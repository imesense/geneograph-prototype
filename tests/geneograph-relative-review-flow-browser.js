const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () =>
{
    const browser = await chromium.launch({ headless: true,
        executablePath: process.env.GENEO_BROWSER_EXECUTABLE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
    try
    {
        for (const width of [1280, 390, 320])
        {
            const page = await browser.newPage({ viewport: { width, height: 850 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(pathToFileURL(path.resolve(__dirname, '../src/index.html')).href);
            const result = await page.evaluate(() =>
            {
                activateProject('p1', { moduleName: 'Geneograph' }); openGeneographBoard('gb1');
                selectGeneographNode('gn-luna'); openGeneographTreeImport();
                const click = selector => document.querySelector(selector).click();
                click('[data-gr-person="gp-luna"]');
                const modal = document.querySelector('.geneo-family-review');
                const initial = modal.innerText;
                const noJargon = !/Anchor person|Resolve identity|Relationship to anchor|Planned result/.test(initial);
                const familyContext = modal.querySelector('.gr-branch-title').textContent.includes('Family of Luna Purrington');
                const sourceWeight = getComputedStyle(modal.querySelector('.gr-global-columns > span')).fontSize === '14px';
                const sourceIcons = modal.querySelectorAll('.gr-global-columns svg').length === 2;
                const readonly = modal.querySelectorAll('button.gr-value').length === 0 && modal.querySelectorAll('button.gr-transfer').length > 0;
                const initials = modal.querySelector('.gr-person[data-gr-person="gp-theo"] .person-avatar-initials');
                const a = initials.getBoundingClientRect(), b = initials.closest('.gr-avatar').getBoundingClientRect();
                const centered = Math.abs(a.x + a.width / 2 - b.x - b.width / 2) < 1 && Math.abs(a.y + a.height / 2 - b.y - b.height / 2) < 1;
                click('[data-gr-fact="names.middle"][data-source="board"]');
                const clearing = geneoTreeImportPreview(geneoTreeImportDraft).operations.some(operation => operation.key === 'names.middle' && operation.clear);
                const targetPreview = modal.querySelector('.gr-value.is-destination')?.innerText.includes('Empty');
                click('[data-gr-summary]');
                const inlineSummary = !modal.querySelector('[data-gr-changes]').hidden && Boolean(modal.querySelector('.gr-rail'))
                    && modal.querySelector('[data-gr-next]').textContent === 'Apply changes';
                click('[data-gr-summary]');
                click('[data-gr-unlink]');
                const dependencyBlocked = Boolean(geneoTreeImportPreview(geneoTreeImportDraft).error) && geneoTreeImportDraft.fields.get('gp-luna').size === 1;
                click('[data-gr-identity-reset]');
                const undoUnlinkKeepsTransfer = geneoTreeImportDraft.fields.get('gp-luna').size === 1;
                click('[data-gr-fact="names.middle"][data-source="none"]');
                click('[data-gr-unlink]');
                const treeBefore = JSON.stringify({ people: sampleData.people, families: sampleData.families, events: sampleData.events });
                click('[data-gr-next]');
                const unlinked = !getGeneographPerson('gp-luna').treePersonId && treeBefore === JSON.stringify({ people: sampleData.people, families: sampleData.families, events: sampleData.events });
                undoGeneographChange();
                const unlinkUndo = getGeneographPerson('gp-luna').treePersonId === 'luna';
                selectGeneographNode('gn-luna'); openGeneographTreeImport();
                click('[data-gr-filter-toggle]');
                const filters = [...modalBackdrop.querySelectorAll('.gr-filter-menu button')].map(button => button.textContent.trim());
                click('[data-gr-status="unlinked"]');
                const filterChip = Boolean(modalBackdrop.querySelector('.gr-filter-chip'));
                click('[data-gr-person="gp-theo"]');
                const createText = modalBackdrop.querySelector('[data-gr-create]').textContent;
                const countBefore = sampleData.people.length;
                click('[data-gr-create]');
                const draft = geneoTreeImportDraft;
                const childId = draft.newIds.get('gp-theo');
                const plan = geneoTreeImportPreview(draft);
                const bundled = plan.operations.some(operation => operation.type === 'identity' && operation.personId === 'gp-theo')
                    && plan.operations.some(operation => operation.type === 'relationship' && operation.ids.includes('gp-theo'));
                const noPartnerInferred = plan.patches.filter(patch => patch.key === 'families' && patch.after?.childIds?.includes(childId))
                    .every(patch => geneoReviewEqual(geneoReviewFamilyParents(patch.after), ['luna']));
                click('[data-gr-next]');
                const oneStep = !document.querySelector('.geneo-family-review') && sampleData.people.length === countBefore + 1
                    && sampleData.families.some(family => (family.childIds || []).includes(childId) && geneoReviewFamilyParents(family).includes('luna'));
                undoGeneographChange();
                const undoBundle = sampleData.people.length === countBefore && !getGeneographPerson('gp-theo').treePersonId;
                selectGeneographNode('gn-luna'); openGeneographTreeImport();
                click('[data-gr-person="gp-theo"]'); click('[data-gr-link]');
                click('[data-gr-match="cleo"]');
                const matchOnly = geneoTreeImportDraft.choices.get('gp-theo') === 'cleo' && geneoTreeImportDraft.relationChoices.size === 0;
                closeModal();
                return { noJargon, familyContext, sourceWeight, sourceIcons, readonly, centered, avatarBounds: [a.toJSON(), b.toJSON()], clearing, targetPreview, inlineSummary,
                    dependencyBlocked, undoUnlinkKeepsTransfer, unlinked, unlinkUndo, filters, filterChip, createText, bundled, noPartnerInferred, oneStep, undoBundle, matchOnly, error: plan.error };
            });
            for (const key of ['noJargon', 'familyContext', 'sourceWeight', 'sourceIcons', 'readonly', 'centered', 'clearing', 'targetPreview', 'inlineSummary',
                'dependencyBlocked', 'undoUnlinkKeepsTransfer', 'unlinked', 'unlinkUndo', 'filterChip', 'bundled', 'noPartnerInferred', 'oneStep', 'undoBundle', 'matchOnly'])
                assert.equal(result[key], true, `${width}: ${key}: ${JSON.stringify(result)}`);
            assert.deepEqual(result.filters, ['All people', 'Not linked', 'With differences', 'With selected changes']);
            assert.match(result.createText, /Create in Family Tree as a child of Luna/);
            await page.evaluate(() => { selectGeneographNode('gn-luna'); openGeneographTreeImport(); geneoTreeImportDraft.mobileDetail = innerWidth < 760; geneoTreeImportRender(); });
            const transfer = page.locator('[data-gr-fact="names.middle"][data-source="tree"]');
            await transfer.focus();
            await transfer.press('Enter');
            assert.equal(await page.evaluate(() => geneoTreeImportDraft.fields.get('gp-luna')?.get('names.middle')), 'tree');
            assert.equal(await page.evaluate(() => document.activeElement.dataset.grFact), 'names.middle');
            await transfer.press('Enter');
            assert.equal(await page.evaluate(() => geneoTreeImportDraft.fields.get('gp-luna')?.has('names.middle')), false);
            if (process.env.GENEO_REVIEW_SCREENSHOT_DIR)
            {
                await page.evaluate(() => { document.querySelector('#toast').style.display = 'none'; document.querySelector('.gr-facts')?.scrollIntoView({ block: 'start' }); });
                await page.screenshot({ path: path.join(process.env.GENEO_REVIEW_SCREENSHOT_DIR, `relative-facts-${width}.png`) });
                await page.evaluate(() => { geneoTreeImportDraft.activePersonId = 'gp-theo'; geneoTreeImportDraft.mobileDetail = true; geneoTreeImportRender(); document.querySelector('.gr-detail')?.scrollTo(0, 0); });
                await page.screenshot({ path: path.join(process.env.GENEO_REVIEW_SCREENSHOT_DIR, `relative-child-${width}.png`) });
            }
            const ru = await page.evaluate(() =>
            {
                closeModal(); setLanguage('ru', false); selectGeneographNode('gn-luna'); openGeneographTreeImport();
                geneoTreeImportDraft.activePersonId = 'gp-theo'; geneoTreeImportDraft.mobileDetail = true; geneoTreeImportRender();
                const modal = document.querySelector('.geneo-family-review');
                return { text: modal.innerText, overflow: modal.scrollWidth - modal.clientWidth };
            });
            assert.ok(ru.text.includes('Создать в Дереве как ребёнка'));
            assert.ok(ru.overflow <= 1);
            assert.deepEqual(errors, []);
            await page.close();
        }
        console.log('Geneograph relative review flow passed.');
    }
    finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
