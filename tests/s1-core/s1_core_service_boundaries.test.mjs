import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { S1Core } from '../../src/s1-core/index.mjs';
import { JsonS1Store } from '../../src/s1-core/json-store.mjs';
import { makeTracePackage } from './helpers.mjs';

test('Trace Package schema rejects incomplete payloads with stable 422 response', () => {
  const core = new S1Core();
  const response = core.api.handle({
    method: 'POST',
    path: '/api/traces',
    subjectKey: 'BASE_USER',
    requestId: 'req_schema_invalid',
    body: { trace_payload: { task_goal: 'missing fields' } },
  });

  assert.equal(response.http_status, 422);
  assert.equal(response.error_code, 'TRACE_SCHEMA_INVALID');
  assert.equal(response.schema_version, 's1.error.v1');
  assert.ok(response.details.some((detail) => detail.field === 'schema_version'));
  assert.ok(response.repair_hint.includes('schema_version'));
});

test('Trace submission is idempotent by writeback_meta.idempotency_key', () => {
  const core = new S1Core();
  const tracePayload = makeTracePackage({
    id: 'trace_idempotent',
    writeback_meta: { source_tool: 'codex', idempotency_key: 'idem_repeatable_trace' },
  });

  const first = core.submitEngineeringTrace({ subjectKey: 'BASE_USER', trace: tracePayload });
  const second = core.submitEngineeringTrace({ subjectKey: 'BASE_USER', trace: tracePayload });

  assert.equal(first.id, 'trace_idempotent');
  assert.equal(second.id, 'trace_idempotent');
  assert.equal(second.idempotent_replay, true);
  assert.equal(core.store.traces.size, 1);
  assert.ok(core.auditEvents.some((event) => event.event_name === 'engineering_trace.idempotent_replay'));
});

test('API adapter exposes search, trace submit, and review with stable response envelopes', () => {
  const core = new S1Core();
  const search = core.api.handle({
    method: 'POST',
    path: '/api/search/before-act',
    subjectKey: 'BASE_USER',
    tokenScopes: ['search:read'],
    requestId: 'req_api_search',
    body: { task_goal: 'OAuth callback' },
  });

  assert.equal(search.schema_version, 's1.api.v1');
  assert.equal(search.http_status, 200);
  assert.equal(search.quota_remaining, 9);

  const created = core.api.handle({
    method: 'POST',
    path: '/api/traces',
    subjectKey: 'BASE_USER',
    requestId: 'req_api_trace',
    body: { trace_payload: makeTracePackage({ id: 'trace_api_review' }) },
  });

  assert.equal(created.http_status, 201);
  assert.equal(created.trace.status, 'submitted');

  const reviewed = core.api.handle({
    method: 'POST',
    path: '/api/traces/trace_api_review/review',
    subjectKey: 'REVIEWER',
    requestId: 'req_api_review',
    body: { decision: 'approve', public_title: 'API reviewed trace' },
  });

  assert.equal(reviewed.schema_version, 's1.api.v1');
  assert.equal(reviewed.review.status, 'approved');
});

test('MCP adapter exposes search_before_act and preserves quota contract', () => {
  const core = new S1Core();
  let response;
  for (let index = 0; index < 11; index += 1) {
    response = core.mcp.call(
      'axiqra.search_before_act',
      { task_goal: 'OAuth callback' },
      {
        subjectKey: 'BASE_USER',
        tokenScopes: ['search:read'],
        requestId: `req_mcp_${index + 1}`,
        now: new Date('2026-06-05T08:00:00.000Z'),
      },
    );
  }

  assert.equal(response.schema_version, 's1.mcp.v1');
  assert.equal(response.http_status, 429);
  assert.equal(response.error_code, 'QUOTA_LIMITED');
  assert.equal(response.no_recall_performed, true);
});

test('JsonS1Store persists quota counters and submitted traces', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'axiqra-s1-'));
  const storePath = path.join(dir, 's1-store.json');
  const store = await JsonS1Store.open(storePath);
  const core = new S1Core({ store });

  core.searchBeforeAct({
    subjectKey: 'BASE_USER',
    query: 'OAuth callback',
    now: new Date('2026-06-05T08:00:00.000Z'),
  });
  core.submitEngineeringTrace({
    subjectKey: 'BASE_USER',
    trace: makeTracePackage({ id: 'trace_persisted', writeback_meta: { source_tool: 'codex', idempotency_key: 'idem_persisted' } }),
  });
  await store.flush();

  const reopened = await JsonS1Store.open(storePath);
  const restoredCore = new S1Core({ store: reopened });
  const second = restoredCore.searchBeforeAct({
    subjectKey: 'BASE_USER',
    query: 'OAuth callback',
    now: new Date('2026-06-05T09:00:00.000Z'),
  });

  assert.equal(reopened.getTrace('trace_persisted').status, 'submitted');
  assert.equal(second.quota_used, 2);
  assert.equal(second.quota_remaining, 8);
});
