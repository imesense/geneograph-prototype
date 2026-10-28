const archiveDocumentBytes = new Map();
const archiveDocumentExtensions = new Set(['txt', 'csv', 'pdf', 'docx']);
const archiveImageExtensions = new Set(['png', 'jpg', 'jpeg', 'webp']);
const archiveUploadedImageUrls = new Map();
const archiveDocumentMaxBytes = 20 * 1024 * 1024;
let archiveShowMarkedAreas = true;

function archiveImageSource(file) {
    return file?.assetUrl || file?.previewUrl || file?.src || file?.thumbnailUrl || '';
}

function archiveCanViewFile(file) {
    if (!file) return false;
    const extension = archiveDocumentExtension(file.name);
    if (archiveImageExtensions.has(extension)) return Boolean(archiveImageSource(file) || archiveDocumentBytes.has(file.id));
    return archiveDocumentExtensions.has(extension) && Boolean(file.assetUrl || archiveDocumentBytes.has(file.id));
}

function archiveMarkedRegions(file) {
    return Object.entries(file?.personRegions || {}).map(([personId, raw]) => {
        const region = normalizeFaceRegion(raw);
        const person = sampleData.people.find(item => item.id === personId && item.projectId === file.projectId);
        return region && person ? { personId, region, name: personResourceDisplayName(person) } : null;
    }).filter(Boolean);
}

function archiveUpdateRegionVisibility() {
    document.querySelectorAll('[data-archive-region-box]').forEach(box => {
        box.hidden = box.dataset.archiveRegionReady === 'false'
            || !box.classList.contains('is-active');
    });
}

function archiveDocumentExtension(name) {
    return String(name || '').split('.').pop().toLowerCase();
}

function archiveDocumentLabel(english, russian) {
    return state.language === 'ru' ? russian : english;
}

async function archiveDocumentBlob(file) {
    if (archiveDocumentBytes.has(file.id)) return archiveDocumentBytes.get(file.id);
    const source = archiveImageExtensions.has(archiveDocumentExtension(file.name)) ? archiveImageSource(file) : file.assetUrl;
    if (!source) throw new Error(archiveDocumentLabel('This file has no viewable original.', 'У этого файла нет доступного оригинала.'));
    const response = await fetch(source);
    if (!response.ok) throw new Error(archiveDocumentLabel('The sample file could not be loaded.', 'Не удалось загрузить образец файла.'));
    return response.blob();
}

