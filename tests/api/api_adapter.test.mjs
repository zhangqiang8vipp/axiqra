import test from 'node:test';
import assert from 'node:assert/strict';
import { S1Core } from '../../src/s1-core/index.mjs';
import { S1ApiAdapter } from '../../src/s1-core/api-adapter.mjs';
import { makeTracePackage } from '../s1-core/helpers.mjs';

// ---------------------------------------------------------------------------
// GET /api/navigation
// ---------------------------------------------------------------------------

test('GET /api/navigation returns navigation for ANON', () => {
  const core = new S1Core();
  const adapter = new S1ApiAdapter({ core });
  const result = adapter.handle({
    method: 'GET',
    path: '/api/navigation',
    subjectKey: 'ANON',
    requestId: 'req_nav_anon',
  });

  assert.equal(result.schema_version, 's1.api.v1');
  assert.equal(result.http_status, 200);
  assert.equal(result.subject_key, 'ANON');
  assert.ok(result.entries.includes('public_solution_network'));
});

test('GET /api/navigation returns navigation for BASE_USER', () => {
  const core = new S1Core();
  const adapter = new S1ApiAdapter({ core });
  const result = adapter.handle({
    method: 'GET',
    path: '/api/navigation',
    subjectKey: 'BASE_USER',
    requestId: 'req_nav_user',
  });

  assert.equal(result.http_status, 200);
  assert.ok(result.entries.includes('personal_workspace'));
});

// ---------------------------------------------------------------------------
// GET /api/search/public
// ---------------------------------------------------------------------------

test('GET /api/search/public returns search results', () => {
  const core = new S1Core();
  const adapter = new S1ApiAdapter({ core });
  const result = adapter.handle({
    method: 'GET',
    path: '/api/search/public',
    subjectKey: 'ANON',
    requestId: 'req_search_pub',
    body: { query: 'OAuth' },
  });

  assert.equal(result.schema_version, 's1.api.v1');
  assert.equal(result.http_status, 200);
  assert.equal(result.subject_key, 'ANON');
  assert.equal(result.mcp_available, false);
  assert.equal(result.login_cta_visible, true);
  assert.ok(Array.isArray(result.results));
});

// ---------------------------------------------------------------------------
// POST /api/search/before-act
// ---------------------------------------------------------------------------

test('POST /api/search/before-act returns quota-checked response', () => {
  const core = new S1Core();
  const adapter = new S1ApiAdapter({ core });
  const result = adapter.handle({
    method: 'POST',
    path: '/api/search/before-act',
    subjectKey: 'BASE_USER',
    tokenScopes: ['search:read'],
    requestId: 'req_mcp_search',
    body: { query: 'OAuth' },
  });

  assert.equal(result.schema_version, 's1.api.v1');
  assert.equal(result.http_status, 200);
  assert.equal(result.quota_limit, 10);
  assert.equal(result.quota_remaining, 9);
  assert.equal(result.no_recall_performed, false);
});

test('POST /api/search/before-act accepts task_goal in body', () => {
  const core = new S1Core();
  const adapter = new S1ApiAdapter({ core });
  const result = adapter.handle({
    method: 'POST',
    path: '/api/search/before-act',
    subjectKey: 'BASE_USER',
    tokenScopes: ['search:read'],
    requestId: 'req_task_goal',
    body: { task_goal: 'Fix OAuth callback' },
  });

  assert.equal(result.http_status, 200);
});

test('POST /api/search/before-act returns 401 for unauthenticated', () => {
  const core = new S1Core();
  const adapter = new S1ApiAdapter({ core });
  const result = adapter.handle({
    method: 'POST',
    path: '/api/search/before-act',
    subjectKey: 'ANON',
    tokenScopes: ['search:read'],
    requestId: 'req_mcp_anon',
    body: { query: 'test' },
  });

  assert.equal(result.http_status, 401);
  assert.equal(result.error_code, 'LOGIN_REQUIRED');
  assert.equal(result.schema_version, 's1.error.v1');
});

// ---------------------------------------------------------------------------
// POST /api/traces
// ---------------------------------------------------------------------------

test('POST /api/traces creates trace and returns 201', () => {
  const core = new S1Core();
  const adapter = new S1ApiAdapter({ core });
  const result = adapter.handle({
    method: 'POST',
    path: '/api/traces',
    subjectKey: 'BASE_USER',
    requestId: 'req_trace_create',
    body: {
      trace_payload: makeTracePackage({
        id: 'trace_api_create',
        writeback_meta: { source_tool: 'test', idempotency_key: 'idem_api_create' },
      }),
    },
  });

  assert.equal(result.schema_version, 's1.api.v1');
  assert.equal(result.http_status, 201);
  assert.equal(result.trace.status, 'submitted');
  assert.equal(result.trace.id, 'trace_api_create');
});

