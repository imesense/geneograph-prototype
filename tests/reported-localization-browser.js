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
        const page = await browser.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(`${pathToFileURL(path.resolve(__dirname, '../src/index.html')).href}?lang=ru`);
        const result = await page.evaluate(() =>
        {
            geneoTourClose({ offerRestore: false });
            setLanguage('ru', false);
            activateProject('p1', { moduleName: 'Archive' });
            const file = sampleData.archiveFiles.find(item => item.id === 'af7');
            const description = renderArchiveFileDetails(file, false);

            activateProject('p1', { moduleName: 'People' });
            openConnectedFilesModal({ projectId: 'p1', autoFocusSearch: false });
            const folder = document.querySelector('[data-connected-files-open-folder="documents"]')?.textContent.trim();
            document.querySelector('[data-connected-files-open-folder="documents"]')?.click();
            const breadcrumb = document.querySelector('[data-connected-files-folder-path="documents"]')?.textContent.trim();
            closeModal({ force: true });

            activateProject('p1', { moduleName: 'Albums' });
            openAddPhotosModal();
            const upload = document.querySelector('[data-albums-photo-upload]')?.innerText;
            closeModal({ force: true });

            activateProject('p1', { moduleName: 'Geneograph' });
            openGeneographBoard('gb1');
            const sticky = selectedGeneographBoard().diagram.nodes.find(node => node.type === 'sticky');
            sticky.appearance.fill.enabled = false;
            const inspector = new DOMParser().parseFromString(renderGeneographNodeInspector(sticky), 'text/html');
            return {
                description,
                folder,
                breadcrumb,
                upload,
                type: inspector.querySelector('.geneo-inspector-title span')?.textContent.trim(),
                deleteLabel: inspector.querySelector('[data-geneo-delete-selection]')?.textContent.trim(),
                restore: inspector.querySelector('[data-geneo-paint-property="fill"] [data-geneo-paint-toggle]')?.textContent.trim(),
                none: inspector.querySelector('[data-geneo-paint-property="fill"] [data-geneo-paint-state]')?.textContent.trim()
            };
        });
        assert.match(result.description, /Образец объявления о рождении/);
        assert.equal(result.folder, 'Исследовательские поездки');
        assert.equal(result.breadcrumb, 'Исследовательские поездки');
        assert.match(result.upload, /Новые фотографии будут добавлены в текущий проект/);
        assert.match(result.upload, /20 МБ на файл/);
        assert.equal(result.type, 'Стикер');
        assert.match(result.deleteLabel, /Удалить стикер/);
        assert.equal(result.restore, 'Восстановить');
        assert.equal(result.none, 'Нет');
        assert.deepEqual(errors, []);
        console.log('Reported Russian localization checks passed.');
    }
    finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
