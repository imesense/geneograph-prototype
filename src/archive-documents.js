const archiveDocumentBytes = new Map();
const archiveDocumentExtensions = new Set(['txt', 'csv', 'pdf', 'docx']);
const archiveDocumentMaxBytes = 20 * 1024 * 1024;

function archiveDocumentExtension(name) {
    return String(name || '').split('.').pop().toLowerCase();
}

function archiveDocumentLabel(english, russian) {
    return state.language === 'ru' ? russian : english;
}

async function archiveDocumentBlob(file) {
    if (archiveDocumentBytes.has(file.id)) return archiveDocumentBytes.get(file.id);
    if (!file.assetUrl) throw new Error(archiveDocumentLabel('This file has no viewable original.', 'У этого файла нет доступного оригинала.'));
    const response = await fetch(file.assetUrl);
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

async function archiveDocumentRenderPdf(blob, host, modal) {
    const pdfjs = await import('./vendor/pdfjs-5.6.205.min.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('./vendor/pdfjs-worker-5.6.205.min.mjs', location.href).href;
    const bytes = await blob.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: bytes, isEvalSupported: false, useSystemFonts: true }).promise;
    if (!pdf.numPages) throw new Error('Empty PDF');
    host.replaceChildren();
    const toolbar = document.createElement('div');
    toolbar.className = 'archive-document-pdf-tools';
    toolbar.innerHTML = `<button class="button secondary" type="button" data-pdf-prev aria-label="Previous page">&#8592;</button><span data-pdf-page></span><button class="button secondary" type="button" data-pdf-next aria-label="Next page">&#8594;</button><button class="button secondary" type="button" data-pdf-out aria-label="Zoom out">&#8722;</button><span data-pdf-zoom></span><button class="button secondary" type="button" data-pdf-in aria-label="Zoom in">+</button>`;
    const canvas = document.createElement('canvas');
    canvas.className = 'archive-document-pdf-canvas';
    host.append(toolbar, canvas);
    let pageNumber = 1;
    let zoom = 1;
    let renderSerial = 0;
    const render = async () => {
        const serial = ++renderSerial;
        const page = await pdf.getPage(pageNumber);
        const available = Math.max(240, host.clientWidth - 32);
        const natural = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: Math.min(1.8, available / natural.width) * zoom });
        if (serial !== renderSerial || !modal.isConnected) return;
        const ratio = Math.min(devicePixelRatio || 1, 2);
        canvas.width = Math.round(viewport.width * ratio);
        canvas.height = Math.round(viewport.height * ratio);
        canvas.style.width = `${Math.round(viewport.width)}px`;
        canvas.style.height = `${Math.round(viewport.height)}px`;
        const context = canvas.getContext('2d');
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        await page.render({ canvasContext: context, viewport }).promise;
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
        render().catch(error => { host.textContent = error.message; });
    });
    await render();
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