function archiveDocumentDownload(file, blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function archiveReleaseDocument(fileId) {
    const url = archiveUploadedImageUrls.get(fileId);
    if (url) URL.revokeObjectURL(url);
    archiveUploadedImageUrls.delete(fileId);
    archiveDocumentBytes.delete(fileId);
}

async function archiveValidateImage(source, extension) {
    const bytes = new Uint8Array(await source.slice(0, 12).arrayBuffer());
    const png = extension === 'png' && [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value);
    const jpeg = ['jpg', 'jpeg'].includes(extension) && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const webp = extension === 'webp' && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF'
        && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
    if (!png && !jpeg && !webp) throw new Error(archiveDocumentLabel('Invalid image file', 'Недопустимый файл изображения'));
    const bitmap = await createImageBitmap(source);
    try {
        if (!bitmap.width || !bitmap.height) throw new Error('Empty image');
    } finally {
        bitmap.close();
    }
}

async function archiveDocumentRenderPdf(blob, host, modal) {
    const pdfjs = await import('./vendor/pdfjs-5.6.205.min.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('./vendor/pdfjs-worker-5.6.205.min.mjs', location.href).href;
    const bytes = await blob.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: bytes, isEvalSupported: false, useSystemFonts: true }).promise;
    if (!pdf.numPages) throw new Error('Empty PDF');
    host.replaceChildren();
    const toolbar = modal.querySelector('[data-document-tools]');
    toolbar.hidden = false;
    toolbar.className = 'archive-document-tools archive-document-pdf-tools';
    toolbar.innerHTML = `<div class="archive-document-tool-group"><button class="button secondary" type="button" data-pdf-prev aria-label="${escapeHtml(archiveDocumentLabel('Previous page', 'Предыдущая страница'))}" title="${escapeHtml(archiveDocumentLabel('Previous page', 'Предыдущая страница'))}">${icon.arrow}</button><span data-pdf-page aria-live="polite"></span><button class="button secondary archive-pdf-next" type="button" data-pdf-next aria-label="${escapeHtml(archiveDocumentLabel('Next page', 'Следующая страница'))}" title="${escapeHtml(archiveDocumentLabel('Next page', 'Следующая страница'))}">${icon.arrow}</button></div><div class="archive-document-tool-group"><button class="button secondary" type="button" data-pdf-out aria-label="${escapeHtml(archiveDocumentLabel('Zoom out', 'Уменьшить'))}" title="${escapeHtml(archiveDocumentLabel('Zoom out', 'Уменьшить'))}">${icon.zoomOut}</button><span data-pdf-zoom aria-live="polite"></span><button class="button secondary" type="button" data-pdf-in aria-label="${escapeHtml(archiveDocumentLabel('Zoom in', 'Увеличить'))}" title="${escapeHtml(archiveDocumentLabel('Zoom in', 'Увеличить'))}">${icon.zoomIn}</button></div>`;
    const canvas = document.createElement('canvas');
    canvas.className = 'archive-document-pdf-canvas';
    const stage = document.createElement('div');
    stage.className = 'archive-document-pdf-stage';
    stage.append(canvas);
    host.append(stage);
    let pageNumber = 1;
    let zoom = 1;
    let renderSerial = 0;
    let renderTask = null;
    const render = async () => {
        const serial = ++renderSerial;
        const page = await pdf.getPage(pageNumber);
        if (serial !== renderSerial || !modal.isConnected) return;
        if (renderTask) {
            renderTask.cancel();
            try { await renderTask.promise; } catch (error) {
                if (error.name !== 'RenderingCancelledException') throw error;
            }
        }
        if (serial !== renderSerial || !modal.isConnected) return;
        const hostStyle = getComputedStyle(host);
        const available = Math.max(160, host.clientWidth
            - parseFloat(hostStyle.paddingLeft) - parseFloat(hostStyle.paddingRight) - 32);
        const natural = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: available / natural.width * zoom });
        if (serial !== renderSerial || !modal.isConnected) return;
        const ratio = Math.min(devicePixelRatio || 1, 2);
        canvas.width = Math.round(viewport.width * ratio);
        canvas.height = Math.round(viewport.height * ratio);
        canvas.style.width = `${Math.round(viewport.width)}px`;
        canvas.style.height = `${Math.round(viewport.height)}px`;
        const context = canvas.getContext('2d');
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        renderTask = page.render({ canvasContext: context, viewport });
        await renderTask.promise;
        if (serial !== renderSerial || !modal.isConnected) return;
        toolbar.querySelector('[data-pdf-page]').textContent = `${pageNumber} / ${pdf.numPages}`;
        toolbar.querySelector('[data-pdf-zoom]').textContent = `${Math.round(zoom * 100)}%`;
        toolbar.querySelector('[data-pdf-prev]').disabled = pageNumber === 1;
        toolbar.querySelector('[data-pdf-next]').disabled = pageNumber === pdf.numPages;
    };
    toolbar.addEventListener('click', event => {
        const button = event.target.closest('button');
        if (!button) return;
        if (button.hasAttribute('data-pdf-prev')) pageNumber = Math.max(1, pageNumber - 1);
        if (button.hasAttribute('data-pdf-next')) pageNumber = Math.min(pdf.numPages, pageNumber + 1);
        if (button.hasAttribute('data-pdf-out')) zoom = Math.max(0.5, +(zoom - 0.25).toFixed(2));
        if (button.hasAttribute('data-pdf-in')) zoom = Math.min(2, +(zoom + 0.25).toFixed(2));
        render().catch(error => { if (modal.isConnected && error.name !== 'RenderingCancelledException') host.textContent = error.message; });
    });
    const observer = new ResizeObserver(() => {
        if (!modal.isConnected) { observer.disconnect(); return; }
        render().catch(error => { if (modal.isConnected && error.name !== 'RenderingCancelledException') host.textContent = error.message; });
    });
    await render();
    observer.observe(host);
    const cleanup = new MutationObserver(() => {
        if (modal.isConnected) return;
        observer.disconnect();
        renderTask?.cancel();
        pdf.destroy();
        cleanup.disconnect();
    });
    cleanup.observe(modalBackdrop, { childList: true });
}

