const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

const url = pathToFileURL(path.resolve(__dirname, '../src/index.html')).href;

(async () => {
    const browser = await chromium.launch({
        ...(process.env.GENEO_BROWSER_PATH ? { executablePath: process.env.GENEO_BROWSER_PATH } : {}),
        headless: true
    });
    try {
        for (const [width, language] of [[1280, 'en'], [1280, 'ru'], [320, 'en'], [320, 'ru']]) {
            const page = await browser.newPage({ viewport: { width, height: 720 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(`${url}?lang=${language}`, { waitUntil: 'domcontentloaded' });
            await page.evaluate(() => {
                if (geneoTourRuntime.active) geneoTourClose();
                openGlobalSettingsModal('privacy');
            });
            assert.equal(await page.locator('.global-settings-nav-button').count(), 3);
            assert.equal(await page.evaluate(() => state.globalSettingsSection), 'general');
            assert.equal(await page.locator('[data-global-settings-save]').count(), 0);
            assert.equal(await page.locator('.global-settings-toggle').count(), 0);
            await page.locator('#globalStartupPreview').selectOption('last');
            await page.locator('[data-global-settings-section="storage"]').click();
            assert.equal(await page.locator('.global-settings-path').count(), 0);
            assert.equal(await page.locator('.global-settings-panel button').count(), 0);
            await page.locator('[data-global-settings-section="general"]').click();
            assert.equal(await page.locator('#globalStartupPreview').inputValue(), 'last');

            const otherLanguage = language === 'en' ? 'ru' : 'en';
            await page.locator('#globalLanguageSelect').selectOption(otherLanguage);
            assert.equal(await page.locator('#globalStartupPreview').inputValue(), 'last');
            assert.equal(await page.evaluate(() => state.language), otherLanguage);
            assert.equal(await page.evaluate(() => localStorage.getItem('geneograph.language')), otherLanguage);
            await page.locator('.global-settings-modal .modal-footer [data-close]').click();
            await page.evaluate(() => openGlobalSettingsModal('general'));
            assert.equal(await page.locator('#globalStartupPreview').inputValue(), 'picker');

            await page.locator('[data-global-settings-section="about"]').click();
            assert.equal(await page.locator('.global-settings-unavailable').isDisabled(), true);
            assert.equal(await page.locator('.global-settings-modal .publish-chip').count(), 0);
            assert.equal(await page.locator('.global-settings-modal [data-toast]').count(), 0);
            assert.equal(await page.locator('.global-settings-modal').getByText('Release notes').count(), 0);
            for (const [href, label] of [
                ['https://geneograph.com/privacy.html', 'Read policy'],
                ['https://geneograph.com/contact.html', 'Contact us'],
                ['https://geneograph.com/', 'Visit website']
            ]) {
                const link = page.locator(`.global-settings-modal a[href="${href}"]`);
                assert.equal(await link.count(), 1, label);
                assert.equal(await link.getAttribute('target'), '_blank');
                assert.match(await link.getAttribute('rel'), /noopener/);
                assert.match(await link.getAttribute('rel'), /noreferrer/);
            }
            const modalOverflow = await page.locator('.global-settings-modal').evaluate(el =>
                el.scrollWidth - el.clientWidth);
            assert.ok(modalOverflow < 2, `${width}px: modal overflows by ${modalOverflow}px`);
            await page.locator('[data-global-settings-tour]').click();
            assert.equal(await page.locator('.global-settings-modal').count(), 0);
            assert.equal(await page.evaluate(() => geneoTourRuntime.active), true);
            assert.deepEqual(errors, [], `${width}px ${language}: ${errors.join('; ')}`);
            await page.close();
        }
        console.log('Global settings sections, language, links, and tour launch passed.');
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
