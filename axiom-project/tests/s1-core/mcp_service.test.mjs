import test from 'node:test';
import assert from 'node:assert/strict';
import { S1Core } from '../../src/s1-core/index.mjs';
import { McpSearchService } from '../../src/s1-core/mcp-service.mjs';
import { AuditLog } from '../../src/s1-core/audit.mjs';
import { S1Policy } from '../../src/s1-core/policy.mjs';
import { S1Store } from '../../src/s1-core/store.mjs';
import { SearchService } from '../../src/s1-core/search-service.mjs';

// ---------------------------------------------------------------------------
// searchBeforeAct — happy path
// ---------------------------------------------------------------------------

test('searchBeforeAct returns quota-checked response with correct envelope', () => {
  const core = new S1Core();
  const result = core.searchBeforeAct({
    subjectKey: 'BASE_USER',
    query: 'OAuth callback',
    tokenScopes: ['search:read'],
    now: new Date('2026-06-05T08:00:00Z'),
  });

  assert.equal(result.http_status, 200);
  assert.equal(result.quota_limit, 10);
  assert.equal(result.quota_used, 1);
  assert.equal(result.quota_remaining, 9);
  assert.equal(result.no_recall_performed, false);
  assert.equal(result.tool, 'axiqra.search_before_act');
  assert.ok(Array.isArray(result.results));
});

test('searchBeforeAct increments quota on each successful call', () => {
  const core = new S1Core({ quotaLimit: 10 });
  const now = new Date('2026-06-05T08:00:00Z');

  for (let i = 0; i < 10; i++) {
    const result = core.searchBeforeAct({
      subjectKey: 'BASE_USER',
      query: 'test',
      tokenScopes: ['search:read'],
      now,
    });
    assert.equal(result.quota_used, i + 1, `call ${i + 1}: quota_used should be ${i + 1}`);
    assert.equal(result.quota_remaining, 9 - i);
  }
});

// ---------------------------------------------------------------------------
// searchBeforeAct — quota boundary
// ---------------------------------------------------------------------------

test('denies MCP search at 11th call with QUOTA_LIMITED', () => {
  const core = new S1Core({ quotaLimit: 10 });
  const now = new Date('2026-06-05T08:00:00Z');

  for (let i = 0; i < 10; i++) {
    core.searchBeforeAct({ subjectKey: 'BASE_USER', query: 'test', tokenScopes: ['search:read'], now });
  }

  const denied = core.searchBeforeAct({
    subjectKey: 'BASE_USER',
    query: 'test',
    tokenScopes: ['search:read'],
    now: new Date('2026-06-05T09:00:00Z'),
  });

  assert.equal(denied.http_status, 429);
  assert.equal(denied.error_code, 'QUOTA_LIMITED');
  assert.equal(denied.no_recall_performed, true);
  assert.equal(denied.quota_remaining, 0);
  assert.deepEqual(denied.results, []);
});

test('quota resets on new day boundary', () => {
  const core = new S1Core({ quotaLimit: 3 });

  // Exhaust today's quota
  for (let i = 0; i < 3; i++) {
    const r = core.searchBeforeAct({
      subjectKey: 'BASE_USER',
      query: 'test',
      tokenScopes: ['search:read'],
      now: new Date('2026-06-05T08:00:00Z'),
    });
    assert.equal(r.quota_remaining, 2 - i);
  }

  // New day — quota resets
  const nextDay = core.searchBeforeAct({
    subjectKey: 'BASE_USER',
    query: 'test',
    tokenScopes: ['search:read'],
    now: new Date('2026-06-06T00:00:00Z'),
  });

  assert.equal(nextDay.quota_remaining, 9); // resets to 10 - 1 = 9
});

