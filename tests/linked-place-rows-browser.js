const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () => {
    const browser = await chromium.launch({ headless: true,
        ...(process.env.GENEO_BROWSER_EXECUTABLE
            ? { executablePath: process.env.GENEO_BROWSER_EXECUTABLE } : {}) });
    try {
        for (const [width, language] of [[320, 'ru'], [390, 'en'], [1280, 'en']]) {
            const page = await browser.newPage({ viewport: { width, height: 800 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.route('https://**/*', route => route.abort());
            await page.goto(pathToFileURL(path.resolve(__dirname, '../src/index.html')).href);
            await page.waitForFunction(() => document.querySelector('#topbar')?.children.length > 0);
            const result = await page.evaluate(language => {
                setLanguage(language, false);
                activateProject('p1', { moduleName: 'Notes' });
                const place = sampleData.places.find(item => item.projectId === 'p1' && !item.deleted);
                const file = sampleData.archiveFiles.find(item => item.projectId === 'p1');
                const source = sampleData.sources.find(item => item.projectId === 'p1');
                const note = sampleData.notes.find(item => item.projectId === 'p1');
                note.linkedPlaceIds = [place.id];
                const host = document.createElement('div');
                host.style.width = innerWidth <= 390 ? '300px' : '360px';
                host.innerHTML = [
                    renderNoteLinkedEntitySection(note, 'place'),
                    renderArchiveSourceConnectionContent(source, 'place', [place]),
                    renderArchiveFilePlaces(file, false)
                ].join('');
                document.body.append(host);
                const rows = [...host.querySelectorAll('.notes-place-item')];
                return {
                    rowCount: rows.length,
                    noMetadata: rows.every(row => !row.querySelector('.notes-place-meta') && !/connected records?|No map position/.test(row.textContent)),
                    sameStructure: rows.every(row => row.querySelector('.notes-place-icon') && row.querySelector('.notes-place-secondary')),
                    localizedOpen: rows.every(row => row.querySelector('.notes-place-main')?.getAttribute('aria-label')?.startsWith(t('Open place:'))),
                    noOverflow: host.scrollWidth <= host.clientWidth,
                    widths: [host.clientWidth, host.scrollWidth],
                    overflowing: [...host.querySelectorAll('*')].filter(el => el.getBoundingClientRect().right > host.getBoundingClientRect().right + 1).slice(0, 5).map(el => el.className)
                };
            }, language);
            assert.equal(result.rowCount, 3);
            assert.ok(result.noMetadata && result.sameStructure && result.localizedOpen && result.noOverflow,
                JSON.stringify({ width, language, ...result }));
            assert.deepEqual(errors, []);
            await page.close();
        }
        console.log('Linked place rows passed.');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
