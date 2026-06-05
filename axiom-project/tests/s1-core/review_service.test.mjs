import test from 'node:test';
import assert from 'node:assert/strict';
import { S1Core } from '../../src/s1-core/index.mjs';
import { makeTracePackage } from './helpers.mjs';

// ---------------------------------------------------------------------------
// reviewTrace — happy path
// ---------------------------------------------------------------------------

test('reviewTrace with approve changes trace status to approved', () => {
  const core = new S1Core();
  const trace = core.submitEngineeringTrace({
    subjectKey: 'BASE_USER',
    trace: makeTracePackage({
      id: 'trace_review_approve',
      writeback_meta: { source_tool: 'test', idempotency_key: 'idem_review_approve' },
    }),
  });

  const result = core.reviewTrace({
    subjectKey: 'REVIEWER',
    traceId: trace.id,
    decision: 'approve',
    publicTitle: 'Approved trace title',
  });

  assert.equal(result.status, 'approved');
  assert.equal(result.reviewer_subject_key, 'REVIEWER');
});

test('reviewTrace with reject changes trace status to rejected', () => {
  const core = new S1Core();
  const trace = core.submitEngineeringTrace({
    subjectKey: 'BASE_USER',
    trace: makeTracePackage({
      id: 'trace_review_reject',
      writeback_meta: { source_tool: 'test', idempotency_key: 'idem_review_reject' },
    }),
  });

  const result = core.reviewTrace({
    subjectKey: 'REVIEWER',
    traceId: trace.id,
    decision: 'reject',
  });

  assert.equal(result.status, 'rejected');
});

// ---------------------------------------------------------------------------
// reviewTrace — approve publishes to memory
// ---------------------------------------------------------------------------

test('approved trace is published to public memory', () => {
  const core = new S1Core();
  const trace = core.submitEngineeringTrace({
    subjectKey: 'BASE_USER',
    trace: makeTracePackage({
      id: 'trace_publish_1',
      writeback_meta: { source_tool: 'test', idempotency_key: 'idem_publish_1' },
    }),
  });

  core.reviewTrace({
    subjectKey: 'REVIEWER',
    traceId: trace.id,
    decision: 'approve',
    publicTitle: 'Published OAuth trace',
  });

  const memory = core.store.listMemory();
  assert.ok(memory.some((m) => m.id === 'published_trace_publish_1'));
});

test('published memory entry is public and desensitized', () => {
  const core = new S1Core();
  const trace = core.submitEngineeringTrace({
    subjectKey: 'BASE_USER',
    trace: makeTracePackage({
      id: 'trace_publish_2',
      tags: ['oauth', 'test'],
      writeback_meta: { source_tool: 'test', idempotency_key: 'idem_publish_2' },
    }),
  });

  core.reviewTrace({
    subjectKey: 'REVIEWER',
    traceId: trace.id,
    decision: 'approve',
    publicTitle: 'Published OAuth trace 2',
  });

  const published = core.store.listMemory().find((m) => m.id === 'published_trace_publish_2');
  assert.equal(published.visibility, 'public');
  assert.equal(published.desensitized, true);
  assert.equal(published.type, 'Solution');
});

test('rejected trace is NOT published to memory', () => {
  const core = new S1Core();
  const trace = core.submitEngineeringTrace({
    subjectKey: 'BASE_USER',
    trace: makeTracePackage({
      id: 'trace_reject_no_pub',
      writeback_meta: { source_tool: 'test', idempotency_key: 'idem_reject_no_pub' },
    }),
  });

  core.reviewTrace({
    subjectKey: 'REVIEWER',
    traceId: trace.id,
    decision: 'reject',
  });

  const published = core.store.listMemory().find((m) => m.id === 'published_trace_reject_no_pub');
  assert.equal(published, undefined);
});

test('anonymous can find approved trace via web search', () => {
  const core = new S1Core();
  const trace = core.submitEngineeringTrace({
    subjectKey: 'BASE_USER',
    trace: makeTracePackage({
      id: 'trace_anon_search_1',
      tags: ['oauth', 'callback', 'retry'],
      writeback_meta: { source_tool: 'test', idempotency_key: 'idem_anon_search' },
    }),
  });

  core.reviewTrace({
    subjectKey: 'REVIEWER',
    traceId: trace.id,
    decision: 'approve',
    publicTitle: 'OAuth callback retry normalization',
  });

  const anonSearch = core.webSearch({ subjectKey: 'ANON', query: 'retry normalization' });
  assert.ok(anonSearch.results.some((r) => r.id === 'published_trace_anon_search_1'));
});

