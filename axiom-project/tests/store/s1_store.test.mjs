import test from 'node:test';
import assert from 'node:assert/strict';
import { S1Store } from '../../src/s1-core/store.mjs';

test('S1Store initializes with empty memory, traces, quota counters, and idempotency index', () => {
  const store = new S1Store();

  assert.deepEqual(store.memory, []);
  assert.equal(store.traces.size, 0);
  assert.equal(store.quotaCounters.size, 0);
  assert.equal(store.idempotencyIndex.size, 0);
});

test('S1Store accepts initial memory', () => {
  const entries = [
    { id: 'entry_1', title: 'Test entry', visibility: 'public', desensitized: true },
  ];
  const store = new S1Store({ memory: entries });

  assert.equal(store.listMemory().length, 1);
  assert.equal(store.listMemory()[0].id, 'entry_1');
});

test('publishMemory adds entry to memory array', () => {
  const store = new S1Store();
  const entry = { id: 'new_entry', title: 'New', visibility: 'public', desensitized: true };

  store.publishMemory(entry);

  assert.equal(store.listMemory().length, 1);
  assert.equal(store.listMemory()[0].id, 'new_entry');
});

test('publishMemory does not mutate original memory array', () => {
  const original = [{ id: 'a' }];
  const store = new S1Store({ memory: original });
  store.publishMemory({ id: 'b' });

  assert.equal(original.length, 1); // original untouched
  assert.equal(store.listMemory().length, 2); // store has both
});

// ---------------------------------------------------------------------------
// Quota counters
// ---------------------------------------------------------------------------

test('getQuotaUsed returns 0 for unknown counter key', () => {
  const store = new S1Store();
  assert.equal(store.getQuotaUsed('BASE_USER:2026-06-05'), 0);
});

test('setQuotaUsed updates counter value', () => {
  const store = new S1Store();
  store.setQuotaUsed('BASE_USER:2026-06-05', 5);

  assert.equal(store.getQuotaUsed('BASE_USER:2026-06-05'), 5);
});

test('quota counters are independent per key', () => {
  const store = new S1Store();
  store.setQuotaUsed('BASE_USER:2026-06-05', 3);
  store.setQuotaUsed('REVIEWER:2026-06-05', 7);

  assert.equal(store.getQuotaUsed('BASE_USER:2026-06-05'), 3);
  assert.equal(store.getQuotaUsed('REVIEWER:2026-06-05'), 7);
});

// ---------------------------------------------------------------------------
// Trace storage
// ---------------------------------------------------------------------------

test('saveTrace stores trace by id', () => {
  const store = new S1Store();
  const trace = { id: 'trace_1', status: 'submitted' };

  store.saveTrace(trace);

  assert.equal(store.traces.size, 1);
  assert.equal(store.getTrace('trace_1').status, 'submitted');
});

test('getTrace returns undefined for non-existent trace', () => {
  const store = new S1Store();
  assert.equal(store.getTrace('non_existent'), undefined);
});

test('saveTrace overwrites existing trace with same id', () => {
  const store = new S1Store();
  store.saveTrace({ id: 'trace_overwrite', status: 'submitted' });
  store.saveTrace({ id: 'trace_overwrite', status: 'approved' });

  assert.equal(store.traces.size, 1);
  assert.equal(store.getTrace('trace_overwrite').status, 'approved');
});

// ---------------------------------------------------------------------------
// Idempotency index
// ---------------------------------------------------------------------------

test('getTraceByIdempotency returns null for unknown key', () => {
  const store = new S1Store();
  assert.equal(store.getTraceByIdempotency('unknown_key'), null);
});

test('rememberTraceIdempotency maps key to traceId', () => {
  const store = new S1Store();
  store.rememberTraceIdempotency('idem_key_1', 'trace_1');

  assert.equal(store.idempotencyIndex.get('idem_key_1'), 'trace_1');
});

test('getTraceByIdempotency returns trace via mapped idempotency key', () => {
  const store = new S1Store();
  store.saveTrace({ id: 'trace_idem_1', status: 'submitted' });
  store.rememberTraceIdempotency('idem_key_map', 'trace_idem_1');

  const found = store.getTraceByIdempotency('idem_key_map');
  assert.ok(found);
  assert.equal(found.id, 'trace_idem_1');
});

test('idempotency index does not prevent duplicate trace ids', () => {
  const store = new S1Store();
  store.saveTrace({ id: 'trace_a', status: 'submitted' });
  store.rememberTraceIdempotency('idem_a', 'trace_a');
  store.saveTrace({ id: 'trace_b', status: 'submitted' });
  store.rememberTraceIdempotency('idem_b', 'trace_b');

  assert.equal(store.traces.size, 2);
  assert.equal(store.idempotencyIndex.size, 2);
});

// ---------------------------------------------------------------------------
// nextTraceId
// ---------------------------------------------------------------------------

test('nextTraceId generates sequential trace IDs', () => {
  const store = new S1Store();
  assert.equal(store.nextTraceId(), 'trace_1');
  assert.equal(store.nextTraceId(), 'trace_2');
  assert.equal(store.nextTraceId(), 'trace_3');
});

test('nextTraceId is independent of saved traces', () => {
  const store = new S1Store();
  store.saveTrace({ id: 'manual_trace', status: 'submitted' });

  // nextTraceId still starts from traces.size + 1 = 2
  assert.equal(store.nextTraceId(), 'trace_2');
});
