const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const context = vm.createContext({ document: { documentElement: { lang: 'en' } }, t: value => value,
    escapeHtml: value => String(value), state: { language: 'en' } });
vm.runInContext(fs.readFileSync(path.resolve(__dirname, '../src/genealogy-dates.js'), 'utf8'), context);
const run = code => JSON.parse(JSON.stringify(vm.runInContext(code, context)));
for (const parts of [{ year: 1900 }, { month: 2 }, { day: 14 }, { year: 1900, month: 2 },
    { day: 14, month: 2 }, { day: 14, year: 1900 }, { year: 1900, month: 2, day: 14 }])
{
    for (const type of ['Exact date', 'About / Circa', 'Before', 'After', 'Between'])
    {
        const source = { ...parts, ...(type === 'Between' ? { year2: 1901, month2: 3, day2: 15 } : {}) };
        const parsed = run(`buildGenealogyDateFromParts(${JSON.stringify(type)}, ${JSON.stringify(source)})`);
        assert.equal(parsed.valid, true, `${type}: ${JSON.stringify(parts)}`);
        const roundTrip = run(`normalizeGenealogyDateInput(${JSON.stringify(parsed.value)})`);
        assert.deepEqual(roundTrip.first, { year: parts.year || null, month: parts.month || null, day: parts.day || null });
        assert.deepEqual(roundTrip.second, parsed.value.second);
        const text = run(`parseGenealogyDateTextAsType(${JSON.stringify(parsed.value.date)}, ${JSON.stringify(type)}, {date2:${JSON.stringify(parsed.value.date2)}})`);
        assert.equal(text.valid, true, parsed.value.date);
        assert.deepEqual(text.value.first, parsed.value.first);
    }
}
for (const input of ['14 Feb', 'February', 'day 14', 'day 14 year 1900', '14 февраля 1900', 'февраль',
    '02.1900', '1900-02', '1900-02-14', '02/14/1900', '14.02.1900', 'Feb 14, 1900', '0015'])
{
    const parsed = run(`parseGenealogyDateText(${JSON.stringify(input)})`);
    assert.equal(parsed.valid, input !== '02/14/1900', input);
}
assert.equal(run(`parseGenealogyDateText('14')`).ambiguity, 14);
assert.equal(run(`parseGenealogyDateText('1900')`).value.dateType, 'Exact date');
assert.equal(run(`parseGenealogyDateText('Unknown')`).value.state, 'unknown');
assert.equal(run(`formatGenealogyDateLabel({first:{year:null,month:2,day:14},state:'known',dateType:'Exact date'})`), '14 Feb');
assert.equal(run(`formatGenealogyDateStartLabel({first:{year:null,month:2,day:14},state:'known',dateType:'Exact date'})`), '14 Feb');
assert.equal(run(`parseGenealogyDateText('Day 14, 1900')`).value.first.month, null);
assert.equal(run(`parseGenealogyDateText('День 14, 1900')`).value.first.month, null);
assert.equal(run(`parseGenealogyDateText('')`).value.state, 'empty');
assert.equal(run(`parseGenealogyDateText('31 February')`).valid, false);
assert.equal(run(`parseGenealogyDateText('29 February')`).valid, true);
assert.equal(run(`parseGenealogyDateText('29 Feb 1900')`).valid, false);
assert.equal(run(`parseGenealogyDateTextAsType('29 Feb 1900','Exact date',{calendar:'Julian'})`).valid, true);
assert.equal(run(`parseGenealogyDateText('14 Feb 0015')`).valid, true);
assert.equal(run(`parseGenealogyDateText('14 Feb 0000')`).valid, false);
assert.equal(run(`parseGenealogyDateText('между 1900 и 1901')`).valid, true);
assert.equal(run(`parseGenealogyDateText('около 1900')`).value.dateType, 'About / Circa');
assert.equal(run(`parseGenealogyDateText('Between 1901 and 1900')`).valid, false);
assert.equal(run(`parseGenealogyDateText('Between 20 Dec and 5 Jan')`).valid, true);
assert.equal(run(`genealogyDateDefinitelyAfter('1901','1900')`), true);
assert.equal(run(`genealogyDateDefinitelyAfter('1900','14 Feb 1900')`), false);
assert.equal(run(`genealogyDateDefinitelyAfter('About 1901','1900')`), false);
assert.equal(run(`genealogyDatesCompatible('1900','14 Feb 1900')`), true);
assert.equal(run(`genealogyDatesCompatible('1901','14 Feb 1900')`), false);
assert.equal(run(`genealogyAgeRange('1900','1970')`), '69–70');
assert.equal(run(`genealogyAgeRange('February','1970')`), null);
assert.equal(run(`genealogyDateMatchesYearFilter('1900',{mode:'exact',from:'1900'})`), true);
assert.equal(run(`genealogyDateMatchesYearFilter('February',{mode:'exact',from:'1900'})`), false);
assert.equal(run(`genealogyDateMatchesYearFilter('Before 1900',{mode:'after',from:'1901'})`), false);
assert.equal(run(`genealogyDateMatchesYearFilter('Between 1890 and 1910',{mode:'exact',from:'1900'})`), true);
assert.equal(run(`genealogyDateSortValue('February')`), null, 'Infinity serializes as null: no invented year');
assert.equal(run(`normalizeGenealogyDateInput({date:'1900',dateType:'Year only'}).dateType`), 'Exact date');
assert.equal(run(`normalizeGenealogyDateInput({date:'scribbled date', originalText:'scribbled date'}).state`), 'unparsed');
console.log('Partial genealogy date model passed.');