// ---------------------------------------------------------------------------
// reviewTrace — authorization
// ---------------------------------------------------------------------------

test('BASE_USER cannot review (no review:write scope)', () => {
  const core = new S1Core();
  const trace = core.submitEngineeringTrace({
    subjectKey: 'BASE_USER',
    trace: makeTracePackage({
      id: 'trace_no_review',
      writeback_meta: { source_tool: 'test', idempotency_key: 'idem_no_review' },
    }),
  });

  assert.throws(
    () => core.reviewTrace({
      subjectKey: 'BASE_USER',
      traceId: trace.id,
      decision: 'approve',
    }),
    /REVIEW_WRITE_DENIED/,
  );
});

test('ANON cannot review with REVIEW_WRITE_DENIED', () => {
  const core = new S1Core();
  const trace = core.submitEngineeringTrace({
    subjectKey: 'BASE_USER',
    trace: makeTracePackage({
      id: 'trace_anon_review',
      writeback_meta: { source_tool: 'test', idempotency_key: 'idem_anon_review' },
    }),
  });

  assert.throws(
    () => core.reviewTrace({
      subjectKey: 'ANON',
      traceId: trace.id,
      decision: 'approve',
    }),
    /REVIEW_WRITE_DENIED/,
  );
});

// ---------------------------------------------------------------------------
// reviewTrace — error cases
// ---------------------------------------------------------------------------

test('reviewing non-existent trace throws TRACE_NOT_FOUND', () => {
  const core = new S1Core();

  assert.throws(
    () => core.reviewTrace({
      subjectKey: 'REVIEWER',
      traceId: 'non_existent_trace_id',
      decision: 'approve',
    }),
    /TRACE_NOT_FOUND/,
  );
});

test('reviewing already-reviewed trace updates reviewer', () => {
  const core = new S1Core();
  const trace = core.submitEngineeringTrace({
    subjectKey: 'BASE_USER',
    trace: makeTracePackage({
      id: 'trace_double_review',
      writeback_meta: { source_tool: 'test', idempotency_key: 'idem_double_review' },
    }),
  });

  core.reviewTrace({ subjectKey: 'REVIEWER', traceId: trace.id, decision: 'approve' });
  const second = core.reviewTrace({
    subjectKey: 'ORG_ADMIN',
    traceId: trace.id,
    decision: 'reject',
  });

  assert.equal(second.status, 'rejected');
  assert.equal(second.reviewer_subject_key, 'ORG_ADMIN');
});

// ---------------------------------------------------------------------------
// reviewTrace — audit events
// ---------------------------------------------------------------------------

test('emits engineering_trace.reviewed audit event on approve', () => {
  const core = new S1Core();
  const trace = core.submitEngineeringTrace({
    subjectKey: 'BASE_USER',
    trace: makeTracePackage({
      id: 'trace_audit_1',
      writeback_meta: { source_tool: 'test', idempotency_key: 'idem_audit_review' },
    }),
  });

  core.reviewTrace({
    subjectKey: 'REVIEWER',
    traceId: trace.id,
    decision: 'approve',
  });

  assert.ok(
    core.auditEvents.some(
      (e) => e.event_name === 'engineering_trace.reviewed'
        && e.actor.subject_key === 'REVIEWER'
        && e.decision.result === 'approved',
    ),
  );
});

test('emits engineering_trace.reviewed audit event on reject', () => {
  const core = new S1Core();
  const trace = core.submitEngineeringTrace({
    subjectKey: 'BASE_USER',
    trace: makeTracePackage({
      id: 'trace_audit_2',
      writeback_meta: { source_tool: 'test', idempotency_key: 'idem_audit_reject' },
    }),
  });

  core.reviewTrace({
    subjectKey: 'REVIEWER',
    traceId: trace.id,
    decision: 'reject',
  });

  assert.ok(
    core.auditEvents.some(
      (e) => e.event_name === 'engineering_trace.reviewed'
        && e.decision.result === 'rejected',
    ),
  );
});
