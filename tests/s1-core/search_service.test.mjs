import test from 'node:test';
import assert from 'node:assert/strict';
import { S1Core } from '../../src/s1-core/index.mjs';
import { makeTracePackage, makeMemoryEntry } from './helpers.mjs';

// ---------------------------------------------------------------------------
// webSearch — anonymous
// ---------------------------------------------------------------------------

test('anonymous search returns only public desensitized results', () => {
  const core = new S1Core();
  const result = core.webSearch({ subjectKey: 'ANON', query: 'OAuth' });

  assert.equal(result.subject_key, 'ANON');
  assert.equal(result.mcp_available, false);
  assert.equal(result.login_cta_visible, true);
  assert.equal(result.allowed_scope[0], 'public_space_desensitized');
  assert.ok(result.results.every((r) => r.visibility === 'public'));
});

test('anonymous search cannot see enterprise private entries', () => {
  const core = new S1Core();
  const result = core.webSearch({
    subjectKey: 'ANON',
    query: 'enterprise-private-seed-title',
  });

  assert.equal(result.results.length, 0);
});

test('anonymous search cannot see own visibility entries', () => {
  const core = new S1Core();
  const result = core.webSearch({
    subjectKey: 'ANON',
    query: 'Personal project architecture notes',
  });

  assert.equal(result.results.length, 0);
});

// ---------------------------------------------------------------------------
// webSearch — authenticated
// ---------------------------------------------------------------------------

test('authenticated BASE_USER can search public entries', () => {
  const core = new S1Core();
  const result = core.webSearch({
    subjectKey: 'BASE_USER',
    query: 'OAuth callback',
  });

  assert.equal(result.subject_key, 'BASE_USER');
  assert.equal(result.mcp_available, false);
  assert.equal(result.login_cta_visible, false);
  assert.ok(result.results.length >= 1);
  assert.ok(result.results.some((r) => r.id === 'pub_case_next_oauth'));
});

test('authenticated user results are not duplicated', () => {
  const core = new S1Core();
  const result = core.webSearch({ subjectKey: 'BASE_USER', query: 'OAuth' });
  const ids = result.results.map((r) => r.id);

  assert.equal(ids.length, new Set(ids).size, 'duplicate results found');
});

// ---------------------------------------------------------------------------
// webSearch — query matching
// ---------------------------------------------------------------------------

test('search with empty query returns all visible entries', () => {
  const core = new S1Core();
  const result = core.webSearch({ subjectKey: 'BASE_USER', query: '' });

  // At minimum, public entries should be visible
  assert.ok(result.results.every((r) => r.visibility === 'public'));
});

test('search matches title, summary, and tags case-insensitively', () => {
  const core = new S1Core();

  const upper = core.webSearch({ subjectKey: 'BASE_USER', query: 'OAUTH' });
  const lower = core.webSearch({ subjectKey: 'BASE_USER', query: 'oauth' });
  const mixed = core.webSearch({ subjectKey: 'BASE_USER', query: 'OAuth' });

  assert.equal(upper.results.length, lower.results.length);
  assert.equal(lower.results.length, mixed.results.length);
});

test('search with no matches returns empty results', () => {
  const core = new S1Core();
  const result = core.webSearch({
    subjectKey: 'BASE_USER',
    query: 'this query definitely matches nothing xyz123',
  });

  assert.equal(result.results.length, 0);
});

// ---------------------------------------------------------------------------
// webSearch — audit events
// ---------------------------------------------------------------------------

test('anonymous search emits anonymous.search.executed audit event', () => {
  const core = new S1Core();
  core.webSearch({ subjectKey: 'ANON', query: 'OAuth' });

  assert.ok(
    core.auditEvents.some(
      (e) => e.event_name === 'anonymous.search.executed'
        && e.actor.subject_key === 'ANON'
        && e.object.query === 'OAuth',
    ),
  );
});

test('authenticated search emits web.search.executed audit event', () => {
  const core = new S1Core();
  core.webSearch({ subjectKey: 'BASE_USER', query: 'OAuth' });

  assert.ok(
    core.auditEvents.some(
      (e) => e.event_name === 'web.search.executed'
        && e.actor.subject_key === 'BASE_USER',
    ),
  );
});

// ---------------------------------------------------------------------------
// webSearch — surface parameter
// ---------------------------------------------------------------------------

test('search respects surface parameter', () => {
  const core = new S1Core();
  const result = core.webSearch({
    subjectKey: 'BASE_USER',
    query: 'OAuth',
    surface: 'public_solution_network',
  });

  assert.equal(result.surface, 'public_solution_network');
});

// ---------------------------------------------------------------------------
// webSearch — result shape
// ---------------------------------------------------------------------------

test('search results have required fields', () => {
  const core = new S1Core();
  const result = core.webSearch({ subjectKey: 'BASE_USER', query: 'OAuth' });

  for (const item of result.results) {
    assert.ok(item.id, `result missing id`);
    assert.ok(item.title, `result missing title`);
    assert.ok(item.visibility, `result missing visibility`);
    assert.equal(typeof item.desensitized, 'boolean');
  }
});
