const assert = require('node:assert/strict');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () => {
    const browser = await chromium.launch({ headless: true, executablePath: process.env.GENEO_BROWSER_PATH });
    try {
        for (const width of [1280, 900, 390, 320]) for (const language of ['en', 'ru']) {
            const page = await browser.newPage({ viewport: { width, height: 900 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(process.env.GENEO_TEST_URL || 'file:///E:/Geneograph/Concept/geneograph-prototype/src/index.html');
            const result = await page.evaluate(async ({ language }) => {
                if (geneoTourRuntime.active) geneoTourClose({ offerRestore: false });
                setLanguage(language, false); activateProject('p1', { moduleName: 'Family Tree' });
                state.selectedPersonId = 'silver'; render();
                const host = document.createElement('div');
                host.style.cssText = `position:fixed;top:0;left:0;width:${Math.min(innerWidth, 550)}px;padding:16px;background:var(--surface-main);z-index:99999`;
                host.innerHTML = renderFamilyTreeTimeline('silver'); document.body.append(host);
                bindTimelineSourceControls(host);
                const toggle = host.querySelector('[data-timeline-evidence-toggle="event-silver-birth"]');
                const item = toggle.closest('.timeline-item');
                const edit = item.querySelector('[data-timeline-edit-fact]');
                const center = selector => { const rect = item.querySelector(selector).getBoundingClientRect(); return rect.top + rect.height / 2; };
                const before = center('.timeline-dot'); const initiallyHidden = edit.hidden;
                toggle.click();
                const date = item.querySelector('.timeline-date').getBoundingClientRect();
                const action = edit.getBoundingClientRect();
                const timeline = { initiallyHidden, expandedVisible: !edit.hidden, label: edit.textContent.trim(),
                    underDate: action.top >= date.bottom - 1, actionFits: action.left >= host.getBoundingClientRect().left,
                    inDateColumn: edit.parentElement.matches('.timeline-date'),
                    stable: Math.abs(center('.timeline-dot') - before) < 1, overflow: host.scrollWidth > host.clientWidth };
                toggle.click(); timeline.closedHidden = edit.hidden; host.remove();
                openEditPersonModal('silver');
                for (const kind of ['education', 'occupation', 'customFact', 'prefix'])
                    document.querySelector(`[data-add-person-add-fact="${kind}"]`).click();
                await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
                const sample = getComputedStyle(document.querySelector('[data-add-person-fact-card="prefix"]'));
                const cardsMatch = [...document.querySelectorAll('[data-repeat-entry]')].every(entry => {
                    const style = getComputedStyle(entry);
                    return style.backgroundColor === sample.backgroundColor && style.borderRadius === sample.borderRadius
                        && style.padding === sample.padding && style.borderTopWidth === sample.borderTopWidth;
                });
                const dateDetails = [];
                const datesFit = [...document.querySelectorAll('.repeatable-fact-dates .profile-edit-date-cell')].every(cell => {
                    const bounds = cell.getBoundingClientRect();
                    const fields = [...cell.querySelectorAll('[data-genealogy-date-type],[data-genealogy-date-input],[data-genealogy-date-details]')];
                    const boxes = fields.map(field => field.getBoundingClientRect());
                    dateDetails.push({ cell: bounds.toJSON(), fields: boxes.map(box => box.toJSON()) });
                    return boxes.every(box => box.width >= 30 && box.left >= bounds.left - 1 && box.right <= bounds.right + 1)
                        && boxes.every((box, index) => boxes.slice(0, index).every(other =>
                            box.left >= other.right - 1 || other.left >= box.right - 1 || box.top >= other.bottom - 1 || other.top >= box.bottom - 1));
                });
                const personAddButtons = document.querySelectorAll('.add-person-modal [data-repeat-add]').length;
                const plusSections = [...document.querySelectorAll('.fact-button-plus')];
                const plusDecoration = plusSections.length === 3 && plusSections.every(plus =>
                    plus.getAttribute('aria-hidden') === 'true' && plus.closest('button') && !plus.querySelector('button'));
                const bin = document.createElement('span'); bin.innerHTML = icon.trash;
                const removalsMatch = [...document.querySelectorAll('[data-repeat-remove],[data-add-person-remove-fact]')].every(button =>
                    button.querySelector('svg')?.innerHTML === bin.querySelector('svg').innerHTML
                        && button.title === t('Remove fact') && button.getAttribute('aria-label') === t('Remove fact'));
                const beforePlus = document.querySelectorAll('[data-repeat-list="EDUC"] [data-repeat-entry]').length;
                document.querySelector('[data-add-person-add-fact="education"] .fact-button-plus').click();
                const plusAddsOne = document.querySelectorAll('[data-repeat-list="EDUC"] [data-repeat-entry]').length === beforePlus + 1;
                const rangeField = document.querySelector('.repeatable-fact-dates .genealogy-date-field');
                const type = rangeField.querySelector('[data-genealogy-date-type]');
                type.value = 'Between'; type.dispatchEvent(new Event('change', { bubbles: true }));
                const rangeBounds = rangeField.getBoundingClientRect();
                const rangeControls = [...rangeField.querySelectorAll('[data-genealogy-date-type],[data-genealogy-date-input],[data-genealogy-date-input-to],[data-genealogy-date-details]')]
                    .map(control => control.getBoundingClientRect());
                const betweenFits = rangeControls.every(box => box.width >= 30 && box.left >= rangeBounds.left - 1 && box.right <= rangeBounds.right + 1)
                    && rangeControls.every((box, index) => rangeControls.slice(0, index).every(other =>
                        box.left >= other.right - 1 || other.left >= box.right - 1 || box.top >= other.bottom - 1 || other.top >= box.bottom - 1));
                closeModal({ force: true });
                state.activeModule = 'People'; state.peopleView = 'profile'; state.selectedPeopleId = 'silver';
                state.peopleProfileEditing = true; renderPeople();
                const profileAdds = ['EDUC', 'OCCU'].every(tag => document.querySelector(`[data-repeat-add="${tag}"]`));
                return { timeline, cardsMatch, datesFit, dateDetails, betweenFits, personAddButtons, profileAdds, plusDecoration, removalsMatch, plusAddsOne };
            }, { language });
            assert.equal(result.timeline.initiallyHidden, true);
            assert.equal(result.timeline.expandedVisible, true);
            assert.equal(result.timeline.closedHidden, true);
            assert.equal(result.timeline.label, language === 'ru' ? 'Изменить' : 'Edit');
            assert.equal(result.timeline.underDate, true); assert.equal(result.timeline.inDateColumn, true);
            assert.equal(result.timeline.actionFits, true);
            assert.equal(result.timeline.stable, true); assert.equal(result.timeline.overflow, false);
            assert.equal(result.cardsMatch, true, `card styling ${width}/${language}`);
            assert.equal(result.datesFit, true, `date controls ${width}/${language}: ${JSON.stringify(result.dateDetails)}`);
            assert.equal(result.betweenFits, true, `Between controls ${width}/${language}`);
            assert.equal(result.personAddButtons, 0); assert.equal(result.profileAdds, true);
            assert.equal(result.plusDecoration, true); assert.equal(result.removalsMatch, true); assert.equal(result.plusAddsOne, true);
            assert.deepEqual(errors, []); await page.close();
        }
        console.log('Repeatable fact layout passed at 1280, 900, 390 and 320px in English/Russian.');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
