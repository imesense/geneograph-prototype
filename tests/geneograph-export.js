const exportTestFrame = document.getElementById('prototype');
const exportTestResults = document.getElementById('results');

function exportTestAssert(condition, message)
{
    if (!condition) throw new Error(message);
}

async function exportTestImage(blob)
{
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext('2d').drawImage(bitmap, 0, 0);
    bitmap.close();
    return canvas;
}

async function exportTestHash(blob)
{
    const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
    return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
}

async function runGeneographExportChecks()
{
    const button = document.getElementById('run');
    button.disabled = true;
    exportTestResults.replaceChildren();
    let passed = 0;
    let failed = 0;
    const check = async (name, action) =>
    {
        const item = document.createElement('li');
        exportTestResults.appendChild(item);
        try
        {
            await action();
            item.className = 'pass';
            item.textContent = `PASS: ${name}`;
            passed += 1;
        }
        catch (error)
        {
            item.className = 'fail';
            item.textContent = `FAIL: ${name} (${error.message})`;
            failed += 1;
            console.error(name, error);
        }
    };

    const app = exportTestFrame.contentWindow;
    let originalCreateObjectURL;
    let originalClick;
    try
    {
        if (exportTestFrame.contentDocument.readyState !== 'complete')
        {
            await new Promise(resolve => exportTestFrame.addEventListener('load', resolve, { once: true }));
        }
        app.eval("activateProject(sampleData.projects[0].id, { moduleName: 'Geneograph' }); openGeneographBoard(sampleData.boards[0].id);");
        const captured = [];
        originalCreateObjectURL = app.URL.createObjectURL;
        originalClick = app.HTMLAnchorElement.prototype.click;
        app.URL.createObjectURL = function(blob)
        {
            if (blob.type === 'image/png') captured.push(blob);
            return originalCreateObjectURL.call(this, blob);
        };
        app.HTMLAnchorElement.prototype.click = function()
        {
            if (this.download && this.href.startsWith('blob:')) return;
            return originalClick.call(this);
        };
        const exportOnce = async () =>
        {
            const count = captured.length;
            await app.eval('runGeneographPngExport()');
            return captured.length > count ? captured.at(-1) : null;
        };
        app.__exportTestDiagram = app.eval('structuredClone(selectedGeneographBoard().diagram)');
        const restore = () => app.eval('selectedGeneographBoard().diagram = structuredClone(window.__exportTestDiagram); renderGeneographEditorPreserveScroll();');

        await check('PNG signature and original Projects logo', async () =>
        {
            const blob = await exportOnce();
            exportTestAssert(blob?.type === 'image/png', 'No PNG blob');
            const signature = new Uint8Array(await blob.slice(0, 8).arrayBuffer());
            exportTestAssert(signature.join(',') === '137,80,78,71,13,10,26,10', 'Invalid PNG signature');
            const canvas = await exportTestImage(blob);
            const pixels = canvas.getContext('2d').getImageData(canvas.width - 500, canvas.height - 100, 500, 100).data;
            let green = 0;
            for (let index = 0; index < pixels.length; index += 4)
            {
                if (pixels[index + 1] > 100 && pixels[index + 1] > pixels[index] * 1.3 && pixels[index + 2] < 170) green += 1;
            }
            exportTestAssert(green > 30, 'Logo green is absent from the branding strip');
        });

        await check('25%, 100%, and 200% have identical framing and bytes', async () =>
        {
            const results = [];
            for (const zoom of [25, 100, 200])
            {
                app.eval(`state.geneoZoom = ${zoom}; renderGeneographEditorPreserveScroll();`);
                const blob = await exportOnce();
                exportTestAssert(Boolean(blob), `No PNG at ${zoom}%`);
                const image = await exportTestImage(blob);
                results.push(`${image.width}x${image.height}:${await exportTestHash(blob)}`);
            }
            exportTestAssert(results.every(value => value === results[0]), results.join(' / '));
        });

        await check('Board, history, selection, and viewport remain unchanged', async () =>
        {
            const snapshot = () => app.eval('JSON.stringify({ diagram: selectedGeneographBoard().diagram, undo: geneoHistoryRuntime.undo, redo: geneoHistoryRuntime.redo, node: state.selectedGeneoNodeId, connection: state.selectedGeneoConnectionId, tool: state.geneoTool, zoom: state.geneoZoom, x: main.querySelector("[data-geneo-canvas-wrap]").scrollLeft, y: main.querySelector("[data-geneo-canvas-wrap]").scrollTop })');
            const before = snapshot();
            exportTestAssert(Boolean(await exportOnce()), 'No PNG');
            exportTestAssert(snapshot() === before, 'Editor state changed');
        });

        await check('Two simultaneous requests create one PNG', async () =>
        {
            const count = captured.length;
            await Promise.all([
                app.eval('runGeneographPngExport()'),
                app.eval('runGeneographPngExport()')
            ]);
            exportTestAssert(captured.length === count + 1, 'Duplicate PNGs were produced');
        });

        await check('Active inline edit commits once before capture', async () =>
        {
            app.eval('state.geneoInlineEditNodeId = selectedGeneographBoard().diagram.nodes.find(node => node.type === "panel").id; renderGeneographEditorPreserveScroll(); main.querySelector("[data-geneo-inline-input]").value = "Export edit check";');
            const history = app.eval('geneoHistoryRuntime.undo.length');
            exportTestAssert(Boolean(await exportOnce()), 'Edited PNG failed');
            exportTestAssert(app.eval('selectedGeneographBoard().diagram.nodes.find(node => node.type === "panel").title') === 'Export edit check', 'Edit was not committed');
            exportTestAssert(app.eval('geneoHistoryRuntime.undo.length') === history + 1, 'Export added an extra history entry');
            restore();
        });

        await check('Negative/off-viewport content expands PNG bounds', async () =>
        {
            const baseline = await exportTestImage(await exportOnce());
            app.eval('selectedGeneographBoard().diagram.nodes.find(node => node.type === "sticky").x = -1200; renderGeneographEditorPreserveScroll();');
            const shifted = await exportTestImage(await exportOnce());
            exportTestAssert(shifted.width > baseline.width, 'Negative content clipped');
            restore();
        });

        await check('Hidden panel descendants stay out; locked objects remain', async () =>
        {
            app.eval('const diagram = selectedGeneographBoard().diagram; diagram.nodes.find(node => node.type === "panel").visible = false; diagram.nodes.find(node => node.type === "person" && !node.parentPanelId).locked = true; renderGeneographEditorPreserveScroll();');
            const stage = app.document.querySelector('[data-geneo-stage]');
            exportTestAssert(!stage.querySelector('.geneo-node-panel'), 'Hidden panel remains in the stage');
            exportTestAssert(Boolean(stage.querySelector('.geneo-node.locked')), 'Locked node is not rendered');
            exportTestAssert(Boolean(await exportOnce()), 'Hidden/locked PNG failed');
            restore();
        });

        await check('Shape and pencil paint survives; hit paths do not', async () =>
        {
            app.eval('state.geneoShapeKind = "hexagon"; createGeneographShapeFromRect({ x: -200, y: 800, width: 200, height: 160 }); createGeneographDrawingFromPoints([{ x: 150, y: 800 }, { x: 200, y: 820 }, { x: 260, y: 900 }]); renderGeneographEditorPreserveScroll();');
            const clone = app.document.querySelector('[data-geneo-stage]').cloneNode(true);
            app.geneoPngRemoveEditorContent(clone);
            exportTestAssert(Boolean(clone.querySelector('.geneo-shape-svg path')?.style.fill), 'Shape paint missing');
            exportTestAssert(clone.querySelectorAll('.geneo-drawing-hit, .geneo-port, .geneo-resize-handle').length === 0, 'Editor hit paths remain');
            exportTestAssert(Boolean(await exportOnce()), 'Mixed PNG failed');
            restore();
        });

        await check('Large board respects capacity and warns', async () =>
        {
            app.eval('selectedGeneographBoard().diagram.nodes.find(node => node.type === "sticky").x = 11000; renderGeneographEditorPreserveScroll();');
            const image = await exportTestImage(await exportOnce());
            exportTestAssert(image.width <= 8192 && image.height <= 8192 && image.width * image.height <= 16777216, 'Capacity exceeded');
            exportTestAssert(app.document.getElementById('toast').textContent.includes('reduced resolution'), 'No resolution notice');
            restore();
        });

        await check('Hidden board reports an empty state', async () =>
        {
            app.eval('selectedGeneographBoard().diagram.nodes.forEach(node => node.visible = false); renderGeneographEditorPreserveScroll();');
            exportTestAssert(await exportOnce() === null, 'Hidden board produced PNG');
            exportTestAssert(app.document.getElementById('toast').textContent.includes('Add visible objects'), 'No empty feedback');
            restore();
        });

        await check('Missing required photo fails without a download', async () =>
        {
            app.eval('selectedGeneographBoard().diagram.nodes.find(node => node.type === "image").imageRef = { scope: "project", id: "missing-test-photo" }; renderGeneographEditorPreserveScroll();');
            exportTestAssert(await exportOnce() === null, 'Missing photo was omitted');
            exportTestAssert(app.document.getElementById('toast').textContent.includes('required board image'), 'No asset feedback');
            restore();
        });

        await check('Corrupt image bytes fail without fallback', async () =>
        {
            app.eval('window.__exportTestImage = resolveGeneographImageSource(selectedGeneographBoard().diagram.nodes.find(node => node.type === "image")).photo; window.__exportTestImageSource = window.__exportTestImage.src; window.__exportTestImage.src = "data:image/png;base64,broken"; renderGeneographEditorPreserveScroll();');
            try
            {
                exportTestAssert(await exportOnce() === null, 'Corrupt image produced PNG');
                exportTestAssert(app.document.getElementById('toast').textContent.includes('required board image'), 'No corrupt-image feedback');
            }
            finally
            {
                app.eval('window.__exportTestImage.src = window.__exportTestImageSource; renderGeneographEditorPreserveScroll();');
            }
        });

        await check('Missing Projects logo fails and cleans up', async () =>
        {
            const logo = app.eval('icon.logo');
            try
            {
                app.eval('icon.logo = ""');
                exportTestAssert(await exportOnce() === null, 'Missing logo produced PNG');
                exportTestAssert(app.document.getElementById('toast').textContent.includes('required board image'), 'No logo feedback');
                exportTestAssert(!app.eval('geneoPngExportRuntime.busy') && !app.document.querySelector('.geneo-export-host'), 'Cleanup failed');
            }
            finally
            {
                app.eval(`icon.logo = ${JSON.stringify(logo)}`);
            }
        });

        await check('Russian attribution and feedback', async () =>
        {
            app.eval('state.language = "ru"; renderGeneographEditorPreserveScroll();');
            exportTestAssert(app.eval('t("Created with GeneoGraph")') === 'Создано в GeneoGraph', 'Wrong attribution');
            exportTestAssert(Boolean(await exportOnce()), 'Russian PNG failed');
            exportTestAssert(app.document.getElementById('toast').textContent.includes('Загрузка PNG'), 'No Russian feedback');
        });
    }
    catch (error)
    {
        await check('Test setup', () => { throw error; });
    }
    finally
    {
        if (originalCreateObjectURL) app.URL.createObjectURL = originalCreateObjectURL;
        if (originalClick) app.HTMLAnchorElement.prototype.click = originalClick;
        const summary = document.createElement('li');
        summary.className = failed ? 'fail' : 'pass';
        summary.textContent = `${passed} passed, ${failed} failed`;
        exportTestResults.appendChild(summary);
        button.disabled = false;
    }
}

document.getElementById('run').addEventListener('click', runGeneographExportChecks);