function archiveDocumentRenderCsv(text, host) {
    if (!window.Papa) throw new Error('CSV parser unavailable');
    const parsed = Papa.parse(text, { delimiter: ',', skipEmptyLines: true });
    if (parsed.errors.length) throw new Error(parsed.errors[0].message);
    const [heading = [], ...rows] = parsed.data;
    const table = document.createElement('table');
    table.className = 'archive-document-table';
    const head = table.createTHead().insertRow();
    heading.forEach(value => { const cell = document.createElement('th'); cell.textContent = value; head.append(cell); });
    const body = table.createTBody();
    let index = 0;
    const append = () => {
        const end = Math.min(index + 150, rows.length);
        for (; index < end; index++) {
            const row = body.insertRow();
            rows[index].forEach(value => { const cell = row.insertCell(); cell.textContent = value; });
        }
    };
    append();
    host.append(table);
    host.addEventListener('scroll', () => {
        if (host.scrollTop + host.clientHeight >= host.scrollHeight - 400 && index < rows.length) append();
    }, { passive: true });
}

function openArchiveImagePeopleModal(fileId, { mode = 'preview' } = {}) {
    const file = archiveFileById(fileId);
    if (!file || !archiveCanViewFile(file)) return;
    openUnifiedImagePeopleModal(file.id, {
        mode,
        archiveFile: file,
        imageSrc: archiveImageSource(file)
    });
}

async function openArchiveDocumentViewer(fileId) {
    const file = archiveFileById(fileId);
    if (!file) return;
    const extension = archiveDocumentExtension(file.name);
    if (archiveImageExtensions.has(extension)) {
        if (archiveCanViewFile(file)) openArchiveImagePeopleModal(fileId);
        else showToast(archiveDocumentLabel('No in-app viewer is available for this file.', 'Этот файл пока нельзя открыть в приложении.'));
        return;
    }
    if (!archiveCanViewFile(file)) {
        showToast(archiveDocumentLabel('No in-app viewer is available for this file.', 'Этот файл пока нельзя открыть в приложении.'));
        return;
    }
    openModal(`<div class="modal archive-document-modal" role="dialog" aria-modal="true" aria-labelledby="archiveDocumentTitle"><div class="modal-header"><div><h2 id="archiveDocumentTitle" data-user-content>${escapeHtml(file.name)}</h2><p>${escapeHtml(extension.toUpperCase())}</p></div><button class="close-button" type="button" data-close aria-label="Close">${icon.close}</button></div><div class="archive-document-tools" data-document-tools hidden></div><div class="modal-body archive-document-body" data-document-body data-user-content><p>${escapeHtml(archiveDocumentLabel('Loading document…', 'Загрузка документа…'))}</p></div><div class="modal-footer"><button class="button secondary" type="button" data-document-download>${escapeHtml(archiveDocumentLabel('Download', 'Скачать'))}</button></div></div>`);
    const modal = modalBackdrop.querySelector('.archive-document-modal');
    const host = modal?.querySelector('[data-document-body]');
    if (!host) return;
    try {
        const blob = await archiveDocumentBlob(file);
        if (!modal.isConnected) return;
        modal.querySelector('[data-document-download]').addEventListener('click', () => archiveDocumentDownload(file, blob));
        host.replaceChildren();
        if (extension === 'txt') {
            const pre = document.createElement('pre');
            pre.className = 'archive-document-text';
            pre.textContent = await blob.text();
            host.append(pre);
        } else if (extension === 'csv') {
            archiveDocumentRenderCsv(await blob.text(), host);
        } else if (extension === 'docx') {
            if (!window.mammoth || !window.DOMPurify) throw new Error('Document viewer unavailable');
            const converted = await mammoth.convertToHtml({ arrayBuffer: await blob.arrayBuffer() }, { externalFileAccess: false });
            const article = document.createElement('article');
            article.className = 'archive-document-article';
            article.innerHTML = DOMPurify.sanitize(converted.value, { USE_PROFILES: { html: true }, FORBID_TAGS: ['iframe', 'object', 'embed', 'form'] });
            host.append(article);
        } else {
            await archiveDocumentRenderPdf(blob, host, modal);
        }
    } catch (error) {
        if (modal.isConnected) host.textContent = `${archiveDocumentLabel('This document could not be opened:', 'Не удалось открыть документ:')} ${error.message}`;
    }
}

