import assert from 'node:assert/strict';
import test from 'node:test';
import { locationHash, parseHash } from '../src/routing.ts';

test('parses public routes', () => {
  assert.deepEqual(parseHash('#/explore'), { route: 'explore' });
  assert.deepEqual(parseHash('#/saved'), { route: 'saved' });
  assert.deepEqual(parseHash('#/about'), { route: 'about' });
});

test('parses a building route', () => {
  assert.deepEqual(parseHash('#/building/stabili-123'), {
    route: 'building-details',
    buildingId: 'stabili-123',
  });
});

test('preserves a management name in the hash', () => {
  const location = { route: 'management-profile' as const, managementId: 'Example Management LLC' };
  assert.equal(locationHash(location), '#/management/Example%20Management%20LLC');
  assert.deepEqual(parseHash(locationHash(location)), location);
});

test('uses Explore for an unknown or incomplete route', () => {
  assert.deepEqual(parseHash('#/unknown'), { route: 'explore' });
  assert.deepEqual(parseHash('#/building/'), { route: 'explore' });
});
