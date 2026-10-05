const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'product-tour.js'), 'utf8');
const elements = new Map();
let menuAborts = 0;
const context = vm.createContext({
    console,
    document: {
        getElementById(id)
        {
            return elements.get(id) || null;
        },
        querySelector(selector)
        {
            return selector === '#relativePopover' ? elements.get('relativePopover') : null;
        }
    },
    state: { selectedPhotoIds: [] },
    menuLifecycleController: { abort()
    {
        menuAborts++;
    } },
    closeMenu()
    {
        elements.delete('relativePopover');
    },
    openRelativePopover()
    {
        elements.set('relativePopover', { inert: false });
    },
    openAlbumsFilterPopover()
    {
        elements.set('albumsFilterPopover', { inert: false });
    },
    closeAlbumsFilterPopover()
    {
        elements.delete('albumsFilterPopover');
    },
    openPeopleColumnsPopover()
    {
        elements.set('peopleColumnsPopover', { inert: false });
    },
    closePeopleColumnsPopover()
    {
        elements.delete('peopleColumnsPopover');
    },
    openPeopleFilterPopover()
    {
        elements.set('peopleFilterPopover', { inert: false });
    },
    closePeopleFilterPopover()
    {
        elements.delete('peopleFilterPopover');
    }
});
vm.runInContext(source, context);
const evaluate = expression => vm.runInContext(expression, context);

assert.equal(evaluate("geneoTourSecondarySelectors['albums-filters']"), '#albumsFilterButton');
assert.match(source, /root\.addEventListener\('click', event => event\.stopPropagation\(\)\)/);
assert.match(source, /root\.addEventListener\('pointerdown', event => event\.stopPropagation\(\)\)/);

for (const [step, button, popover] of [
    ['albums-filters', 'albumsFilterButton', 'albumsFilterPopover'],
    ['people-columns', 'peopleColumnsButton', 'peopleColumnsPopover'],
    ['people-filters', 'peopleFilterButton', 'peopleFilterPopover'],
    ['tree-add-relative', 'addRelative', 'relativePopover']
])
{
    elements.set(button, {});
    if (step === 'tree-add-relative')
        context.document.querySelector = selector => selector === '#addRelative'
            ? elements.get(button) : elements.get('relativePopover');
    evaluate(`geneoTourOpenPreview({ id: '${step}' })`);
    assert.equal(elements.get(popover)?.inert, true, `${step} preview was not opened read-only`);
    evaluate('geneoTourClosePreview()');
    assert.equal(elements.has(popover), false, `${step} preview was not cleaned up`);
}
assert.equal(menuAborts, 1, 'Relative menu outside-click and scroll handlers remain active');
console.log('Tour popover ownership, cleanup, and paired spotlight checks passed.');
