import test from 'node:test';
import assert from 'node:assert/strict';
import { S1Core, runS1ClosedLoopDemo } from '../../src/s1-core/index.mjs';
import { makeTracePackage } from './helpers.mjs';

test('S1 closed loop runs search, MCP, trace submit, review, and public recall', () => {
  const result = runS1ClosedLoopDemo();

  assert.equal(result.anonymousBefore.results.length, 1);
  assert.equal(result.anonymousBefore.mcp_available, false);
  assert.equal(result.mcpBefore.http_status, 200);
  assert.equal(result.mcpBefore.quota_limit, 10);
  assert.equal(result.mcpBefore.quota_remaining, 9);
  assert.equal(result.trace.status, 'submitted');
  assert.equal(result.trace.worked.includes('abc123'), false);
  assert.equal(result.reviewed.status, 'approved');
  assert.equal(result.anonymousAfter.results.some((item) => item.id === 'published_trace_oauth_callback_retry'), true);
  assert.ok(result.auditEvents.some((event) => event.event_name === 'engineering_trace.reviewed'));
});

test('MCP search_before_act enforces ordinary user daily limit at the 11th call', () => {
  const core = new S1Core();
  let response;

  for (let index = 0; index < 10; index += 1) {
    response = core.searchBeforeAct({
      subjectKey: 'BASE_USER',
      query: 'OAuth callback',
      now: new Date('2026-06-05T08:00:00.000Z'),
    });
  }

  assert.equal(response.http_status, 200);
  assert.equal(response.quota_remaining, 0);

  const eleventh = core.searchBeforeAct({
    subjectKey: 'BASE_USER',
    query: 'OAuth callback',
    now: new Date('2026-06-05T09:00:00.000Z'),
  });

  assert.equal(eleventh.http_status, 429);
  assert.equal(eleventh.error_code, 'QUOTA_LIMITED');
  assert.equal(eleventh.no_recall_performed, true);
  assert.deepEqual(eleventh.results, []);
});

test('anonymous search cannot see private objects or call MCP', () => {
  const core = new S1Core();
  const anonymous = core.webSearch({ subjectKey: 'ANON', query: 'enterprise-private-seed-title' });
  const mcp = core.searchBeforeAct({ subjectKey: 'ANON', query: 'OAuth callback' });

  assert.equal(anonymous.results.length, 0);
  assert.equal(anonymous.mcp_available, false);
  assert.equal(anonymous.login_cta_visible, true);
  assert.equal(mcp.http_status, 401);
  assert.equal(mcp.error_code, 'LOGIN_REQUIRED');
  assert.equal(mcp.no_recall_performed, true);
});

test('advanced identity keeps base navigation entries and only adds advanced entries', () => {
  const core = new S1Core();
  const nav = core.getNavigation('ORG_ADMIN');

  assert.ok(nav.entries.includes('home'));
  assert.ok(nav.entries.includes('personal_workspace'));
  assert.ok(nav.entries.includes('public_solution_network'));
  assert.ok(nav.entries.includes('enterprise_admin_console'));
  assert.equal(nav.rule, 'base_entries + membership + grants + advanced_entries -> ABAC filter');
});

test('review write permission is required before trace can publish to memory', () => {
  const core = new S1Core();
  const trace = core.submitEngineeringTrace({
    subjectKey: 'BASE_USER',
    trace: makeTracePackage({
      id: 'trace_denied_review',
      task_goal: 'Denied review sample',
      writeback_meta: { source_tool: 'codex', idempotency_key: 'idem_trace_denied_review' },
    }),
  });

  assert.throws(() => {
    core.reviewTrace({ subjectKey: 'BASE_USER', traceId: trace.id, decision: 'approve' });
  }, /REVIEW_WRITE_DENIED/);
});
