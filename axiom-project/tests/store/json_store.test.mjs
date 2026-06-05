import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JsonS1Store } from '../../src/s1-core/json-store.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function makeTempStore() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'axiqra-json-store-'));
  const filePath = path.join(dir, 's1-store.json');
  const store = await JsonS1Store.open(filePath);
  return { store, filePath, dir };
}

test('JsonS1Store.open creates store file on first open', async () => {
  const { store, filePath, dir } = await makeTempStore();

  assert.ok(await fs.access(filePath).then(() => true).catch(() => false));
  assert.ok(store instanceof JsonS1Store);

  await fs.rm(dir, { recursive: true });
});

test('JsonS1Store.open loads existing store from file', async () => {
  const { store: original, filePath, dir } = await makeTempStore();
  original.publishMemory({ id: 'entry_from_original', title: 'Original', visibility: 'public', desensitized: true });
  original.setQuotaUsed('BASE_USER:2026-06-05', 5);
  await original.flush();

  const reopened = await JsonS1Store.open(filePath);
  assert.equal(reopened.listMemory().length, 1);
  assert.equal(reopened.getQuotaUsed('BASE_USER:2026-06-05'), 5);

  await fs.rm(dir, { recursive: true });
});

test('flush persists memory, traces, quota counters, and idempotency index', async () => {
  const { store, filePath, dir } = await makeTempStore();

  store.publishMemory({ id: 'mem_flush', title: 'Flushed entry', visibility: 'public', desensitized: true });
  store.setQuotaUsed('TEST_USER:2026-06-05', 7);
  store.saveTrace({ id: 'trace_flush', status: 'submitted' });
  store.rememberTraceIdempotency('idem_flush', 'trace_flush');
  await store.flush();

  const reopened = await JsonS1Store.open(filePath);
  assert.equal(reopened.listMemory().length, 1);
  assert.equal(reopened.getQuotaUsed('TEST_USER:2026-06-05'), 7);
  assert.equal(reopened.getTrace('trace_flush').status, 'submitted');
  assert.equal(reopened.idempotencyIndex.get('idem_flush'), 'trace_flush');

  await fs.rm(dir, { recursive: true });
});

test('snapshot returns serializable state', async () => {
  const { store, dir } = await makeTempStore();

  store.publishMemory({ id: 'snap_mem', title: 'Snapshot', visibility: 'public', desensitized: true });
  store.setQuotaUsed('SNAP_USER:2026-06-05', 3);
  store.saveTrace({ id: 'snap_trace', status: 'submitted' });
  store.rememberTraceIdempotency('idem_snap', 'snap_trace');

  const snap = store.snapshot();

  assert.ok(Array.isArray(snap.memory));
  assert.ok(Array.isArray(snap.traces));
  assert.ok(Array.isArray(snap.quotaCounters));
  assert.ok(Array.isArray(snap.idempotencyIndex));
  assert.equal(snap.memory.length, 1);
  assert.equal(snap.quotaCounters[0][0], 'SNAP_USER:2026-06-05');
  assert.equal(snap.quotaCounters[0][1], 3);

  await fs.rm(dir, { recursive: true });
});

test('reopened store continues quota counting from persisted state', async () => {
  const { store, filePath, dir } = await makeTempStore();

  // First session: use some quota
  store.setQuotaUsed('USER_A:2026-06-05', 3);
  await store.flush();

  // Second session: resume counting
  const resumed = await JsonS1Store.open(filePath);
  assert.equal(resumed.getQuotaUsed('USER_A:2026-06-05'), 3);
  resumed.setQuotaUsed('USER_A:2026-06-05', 4);
  await resumed.flush();

  // Third session: verify persistence
  const confirmed = await JsonS1Store.open(filePath);
  assert.equal(confirmed.getQuotaUsed('USER_A:2026-06-05'), 4);

  await fs.rm(dir, { recursive: true });
});

test('concurrent writes to same file do not corrupt (sequential guarantee)', async () => {
  const { filePath, dir } = await makeTempStore();

  const s1 = await JsonS1Store.open(filePath);
  s1.setQuotaUsed('CONCURRENT:2026-06-05', 1);
  await s1.flush();

  const s2 = await JsonS1Store.open(filePath);
  s2.setQuotaUsed('CONCURRENT:2026-06-05', 2);
  await s2.flush();

  const s3 = await JsonS1Store.open(filePath);
  assert.equal(s3.getQuotaUsed('CONCURRENT:2026-06-05'), 2);

  await fs.rm(dir, { recursive: true });
});
