const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () => {
    const browser = await chromium.launch({
        ...(process.env.GENEO_BROWSER_PATH ? { executablePath: process.env.GENEO_BROWSER_PATH } : {}),
        headless: true
    });
    try {
        for (const [width, moduleName, open] of [
            [1280, 'Albums', "openPhotoLightbox('photo-silver-luna-wedding')"],
            [390, 'Albums', "openPhotoLightbox('photo-silver-luna-wedding')"],
            [1280, 'Archive', "openArchiveImagePeopleModal('af7')"],
            [390, 'Archive', "openArchiveImagePeopleModal('af7')"]
        ]) {
            const page = await browser.newPage({ viewport: { width, height: 760 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(pathToFileURL(path.resolve(__dirname, '../src/index.html')).href, { waitUntil: 'load' });
            await page.evaluate(({ moduleName, open }) => {
                if (geneoTourRuntime.active) geneoTourClose();
                activateProject('p1', { moduleName });
                Function(open)();
            }, { moduleName, open });
            const modal = page.locator('.photo-people-modal');
            const viewport = modal.locator('[data-image-viewport]');
            await viewport.locator('img').first().evaluate(image => image.decode());
            await page.waitForFunction(() => document.querySelector('[data-image-surface]')?.style.width);
            const original = await viewport.locator('img').first().boundingBox();
            const bounds = await viewport.boundingBox();
            await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
            await page.mouse.wheel(0, -350);
            assert.ok(parseInt(await modal.locator('[data-image-zoom]').textContent(), 10) > 100);
            const enlarged = await viewport.locator('img').first().boundingBox();
            assert.ok(enlarged.width > original.width, `${moduleName} ${width}: zoom enlarged image`);
            await modal.locator('[data-image-zoom-in]').click();
            if (process.env.GENEO_CAPTURE_DIR) await modal.screenshot({ path: path.join(process.env.GENEO_CAPTURE_DIR, `image-zoom-${moduleName.toLowerCase()}-${width}.png`) });
            assert.equal(await viewport.getAttribute('class').then(value => value.includes('is-panning')), true);
            assert.equal(await modal.locator('[data-image-pan]').count(), 0);
            await modal.locator('[data-lightbox-person]').first().hover();
            if (process.env.GENEO_CAPTURE_DIR) await modal.screenshot({ path: path.join(process.env.GENEO_CAPTURE_DIR, `image-zoom-label-${moduleName.toLowerCase()}-${width}.png`) });
            const label = modal.locator('.photo-image-regions .albums-lightbox-face-name:visible').first();
            assert.equal(await label.count(), 1, `${moduleName}: hovered label is visible`);
            assert.ok((await label.boundingBox()).height < 48, `${moduleName}: label stays screen-sized`);
            const beforePan = await viewport.locator('[data-image-surface]').evaluate(element => element.style.transform);
            const panPoint = await viewport.evaluate(element => {
                const rect = element.getBoundingClientRect();
                for (const y of [.2, .35, .5, .65, .8]) for (const x of [.2, .35, .5, .65, .8]) {
                    const px = rect.left + rect.width * x;
                    const py = rect.top + rect.height * y;
                    const hit = document.elementFromPoint(px, py);
                    if (hit?.closest('[data-image-viewport]') === element && !hit.closest('[data-image-region], .photo-image-tools')) return { x: px, y: py };
                }
                return null;
            });
            assert.ok(panPoint, 'unmarked image area is available for panning');
            await page.mouse.move(panPoint.x, panPoint.y);
            await page.mouse.down();
            await page.mouse.move(panPoint.x + 45, panPoint.y + 25, { steps: 3 });
            await page.mouse.up();
            const afterPlainPan = await viewport.locator('[data-image-surface]').evaluate(element => element.style.transform);
            assert.notEqual(afterPlainPan, beforePan, `${moduleName} ${width}: drag pans automatically`);
            await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
            await page.keyboard.down('Space');
            await page.mouse.down();
            await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2 + 45, { steps: 3 });
            await page.mouse.up();
            await page.keyboard.up('Space');
            const afterPan = await viewport.locator('[data-image-surface]').evaluate(element => element.style.transform);
            assert.notEqual(afterPan, afterPlainPan, `${moduleName} ${width}: Space-drag pans`);
            await modal.locator('[data-image-fit]').click();
            assert.equal((await modal.locator('[data-image-zoom]').textContent()).trim(), '100%');
            if (width === 1280) {
                await modal.locator('[data-lightbox-tag]').click();
                const choice = modal.locator('[data-photo-people-choice]').first();
                const personId = await choice.getAttribute('data-photo-people-choice');
                await choice.click();
                await modal.locator('[data-image-zoom-in]').click();
                await modal.locator('[data-photo-people-add-region]').click();
                assert.equal(await viewport.getAttribute('class').then(value => value.includes('is-drawing')), true);
                await page.keyboard.press('Escape');
                assert.equal(await viewport.getAttribute('class').then(value => value.includes('is-panning')), true);
                assert.equal(await modal.count(), 1, 'Escape cancels drawing without closing preview');
                await modal.locator('[data-photo-people-add-region]').click();
                const imageBounds = await modal.locator('[data-face-region-selector]').boundingBox();
                const start = { x: imageBounds.x + imageBounds.width * .7, y: imageBounds.y + imageBounds.height * .7 };
                const end = { x: imageBounds.x + imageBounds.width * .8, y: imageBounds.y + imageBounds.height * .71 };
                await page.mouse.move(start.x, start.y);
                await page.mouse.down();
                await page.mouse.move(end.x, end.y, { steps: 4 });
                await page.mouse.up();
                const saved = await page.evaluate(({ moduleName, personId }) => moduleName === 'Albums'
                    ? getPhoto('photo-silver-luna-wedding').personRegions[personId]
                    : archiveFileById('af7').personRegions[personId], { moduleName, personId });
                assert.ok(saved && Math.abs(saved.x - .7) < .04 && Math.abs(saved.y - .7) < .04,
                    `${moduleName}: drawing at zoom uses image coordinates`);
                assert.ok(saved.height > 0 && saved.height < .06, `${moduleName}: one-line area is not inflated`);
                if (process.env.GENEO_CAPTURE_DIR) await modal.screenshot({ path: path.join(process.env.GENEO_CAPTURE_DIR, `tiny-area-${moduleName.toLowerCase()}.png`) });
                assert.equal(await viewport.getAttribute('class').then(value => value.includes('is-panning')), true);
                const box = modal.locator('[data-face-region-box]');
                const boxBounds = await box.boundingBox();
                await page.mouse.move(boxBounds.x + boxBounds.width / 2, boxBounds.y + boxBounds.height / 2);
                await page.mouse.down();
                await page.mouse.move(boxBounds.x + boxBounds.width / 2 + 12, boxBounds.y + boxBounds.height / 2, { steps: 3 });
                await page.mouse.up();
                const moved = await page.evaluate(({ moduleName, personId }) => moduleName === 'Albums'
                    ? getPhoto('photo-silver-luna-wedding').personRegions[personId]
                    : archiveFileById('af7').personRegions[personId], { moduleName, personId });
                assert.ok(moved.x > saved.x, `${moduleName}: direct region drag still edits at zoom`);
                await modal.locator('[data-face-region-box]').focus();
                await page.keyboard.press('Alt+Shift+ArrowUp');
                const resized = await page.evaluate(({ moduleName, personId }) => moduleName === 'Albums'
                    ? getPhoto('photo-silver-luna-wedding').personRegions[personId]
                    : archiveFileById('af7').personRegions[personId], { moduleName, personId });
                assert.ok(resized.height > 0 && resized.height < moved.height, `${moduleName}: pixel-level keyboard resize`);
                await modal.locator('.albums-preview-done').click();
                await page.evaluate(({ moduleName, open }) => Function(open)(), { moduleName, open });
                const reopened = await page.evaluate(({ moduleName, personId }) => moduleName === 'Albums'
                    ? getPhoto('photo-silver-luna-wedding').personRegions[personId]
                    : archiveFileById('af7').personRegions[personId], { moduleName, personId });
                assert.ok(reopened.height < .06, `${moduleName}: small area survives reopening`);
            }
            assert.ok(await viewport.evaluate(element => element.scrollWidth <= element.clientWidth + 1));
            assert.deepEqual(errors, []);
            await page.close();
        }
        const touch = await browser.newPage({ viewport: { width: 390, height: 760 }, isMobile: true, hasTouch: true });
        await touch.goto(pathToFileURL(path.resolve(__dirname, '../src/index.html')).href, { waitUntil: 'load' });
        await touch.evaluate(() => {
            if (geneoTourRuntime.active) geneoTourClose();
            activateProject('p1', { moduleName: 'Archive' });
            openArchiveImagePeopleModal('af7');
        });
        const touchViewport = touch.locator('[data-image-viewport]');
        await touchViewport.locator('img').first().evaluate(image => image.decode());
        const touchBounds = await touchViewport.boundingBox();
        const cx = touchBounds.x + touchBounds.width / 2;
        const cy = touchBounds.y + touchBounds.height / 2;
        const cdp = await touch.context().newCDPSession(touch);
        const points = distance => [{ x: cx - distance, y: cy, id: 1 }, { x: cx + distance, y: cy, id: 2 }];
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: points(30) });
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: points(65) });
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        assert.ok(parseInt(await touch.locator('[data-image-zoom]').textContent(), 10) > 100, 'pinch zooms on touch');
        const touchPanPoint = await touchViewport.evaluate(element => {
            const rect = element.getBoundingClientRect();
            for (const y of [.2, .4, .6, .8]) for (const x of [.2, .4, .6, .8]) {
                const px = rect.left + rect.width * x;
                const py = rect.top + rect.height * y;
                const hit = document.elementFromPoint(px, py);
                if (hit?.closest('[data-image-viewport]') === element && !hit.closest('[data-image-region], .photo-image-tools')) return { x: px, y: py };
            }
            return null;
        });
        assert.ok(touchPanPoint);
        const beforeTouchPan = await touchViewport.locator('[data-image-surface]').evaluate(element => element.style.transform);
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...touchPanPoint, id: 3 }] });
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: touchPanPoint.x + 30, y: touchPanPoint.y + 30, id: 3 }] });
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        assert.notEqual(await touchViewport.locator('[data-image-surface]').evaluate(element => element.style.transform), beforeTouchPan, 'single-finger drag pans after pinch');
        await touch.close();
        console.log('Albums and Archive image zoom passed.');
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
