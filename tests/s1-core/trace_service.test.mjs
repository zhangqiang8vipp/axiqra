import test from 'node:test';
import assert from 'node:assert/strict';
import { S1Core } from '../../src/s1-core/index.mjs';
import { TraceService } from '../../src/s1-core/trace-service.mjs';
import { AuditLog } from '../../src/s1-core/audit.mjs';
import { S1Policy } from '../../src/s1-core/policy.mjs';
import { S1Store } from '../../src/s1-core/store.mjs';
import { makeTracePackage, makeInvalidTracePackage } from './helpers.mjs';

// ---------------------------------------------------------------------------
// submitEngineeringTrace — happy path
// ---------------------------------------------------------------------------

test('submitEngineeringTrace saves trace with submitted status', () => {
  const core = new S1Core();
  const trace = makeTracePackage({
    id: 'trace_submit_1',
    writeback_meta: { source_tool: 'cursor', idempotency_key: 'idem_submit_1' },
  });

  const result = core.submitEngineeringTrace({ subjectKey: 'BASE_USER', trace });

  assert.equal(result.id, 'trace_submit_1');
  assert.equal(result.status, 'submitted');
  assert.equal(result.public_candidate, true);
  assert.equal(result.author_subject_key, 'BASE_USER');
});

test('submitEngineeringTrace sets idempotent_replay false on first submission', () => {
  const core = new S1Core();
  const trace = makeTracePackage({
    id: 'trace_idem_first',
    writeback_meta: { source_tool: 'codex', idempotency_key: 'idem_first' },
  });

  const result = core.submitEngineeringTrace({ subjectKey: 'BASE_USER', trace });

  assert.equal(result.idempotent_replay, undefined); // not set on first
});

// ---------------------------------------------------------------------------
// submitEngineeringTrace — idempotency
// ---------------------------------------------------------------------------

test('submitEngineeringTrace is idempotent by idempotency_key', () => {
  const core = new S1Core();
  const trace = makeTracePackage({
    id: 'trace_idem',
    writeback_meta: { source_tool: 'codex', idempotency_key: 'idem_trace_idem' },
  });

  const first = core.submitEngineeringTrace({ subjectKey: 'BASE_USER', trace });
  const second = core.submitEngineeringTrace({ subjectKey: 'BASE_USER', trace });

  assert.equal(first.id, 'trace_idem');
  assert.equal(second.id, 'trace_idem');
  assert.equal(second.idempotent_replay, true);
  assert.equal(core.store.traces.size, 1);
});

test('idempotent replay emits engineering_trace.idempotent_replay audit event', () => {
  const core = new S1Core();
  const trace = makeTracePackage({
    writeback_meta: { source_tool: 'cursor', idempotency_key: 'idem_audit_test' },
  });

  core.submitEngineeringTrace({ subjectKey: 'BASE_USER', trace });
  core.submitEngineeringTrace({ subjectKey: 'BASE_USER', trace });

  assert.ok(
    core.auditEvents.some((e) => e.event_name === 'engineering_trace.idempotent_replay'),
  );
});

// ---------------------------------------------------------------------------
// submitEngineeringTrace — schema validation
// ---------------------------------------------------------------------------

test('rejects trace missing schema_version with TRACE_SCHEMA_INVALID', () => {
  const core = new S1Core();
  const trace = makeInvalidTracePackage(['schema_version']);

  assert.throws(
    () => core.submitEngineeringTrace({ subjectKey: 'BASE_USER', trace }),
    /TRACE_SCHEMA_INVALID/,
  );
});

test('rejects trace missing task_goal with TRACE_SCHEMA_INVALID', () => {
  const core = new S1Core();
  const trace = makeInvalidTracePackage(['task_goal']);

  assert.throws(
    () => core.submitEngineeringTrace({ subjectKey: 'BASE_USER', trace }),
    /TRACE_SCHEMA_INVALID/,
  );
});

test('rejects trace missing context with TRACE_SCHEMA_INVALID', () => {
  const core = new S1Core();
  const trace = makeInvalidTracePackage(['context']);

  assert.throws(
    () => core.submitEngineeringTrace({ subjectKey: 'BASE_USER', trace }),
    /TRACE_SCHEMA_INVALID/,
  );
});

