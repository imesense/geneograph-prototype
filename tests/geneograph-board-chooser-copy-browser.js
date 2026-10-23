const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () =>
{
    const browser = await chromium.launch({ headless: true,
        ...(process.env.GENEO_BROWSER_EXECUTABLE
            ? { executablePath: process.env.GENEO_BROWSER_EXECUTABLE } : {}) });
    try
    {
        for (const [width, language] of [[1280, 'en'], [390, 'ru'], [320, 'ru']])
        {
            const page = await browser.newPage({ viewport: { width, height: 720 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(pathToFileURL(path.resolve(__dirname, '../src/index.html')).href);
            const ids = await page.evaluate(language =>
            {
                geneoTourClose({ offerRestore: false });
                setLanguage(language, false);
                activateProject('p1', { moduleName: 'People' });
                const people = getPeople(currentProjectId()).filter(person => !person.deleted);
                const board = getProjectBoards(currentProjectId()).find(candidate =>
                    people.filter(person => geneoBoardHasTreePerson(candidate, person.id)).length >= 2
                    && people.some(person => !geneoBoardHasTreePerson(candidate, person.id)));
                if (!board) return null;
                return { boardId: board.id,
                    present: people.filter(person => geneoBoardHasTreePerson(board, person.id)).slice(0, 2).map(person => person.id),
                    missing: people.find(person => !geneoBoardHasTreePerson(board, person.id)).id };
            }, language);
            assert.ok(ids, 'sample project has a board with present and missing people');

            for (const [people, expected, action] of [
                [[ids.present[0]], language === 'ru' ? 'Уже на этом холсте' : 'Already on this board', language === 'ru' ? 'Открыть холст' : 'Open board'],
                [ids.present, language === 'ru' ? 'Все выбранные люди уже на этом холсте' : 'All selected people are on this board', language === 'ru' ? 'Открыть холст' : 'Open board'],
                [[ids.present[0], ids.missing], language === 'ru' ? 'Добавить: 1 · Уже на холсте: 1' : '1 person to add · 1 already on board', language === 'ru' ? 'Добавить на холст' : 'Add to board']
            ])
            {
                await page.evaluate(personIds => openGeneographBoardChooser(personIds), people);
                const modal = page.locator('.geneo-board-chooser-modal');
                const row = modal.locator(`input[name="geneoBoardChoice"][value="${ids.boardId}"]`).locator('..');
                assert.equal(await row.locator('small').innerText(), expected);
                await row.locator('input').check();
                assert.equal(await modal.locator('[data-geneo-add-to-board]').innerText(), action);
                const announcement = modal.locator('[data-geneo-board-summary]');
                assert.match(await announcement.innerText(), new RegExp(action));
                assert.equal(await announcement.evaluate(element => {
                    const rect = element.getBoundingClientRect();
                    return rect.width <= 1 && rect.height <= 1 && getComputedStyle(element).display !== 'none';
                }), true);
                assert.equal(await modal.locator('.modal-footer').evaluate(element =>
                    getComputedStyle(element).justifyContent), 'flex-end');
                if (people.length === 1 && process.env.GENEO_BOARD_CHOOSER_SCREENSHOT_DIR)
                    await modal.screenshot({ path: path.join(process.env.GENEO_BOARD_CHOOSER_SCREENSHOT_DIR,
                        `board-chooser-${width}.png`) });
                await modal.locator('[data-close]').last().click();
            }
            assert.deepEqual(errors, []);
            await page.close();
        }
    }
    finally
    {
        await browser.close();
    }
    console.log('Geneograph board chooser copy passed.');
})().catch(error =>
{
    console.error(error);
    process.exitCode = 1;
});