test('quota counters are per-subject', () => {
  const core = new S1Core({ quotaLimit: 2 });

  core.searchBeforeAct({ subjectKey: 'BASE_USER', query: 'test', tokenScopes: ['search:read'], now: new Date('2026-06-05T08:00:00Z') });
  core.searchBeforeAct({ subjectKey: 'BASE_USER', query: 'test', tokenScopes: ['search:read'], now: new Date('2026-06-05T09:00:00Z') });

  // REViEWER has separate quota counter
  const reviewer = core.searchBeforeAct({
    subjectKey: 'REVIEWER',
    query: 'test',
    tokenScopes: ['search:read'],
    now: new Date('2026-06-05T10:00:00Z'),
  });

  assert.equal(reviewer.http_status, 200);
  assert.equal(reviewer.quota_used, 1); // Not exhausted — separate counter
  assert.equal(reviewer.quota_remaining, 9);
});

// ---------------------------------------------------------------------------
// searchBeforeAct — authorization
// ---------------------------------------------------------------------------

test('rejects unauthenticated ANON with LOGIN_REQUIRED', () => {
  const core = new S1Core();
  const result = core.searchBeforeAct({
    subjectKey: 'ANON',
    query: 'OAuth',
    tokenScopes: ['search:read'],
  });

  assert.equal(result.http_status, 401);
  assert.equal(result.error_code, 'LOGIN_REQUIRED');
  assert.equal(result.no_recall_performed, true);
  assert.deepEqual(result.results, []);
});

test('rejects missing search:read scope with SCOPE_DENIED', () => {
  const core = new S1Core();
  const result = core.searchBeforeAct({
    subjectKey: 'BASE_USER',
    query: 'OAuth',
    tokenScopes: [], // missing
  });

  assert.equal(result.http_status, 403);
  assert.equal(result.error_code, 'SCOPE_DENIED');
  assert.equal(result.no_recall_performed, true);
});

// ---------------------------------------------------------------------------
// searchBeforeAct — audit events
// ---------------------------------------------------------------------------

test('emits mcp.search.quota_checked on successful call', () => {
  const core = new S1Core();
  const now = new Date('2026-06-05T08:00:00Z');
  core.searchBeforeAct({ subjectKey: 'BASE_USER', query: 'OAuth', tokenScopes: ['search:read'], now });

  assert.ok(
    core.auditEvents.some(
      (e) => e.event_name === 'mcp.search.quota_checked'
        && e.actor.subject_key === 'BASE_USER'
        && e.decision.result === 'allow',
    ),
  );
});

test('emits mcp.search.quota_exceeded on quota denial', () => {
  const core = new S1Core({ quotaLimit: 1 });
  const now = new Date('2026-06-05T08:00:00Z');

  core.searchBeforeAct({ subjectKey: 'BASE_USER', query: 'test', tokenScopes: ['search:read'], now });
  core.searchBeforeAct({ subjectKey: 'BASE_USER', query: 'test', tokenScopes: ['search:read'], now });

  assert.ok(
    core.auditEvents.some(
      (e) => e.event_name === 'mcp.search.quota_exceeded'
        && e.decision.reason_code === 'QUOTA_LIMITED',
    ),
  );
});

test('audit event includes quota metadata', () => {
  const core = new S1Core();
  const now = new Date('2026-06-05T08:00:00Z');
  core.searchBeforeAct({ subjectKey: 'BASE_USER', query: 'OAuth', tokenScopes: ['search:read'], now });

  const event = core.auditEvents.find((e) => e.event_name === 'mcp.search.quota_checked');
  assert.equal(event.quota.quota_limit, 10);
  assert.equal(event.quota.quota_used, 1);
  assert.equal(event.quota.quota_remaining, 9);
});

// ---------------------------------------------------------------------------
// searchBeforeAct — configurable quota limit
// ---------------------------------------------------------------------------

test('respects custom quotaLimit in constructor', () => {
  const core = new S1Core({ quotaLimit: 5 });

  for (let i = 0; i < 5; i++) {
    const r = core.searchBeforeAct({
      subjectKey: 'BASE_USER',
      query: 'test',
      tokenScopes: ['search:read'],
    });
    assert.equal(r.http_status, 200);
    assert.equal(r.quota_limit, 5);
  }

  const denied = core.searchBeforeAct({
    subjectKey: 'BASE_USER',
    query: 'test',
    tokenScopes: ['search:read'],
  });

  assert.equal(denied.http_status, 429);
});
