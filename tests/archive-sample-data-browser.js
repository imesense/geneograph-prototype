const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

const url = pathToFileURL(path.resolve(__dirname, '../src/index.html')).href;

(async () => {
    const browser = await chromium.launch({ headless: true,
        ...(process.env.GENEO_BROWSER_PATH ? { executablePath: process.env.GENEO_BROWSER_PATH } : {}) });
    try {
        const page = await browser.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        const result = await page.evaluate(async () => {
            const folders = sampleData.archiveFolders.filter(folder => folder.projectId === 'p1');
            const files = sampleData.archiveFiles.filter(file => file.projectId === 'p1');
            const folderIds = new Set(folders.map(folder => folder.id));
            const fileIds = new Set(files.map(file => file.id));
            const kinds = folders.map(folder => {
                const subfolders = folders.filter(child => child.parentId === folder.id).length;
                const items = files.filter(file => file.folderId === folder.id).length;
                return { name: folder.name, subfolders, items };
            });
            const images = await Promise.all(files.map(file => new Promise(resolve => {
                const image = new Image();
                image.onload = () => resolve({ id: file.id, ok: true, width: image.naturalWidth });
                image.onerror = () => resolve({ id: file.id, ok: false });
                image.src = file.previewUrl;
            })));
            return {
                files: files.length,
                invalidParents: folders.filter(folder => folder.parentId !== 'null' && !folderIds.has(folder.parentId)).map(folder => folder.id),
                invalidFolders: files.filter(file => !folderIds.has(file.folderId)).map(file => file.id),
                danglingNotes: sampleData.notes.flatMap(note => (note.linkedArchiveFileIds || []).filter(id => !fileIds.has(id))),
                danglingSources: sampleData.sourceLinks.filter(link => link.targetType === 'file' && !fileIds.has(link.targetId)).map(link => link.targetId),
                invalidPeople: files.flatMap(file => (file.linkedPersonIds || []).filter(id => !sampleData.people.some(person => person.id === id))),
                invalidRegions: files.flatMap(file => Object.entries(file.personRegions || {}).filter(([id, region]) =>
                    !file.linkedPersonIds.includes(id) || [region.x, region.y, region.width, region.height].some(n => n < 0 || n > 1)
                    || region.x + region.width > 1 || region.y + region.height > 1).map(([id]) => `${file.id}:${id}`)),
                kinds, images
            };
        });
        assert.equal(result.files, 7);
        for (const key of ['invalidParents', 'invalidFolders', 'danglingNotes', 'danglingSources', 'invalidPeople', 'invalidRegions'])
            assert.deepEqual(result[key], [], key);
        assert.ok(result.kinds.some(folder => folder.subfolders && folder.items), 'mixed folder');
        assert.ok(result.kinds.some(folder => folder.subfolders && !folder.items), 'folders-only folder');
        assert.ok(result.kinds.some(folder => !folder.subfolders && folder.items), 'files-only folder');
        assert.ok(result.kinds.some(folder => !folder.subfolders && !folder.items), 'empty folder');
        assert.ok(result.images.every(image => image.ok && image.width > 100), JSON.stringify(result.images));
        assert.deepEqual(errors, []);
        console.log('Archive sample folders, images, regions, and references passed.');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
