const assert = require('node:assert/strict');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () =>
{
    const browser = await chromium.launch({ headless: true, ...(process.env.GENEO_BROWSER_EXECUTABLE
        ? { executablePath: process.env.GENEO_BROWSER_EXECUTABLE } : {}) });
    try
    {
        const page = await browser.newPage({ viewport: { width: 390, height: 760 } });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(process.env.GENEO_TEST_URL || 'http://localhost:8765');
        await page.waitForFunction(() =>
        {
            try { return typeof DEFAULT_DOCUMENT_TITLE === 'string' && typeof activateProject === 'function'; }
            catch (_) { return false; }
        });
        await page.evaluate(() => activateProject('p1', { moduleName: 'Projects' }));
        const result = await page.evaluate(() =>
        {
            const heading = document.querySelector('.project-insights-heading');
            const rows = [...document.querySelectorAll('.project-insight-row .startup-action-copy span')];
            return {
                heading: heading?.textContent.trim(),
                icon: Boolean(heading?.querySelector('svg')),
                strokes: [...(heading?.querySelectorAll('svg path') || [])].map(path => getComputedStyle(path).stroke),
                metadata: rows.map(row => row.textContent.trim()),
                projectName: sampleData.projects.find(project => project.id === 'p1')?.name,
                overflow: document.documentElement.scrollWidth > innerWidth
            };
        });
        assert.equal(result.heading, 'Project insights');
        assert.equal(result.icon, true);
        assert(result.strokes.every(stroke => stroke === 'rgb(255, 255, 255)'));
        assert(result.metadata.every(text => !text.includes(result.projectName)));
        assert.equal(result.overflow, false);
        await page.evaluate(() =>
        {
            sampleData.projects.push({ id: 'empty-overview-test', name: 'Empty overview test', status: 'Local project' });
            activateProject('empty-overview-test', { moduleName: 'Projects' });
        });
        for (const width of [390, 1440])
        {
            await page.setViewportSize({ width, height: 900 });
            const empty = await page.evaluate(() =>
            {
                const activityHeading = document.querySelector('.activity-panel h2');
                const activity = document.querySelector('.project-activity-empty');
                const insights = document.querySelector('.project-insights-empty');
                const x = element => element.getBoundingClientRect().left;
                return {
                    activity: Boolean(activity), insights: Boolean(insights),
                    headingX: x(activityHeading) + parseFloat(getComputedStyle(activityHeading).paddingLeft),
                    messageX: x(activity),
                    titleSize: parseFloat(getComputedStyle(activity.querySelector('strong')).fontSize),
                    bodySize: parseFloat(getComputedStyle(activity.querySelector('span')).fontSize),
                    insightsSize: parseFloat(getComputedStyle(insights).fontSize),
                    overflow: document.documentElement.scrollWidth > innerWidth
                };
            });
            assert.equal(empty.activity, true);
            assert.equal(empty.insights, true);
            assert(Math.abs(empty.headingX - empty.messageX) <= 1);
            assert(empty.titleSize >= 16 && empty.bodySize >= 14 && empty.insightsSize >= 14);
            assert.equal(empty.overflow, false);
        }
        assert.deepEqual(errors, []);
        console.log('Project insights browser check passed.');
    }
    finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
