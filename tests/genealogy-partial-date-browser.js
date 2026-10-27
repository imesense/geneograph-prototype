const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () =>
{
    const browser = await chromium.launch({ headless: true, executablePath: process.env.GENEO_BROWSER_EXECUTABLE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
    try
    {
        for (const [width, language] of [[1280, 'en'], [390, 'ru'], [320, 'ru']])
        {
            const page = await browser.newPage({ viewport: { width, height: 900 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(pathToFileURL(path.resolve(__dirname, '../src/index.html')).href);
            await page.evaluate(language =>
            {
                geneoTourClose({ offerRestore: false }); setLanguage(language, false);
                activateProject('p1', { moduleName: 'People' });
                openAddPersonModal('Add person', 'Create a new person in this project');
            }, language);
            const field = page.locator('[data-genealogy-date-field="addPersonBirth"]');
            const editor = page.locator('.genealogy-date-popover');
            assert.equal(await field.locator('option[value="Year only"]').count(), 0);
            await field.locator('[data-genealogy-date-input]').fill('14');
            await page.locator('#addPersonFirstName').click();
            assert.equal(await field.locator('[data-date-resolve]').count(), 2);
            await field.locator('[data-date-resolve="year"]').click();
            assert.equal(await field.locator('[data-genealogy-date-input]').inputValue(), 'year 14');
            await field.locator('[data-genealogy-date-input]').fill('1900-50');
            await field.locator('[data-genealogy-date-input]').press('Enter');
            assert.equal(await field.locator('.genealogy-date-validation').innerText(), language === 'ru'
                ? 'Вычисление года должно начинаться с =. Например: =1900-50.'
                : 'Year calculations must start with =. Try =1900-50.');
            assert.equal(await field.locator('[data-genealogy-date-input]').inputValue(), '1900-50');
            await field.locator('[data-genealogy-date-input]').fill('=1900-50');
            await field.locator('[data-genealogy-date-input]').press('Enter');
            assert.equal(await field.locator('[data-genealogy-date-input]').inputValue(), '1850');
            assert.equal(await page.evaluate(() => collectGenealogyDateField('addPersonBirth').first.year), 1850);
            await field.locator('[data-genealogy-date-input]').fill('=9999 + 1');
            await page.locator('#addPersonFirstName').click();
            assert.equal(await field.locator('.genealogy-date-validation').isVisible(), true);
            await field.locator('[data-genealogy-date-input]').fill('=1900-50');
            await field.locator('[data-genealogy-date-input]').press('Tab');
            assert.equal(await field.locator('[data-genealogy-date-input]').inputValue(), '1850');
            await field.locator('[data-genealogy-date-input]').fill('1900');
            await field.locator('[data-genealogy-date-type]').selectOption('Between');
            await field.locator('[data-genealogy-date-input-to]').fill('=1900+50');
            await page.locator('#addPersonFirstName').click();
            assert.equal(await field.locator('[data-genealogy-date-input-to]').inputValue(), '1950');
            assert.equal(await page.evaluate(() => collectGenealogyDateField('addPersonBirth').second.year), 1950);
            await field.locator('[data-genealogy-date-type]').selectOption('Exact date');
            await field.locator('[data-genealogy-date-details]').click();
            assert.equal(await editor.locator('[data-editor-year]').inputValue(), '1900');
            await editor.locator('[data-editor-day]').fill('14');
            await editor.locator('[data-editor-month]').selectOption('02');
            await editor.locator('[data-editor-year]').fill('1900-50');
            await editor.locator('[data-editor-year]').press('Enter');
            assert.equal(await editor.locator('[data-editor-year]').inputValue(), '1900-50');
            assert.equal(await editor.locator('[data-editor-validation]').innerText(), language === 'ru'
                ? 'Вычисление года должно начинаться с =. Например: =1900-50.'
                : 'Year calculations must start with =. Try =1900-50.');
            await editor.locator('[data-editor-year]').fill('=1900-50');
            await editor.locator('[data-editor-year]').press('Enter');
            assert.equal(await editor.locator('[data-editor-year]').inputValue(), '1850');
            assert.equal(await editor.locator('[data-editor-day]').inputValue(), '14');
            assert.equal(await editor.locator('[data-editor-month]').inputValue(), '02');
            await editor.locator('[data-editor-year]').fill('');
            await editor.locator('[data-genealogy-date-apply]').click();
            let value = JSON.parse(await field.locator('[data-genealogy-date-model]').inputValue());
            assert.deepEqual(value.first, { year: null, month: 2, day: 14 });
            assert.equal(await field.locator('[data-genealogy-date-input]').inputValue(), language === 'ru' ? '14 февраля' : '14 Feb');
            await field.locator('[data-genealogy-date-details]').click();
            assert.equal(await editor.locator('[data-date-unknown]').count(), 0);
            assert.equal(await editor.locator('[data-editor-smart]').inputValue(), language === 'ru' ? '14 февраля' : '14 Feb');
            assert.equal(await editor.locator('[data-first-date-label]').isVisible(), false);
            assert.equal(await editor.locator('[data-calendar-toggle="2"]').isVisible(), false);
            assert.equal(await editor.locator('[data-calendar-toggle=""]').getAttribute('aria-label'), language === 'ru' ? 'Выбрать полную дату' : 'Choose a full date');
            await editor.locator('[data-editor-smart]').fill('1900-50');
            await editor.locator('[data-editor-smart]').press('Enter');
            assert.equal(await editor.locator('[data-editor-validation]').innerText(), language === 'ru'
                ? 'Вычисление года должно начинаться с =. Например: =1900-50.'
                : 'Year calculations must start with =. Try =1900-50.');
            await editor.locator('[data-editor-smart]').fill('=1900-50');
            await editor.locator('[data-editor-smart]').press('Enter');
            assert.equal(await editor.locator('[data-editor-smart]').inputValue(), '1850');
            await editor.locator('[data-genealogy-date-apply]').click();
            value = JSON.parse(await field.locator('[data-genealogy-date-model]').inputValue());
            assert.deepEqual(value.first, { year: 1850, month: null, day: null });
            assert.equal(value.dateType, 'Exact date');
            await field.locator('[data-genealogy-date-details]').click();
            await editor.locator('[data-editor-smart]').fill(language === 'ru' ? 'около 1900' : 'about 1900');
            assert.equal(await editor.locator('[data-editor-month]').inputValue(), '');
            assert.equal(await editor.locator('[data-editor-day]').inputValue(), '');
            await editor.locator('[data-genealogy-date-apply]').click();
            value = JSON.parse(await field.locator('[data-genealogy-date-model]').inputValue());
            assert.equal(value.dateType, 'About / Circa'); assert.equal(value.first.year, 1900);
            await field.locator('[data-genealogy-date-details]').click();
            await editor.locator('[data-editor-smart]').fill('day 21');
            await editor.locator('[data-editor-smart]').press('Escape');
            assert.equal(await editor.count(), 0);
            assert.equal(await page.locator('.add-person-modal').count(), 1);
            assert.equal(JSON.parse(await field.locator('[data-genealogy-date-model]').inputValue()).first.year, 1900);
            await field.locator('[data-genealogy-date-details]').click();
            await editor.locator('[data-editor-smart]').fill('Between 14 Feb and 1901');
            await editor.locator('[data-genealogy-date-apply]').click();
            value = JSON.parse(await field.locator('[data-genealogy-date-model]').inputValue());
            assert.equal(value.second.year, 1901); assert.equal(value.first.year, null);
            await field.locator('[data-genealogy-date-details]').click();
            assert.equal(await editor.locator('[data-date-preview]').count(), 0);
            assert.equal(await editor.locator('[data-first-date-label]').textContent(), language === 'ru' ? 'С' : 'From');
            assert.equal(await editor.locator('.genealogy-date-second-date > strong').textContent(), language === 'ru' ? 'По' : 'To');
            assert.equal(await editor.locator('[data-calendar-toggle="2"]').getAttribute('aria-label'), language === 'ru' ? 'Выбрать дату окончания' : 'Choose To date');
            const calendarToggle = editor.locator('[data-calendar-toggle=""]');
            const toToggle = editor.locator('[data-calendar-toggle="2"]');
            assert.equal(await calendarToggle.getAttribute('aria-expanded'), 'false');
            await calendarToggle.click();
            assert.equal(await calendarToggle.getAttribute('aria-expanded'), 'true');
            assert.equal(await editor.locator('[data-grid-target]').isVisible(), true);
            assert.deepEqual(await editor.locator('[data-grid-target] option').allTextContents(), language === 'ru' ? ['С', 'По'] : ['From', 'To']);
            await toToggle.click();
            assert.equal(await editor.locator('.genealogy-calendar').isVisible(), true);
            assert.equal(await calendarToggle.getAttribute('aria-expanded'), 'false');
            assert.equal(await toToggle.getAttribute('aria-expanded'), 'true');
            assert.equal(await editor.locator('[data-grid-target]').inputValue(), '2');
            assert.equal(await editor.locator('[data-grid-year]').inputValue(), '1901');
            await toToggle.click();
            assert.equal(await editor.locator('.genealogy-calendar').isVisible(), false);
            await toToggle.press('Enter');
            assert.equal(await editor.locator('.genealogy-calendar').isVisible(), true);
            const beforeBrowse = await editor.locator('[data-editor-smart]').inputValue();
            await editor.locator('[data-grid-month="1"]').click();
            assert.equal(await editor.locator('[data-grid-target]').inputValue(), '2');
            assert.equal(await editor.locator('[data-editor-smart]').inputValue(), beforeBrowse);
            await editor.locator('[data-grid-target]').selectOption('');
            assert.equal(await calendarToggle.getAttribute('aria-expanded'), 'true');
            assert.equal(await toToggle.getAttribute('aria-expanded'), 'false');
            await editor.locator('[data-grid-year]').fill('1900');
            await editor.locator('[data-grid-year]').dispatchEvent('change');
            await editor.locator('[data-grid-month-select]').selectOption('02');
            await editor.locator('[data-grid-day="14"]').click();
            assert.equal(await editor.locator('[data-editor-year]').inputValue(), '1900');
            assert.equal(await editor.locator('[data-editor-year2]').inputValue(), '1901');
            await calendarToggle.click();
            assert.equal(await editor.locator('.genealogy-calendar').isVisible(), false);
            await calendarToggle.click();
            assert.equal(await editor.locator('.genealogy-calendar').isVisible(), true);
            const editorBounds = await editor.boundingBox();
            const applyBounds = await editor.locator('[data-genealogy-date-apply]').boundingBox();
            const clearBounds = await editor.locator('[data-date-clear]').boundingBox();
            assert.ok(applyBounds.y + applyBounds.height <= editorBounds.y + editorBounds.height + 1);
            assert.ok(Math.abs(applyBounds.y - clearBounds.y) <= 1, 'date actions stay on one line');
            assert.ok(await editor.evaluate(el => el.scrollWidth <= el.clientWidth + 1), `editor fits ${width}`);
            if (process.env.GENEO_DATE_SCREENSHOTS)
                await page.screenshot({ path: path.join(process.env.GENEO_DATE_SCREENSHOTS, `date-editor-${width}.png`) });
            await editor.locator('[data-genealogy-date-close]').first().click();
            await field.locator('[data-genealogy-date-details]').click();
            await editor.locator('[data-editor-type]').selectOption('Between');
            await editor.locator('[data-editor-day]').fill('14');
            await editor.locator('[data-editor-month]').selectOption('02');
            await editor.locator('[data-editor-year]').fill('=1900-50');
            await editor.locator('[data-editor-year]').press('Tab');
            assert.equal(await editor.locator('[data-editor-year]').inputValue(), '1850');
            await editor.locator('[data-editor-year2]').fill('=1850+50');
            await editor.locator('[data-editor-year2]').press('Enter');
            assert.equal(await editor.locator('[data-editor-year2]').inputValue(), '1900');
            await editor.locator('[data-genealogy-date-apply]').click();
            value = JSON.parse(await field.locator('[data-genealogy-date-model]').inputValue());
            assert.deepEqual(value.first, { year: 1850, month: 2, day: 14 });
            assert.deepEqual(value.second, { year: 1900, month: null, day: null });
            await page.evaluate(() => { closeModal({ force: true }); openArchiveSourceModal(); });
            const accessed = page.locator('[data-genealogy-date-field="archiveSourceAccessed"]');
            await accessed.locator('[data-genealogy-date-input]').fill('February');
            const sourceDate = await page.evaluate(() => collectArchiveSourceAccessedDate());
            assert.deepEqual(sourceDate.first, { year: null, month: 2, day: null });
            const integrations = await page.evaluate(() =>
            {
                const date = buildGenealogyDateFromParts('Exact date', { day: 14, year: 1900 }).value;
                const media = mediaDateFromGenealogyModel(date);
                const photo = photoDateModel({ date: JSON.parse(JSON.stringify(media)) });
                const target = { birth: { ...normalizeGenealogyDateInput('1900'), placeId: 'keep-place', reason: 'keep-reason' } };
                geneoReviewSetFact(target, 'birth.date', date);
                const payload = { format: GENEO_BOARD_FILE_FORMAT, version: GENEO_BOARD_FILE_VERSION,
                    board: { title: 'Partial dates', description: '', diagram: { canvas: {}, personCardDefaults: {},
                        assets: [], people: [{ id: 'partial', names: {}, birth: date }], families: [], nodes: [], connections: [] } } };
                validateGeneographBoardFile(payload);
                payload.board.diagram.people[0].birth.first.day = 32;
                let rejectedInvalid = false;
                try { validateGeneographBoardFile(payload); } catch { rejectedInvalid = true; }
                return { photo: photo.first, copied: target.birth.first, place: target.birth.placeId, reason: target.birth.reason,
                    rejectedInvalid,
                    sourceLabel: archiveFormatDate(normalizeGenealogyDateInput('February')),
                    compatible: genealogyDatesCompatible('1900', '14 Feb 1900') };
            });
            assert.deepEqual(integrations.photo, { year: 1900, month: null, day: 14 });
            assert.deepEqual(integrations.copied, integrations.photo);
            assert.equal(integrations.place, 'keep-place'); assert.equal(integrations.reason, 'keep-reason');
            assert.equal(integrations.compatible, true);
            assert.equal(integrations.rejectedInvalid, true);
            assert.deepEqual(errors, []);
            await page.close();
        }
    }
    finally { await browser.close(); }
    console.log('Partial genealogy date editor and module integration passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
