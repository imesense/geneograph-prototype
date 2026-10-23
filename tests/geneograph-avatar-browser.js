const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () => {
    const root = path.resolve(__dirname, '../src');
    const server = http.createServer((request, response) => {
        const target = path.resolve(root, `.${decodeURIComponent(new URL(request.url, 'http://localhost').pathname)}`);
        if (!target.startsWith(root + path.sep) || !fs.existsSync(target)) {
            response.writeHead(404).end(); return;
        }
        const type = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html',
            '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' }[path.extname(target)] || 'application/octet-stream';
        response.setHeader('Content-Type', type);
        fs.createReadStream(target).pipe(response);
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const url = `http://127.0.0.1:${server.address().port}/index.html`;
    const browser = await chromium.launch({
        ...(process.env.GENEO_BROWSER_EXECUTABLE ? { executablePath: process.env.GENEO_BROWSER_EXECUTABLE } : {}),
        headless: true
    });
    try {
        for (const [width, language] of [[1280, 'en'], [390, 'ru']]) {
            const page = await browser.newPage({ viewport: { width, height: 800 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(`${url}?lang=${language}`, { waitUntil: 'domcontentloaded' });
            if (errors.length) throw new Error(errors.join('\n'));
            const ids = await page.evaluate(({ language, width }) => {
                activateProject('p1', { moduleName: 'Geneograph' });
                openGeneographBoard('gb1');
                setLanguage(language, false);
                const node = selectedGeneographDiagram().nodes.find(item => item.type === 'person');
                state.selectedGeneoNodeId = node.id;
                state.selectedGeneoNodeIds = [node.id];
                renderGeneographEditorPreserveScroll();
                if (width < 900) document.body.classList.add('mobile-details-open');
                const photo = sampleData.media.find(item => item.projectId === selectedGeneographBoard().projectId && !item.deletedAt);
                const person = getGeneographPerson(node.personId);
                return { nodeId: node.id, personId: node.personId, photoId: photo.id,
                    initialPhotoId: person.photoId || null,
                    treePhotoId: person.treePersonId ? getPerson(person.treePersonId)?.primaryPhotoId || null : null };
            }, { language, width });
            const inspector = page.locator('.geneo-inspector');
            assert.equal(await inspector.locator('.geneo-person-inspector-hero').count(), 1);
            const emptyPlacesHero = await page.evaluate(({ personId, nodeId }) => {
                const person = getGeneographPerson(personId);
                const node = getGeneographNode(nodeId);
                const element = document.createElement('div');
                element.innerHTML = renderGeneographPersonInspectorContent({
                    ...person, gender: 'female', names: { ...person.names, maiden: 'Smith' },
                    birth: {}, death: {}
                }, node);
                return {
                    name: element.querySelector('.geneo-person-inspector-name')?.textContent.trim(),
                    hasPlaces: element.querySelector('.geneo-person-inspector-hero')?.classList.contains('has-places'),
                    facts: element.querySelectorAll('.geneo-person-summary').length
                };
            }, ids);
            assert.match(emptyPlacesHero.name, /\(Smith\)/);
            assert.equal(emptyPlacesHero.hasPlaces, false);
            assert.equal(emptyPlacesHero.facts, 0);
            assert.equal(await inspector.locator('[data-geneo-avatar-location="inspector"]').count(), 1);
            if (width > 900) {
                const camera = inspector.locator('[data-geneo-avatar-location="inspector"]');
                const cardCamera = page.locator(`[data-geneo-node="${ids.nodeId}"] [data-geneo-avatar-location="card"]`);
                await page.mouse.move(10, 10);
                await page.waitForTimeout(200);
                assert.equal(await camera.evaluate(button => getComputedStyle(button).opacity), '0');
                assert.equal(await cardCamera.evaluate(button => getComputedStyle(button).opacity), '0');
                await page.locator(`[data-geneo-node="${ids.nodeId}"] .geneo-person-avatar`).hover();
                await page.waitForTimeout(200);
                assert.equal(await cardCamera.evaluate(button => getComputedStyle(button).opacity), '1');
                await inspector.locator('.geneo-inspector-person-avatar').hover();
                await page.waitForTimeout(200);
                assert.equal(await camera.evaluate(button => getComputedStyle(button).opacity), '1');
                assert.equal(await camera.evaluate(button => {
                    const box = button.getBoundingClientRect();
                    return document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)?.closest('button') === button;
                }), true);
            }
            await inspector.locator('[data-geneo-avatar-location="inspector"]').click();
            await page.locator(`[data-geneo-image-candidate="${ids.photoId}"]`).click();
            await page.locator('[data-geneo-image-confirm]').click();
            await page.locator('[data-geneo-avatar-cancel]').last().click();
            assert.equal(await page.locator('[data-geneo-image-picker]').count(), 0);
            assert.equal(await page.evaluate(personId => getGeneographPerson(personId).photoId || null, ids.personId), ids.initialPhotoId);
            await inspector.locator('[data-geneo-avatar-location="inspector"]').click();
            assert.equal(await page.locator('[data-geneo-image-picker]').count(), 1);
            await page.locator(`[data-geneo-image-candidate="${ids.photoId}"]`).click();
            await page.locator('[data-geneo-image-confirm]').click();
            assert.equal(await page.locator('[data-geneo-avatar-adjust]').count(), 1);
            assert.ok((await page.locator('#geneoAvatarAdjustTitle').textContent())
                .includes(language === 'ru' ? 'Изменить фото' : 'Change photo for'));
            assert.equal(await page.locator('[data-geneo-avatar-adjust] [data-face-region-selector]').count(), 1);
            assert.equal(await page.locator('[data-geneo-avatar-adjust] .person-photo-preview-card').count(), 2);
            assert.equal(await page.evaluate(() => Boolean(document.elementFromPoint(innerWidth / 2, innerHeight / 2)?.closest('[data-geneo-avatar-adjust]'))), true);
            if (process.env.GENEO_AVATAR_SCREENSHOT_DIR) {
                await page.locator('[data-geneo-avatar-adjust]').screenshot({
                    path: path.join(process.env.GENEO_AVATAR_SCREENSHOT_DIR, `avatar-adjust-${width}.png`)
                });
            }
            const originalRegion = await page.evaluate(() => ({ ...state.geneoImagePicker.avatarRegion }));
            await page.locator('[data-geneo-avatar-adjust] [data-face-region-box]').focus();
            await page.keyboard.press('ArrowRight');
            const adjustedRegion = await page.evaluate(() => ({ ...state.geneoImagePicker.avatarRegion }));
            assert.ok(adjustedRegion.x > originalRegion.x);
            assert.deepEqual(await page.locator('[data-geneo-avatar-adjust] .person-photo-region-preview').first().evaluate(
                preview => JSON.parse(preview.dataset.faceRegion)), adjustedRegion);
            await page.locator('[data-geneo-avatar-save]').click();
            assert.deepEqual(await page.evaluate(personId => {
                const person = getGeneographPerson(personId);
                return [person.photoId, person.photoAssetId, person.photoCrop, person.photoRegion];
            }, ids.personId), [ids.photoId, null, null, adjustedRegion]);
            assert.equal(await inspector.locator('.geneo-person-inspector-avatar, .geneo-inspector-person-avatar.has-photo').count(), 1);
            assert.deepEqual(await inspector.locator('.geneo-inspector-person-avatar .person-avatar-media').evaluate(
                media => JSON.parse(media.dataset.faceRegion)), adjustedRegion);
            if (process.env.GENEO_AVATAR_SCREENSHOT_DIR) {
                await inspector.screenshot({
                    path: path.join(process.env.GENEO_AVATAR_SCREENSHOT_DIR, `avatar-inspector-${width}.png`)
                });
            }
            if (ids.treePhotoId) assert.equal(await page.evaluate(personId => {
                const person = getGeneographPerson(personId);
                return getPerson(person.treePersonId).primaryPhotoId;
            }, ids.personId), ids.treePhotoId);
            await page.evaluate(() => undoGeneographChange());
            assert.equal(await page.evaluate(personId => getGeneographPerson(personId).photoId, ids.personId), ids.initialPhotoId);
            await page.evaluate(() => redoGeneographChange());
            assert.equal(await page.evaluate(personId => getGeneographPerson(personId).photoId, ids.personId), ids.photoId);
            assert.deepEqual(await page.evaluate(personId => getGeneographPerson(personId).photoRegion, ids.personId), adjustedRegion);
            await inspector.locator('[data-geneo-avatar-location="inspector"]').click();
            assert.equal(await page.locator('[data-geneo-avatar-remove]').count(), 1);
            await page.locator('[data-geneo-avatar-remove]').click();
            assert.equal(await page.evaluate(personId => getGeneographPerson(personId).photoId, ids.personId), null);
            const fallbackPhotoId = await inspector.locator('.geneo-inspector-person-avatar .person-avatar-photo').count();
            assert.equal(fallbackPhotoId > 0, Boolean(ids.treePhotoId));
            const upload = await page.evaluate(() => {
                const canvas = document.createElement('canvas');
                canvas.width = 2; canvas.height = 2;
                canvas.getContext('2d').fillRect(0, 0, 2, 2);
                return { filename: 'board-avatar.png', mimeType: 'image/png', src: canvas.toDataURL('image/png') };
            });
            await inspector.locator('[data-geneo-avatar-location="inspector"]').click();
            await page.locator('[data-geneo-image-tab="upload"]').click();
            await page.locator('[data-geneo-image-file]').setInputFiles({
                name: upload.filename || 'avatar.png', mimeType: upload.mimeType,
                buffer: Buffer.from(upload.src.split(',')[1], 'base64')
            });
            await page.locator('[data-geneo-image-confirm]:enabled').waitFor();
            await page.locator('[data-geneo-image-confirm]').click();
            await page.locator('[data-geneo-avatar-save]').click();
            const uploaded = await page.evaluate(personId => {
                const person = getGeneographPerson(personId);
                return { id: person.photoAssetId,
                    asset: selectedGeneographBoard().diagram.assets.some(item => item.id === person.photoAssetId),
                    treePhotoId: person.treePersonId ? getPerson(person.treePersonId).primaryPhotoId : null };
            }, ids.personId);
            assert.ok(uploaded.id);
            assert.equal(uploaded.asset, true);
            assert.equal(uploaded.treePhotoId, ids.treePhotoId);
            const exported = await page.evaluate(async () => JSON.parse(await buildGeneographBoardFile()).board.diagram);
            assert.ok(exported.assets.some(item => item.id === uploaded.id));
            assert.ok(exported.people.some(item => item.id === ids.personId && item.photoRegion));
            await page.evaluate(() => undoGeneographChange());
            assert.equal(await page.evaluate(personId => getGeneographPerson(personId).photoAssetId, ids.personId), null);
            await page.evaluate(() => redoGeneographChange());
            assert.equal(await page.evaluate(personId => getGeneographPerson(personId).photoAssetId, ids.personId), uploaded.id);
            await inspector.locator('[data-geneo-avatar-location="inspector"]').click();
            await page.locator('[data-geneo-image-tab="upload"]').click();
            await page.locator('[data-geneo-image-confirm]').click();
            await page.locator('[data-geneo-avatar-save]').click();
            assert.equal(await page.evaluate(personId => getGeneographPerson(personId).photoAssetId, ids.personId), uploaded.id);
            const cardActions = await page.evaluate(nodeId => {
                const node = getGeneographNode(nodeId);
                return ['standard', 'chart', 'portrait', 'compact'].map(style => {
                    const card = { ...node, personCard: { ...node.personCard, custom: true, style } };
                    const element = document.createElement('div');
                    element.innerHTML = renderGeneographPersonNode(card);
                    return element.querySelectorAll('[data-geneo-avatar-location="card"]').length;
                });
            }, ids.nodeId);
            assert.deepEqual(cardActions, [1, 1, 1, 0]);
            assert.deepEqual(errors, []);
            await page.close();
        }
        console.log('Geneograph avatar checks passed.');
    } finally {
        await browser.close();
        server.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
