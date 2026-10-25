const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () => {
    const browser = await chromium.launch({ headless: true,
        ...(process.env.GENEO_BROWSER_EXECUTABLE ? { executablePath: process.env.GENEO_BROWSER_EXECUTABLE } : {}) });
    try {
        for (const moduleName of ['Family Tree', 'People', 'Geneograph']) {
            const page = await browser.newPage();
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(pathToFileURL(path.resolve(__dirname, '../src/index.html')).href);
            await page.evaluate(moduleName => {
                activateProject('p1', { moduleName });
                if (moduleName === 'Geneograph') openGeneographBoard('gb1');
            }, moduleName);
            for (const [anchorGender, expected] of [['Male', 'Female'], ['Female', 'Male'], ['Unknown', 'Unknown']]) {
                await page.evaluate(({ moduleName, anchorGender }) => {
                    if (moduleName === 'Geneograph') {
                        getGeneographPerson('gp-silver').gender = anchorGender.toLowerCase();
                        openGeneographPersonModal('', { relative: { anchorNodeId: 'gn-silver', type: 'partner' } });
                    } else {
                        getPerson('silver').gender = anchorGender;
                        openAddPersonModal('Add partner', 'Create a partner', {
                            relativeType: 'partner', personId: 'silver', connectAfterCreate: true
                        });
                    }
                }, { moduleName, anchorGender });
                const gender = page.locator(moduleName === 'Geneograph' ? '#geneoPersonGender' : '#addPersonGender');
                assert.equal(await gender.inputValue(), moduleName === 'Geneograph' ? expected.toLowerCase() : expected);
                await gender.selectOption(moduleName === 'Geneograph' ? 'unknown' : 'Unknown');
                assert.equal(await gender.inputValue(), moduleName === 'Geneograph' ? 'unknown' : 'Unknown');
                await page.evaluate(() => closeModal({ force: true }));
            }
            await page.evaluate(moduleName => {
                if (moduleName === 'Geneograph') {
                    openGeneographPersonModal('', { gender: 'male', relative: { anchorNodeId: 'gn-silver', type: 'partner' } });
                } else {
                    openAddPersonModal('Add partner', 'Create a partner', {
                        relativeType: 'partner', personId: 'silver', connectAfterCreate: true, gender: 'Male'
                    });
                }
            }, moduleName);
            assert.equal(await page.locator(moduleName === 'Geneograph' ? '#geneoPersonGender' : '#addPersonGender').inputValue(),
                moduleName === 'Geneograph' ? 'male' : 'Male');
            await page.evaluate(() => closeModal({ force: true }));
            assert.deepEqual(errors, []);
            await page.close();
        }
    } finally { await browser.close(); }
    process.stdout.write('Partner gender defaults passed.\n');
})().catch(error => { console.error(error); process.exitCode = 1; });
