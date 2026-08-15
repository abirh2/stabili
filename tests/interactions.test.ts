import assert from 'node:assert/strict';
import test from 'node:test';
import { summarizeFilter, type FilterOption } from '../src/components/common/FilterChip.tsx';
import { filterOptionsByQuery, managementAvailability, matchesCategoricalValue } from '../src/exploreFilters.ts';

const boroughOptions: FilterOption[] = [
  { value: 'bronx', label: 'Bronx' },
  { value: 'brooklyn', label: 'Brooklyn' },
  { value: 'manhattan', label: 'Manhattan' },
];

test('filter summaries remain compact for zero, one, and multiple selections', () => {
  assert.equal(summarizeFilter('Borough', [], boroughOptions), 'Borough');
  assert.equal(summarizeFilter('Borough', ['bronx'], boroughOptions), 'Bronx');
  assert.equal(summarizeFilter('Borough', ['bronx', 'brooklyn', 'manhattan'], boroughOptions), 'Bronx +2');
});

test('categorical filters accept any selected value and clear with an empty selection', () => {
  const selected = ['bronx', 'queens'];
  assert.equal(matchesCategoricalValue('bronx', selected), true);
  assert.equal(matchesCategoricalValue('queens', selected), true);
  assert.equal(matchesCategoricalValue('brooklyn', selected), false);
  assert.equal(matchesCategoricalValue('brooklyn', []), true);
});

test('management availability follows the same independent categorical model', () => {
  assert.equal(managementAvailability(true), 'available');
  assert.equal(managementAvailability(false), 'unavailable');
  assert.equal(matchesCategoricalValue('available', ['available', 'unavailable']), true);
  assert.equal(matchesCategoricalValue('unavailable', ['available', 'unavailable']), true);
});

test('ZIP search narrows visible options without changing their values', () => {
  const zipOptions = ['10001', '10451', '11201', '11368'].map((value) => ({ label: value, value }));
  assert.deepEqual(filterOptionsByQuery(zipOptions, '104'), [{ label: '10451', value: '10451' }]);
  assert.deepEqual(filterOptionsByQuery(zipOptions, ' 11 '), [
    { label: '11201', value: '11201' },
    { label: '11368', value: '11368' },
  ]);
  assert.deepEqual(filterOptionsByQuery(zipOptions, ''), zipOptions);
});