test('POST /api/traces returns 422 for invalid schema', () => {
  const core = new S1Core();
  const adapter = new S1ApiAdapter({ core });
  const result = adapter.handle({
    method: 'POST',
    path: '/api/traces',
    subjectKey: 'BASE_USER',
    requestId: 'req_trace_invalid',
    body: { trace_payload: { task_goal: 'missing everything' } },
  });

  assert.equal(result.http_status, 422);
  assert.equal(result.error_code, 'TRACE_SCHEMA_INVALID');
  assert.equal(result.schema_version, 's1.error.v1');
  assert.ok(result.details.some((d) => d.field === 'schema_version'));
  assert.ok(result.repair_hint.includes('schema_version'));
});

// ---------------------------------------------------------------------------
// POST /api/traces/:id/review
// ---------------------------------------------------------------------------

test('POST /api/traces/:id/review approves trace', () => {
  const core = new S1Core();
  const adapter = new S1ApiAdapter({ core });

  // Submit first
  const created = adapter.handle({
    method: 'POST',
    path: '/api/traces',
    subjectKey: 'BASE_USER',
    requestId: 'req_trace_review_setup',
    body: {
      trace_payload: makeTracePackage({
        id: 'trace_review_api',
        writeback_meta: { source_tool: 'test', idempotency_key: 'idem_review_api' },
      }),
    },
  });

  const result = adapter.handle({
    method: 'POST',
    path: `/api/traces/${created.trace.id}/review`,
    subjectKey: 'REVIEWER',
    requestId: 'req_trace_review',
    body: { decision: 'approve', public_title: 'API reviewed' },
  });

  assert.equal(result.schema_version, 's1.api.v1');
  assert.equal(result.review.status, 'approved');
});

test('POST /api/traces/:id/review rejects trace', () => {
  const core = new S1Core();
  const adapter = new S1ApiAdapter({ core });

  const created = adapter.handle({
    method: 'POST',
    path: '/api/traces',
    subjectKey: 'BASE_USER',
    requestId: 'req_reject_setup',
    body: {
      trace_payload: makeTracePackage({
        id: 'trace_reject_api',
        writeback_meta: { source_tool: 'test', idempotency_key: 'idem_reject_api' },
      }),
    },
  });

  const result = adapter.handle({
    method: 'POST',
    path: `/api/traces/${created.trace.id}/review`,
    subjectKey: 'REVIEWER',
    requestId: 'req_trace_reject',
    body: { decision: 'reject' },
  });

  assert.equal(result.review.status, 'rejected');
});

// ---------------------------------------------------------------------------
// Route not found
// ---------------------------------------------------------------------------

test('unknown route returns 404 ROUTE_NOT_FOUND', () => {
  const core = new S1Core();
  const adapter = new S1ApiAdapter({ core });
  const result = adapter.handle({
    method: 'GET',
    path: '/api/nonexistent',
    subjectKey: 'ANON',
    requestId: 'req_404',
  });

  assert.equal(result.http_status, 404);
  assert.equal(result.error_code, 'ROUTE_NOT_FOUND');
  assert.equal(result.schema_version, 's1.error.v1');
});

test('wrong method on valid route returns 404', () => {
  const core = new S1Core();
  const adapter = new S1ApiAdapter({ core });
  const result = adapter.handle({
    method: 'DELETE',
    path: '/api/navigation',
    subjectKey: 'ANON',
    requestId: 'req_wrong_method',
  });

  assert.equal(result.http_status, 404);
  assert.equal(result.error_code, 'ROUTE_NOT_FOUND');
});

// ---------------------------------------------------------------------------
// Request ID propagation
// ---------------------------------------------------------------------------

test('request_id is included in all responses', () => {
  const core = new S1Core();
  const adapter = new S1ApiAdapter({ core });
  const result = adapter.handle({
    method: 'GET',
    path: '/api/search/public',
    subjectKey: 'ANON',
    requestId: 'req_my_custom_id',
    body: { query: 'test' },
  });

  assert.equal(result.request_id, 'req_my_custom_id');
});

test('request_id defaults to req_s1_api when not provided', () => {
  const core = new S1Core();
  const adapter = new S1ApiAdapter({ core });
  const result = adapter.handle({
    method: 'GET',
    path: '/api/search/public',
    subjectKey: 'ANON',
    body: { query: 'test' },
  });

  assert.equal(result.request_id, 'req_s1_api');
});
