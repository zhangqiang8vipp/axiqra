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

test('anonymous public search only returns public desensitized results', async () => {
  const response = await readJson('docs/evidence/v2.0/anonymous/public_search_response.json');

  assert.equal(response.subject_key, 'ANON');
  assert.equal(response.http_status, 200);
  assert.equal(response.mcp_available, false);
  assert.equal(response.login_cta_visible, true);
  assert.deepEqual(response.allowed_scope, ['public_space_desensitized']);
  assert.ok(response.results.every((item) => item.visibility === 'public' && item.desensitized === true));
});

test('anonymous search must not leak private objects or MCP capability', async () => {
  const response = await readJson('docs/evidence/v2.0/anonymous/private_isolation_response.json');

  assert.equal(response.result_count, 0);
  assert.equal(response.private_title_leaked, false);
  assert.equal(response.space_name_leaked, false);
  assert.equal(response.trace_id_leaked, false);
  assert.equal(response.mcp_available, false);
});
