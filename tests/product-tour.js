const tourTestFrame = document.getElementById('prototype');
const tourTestResults = document.getElementById('results');

function tourTestAssert(condition, message)
{
    if (!condition) throw new Error(message);
}

async function tourTestUntil(check, message)
{
    const deadline = performance.now() + 6000;
    while (performance.now() < deadline)
    {
        if (check()) return;
        await new Promise(resolve => setTimeout(resolve, 40));
    }
    throw new Error(message);
}

async function tourTestStep(app, index)
{
    await tourTestUntil(() => app.eval(`geneoTourRuntime.index === ${index} && !geneoTourRuntime.transitioning`), `Step ${index} did not settle`);
    await new Promise(resolve => setTimeout(resolve, 80));
}

function tourTestRecordSnapshot(app)
{
    return app.eval(`(() => {
        const records = structuredClone(sampleData);
        records.boards.forEach(board => board.diagram?.nodes?.forEach(node => {
            if (node.personCard?.heightMode === 'auto') delete node.height;
        }));
        return JSON.stringify(records);
    })()`);
}

async function runProductTourChecks()
{
    const button = document.getElementById('run');
    button.disabled = true;
    tourTestResults.replaceChildren();
    let passed = 0;
    let failed = 0;
    const check = async (name, action) =>
    {
        const item = document.createElement('li');
        tourTestResults.appendChild(item);
        try
        {
            await action();
            item.className = 'pass';
            item.textContent = `PASS: ${name}`;
            passed += 1;
        }
        catch (error)
        {
            item.className = 'fail';
            item.textContent = `FAIL: ${name} - ${error.message}`;
            failed += 1;
        }
    };

    const app = tourTestFrame.contentWindow;
    try
    {
        await tourTestUntil(() => Boolean(app.document.querySelector('.app')), 'App did not load');
        await check('Project selection offers the welcome card', async () =>
        {
            app.localStorage.removeItem('geneograph.productTour');
            app.eval('geneoTourRuntime.invited = false; state.activeModule = "Projects"; state.projectOpen = false; render(); maybeOfferGeneoProductTour()');
            await tourTestUntil(() => Boolean(app.document.querySelector('[data-geneo-tour-action="start"]')), 'Welcome did not open');
            tourTestAssert(app.document.querySelector('[data-geneo-tour-title]').textContent === 'Explore a family story', 'Wrong welcome title');
            tourTestAssert(app.document.querySelector('.geneo-tour-card').getAttribute('aria-modal') === 'true', 'Dialog semantics missing');
        });

        await check('Twenty-two stops reach real records and Finish leaves the board open', async () =>
        {
            const recordsBefore = tourTestRecordSnapshot(app);
            app.document.querySelector('[data-geneo-tour-action="start"]').click();
            const expected = ['Projects', ...Array(4).fill('Family Tree'), ...Array(3).fill('People'),
                ...Array(3).fill('Albums'), ...Array(3).fill('Archive'), ...Array(2).fill('Notes'),
                ...Array(3).fill('Places'), ...Array(3).fill('Geneograph')];
            const ids = ['projects', 'tree-group', 'tree-sidebar', 'tree-relative', 'tree-edit',
                'people-navigation', 'people-list', 'people-profile', 'albums-navigation',
                'albums-photo', 'albums-context', 'archive-navigation', 'archive-file',
                'archive-context', 'notes-list', 'notes-editor', 'places-navigation',
                'places-map', 'places-people', 'geneograph-toolbar', 'geneograph-board',
                'geneograph-settings'];
            for (let index = 0; index < expected.length; index += 1)
            {
                await tourTestStep(app, index);
                tourTestAssert(app.eval('state.activeModule') === expected[index], `Wrong module at ${index}`);
                tourTestAssert(app.eval('geneoTourSteps[geneoTourRuntime.index].id') === ids[index], `Wrong stop at ${index}`);
                tourTestAssert(!app.eval('geneoTourRuntime.fallback'), `Missing target at ${index}`);
                tourTestAssert(app.eval('geneoTourRuntime.target?.isConnected'), `Detached target at ${index}`);
                tourTestAssert(app.document.querySelector('[data-geneo-tour-progress]').textContent.includes(String(index + 1)), `Wrong progress at ${index}`);
                tourTestAssert(app.document.querySelector('[data-geneo-tour-progress]').textContent.includes(expected[index]), `Missing chapter at ${index}`);
                if (index === 3)
                {
                    tourTestAssert(Boolean(app.document.querySelector('#relativePopover')), 'Real relative popover missing');
                    app.document.querySelector('[data-geneo-tour-action="back"]').click();
                    await tourTestStep(app, 2);
                    tourTestAssert(!app.document.querySelector('#relativePopover'), 'Relative preview not cleaned up');
                    app.document.querySelector('[data-geneo-tour-action="next"]').click();
                    await tourTestStep(app, 3);
                }
                if (index === 4)
                {
                    tourTestAssert(app.document.querySelector('#modalBackdrop').classList.contains('open'), 'Real quick-edit modal missing');
                    tourTestAssert(app.document.querySelector('#modalBackdrop').inert, 'Quick-edit preview is editable');
                    tourTestAssert(!app.document.querySelector('[data-geneo-tour]').classList.contains('is-unanchored'), 'Quick-edit form is obscured');
                }
                if (index === 12) tourTestAssert(app.eval('geneoTourRuntime.target?.matches("[data-archive-file-row=af5]")'), 'File row not highlighted');
                if (index === 13) tourTestAssert(app.eval('!!sampleData.sources.find(source => source.id === "as3")'), 'Source missing');
                app.document.querySelector('[data-geneo-tour-action="next"]').click();
            }
            await tourTestStep(app, 22);
            app.document.querySelector('[data-geneo-tour-action="finish"]').click();
            tourTestAssert(!app.eval('geneoTourRuntime.active'), 'Tour did not finish');
            tourTestAssert(app.eval('state.activeModule') === 'Geneograph', 'Finish left the board');
            tourTestAssert(app.eval('geneoTourReadStatus()') === 'completed', 'Completion not saved');
            tourTestAssert(tourTestRecordSnapshot(app) === recordsBefore, 'Tour changed sample records');
        });

        await check('Replay, Russian copy, Skip, and return action', async () =>
        {
            app.eval('setLanguage("ru"); state.activeModule = "People"; state.peopleView = "directory"; render()');
            const origin = app.eval('state.activeModule');
            app.eval('startGeneoProductTour()');
            await tourTestStep(app, -1);
            tourTestAssert(app.document.querySelector('[data-geneo-tour-title]').textContent === 'Исследуйте историю семьи', 'Welcome not translated');
            app.document.querySelector('[data-geneo-tour-action="start"]').click();
            await tourTestStep(app, 0);
            app.document.querySelector('.geneo-tour-close').click();
            tourTestAssert(!app.eval('geneoTourRuntime.active'), 'Skip did not close');
            tourTestAssert(app.document.querySelector('.toast').textContent.includes('Вернуться назад'), 'Return action missing');
            app.document.querySelector('.toast button').click();
            await tourTestUntil(() => app.eval('state.activeModule') === origin, 'Origin not restored');
        });

        await check('Skip module and Back follow visited history', async () =>
        {
            app.eval('startGeneoProductTour()');
            await tourTestStep(app, -1);
            app.document.querySelector('[data-geneo-tour-action="start"]').click();
            await tourTestStep(app, 0);
            app.document.querySelector('[data-geneo-tour-action="skip-module"]').click();
            await tourTestStep(app, 1);
            app.document.querySelector('[data-geneo-tour-action="skip-module"]').click();
            await tourTestStep(app, 5);
            app.document.querySelector('[data-geneo-tour-action="back"]').click();
            await tourTestStep(app, 1);
            app.eval('geneoTourClose({ offerRestore: false })');
        });

        await check('Missing target uses an unanchored same-step fallback', async () =>
        {
            app.eval('startGeneoProductTour()');
            await tourTestStep(app, -1);
            const original = app.geneoTourTarget;
            app.geneoTourTarget = () => null;
            try
            {
                app.document.querySelector('[data-geneo-tour-action="start"]').click();
                await tourTestStep(app, 0);
                tourTestAssert(app.eval('geneoTourRuntime.fallback'), 'Fallback was not set');
                tourTestAssert(!app.document.querySelector('[data-geneo-tour-fallback]').hidden, 'Fallback copy hidden');
                tourTestAssert(app.document.querySelector('[data-geneo-tour-title]').textContent === app.eval('t("Everything starts with a project")'), 'Wrong fallback step');
            }
            finally
            {
                app.geneoTourTarget = original;
                app.eval('geneoTourClose({ offerRestore: false })');
            }
        });

        await check('Language changes preserve progress and Escape closes', async () =>
        {
            app.eval('startGeneoProductTour()');
            await tourTestStep(app, -1);
            app.document.querySelector('[data-geneo-tour-action="start"]').click();
            await tourTestStep(app, 0);
            app.eval('setLanguage("en")');
            await tourTestUntil(() => app.document.querySelector('[data-geneo-tour-title]')?.textContent === 'Everything starts with a project', 'English copy did not update');
            tourTestAssert(app.eval('geneoTourRuntime.index') === 0, 'Language switch reset progress');
            app.document.dispatchEvent(new app.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
            tourTestAssert(!app.eval('geneoTourRuntime.active'), 'Escape did not close the tour');
        });

        await check('App navigation and modal opening dismiss without restoring', async () =>
        {
            app.eval('startGeneoProductTour()');
            await tourTestStep(app, -1);
            app.eval('state.activeModule = "Albums"; render()');
            tourTestAssert(!app.eval('geneoTourRuntime.active'), 'Navigation left tour open');
            tourTestAssert(app.eval('state.activeModule') === 'Albums', 'Navigation was overridden');
            app.eval('startGeneoProductTour()');
            await tourTestStep(app, -1);
            app.eval('openModal("<div role=dialog>Test modal</div>")');
            tourTestAssert(!app.eval('geneoTourRuntime.active'), 'Modal left tour open');
            app.eval('closeModal()');
        });

        await check('Unavailable storage still allows a session tour', async () =>
        {
            const prototype = app.Storage.prototype;
            const getItem = prototype.getItem;
            const setItem = prototype.setItem;
            prototype.getItem = () => { throw new Error('storage unavailable'); };
            prototype.setItem = () => { throw new Error('storage unavailable'); };
            try
            {
                tourTestAssert(app.eval('geneoTourReadStatus()') === 'unseen', 'Storage fallback failed');
                app.eval('geneoTourWriteStatus("skipped"); startGeneoProductTour()');
                await tourTestStep(app, -1);
                tourTestAssert(app.eval('geneoTourRuntime.active'), 'Tour did not start without storage');
                app.eval('geneoTourClose({ offerRestore: false })');
            }
            finally
            {
                prototype.getItem = getItem;
                prototype.setItem = setItem;
            }
        });

        await check('Help offers replay from another module', async () =>
        {
            app.eval('state.activeModule = "Notes"; render()');
            app.document.querySelector('[data-topbar-help]').click();
            const replay = app.document.querySelector('[data-help-tour]');
            tourTestAssert(Boolean(replay), 'Help replay entry missing');
            replay.click();
            await tourTestStep(app, -1);
            tourTestAssert(app.eval('geneoTourRuntime.active'), 'Help did not start the tour');
            app.eval('geneoTourClose({ offerRestore: false })');
        });
    }
    finally
    {
        const summary = document.createElement('li');
        summary.className = failed ? 'fail' : 'pass';
        summary.textContent = `${passed} passed, ${failed} failed`;
        tourTestResults.appendChild(summary);
        button.disabled = false;
    }
}

document.getElementById('run').addEventListener('click', runProductTourChecks);