async function openArchiveDocumentViewer(fileId) {
    const file = archiveFileById(fileId);
    if (!file) return;
    const extension = archiveDocumentExtension(file.name);
    if (!archiveDocumentExtensions.has(extension)) {
        showToast(archiveDocumentLabel('No in-app viewer is available for this file.', 'Этот файл пока нельзя открыть в приложении.'));
        return;
    }
    openModal(`<div class="modal archive-document-modal" role="dialog" aria-modal="true" aria-labelledby="archiveDocumentTitle"><div class="modal-header"><div><h2 id="archiveDocumentTitle" data-user-content>${escapeHtml(file.name)}</h2><p>${escapeHtml(extension.toUpperCase())}</p></div><button class="close-button" type="button" data-close aria-label="Close">${icon.close}</button></div><div class="modal-body archive-document-body" data-document-body data-user-content><p>${escapeHtml(archiveDocumentLabel('Loading document…', 'Загрузка документа…'))}</p></div><div class="modal-footer"><button class="button secondary" type="button" data-document-download>${escapeHtml(archiveDocumentLabel('Download', 'Скачать'))}</button></div></div>`);
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

function openArchiveDocumentImport({ files = null, onImported = null } = {}) {
    const folderId = state.activeModule === 'Archive' ? state.archiveSelectedFolderId || null : null;
    const projectId = currentProjectId();
    openModal(`<div class="modal archive-document-import" role="dialog" aria-modal="true" aria-labelledby="archiveImportTitle"><div class="modal-header"><div><h2 id="archiveImportTitle">${escapeHtml(archiveDocumentLabel('Add files', 'Добавить файлы'))}</h2><p>${escapeHtml(archiveDocumentLabel('Files remain available until this page reloads. Maximum 20 MB per file.', 'Файлы доступны до перезагрузки страницы. Не более 20 МБ на файл.'))}</p></div><button class="close-button" type="button" data-close aria-label="Close">${icon.close}</button></div><div class="modal-body"><div class="archive-document-drop" data-document-drop tabindex="0" role="button"><strong>${escapeHtml(archiveDocumentLabel('Drop files here or choose files', 'Перетащите файлы сюда или выберите'))}</strong><span>TXT, CSV, PDF, DOCX</span></div><input type="file" multiple accept=".txt,.csv,.pdf,.docx" data-document-input hidden><div class="archive-document-import-results" data-import-results data-user-content role="status"></div></div><div class="modal-footer"><button class="button secondary" type="button" data-close>${escapeHtml(archiveDocumentLabel('Done', 'Готово'))}</button><button class="button primary" type="button" data-document-choose>${escapeHtml(archiveDocumentLabel('Choose files', 'Выбрать файлы'))}</button></div></div>`);
    const modal = modalBackdrop.querySelector('.archive-document-import');
    if (!modal) return;
    const input = modal.querySelector('[data-document-input]');
    const drop = modal.querySelector('[data-document-drop]');
    const result = modal.querySelector('[data-import-results]');
    const choose = () => input.click();
    modal.querySelector('[data-document-choose]').addEventListener('click', choose);
    drop.addEventListener('click', choose);
    drop.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(); } });
    drop.addEventListener('dragover', event => { event.preventDefault(); drop.classList.add('dragging'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('dragging'));
    const importFiles = async selected => {
        const ids = [];
        for (const source of Array.from(selected || [])) {
            const row = document.createElement('p');
            result.append(row);
            const extension = archiveDocumentExtension(source.name);
            if (!archiveDocumentExtensions.has(extension) || source.size > archiveDocumentMaxBytes || source.size === 0) {
                row.textContent = `${source.name}: ${archiveDocumentLabel('Unsupported, empty, or over 20 MB.', 'Неподдерживаемый, пустой или больше 20 МБ.')}`;
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
                const id = `af-upload-${crypto.randomUUID()}`;
                const now = new Date().toISOString();
                const kind = extension === 'pdf' ? 'pdf' : extension === 'csv' ? 'sheet' : 'doc';
                sampleData.archiveFiles.push({ id, projectId, folderId, name: source.name, kind, type: extension.toUpperCase(), mimeType: source.type, size: `${Math.max(1, Math.ceil(source.size / 1024))} KB`, sizeBytes: source.size, favorite: false, description: '', linkedPersonIds: [], linkedEventIds: [], linkedNoteIds: [], linkedPlaceIds: [], placeIds: [], addedAt: now, updatedAt: now });
                archiveDocumentBytes.set(id, source);
                ids.push(id);
                row.textContent = `${source.name}: ${archiveDocumentLabel('Added', 'Добавлен')}`;
            } catch (error) {
                row.textContent = `${source.name}: ${archiveDocumentLabel('Could not read file', 'Не удалось прочитать файл')} (${error.message})`;
            }
        }
        if (ids.length) {
            if (onImported) onImported(ids);
            else renderArchiveMain();
        }
    };
    input.addEventListener('change', () => { importFiles(input.files); input.value = ''; });
    drop.addEventListener('drop', event => { event.preventDefault(); drop.classList.remove('dragging'); importFiles(event.dataTransfer.files); });
    if (files?.length) importFiles(files);
}
