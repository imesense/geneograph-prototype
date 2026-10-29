const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () =>
{
    const browser = await chromium.launch({ headless: true, executablePath: process.env.GENEO_BROWSER_EXECUTABLE });
    try
    {
        for (const [width, language] of [[1280,'en'],[390,'ru'],[320,'en']])
        {
            const page = await browser.newPage({viewport:{width,height:800}});
            const errors=[];
            page.on('pageerror', error=>errors.push(error.message));
            await page.goto(pathToFileURL(path.resolve(__dirname,'../src/index.html')).href);
            const png=await page.evaluate(language=>
            {
                geneoTourClose({offerRestore:false});
                setLanguage(language,false);
                activateProject('p1',{moduleName:'Albums'});
                if (sampleData.media.some(photo => Object.hasOwn(photo, 'placeholder'))) throw new Error('Decorative media metadata remains');
                const canvas=document.createElement('canvas');
                canvas.width=200;canvas.height=120;
                const context=canvas.getContext('2d');
                context.fillStyle='#00ff00';context.fillRect(80,40,40,40);
                context.fillStyle='rgba(255,0,0,0.5)';context.fillRect(120,40,40,40);
                window.transparentFixture=canvas.toDataURL('image/png');
                window.transparentWebpFixture=canvas.toDataURL('image/webp');
                return window.transparentFixture.split(',')[1];
            },language);
            let finishLoad;
            const loadGate=new Promise(resolve=>{finishLoad=resolve;});
            await page.route('https://image-fixture.invalid/photo.png',async route=>
            {
                await loadGate;
                await route.fulfill({contentType:'image/png',body:Buffer.from(png,'base64')});
            });
            await page.evaluate(()=>
            {
                const host=document.createElement('div');
                host.id='transparency-probe';
                host.style.cssText='position:fixed;top:80px;left:10px;width:200px;height:120px;background:rgb(51,68,85);z-index:99999';
                host.innerHTML=renderPhotoThumbnail({id:'legacy-placeholder',src:'https://image-fixture.invalid/photo.png',placeholder:{pattern:'orbit',palette:'plum',seed:1}});
                document.body.append(host);
            });
            const probe=page.locator('#transparency-probe');
            const original=await probe.boundingBox();
            assert.equal(await probe.locator('[data-photo-thumbnail]').getAttribute('data-photo-state'),'loading');
            assert.equal(await probe.locator('.photo-thumbnail-fallback').isVisible(),false);
            finishLoad();
            await page.waitForFunction(()=>document.querySelector('#transparency-probe [data-photo-thumbnail]').dataset.photoState==='loaded');
            assert.deepEqual(await probe.boundingBox(),original);
            const shot=await probe.screenshot();
            const pixels=await page.evaluate(async base64=>
            {
                const image=new Image();image.src='data:image/png;base64,'+base64;await image.decode();
                const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
                const context=canvas.getContext('2d');context.drawImage(image,0,0);
                return [[10,10],[100,60],[140,60]].map(([x,y])=>[...context.getImageData(x,y,1,1).data]);
            },shot.toString('base64'));
            assert.deepEqual(pixels[0],[51,68,85,255]);
            assert.deepEqual(pixels[1],[0,255,0,255]);
            assert.ok(Math.abs(pixels[2][0]-153)<=1 && Math.abs(pixels[2][1]-34)<=1 && Math.abs(pixels[2][2]-42)<=1,JSON.stringify(pixels[2]));
            assert.equal(await page.locator('.photo-abstract,.thumb-img-backdrop').count(),0);
            await page.evaluate(()=>
            {
                const host=document.querySelector('#transparency-probe');
                host.innerHTML=renderPhotoThumbnail({id:'webp',src:window.transparentWebpFixture});
            });
            await page.waitForFunction(()=>document.querySelector('#transparency-probe [data-photo-thumbnail]').dataset.photoState==='loaded');
            await page.evaluate(()=>{document.querySelector('#transparency-probe').innerHTML=renderPhotoThumbnail({id:'broken',src:'data:image/png;base64,invalid'});});
            await page.waitForFunction(()=>document.querySelector('#transparency-probe [data-photo-thumbnail]').dataset.photoState==='missing');
            assert.ok(await probe.locator('.photo-thumbnail-fallback').isVisible());
            assert.equal((await probe.locator('.photo-thumbnail-fallback').textContent()).trim(),language==='ru'?'Изображение недоступно':'Image unavailable');
            assert.deepEqual(await probe.boundingBox(),original);
            await page.evaluate(()=>
            {
                document.querySelector('#transparency-probe').remove();
                const photo=getProjectPhotos('p1')[0];
                photo.src=window.transparentFixture;
                const person=getPerson('silver');
                photo.personIds=[...new Set([...(photo.personIds||[]),person.id])];
                person.primaryPhotoId=photo.id;
                person.primaryPhotoCrop=null;
                renderAlbums();
            });
            assert.equal(await page.locator('.photo-abstract,.thumb-img-backdrop').count(),0);
            await page.screenshot({path:path.join(os.tmpdir(),`image-transparency-albums-${width}.png`)});
            await page.evaluate(()=>openPhotoLightbox(getProjectPhotos('p1')[0].id));
            assert.equal(await page.locator('.photo-abstract,.thumb-img-backdrop').count(),0);
            await page.evaluate(()=>{closeModal({force:true});rpOpenPhotoLinkPicker({projectId:'p1',onSave:()=>true});});
            assert.ok(await page.locator('.rp-photo-grid .rp-thumbnail').evaluateAll(elements=>elements.every(element=>getComputedStyle(element).backgroundColor==='rgba(0, 0, 0, 0)')));
            await page.evaluate(()=>
            {
                closeModal({force:true});
                activateProject('p1',{moduleName:'Family Tree'});
            });
            assert.ok(await page.locator('.person-avatar.has-photo').evaluateAll(elements=>elements.every(element=>getComputedStyle(element).backgroundImage==='none' && getComputedStyle(element).backgroundColor==='rgba(0, 0, 0, 0)')));
            assert.deepEqual(errors,[]);
            await page.close();
        }
        console.log('Transparent PNG/WebP, alpha pixels, delayed loading, missing sources and shared photo surfaces passed');
    }
    finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
