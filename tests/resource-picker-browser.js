const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () =>
{
    const browser = await chromium.launch({ headless: true, executablePath: process.env.GENEO_BROWSER_EXECUTABLE });
    const screenshots = path.join(os.tmpdir(), 'geneograph-resource-picker');
    fs.mkdirSync(screenshots, { recursive: true });
    try
    {
        for (const width of [1280, 900, 390, 320])
        {
            const page = await browser.newPage({ viewport: { width, height: 900 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(pathToFileURL(path.resolve(__dirname, '../src/index.html')).href);
            await page.evaluate(() =>
            {
                geneoTourClose({ offerRestore: false });
                state.projectOpen = true;
                state.currentProjectId = 'p1';
                state.activeModule = 'People';
                render();
            });
            for (const kind of ['photos', 'files', 'notes', 'sources', 'places'])
            {
                await page.evaluate(kind =>
                {
                    if (kind === 'photos') openAddPhotosToPersonModal(sampleData.people.find(person => person.projectId === 'p1').id);
                    if (kind === 'files') openConnectedFilesModal({ projectId: 'p1', onSave: () => true });
                    if (kind === 'notes') openNoteLinkPickerModal({ projectId: 'p1', onSave: () => true });
                    if (kind === 'sources') openSourcesForTargetModal({ projectId: 'p1', draftSourceIds: [], onDraftSave: () => true });
                    if (kind === 'places') openNotesPlacesModal({ noteId: sampleData.notes.find(note => note.projectId === 'p1').id });
                }, kind);
                await page.locator(`[data-resource-picker="${kind}"]`).waitFor();
                assert.ok(await page.locator('.resource-picker').evaluate(root => root.scrollWidth <= root.clientWidth + 1), `${kind} overflow at ${width}`);
                await page.locator('[data-rp-action="browse"]').click();
                assert.ok(await page.locator('.rp-scopes').isVisible());
                await page.locator('[data-rp-scope="all"]').last().click();
                await page.locator('[data-rp-search]').fill('zzzz-no-result');
                assert.ok(await page.locator('.rp-empty').isVisible());
                await page.locator('[data-rp-action="clear-filters"]').click();
                if (await page.locator('[data-rp-check]:not(:checked)').count())
                {
                    const total = await page.locator('[data-rp-check]:checked').count() + 1;
                    const id = await page.locator('[data-rp-check]:not(:checked)').first().getAttribute('data-rp-check');
                    await page.locator(`[data-rp-check="${id}"]`).check();
                    await page.locator('[data-rp-action="selected"]').click();
                    assert.equal(await page.locator('[data-rp-check]').count(), total);
                    await page.locator('.rp-footer-actions [data-rp-action="results"]').click();
                }
                if (await page.locator('[data-rp-action^="preview:"]').count())
                {
                    await page.locator('[data-rp-action^="preview:"]').first().click();
                    assert.ok(await page.locator('.rp-preview').isVisible());
                    await page.keyboard.press('Escape');
                    assert.ok(await page.locator('.rp-results').isVisible());
                }
                await page.screenshot({ path: path.join(screenshots, `resource-picker-${kind}-${width}.png`) });
                await page.evaluate(() => closeModal({ force: true }));
                assert.equal(await page.locator('[data-resource-picker]').count(), 0);
            }
            assert.deepEqual(errors, []);
            await page.close();
        }
        console.log('Resource picker browser checks passed');
    }
    finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