test('rejects trace missing paths with TRACE_SCHEMA_INVALID', () => {
  const core = new S1Core();
  const trace = makeInvalidTracePackage(['paths']);

  assert.throws(
    () => core.submitEngineeringTrace({ subjectKey: 'BASE_USER', trace }),
    /TRACE_SCHEMA_INVALID/,
  );
});

test('rejects trace missing evidence with TRACE_SCHEMA_INVALID', () => {
  const core = new S1Core();
  const trace = makeInvalidTracePackage(['evidence']);

  assert.throws(
    () => core.submitEngineeringTrace({ subjectKey: 'BASE_USER', trace }),
    /TRACE_SCHEMA_INVALID/,
  );
});

test('rejects trace missing authorization with TRACE_SCHEMA_INVALID', () => {
  const core = new S1Core();
  const trace = makeInvalidTracePackage(['authorization']);

  assert.throws(
    () => core.submitEngineeringTrace({ subjectKey: 'BASE_USER', trace }),
    /TRACE_SCHEMA_INVALID/,
  );
});

test('rejects trace missing writeback_meta.idempotency_key with TRACE_SCHEMA_INVALID', () => {
  const core = new S1Core();
  const trace = makeInvalidTracePackage(['idempotency_key']);

  assert.throws(
    () => core.submitEngineeringTrace({ subjectKey: 'BASE_USER', trace }),
    /TRACE_SCHEMA_INVALID/,
  );
});

// ---------------------------------------------------------------------------
// submitEngineeringTrace — authorization
// ---------------------------------------------------------------------------

test('rejects ANON with TRACE_WRITE_DENIED', () => {
  const core = new S1Core();
  const trace = makeTracePackage({
    writeback_meta: { source_tool: 'test', idempotency_key: 'idem_anon' },
  });

  assert.throws(
    () => core.submitEngineeringTrace({ subjectKey: 'ANON', trace }),
    /TRACE_WRITE_DENIED/,
  );
});

test('rejects authenticated user missing trace:write scope', () => {
  const customSubjects = {
    USER_NO_SCOPE: {
      subjectKey: 'USER_NO_SCOPE',
      authenticated: true,
      scopes: ['search:read'],
      entries: [],
      advancedEntries: [],
      grants: [],
    },
  };
  const core = new S1Core({ subjects: customSubjects });
  const trace = makeTracePackage({
    writeback_meta: { source_tool: 'test', idempotency_key: 'idem_no_scope' },
  });

  assert.throws(
    () => core.submitEngineeringTrace({ subjectKey: 'USER_NO_SCOPE', trace }),
    /TRACE_WRITE_DENIED/,
  );
});

// ---------------------------------------------------------------------------
// submitEngineeringTrace — audit events
// ---------------------------------------------------------------------------

test('emits engineering_trace.submitted on successful submit', () => {
  const core = new S1Core();
  core.submitEngineeringTrace({
    subjectKey: 'BASE_USER',
    trace: makeTracePackage({ writeback_meta: { source_tool: 'test', idempotency_key: 'idem_audit' } }),
  });

  assert.ok(
    core.auditEvents.some(
      (e) => e.event_name === 'engineering_trace.submitted'
        && e.actor.subject_key === 'BASE_USER'
        && e.decision.result === 'submitted',
    ),
  );
});

// ---------------------------------------------------------------------------
// submitEngineeringTrace — data normalization
// ---------------------------------------------------------------------------

test('normalizes trace with computed worked and failed fields', () => {
  const core = new S1Core();
  const trace = makeTracePackage({
    id: 'trace_normalized',
    paths: {
      forward_path: [{ order: 1, summary: 'Step 1 succeeded' }],
      failed_path: [{ order: 1, summary: 'Step 2 failed' }],
    },
    writeback_meta: { source_tool: 'test', idempotency_key: 'idem_norm' },
  });

  const result = core.submitEngineeringTrace({ subjectKey: 'BASE_USER', trace });

  assert.equal(result.worked, 'Step 1 succeeded');
  assert.equal(result.failed, 'Step 2 failed');
  assert.ok(result.tags.includes('oauth')); // from original tags
});

test('stores trace in core.store.traces', () => {
  const core = new S1Core();
  core.submitEngineeringTrace({
    subjectKey: 'BASE_USER',
    trace: makeTracePackage({
      id: 'trace_store_check',
      writeback_meta: { source_tool: 'test', idempotency_key: 'idem_store' },
    }),
  });

  assert.ok(core.store.getTrace('trace_store_check'));
});
