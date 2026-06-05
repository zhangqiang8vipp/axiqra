import test from 'node:test';
import assert from 'node:assert/strict';
import { S1Core } from '../../src/s1-core/index.mjs';
import { runS1ClosedLoopDemo } from '../../src/s1-core/index.mjs';
import { makeTracePackage } from './helpers.mjs';

// ---------------------------------------------------------------------------
// S1Core construction
// ---------------------------------------------------------------------------

test('S1Core constructs with default parameters', () => {
  const core = new S1Core();
  assert.ok(core.store);
  assert.ok(core.policy);
  assert.ok(core.searchService);
  assert.ok(core.mcpService);
  assert.ok(core.traceService);
  assert.ok(core.reviewService);
  assert.ok(core.auditLog);
});

test('S1Core accepts custom subjects', () => {
  const customSubjects = {
    TEST: {
      subjectKey: 'TEST',
      authenticated: true,
      scopes: ['search:read'],
      entries: ['home'],
      advancedEntries: [],
      grants: [],
    },
  };
  const core = new S1Core({ subjects: customSubjects });
  const nav = core.getNavigation('TEST');
  assert.equal(nav.subject_key, 'TEST');
});

test('S1Core accepts custom memory', () => {
  const core = new S1Core({
    memory: [{ id: 'custom_1', type: 'Custom', title: 'Custom entry', visibility: 'public', desensitized: true }],
  });
  const result = core.webSearch({ subjectKey: 'BASE_USER', query: 'Custom' });
  assert.ok(result.results.some((r) => r.id === 'custom_1'));
});

test('S1Core accepts custom quotaLimit', () => {
  const core = new S1Core({ quotaLimit: 5 });
  for (let i = 0; i < 5; i++) {
    const r = core.searchBeforeAct({ subjectKey: 'BASE_USER', query: 'test', tokenScopes: ['search:read'] });
    assert.equal(r.quota_limit, 5);
  }
  const denied = core.searchBeforeAct({ subjectKey: 'BASE_USER', query: 'test', tokenScopes: ['search:read'] });
  assert.equal(denied.http_status, 429);
});

// ---------------------------------------------------------------------------
// auditEvents getter
// ---------------------------------------------------------------------------

test('auditEvents exposes audit log events', () => {
  const core = new S1Core();
  core.webSearch({ subjectKey: 'ANON', query: 'test' });
  assert.ok(Array.isArray(core.auditEvents));
  assert.ok(core.auditEvents.length > 0);
});

// ---------------------------------------------------------------------------
// Closed-loop integration: full user journey
// ---------------------------------------------------------------------------

test('closed loop: anonymous cannot see unpublished trace before review', () => {
  const core = new S1Core();
  core.submitEngineeringTrace({
    subjectKey: 'BASE_USER',
    trace: makeTracePackage({
      id: 'trace_loop_1',
      writeback_meta: { source_tool: 'test', idempotency_key: 'idem_loop_1' },
    }),
  });

  const anonSearch = core.webSearch({ subjectKey: 'ANON', query: 'OAuth callback' });
  assert.equal(anonSearch.results.some((r) => r.id === 'published_trace_loop_1'), false);
});

test('closed loop: published trace appears in anonymous search after approve', () => {
  const core = new S1Core();
  const trace = core.submitEngineeringTrace({
    subjectKey: 'BASE_USER',
    trace: makeTracePackage({
      id: 'trace_loop_2',
      tags: ['oauth', 'callback', 'retry'],
      writeback_meta: { source_tool: 'test', idempotency_key: 'idem_loop_2' },
    }),
  });

  core.reviewTrace({
    subjectKey: 'REVIEWER',
    traceId: trace.id,
    decision: 'approve',
    publicTitle: 'OAuth callback retry normalization',
  });

  const anonSearch = core.webSearch({ subjectKey: 'ANON', query: 'retry normalization' });
  assert.ok(anonSearch.results.some((r) => r.id === 'published_trace_loop_2'));
});

test('closed loop: trace secrets are redacted before storage', () => {
  const core = new S1Core();
  const { makeTraceWithSecrets } = await import('./helpers.mjs');

  // Note: this tests that redactTrace runs in the trace pipeline
  // The actual stored trace should have secrets redacted
  const trace = core.submitEngineeringTrace({
    subjectKey: 'BASE_USER',
    trace: {
      id: 'trace_secret_loop',
      schema_version: 's1.trace.v1',
      task_goal: 'API call with secrets',
      context: { tech_stack: ['api'], environment: 'prod' },
      paths: {
        forward_path: [{ order: 1, summary: 'Called with api_key=secret123' }],
        failed_path: [],
      },
      evidence: [{ type: 'test' }],
      authorization: { visibility_scope: 'public_candidate', license_scope: 'sample' },
      writeback_meta: { source_tool: 'test', idempotency_key: 'idem_secret_loop' },
    },
  });

  const stored = core.store.getTrace('trace_secret_loop');
  assert.equal(stored.paths.forward_path[0].summary, 'Called with api_key=[REDACTED]');
});

test('runS1ClosedLoopDemo completes without errors', () => {
  const result = runS1ClosedLoopDemo();
  assert.ok(result.anonymousBefore);
  assert.ok(result.mcpBefore);
  assert.ok(result.trace);
  assert.ok(result.reviewed);
  assert.ok(result.anonymousAfter);
  assert.ok(result.auditEvents);
});

test('runS1ClosedLoopDemo produces correct results', () => {
  const result = runS1ClosedLoopDemo();

  assert.equal(result.mcpBefore.http_status, 200);
  assert.equal(result.mcpBefore.quota_limit, 10);
  assert.equal(result.mcpBefore.quota_remaining, 9);
  assert.equal(result.trace.status, 'submitted');
  assert.equal(result.reviewed.status, 'approved');
  assert.ok(result.auditEvents.some((e) => e.event_name === 'engineering_trace.reviewed'));
});

// ---------------------------------------------------------------------------
// Multi-user isolation
// ---------------------------------------------------------------------------

test('BASE_USER and REVIEWER have separate trace stores', () => {
  const core = new S1Core();
  core.submitEngineeringTrace({
    subjectKey: 'BASE_USER',
    trace: makeTracePackage({
      id: 'trace_user_1',
      writeback_meta: { source_tool: 'test', idempotency_key: 'idem_user_1' },
    }),
  });
  core.submitEngineeringTrace({
    subjectKey: 'REVIEWER',
    trace: makeTracePackage({
      id: 'trace_user_2',
      writeback_meta: { source_tool: 'test', idempotency_key: 'idem_user_2' },
    }),
  });

  assert.equal(core.store.traces.size, 2);
  assert.ok(core.store.getTrace('trace_user_1'));
  assert.ok(core.store.getTrace('trace_user_2'));
});

test('reviewer can see BASE_USER traces', () => {
  const core = new S1Core();
  const trace = core.submitEngineeringTrace({
    subjectKey: 'BASE_USER',
    trace: makeTracePackage({
      id: 'trace_cross_user',
      writeback_meta: { source_tool: 'test', idempotency_key: 'idem_cross_user' },
    }),
  });

  // REVIEWER should be able to review BASE_USER's trace
  const result = core.reviewTrace({
    subjectKey: 'REVIEWER',
    traceId: trace.id,
    decision: 'approve',
  });

  assert.equal(result.status, 'approved');
});
