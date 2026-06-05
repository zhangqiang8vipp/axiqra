import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(root, relativePath), 'utf8'));
}

test('quota checked audit event contains actor, object, decision, quota, and trace', async () => {
  const event = await readJson('docs/evidence/v2.0/audit/mcp_quota_checked.json');

  assert.equal(event.event_name, 'mcp.search.quota_checked');
  assert.equal(event.decision.result, 'allow');
  assert.equal(event.quota.quota_limit, 10);
  assert.equal(event.quota.quota_remaining, 9);
  assert.ok(event.trace.evidence_ref.endsWith('base_1_response.json'));
});

test('quota exceeded audit event denies recall with QUOTA_LIMITED', async () => {
  const event = await readJson('docs/evidence/v2.0/audit/mcp_quota_exceeded.json');

  assert.equal(event.event_name, 'mcp.search.quota_exceeded');
  assert.equal(event.decision.result, 'deny');
  assert.equal(event.decision.reason_code, 'QUOTA_LIMITED');
  assert.equal(event.decision.no_recall_performed, true);
  assert.equal(event.quota.quota_remaining, 0);
});