async function archiveImportFiles(selected, { projectId = currentProjectId(), folderId = null, onResult = () => {} } = {}) {
    const ids = [];
    if (!projectId || (folderId && !archiveFolderById(folderId, projectId))) return ids;
    for (const source of Array.from(selected || [])) {
        const report = (status, message) => onResult(source, status, message);
        const extension = archiveDocumentExtension(source.name);
        if (!(archiveDocumentExtensions.has(extension) || archiveImageExtensions.has(extension)) || source.size > archiveDocumentMaxBytes || source.size === 0) {
            report('error', archiveDocumentLabel('Unsupported, empty, or over 20 MB.', 'Неподдерживаемый, пустой или больше 20 МБ.'));
            continue;
        }
        try {
            const signature = new Uint8Array(await source.slice(0, 5).arrayBuffer());
            if (extension === 'pdf' && String.fromCharCode(...signature) !== '%PDF-') throw new Error('Invalid PDF');
            if (extension === 'docx' && !(signature[0] === 80 && signature[1] === 75)) throw new Error('Invalid DOCX');
            if (extension === 'pdf') {
                const pdfjs = await import('./vendor/pdfjs-5.6.205.min.mjs');
                pdfjs.GlobalWorkerOptions.workerSrc = new URL('./vendor/pdfjs-worker-5.6.205.min.mjs', location.href).href;
                await pdfjs.getDocument({ data: await source.arrayBuffer(), isEvalSupported: false }).promise;
            }
            if (extension === 'csv') {
                const parsed = Papa.parse(await source.text(), { delimiter: ',', skipEmptyLines: true });
                if (parsed.errors.length) throw new Error(parsed.errors[0].message);
            }
            if (extension === 'docx') await mammoth.convertToHtml({ arrayBuffer: await source.arrayBuffer() }, { externalFileAccess: false });
            if (archiveImageExtensions.has(extension)) await archiveValidateImage(source, extension);
            const id = `af-upload-${crypto.randomUUID()}`;
            const now = new Date().toISOString();
            const image = archiveImageExtensions.has(extension);
            const kind = image ? 'img' : extension === 'pdf' ? 'pdf' : extension === 'csv' ? 'sheet' : 'doc';
            const previewUrl = image ? URL.createObjectURL(source) : '';
            sampleData.archiveFiles.push({ id, projectId, folderId, name: source.name, kind, type: image ? 'Image' : extension.toUpperCase(), mimeType: source.type, size: `${Math.max(1, Math.ceil(source.size / 1024))} KB`, sizeBytes: source.size, favorite: false, description: '', previewUrl, linkedPersonIds: [], linkedEventIds: [], linkedNoteIds: [], linkedPlaceIds: [], placeIds: [], addedAt: now, updatedAt: now });
            archiveDocumentBytes.set(id, source);
            if (image) archiveUploadedImageUrls.set(id, previewUrl);
            ids.push(id);
            report('success', archiveDocumentLabel('Added', 'Добавлен'));
        } catch (error) {
            report('error', `${archiveDocumentLabel('Could not read file', 'Не удалось прочитать файл')} (${error.message})`);
        }
    }
    return ids;
}

function archiveRollbackImportedFiles(ids) {
    const removed = new Set(ids);
    for (let index = sampleData.archiveFiles.length - 1; index >= 0; index--) {
        if (removed.has(sampleData.archiveFiles[index].id)) sampleData.archiveFiles.splice(index, 1);
    }
    ids.forEach(id => {
        archiveDocumentBytes.delete(id);
        const url = archiveUploadedImageUrls.get(id);
        if (url) URL.revokeObjectURL(url);
        archiveUploadedImageUrls.delete(id);
    });
}

