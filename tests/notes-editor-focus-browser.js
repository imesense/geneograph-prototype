const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () =>
{
    const browser = await chromium.launch({ headless: true, executablePath: process.env.GENEO_BROWSER_EXECUTABLE });
    try
    {
        for (const width of [1280, 390, 320])
        {
            const page = await browser.newPage({ viewport: { width, height: 800 } });
            await page.goto(pathToFileURL(path.resolve(__dirname, '../src/index.html')).href);
            await page.evaluate(() =>
            {
                geneoTourClose({ offerRestore: false });
                activateProject('p1', { moduleName: 'Notes' });
                state.selectedNoteId = 'note-daisy-parentage';
                state.notesRightCollapsed = false;
                state.notesMobilePane = 'editor';
                render();
            });
            const result = await page.evaluate(() =>
            {
                const shell = document.querySelector('.notes-rich-editor-shell');
                const editor = shell.querySelector('.ql-editor, .notes-body-input');
                editor.focus();
                const styles = getComputedStyle(editor);
                const shellStyles = getComputedStyle(shell);
                return { outline: styles.outlineStyle, focus: shell.matches(':focus-within'),
                    border: shellStyles.borderTopColor, radius: shellStyles.borderTopLeftRadius };
            });
            assert.equal(result.outline, 'none');
            assert.equal(result.focus, true);
            assert.notEqual(result.border, 'transparent');
            assert.notEqual(result.radius, '0px');
            await page.close();
        }
        console.log('Notes editor focus passed.');
    }
    finally
    {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
