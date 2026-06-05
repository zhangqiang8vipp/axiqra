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

test('MCP search_before_act ordinary user quota boundaries are explicit', async () => {
  const fixtures = await readJson('fixtures/v2.0/mcp/quota-boundary-fixtures.json');
  const first = await readJson('docs/evidence/v2.0/mcp/base_1_response.json');
  const tenth = await readJson('docs/evidence/v2.0/mcp/base_10_response.json');
  const eleventh = await readJson('docs/evidence/v2.0/mcp/base_11_quota_limited_response.json');

  assert.equal(fixtures.default_quota_policy.quota_limit, 10);
  assert.equal(first.http_status, 200);
  assert.equal(first.quota_remaining, 9);
  assert.equal(tenth.http_status, 200);
  assert.equal(tenth.quota_remaining, 0);
  assert.equal(eleventh.http_status, 429);
  assert.equal(eleventh.error_code, 'QUOTA_LIMITED');
  assert.equal(eleventh.no_recall_performed, true);
});

test('MCP search requires search:read scope before quota recall', async () => {
  const denied = await readJson('docs/evidence/v2.0/mcp/scope_denied_response.json');

  assert.equal(denied.http_status, 403);
  assert.equal(denied.error_code, 'SCOPE_DENIED');
  assert.equal(denied.required_scope, 'search:read');
  assert.equal(denied.no_recall_performed, true);
});
