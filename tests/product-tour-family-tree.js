const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..', 'src');
const source = fs.readFileSync(path.join(root, 'product-tour.js'), 'utf8');
const localization = fs.readFileSync(path.join(root, 'localization.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'product-tour.css'), 'utf8');
const context = vm.createContext({ console });
vm.runInContext(source, context);
const steps = vm.runInContext('geneoTourSteps', context);
const ids = Array.from(steps, step => step.id);
const timeline = ids.indexOf('tree-timeline');

assert.deepEqual(ids.slice(timeline, timeline + 4), [
    'tree-timeline', 'tree-relationships', 'tree-relationship-actions', 'tree-to-people'
]);

const start = localization.indexOf('const RU_UI_TOUR =');
const end = localization.indexOf('const RU_UI_MODULE_BLOCKS =', start);
const russian = vm.runInNewContext(`${localization.slice(start, end)}\nRU_UI_TOUR`);
for (const id of ['tree-relationships', 'tree-relationship-actions'])
{
    const step = steps.find(item => item.id === id);
    assert.equal(step.module, 'Family Tree');
    assert.ok(russian[step.title], `Missing Russian title: ${step.title}`);
    assert.ok(russian[step.body], `Missing Russian copy: ${step.body}`);
}

assert.match(source, /'tree-relationships': '\.tree-inspector \[data-toggle-section="relationships"\]'/);
assert.match(source, /'tree-relationship-actions': '\.tree-inspector #section-relationships \[data-relationship-related-person-id="luna"\] \.relation-actions'/);
assert.match(source, /'geneo-tour-tree-relationship-actions'\);/);
assert.match(styles, /body\.geneo-tour-tree-relationship-actions \.tree-inspector[\s\S]*?\.relation-actions\s*\{\s*opacity: 1;/);

console.log('Family Tree tour relationship stops and localization checks passed.');
