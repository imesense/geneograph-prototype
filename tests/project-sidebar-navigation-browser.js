const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () =>
{
    const browser = await chromium.launch({ headless: true, ...(process.env.GENEO_BROWSER_EXECUTABLE
        ? { executablePath: process.env.GENEO_BROWSER_EXECUTABLE } : {}) });
    try
    {
        for (const [width, language] of [[390, 'ru'], [1280, 'en']])
        {
            const page = await browser.newPage({ viewport: { width, height: 720 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.stack || error.message));
            await page.goto(`${pathToFileURL(path.resolve(__dirname, '../src/index.html')).href}?lang=${language}`);
            for (const section of ['overview', 'activity', 'settings'])
            {
                await page.evaluate(({ language, section }) =>
                {
                    setLanguage(language, false);
                    activateProject('p1', { moduleName: 'Projects' });
                    state.openSide = section;
                    render();
                }, { language, section });
                const navigation = await page.evaluate(() =>
                {
                    const titles = [...sidebar.querySelectorAll('.side-section-title')];
                    const link = sidebar.querySelector('#backToProjects');
                    return { headings: titles.map(item => item.textContent.trim()),
                        count: sidebar.querySelectorAll('#backToProjects').length,
                        label: link?.textContent.trim(),
                        beforeProject: Boolean(link && titles[1] && link.compareDocumentPosition(titles[1]) & Node.DOCUMENT_POSITION_FOLLOWING),
                        overflow: sidebar.scrollWidth > sidebar.clientWidth + 1 };
                });
                assert.equal(navigation.count, 1);
                assert.deepEqual(navigation.headings.slice(0, 2), language === 'ru' ? ['Навигация', 'Проект'] : ['Navigation', 'Project']);
                assert.equal(navigation.label, language === 'ru' ? 'Все проекты' : 'All projects');
                assert.equal(navigation.beforeProject, true);
                assert.equal(navigation.overflow, false);
                await page.locator('#backToProjects').evaluate(button => button.click());
                assert.equal(await page.evaluate(() => state.projectOpen), false);
                assert.equal(await page.evaluate(() => state.activeModule), 'Projects');
            }
            assert.deepEqual(errors, []);
            await page.close();
        }
        console.log('Project sidebar navigation checks passed.');
    }
    finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
