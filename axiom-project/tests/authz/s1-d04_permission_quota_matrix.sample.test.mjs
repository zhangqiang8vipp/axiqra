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

test('advanced identities keep base navigation entries and do not bypass quota by default', async () => {
  const fixtures = await readJson('fixtures/v2.0/accounts/search-permission-fixtures.json');
  const admin = fixtures.subjects.find((subject) => subject.subject_key === 'ORG_ADMIN');
  const maintainer = fixtures.subjects.find((subject) => subject.subject_key === 'MAINTAINER');

  for (const subject of [admin, maintainer]) {
    assert.ok(subject.base_entries.includes('home'));
    assert.ok(subject.base_entries.includes('personal_workspace'));
    assert.ok(subject.base_entries.includes('public_solution_network'));
    assert.match(subject.quota_policy, /10_per_day/);
  }
});

test('anonymous subject has public entries only and no MCP token', async () => {
  const fixtures = await readJson('fixtures/v2.0/accounts/search-permission-fixtures.json');
  const anonymous = fixtures.subjects.find((subject) => subject.subject_key === 'ANON');

  assert.deepEqual(anonymous.advanced_entries, []);
  assert.equal(anonymous.quota_policy, 'no_mcp_token');
  assert.ok(anonymous.denied_search.includes('mcp_search'));
  assert.ok(anonymous.denied_search.includes('enterprise_space'));
});
