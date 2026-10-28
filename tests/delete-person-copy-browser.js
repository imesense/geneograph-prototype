const assert = require('node:assert/strict');
const { chromium } = require(process.env.GENEO_PLAYWRIGHT_PATH || 'playwright');

(async () => {
    const browser = await chromium.launch({ headless: true, executablePath: process.env.GENEO_BROWSER_PATH });
    try {
        for (const width of [1280, 320]) for (const language of ['en', 'ru']) {
            const page = await browser.newPage({ viewport: { width, height: 850 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(process.env.GENEO_TEST_URL || 'file:///E:/Geneograph/Concept/geneograph-prototype/src/index.html');
            await page.evaluate(language => {
                if (geneoTourRuntime.active) geneoTourClose({ offerRestore: false });
                setLanguage(language, false); activateProject('p1', { moduleName: 'People' });
            }, language);
            for (const requested of [1, 2, 6, 21]) {
                const result = await page.evaluate(requested => {
                    const people = getPeople('p1').slice(0, requested);
                    const before = JSON.stringify(sampleData.people);
                    openDeletePeopleConfirm(people.map(person => person.id));
                    const modal = modalBackdrop.querySelector('.modal');
                    const result = { count: people.length, title: modal.querySelector('h2').textContent,
                        subtitle: modal.querySelector('.modal-header p').textContent,
                        paragraphs: [...modal.querySelectorAll('.modal-body p')].map(p => p.textContent),
                        button: modal.querySelector('[data-confirm-delete-people]').textContent,
                        fits: modal.scrollWidth <= modal.clientWidth && modal.getBoundingClientRect().right <= innerWidth + 1 };
                    closeModal({ force: true }); result.unchanged = before === JSON.stringify(sampleData.people);
                    return result;
                }, requested);
                assert.equal(result.fits, true); assert.equal(result.unchanged, true);
                if (language === 'ru') {
                    assert.equal(result.title, result.count === 1 ? 'Удалить человека?' : 'Удалить выбранных людей?');
                    assert.equal(result.button, result.count === 1 ? 'Удалить человека' : 'Удалить людей');
                    assert.match(result.subtitle, /^Выбрано: /);
                    assert.equal(result.paragraphs.at(-1), 'Связанные фотографии, файлы архива, заметки и другие материалы останутся в проекте.');
                    assert.equal(result.paragraphs.some(text => /photos|archive|notes|research|relationship|And/i.test(text)), false);
                    if (result.count === 6) assert.equal(result.paragraphs[1], 'И ещё 1 человек.');
                } else {
                    assert.equal(result.title, result.count === 1 ? 'Delete this person?' : 'Delete selected people?');
                    assert.match(result.paragraphs[0], /family connections will be removed from the project/);
                }
            }
            assert.deepEqual(errors, []); await page.close();
        }
        console.log('Delete person localization passed for single and multiple people in English/Russian.');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