function openArchiveDocumentImport({ files = null, onImported = null, projectId = currentProjectId(), folderId = state.activeModule === 'Archive' ? state.archiveSelectedFolderId || null : null, destinationLabel = null, modalOpener = openModal } = {}) {
    const destination = destinationLabel || (folderId ? archiveFolderById(folderId, projectId)?.name : archiveDocumentLabel('All files', 'Все файлы'));
    modalOpener(`<div class="modal archive-document-import" role="dialog" aria-modal="true" aria-labelledby="archiveImportTitle"><div class="modal-header"><div><h2 id="archiveImportTitle">${escapeHtml(archiveDocumentLabel('Add files', 'Добавить файлы'))}</h2><p>${escapeHtml(archiveDocumentLabel('Adding to', 'Папка'))} <strong>${escapeHtml(destination || archiveDocumentLabel('All files', 'Все файлы'))}</strong></p></div><button class="close-button" type="button" data-close aria-label="Close">${icon.close}</button></div><div class="modal-body"><div class="archive-document-drop upload-dropzone" data-document-drop tabindex="0" role="button" aria-label="${escapeHtml(archiveDocumentLabel('Choose files or drop them here', 'Выберите файлы или перетащите их сюда'))}">${renderUploadDropzonePrompt(archiveDocumentLabel('Drop files here or choose files', 'Перетащите файлы сюда или выберите'), archiveDocumentLabel('Up to 20 MB each', 'До 20 МБ каждый'))}</div><p class="archive-document-formats">PNG, JPEG, WebP, TXT, CSV, PDF, DOCX</p><input type="file" multiple accept=".png,.jpg,.jpeg,.webp,.txt,.csv,.pdf,.docx" data-document-input hidden><div class="archive-document-import-results" data-import-results data-user-content hidden><h3>${escapeHtml(archiveDocumentLabel('Import results', 'Результаты добавления'))}</h3><div data-import-rows></div></div></div><div class="modal-footer"><p class="archive-document-import-notice"><span aria-hidden="true">${icon.warning}</span><span>${escapeHtml(archiveDocumentLabel('Available until page reload', 'Доступны до перезагрузки страницы'))}</span></p><span class="archive-document-import-summary" data-import-summary role="status" aria-live="polite"></span><button class="button secondary" type="button" data-close>${escapeHtml(archiveDocumentLabel('Done', 'Готово'))}</button><button class="button primary" type="button" data-document-choose>${escapeHtml(archiveDocumentLabel('Choose files', 'Выбрать файлы'))}</button></div></div>`);
    const modal = modalBackdrop.querySelector('.archive-document-import');
    if (!modal) return;
    const input = modal.querySelector('[data-document-input]');
    const drop = modal.querySelector('[data-document-drop]');
    const result = modal.querySelector('[data-import-results]');
    const rows = modal.querySelector('[data-import-rows]');
    const summary = modal.querySelector('[data-import-summary]');
    const chooseButton = modal.querySelector('[data-document-choose]');
    const doneButton = modal.querySelector('.modal-footer [data-close]');
    let added = 0;
    let failed = 0;
    const updateSummary = () => {
        summary.textContent = `${added} ${archiveDocumentLabel('added', 'добавлено')}${failed ? ` · ${failed} ${archiveDocumentLabel('not added', 'не добавлено')}` : ''}`;
        if (added > 0 && !doneButton.classList.contains('primary')) {
            chooseButton.classList.replace('primary', 'secondary');
            doneButton.classList.replace('secondary', 'primary');
            chooseButton.after(doneButton);
        } else if (added === 0 && doneButton.classList.contains('primary')) {
            doneButton.classList.replace('primary', 'secondary');
            chooseButton.classList.replace('secondary', 'primary');
            doneButton.after(chooseButton);
        }
    };
    const choose = () => input.click();
    chooseButton.addEventListener('click', choose);
    bindUploadDropzoneChooser(drop, input);
    drop.addEventListener('dragover', event => { event.preventDefault(); drop.classList.add('dragging'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('dragging'));
    let importing = false;
    const importFiles = async selected => {
        if (importing) return;
        if (folderId && !archiveFolderById(folderId, projectId)) {
            result.hidden = false;
            const row = document.createElement('p');
            row.className = 'archive-document-import-row error';
            row.textContent = archiveDocumentLabel('This folder is no longer available. Choose another folder.', 'Эта папка больше недоступна. Выберите другую папку.');
            rows.append(row);
            failed++;
            updateSummary();
            return;
        }
        importing = true;
        chooseButton.disabled = true;
        const batchRows = [];
        try {
        const ids = await archiveImportFiles(selected, { projectId, folderId, onResult: (source, status, message) => {
            const row = document.createElement('p');
            result.hidden = false;
            rows.append(row);
            row.className = `archive-document-import-row ${status}`;
            const name = document.createElement('strong');
            name.textContent = source.name;
            const detail = document.createElement('span');
            detail.textContent = message;
            row.append(name, detail);
            if (status === 'success') {
                added++;
                batchRows.push(row);
            }
            else failed++;
            updateSummary();
        } });
        if (ids.length) {
            let linked;
            try {
                linked = onImported ? await onImported(ids) : (renderArchiveMain(), { ok: true });
            } catch (error) {
                linked = { ok: false, message: error?.message };
            }
            if (linked === false || linked?.ok === false) {
                archiveRollbackImportedFiles(ids);
                const message = linked?.message || archiveDocumentLabel('Files could not be linked. Please try again.', 'Не удалось связать файлы. Повторите попытку.');
                batchRows.forEach(row => {
                    row.classList.replace('success', 'error');
                    row.querySelector('span').textContent = message;
                });
                added -= batchRows.length;
                failed += batchRows.length;
                updateSummary();
            }
        }
        } finally {
            importing = false;
            chooseButton.disabled = false;
        }
    };
    input.addEventListener('change', () => { importFiles(input.files); input.value = ''; });
    drop.addEventListener('drop', event => { event.preventDefault(); drop.classList.remove('dragging'); importFiles(event.dataTransfer.files); });
    if (files?.length) importFiles(files);
}
