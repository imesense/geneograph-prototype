const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

const url = pathToFileURL(path.resolve(__dirname, '../src/index.html')).href;

(async () =>
{
    const browser = await chromium.launch({ headless: true,
        ...(process.env.GENEO_BROWSER_EXECUTABLE
            ? { executablePath: process.env.GENEO_BROWSER_EXECUTABLE } : {}) });
    try
    {
        const page = await browser.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(url);
        const audit = await page.evaluate(() =>
        {
            const notes = sampleData.notes.filter(note => note.projectId === 'p1');
            const ids = {
                linkedPersonIds: new Set(sampleData.people.map(person => person.id)),
                linkedPlaceIds: new Set(sampleData.places.map(place => place.id)),
                linkedEventIds: new Set(sampleData.events.map(event => event.id)),
                linkedPhotoIds: new Set(sampleData.media.map(photo => photo.id)),
                linkedArchiveFileIds: new Set(sampleData.archiveFiles.map(file => file.id)),
                relatedNoteIds: new Set(notes.map(note => note.id))
            };
            const invalidLinks = notes.flatMap(note => Object.entries(ids).flatMap(([field, values]) =>
                (note[field] || []).filter(id => !values.has(id)).map(id => `${note.id}:${field}:${id}`)));
            const invalidSources = sampleData.sourceLinks.filter(link => link.targetType === 'note'
                && (!ids.relatedNoteIds.has(link.targetId)
                    || !sampleData.sources.some(source => source.id === link.sourceId)));
            const invalidDeltas = notes.filter(note => note.bodyDelta
                && (!normalizeRichTextDelta(note.bodyDelta)
                    || plainTextFromRichTextDelta(note.bodyDelta) !== note.body)).map(note => note.id);
            const daisy = notes.find(note => note.id === 'note-daisy-parentage');
            const rupert = notes.find(note => note.id === 'note-rupert-death');
            state.language = 'ru';
            const untranslated = notes.flatMap(note => [note.title, ...note.body.split('\n'),
                ...(note.checklist || []).map(item => item.text)]
                .filter(text => text.trim() && translateText(text) === text)
                .map(text => `${note.id}:${text}`));
            return { count: notes.length, invalidLinks, invalidSources: invalidSources.length, invalidDeltas,
                daisyPeople: daisy.linkedPersonIds, daisyEvents: daisy.linkedEventIds,
                reciprocal: {
                    person: getNotesForPerson('daisy', { projectId: 'p1' }).some(note => note.id === daisy.id),
                    event: getNotesForEvent('event-daisy-birth', { projectId: 'p1' }).some(note => note.id === daisy.id),
                    file: getNotesForArchiveFile('af-birth-sample', { projectId: 'p1' }).some(note => note.id === daisy.id),
                    photo: getNotesForPhoto('photo-unidentified-studio', { projectId: 'p1' }).some(note => note.id === 'note-whiskerfield-album')
                },
                rupertPlaces: rupert.linkedPlaceIds, richCount: notes.filter(note => note.bodyDelta).length,
                rupertSources: sourceIdsForTarget('note', rupert.id, 'p1'),
                daisySources: sourceIdsForTarget('note', daisy.id, 'p1'),
                untranslated,
                beforeProjectNotes: notes.filter(note => note.createdAt < '2026-05-01').map(note => note.id) };
        });
        assert.equal(audit.count, 12);
        assert.deepEqual(audit.invalidLinks, []);
        assert.equal(audit.invalidSources, 0);
        assert.deepEqual(audit.invalidDeltas, []);
        assert.deepEqual(audit.untranslated, []);
        assert.deepEqual(audit.daisyPeople, ['daisy']);
        assert.deepEqual(audit.daisyEvents, ['event-daisy-birth']);
        assert.deepEqual(audit.reciprocal, { person: true, event: true, file: true, photo: true });
        assert.deepEqual(audit.rupertPlaces, []);
        assert.deepEqual(audit.rupertSources, []);
        assert.deepEqual(audit.daisySources, ['as1']);
        assert.ok(audit.richCount >= 8);
        assert.deepEqual(audit.beforeProjectNotes, []);

        for (const language of ['en', 'ru'])
        {
            for (const id of ['note-daisy-parentage', 'note-meowbridge-transcription',
                'note-whiskerfield-album', 'note-purrington-surname', 'note-silver-profile-checklist'])
            {
                const result = await page.evaluate(({ language, id }) =>
                {
                    setLanguage(language, false);
                    activateProject('p1', { moduleName: 'Notes' });
                    const note = getNote(id, { projectId: 'p1', includeArchived: true });
                    state.notesView = note.archived ? 'archived' : 'all';
                    state.notesRightCollapsed = false;
                    state.selectedNoteId = id;
                    renderNotes();
                    return { title: translateText(note.title), original: JSON.stringify(note.bodyDelta),
                        body: localizedNoteBodyText(note.body),
                        translatedLines: note.body.split('\n').filter(line => line.trim()
                            && localizedNoteBodyText(line) !== line).length,
                        totalLines: note.body.split('\n').filter(line => line.trim()).length };
                }, { language, id });
                assert.ok(result.title);
                if (language === 'ru' && result.totalLines)
                    assert.equal(result.translatedLines, result.totalLines, id);
                if (id === 'note-daisy-parentage')
                {
                    const html = await page.evaluate(id =>
                    {
                        const note = getNote(id, { projectId: 'p1', includeArchived: true });
                        return renderRichTextDeltaHtml(localizedNoteBodyDelta(note.bodyDelta));
                    }, id);
                    assert.match(html, /<h3/);
                    assert.match(html, /<li/);
                    assert.match(html, /<strong/);
                    assert.match(html, language === 'ru' ? /Что указано в выписке/ : /What the extract says/);
                }
                if (id === 'note-silver-profile-checklist') continue;
                const runtime = await page.evaluate(() => ({ selected: state.selectedNoteId,
                    open: state.notesEditorOpen, current: notesRichTextRuntime.noteId,
                    fallback: notesRichTextRuntime.fallbackActive }));
                assert.equal(runtime.current, id, JSON.stringify({ language, id, runtime }));
                const richEditor = await page.evaluate(() => Boolean(notesRichTextRuntime.instance));
                const editorText = richEditor
                    ? await page.locator('#notesRichTextEditor .ql-editor').innerText()
                    : await page.locator('#notesBodyInput').inputValue();
                assert.ok(editorText.includes(result.body.split('\n')[0]), `${language}:${id}`);
                if (richEditor)
                    assert.ok(await page.locator('#notesRichTextEditor .ql-editor h3, #notesRichTextEditor .ql-editor li').count() > 0);
                const current = await page.evaluate(id => JSON.stringify(getNote(id,
                    { projectId: 'p1', includeArchived: true }).bodyDelta), id);
                assert.equal(current, result.original, `${language}:${id}:untouched content changed`);
            }
        }
        assert.deepEqual(errors, []);
    }
    finally
    {
        await browser.close();
    }
    console.log('Sample notes content, links, and localization passed.');
})().catch(error =>
{
    console.error(error);
    process.exitCode = 1;
});
