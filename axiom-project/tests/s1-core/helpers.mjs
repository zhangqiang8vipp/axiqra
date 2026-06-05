/**
 * Shared test data constructors for Axiqra S1 Core tests.
 * All trace/subject/search fixtures MUST be constructed via these helpers.
 * No hardcoded fixtures in individual test files.
 */

import { DEFAULT_SUBJECTS } from '../../src/s1-core/defaults.mjs';

// ---------------------------------------------------------------------------
// Trace Package constructors
// ---------------------------------------------------------------------------

/**
 * Build a valid S1 Engineering Trace Package.
 * Required fields: schema_version, task_goal, context, paths, evidence,
 *                  authorization, writeback_meta
 * @param {object} overrides - Partial override of default fields
 */
export function makeTracePackage(overrides = {}) {
  return {
    id: 'trace_test_package',
    schema_version: 's1.trace.v1',
    task_goal: 'Normalize OAuth callback retry',
    context: {
      tech_stack: ['next.js', 'oauth'],
      environment: 'sample',
      workspace_id: 'public_space',
    },
    paths: {
      forward_path: [
        {
          order: 1,
          summary: 'Normalize callback URL and provider state before retry. token=abc123',
        },
      ],
      failed_path: [
        {
          order: 1,
          summary: 'Retrying with stale provider state failed.',
        },
      ],
    },
    evidence: [
      {
        type: 'test_output',
        ref: 'tests/s1-core/helpers.mjs',
      },
    ],
    authorization: {
      visibility_scope: 'public_candidate',
      license_scope: 'sample',
    },
    writeback_meta: {
      source_tool: 'codex',
      idempotency_key: 'idem_trace_test_package',
    },
    tags: ['oauth', 'callback', 'retry'],
    ...overrides,
  };
}

/**
 * Build an invalid trace package missing one or more required fields.
 * Used to test schema validation rejection.
 * @param {string[]} missingFields - Field names to omit
 */
export function makeInvalidTracePackage(missingFields = []) {
  const base = makeTracePackage();
  if (missingFields.includes('schema_version')) delete base.schema_version;
  if (missingFields.includes('task_goal')) delete base.task_goal;
  if (missingFields.includes('context')) delete base.context;
  if (missingFields.includes('paths')) delete base.paths;
  if (missingFields.includes('evidence')) delete base.evidence;
  if (missingFields.includes('authorization')) delete base.authorization;
  if (missingFields.includes('writeback_meta')) delete base.writeback_meta;
  if (missingFields.includes('idempotency_key')) {
    base.writeback_meta = { source_tool: 'codex' };
  }
  if (missingFields.includes('source_tool')) {
    base.writeback_meta = { idempotency_key: 'idem_test' };
  }
  return base;
}

// ---------------------------------------------------------------------------
// Trace package with secrets — used for redaction tests
// ---------------------------------------------------------------------------

/** @type {Record<string, string[]>} */
const SECRET_PATTERNS = {
  'api_key=secret123': 'api_key=[REDACTED]',
  'apiKey:sk-test-abc': 'apiKey:[REDACTED]',
  'token=ghp_xxxx': 'token=[REDACTED]',
  'password:MySecret1': 'password:[REDACTED]',
};

/**
 * Build a trace package that contains secrets to be redacted.
 * Patterns: api_key=xxx, apiKey:xxx, token=xxx, password:xxx
 */
export function makeTraceWithSecrets(overrides = {}) {
  return makeTracePackage({
    paths: {
      forward_path: [
        {
          order: 1,
          summary: 'Called external API with api_key=secret123 and token=ghp_xxxx',
        },
      ],
      failed_path: [
        {
          order: 1,
          summary: 'Failed because password:MySecret1 was wrong',
        },
      ],
    },
    context: {
      tech_stack: ['python', 'api'],
      environment: 'prod',
      config: { apiKey: 'apiKey:sk-test-abc' },
    },
    ...overrides,
  });
}

// ---------------------------------------------------------------------------
// Subject constructors
// ---------------------------------------------------------------------------

/**
 * Build a subject configuration from DEFAULT_SUBJECTS keys,
 * or a completely custom one.
 * @param {string} key - One of 'ANON' | 'BASE_USER' | 'REVIEWER' | 'ORG_ADMIN'
 * @param {object} overrides
 */
export function makeSubject(key, overrides = {}) {
  const base = DEFAULT_SUBJECTS[key];
  if (!base) {
    return {
      subjectKey: key,
      authenticated: false,
      scopes: [],
      entries: [],
      advancedEntries: [],
      grants: [],
      ...overrides,
    };
  }
  return { ...base, ...overrides };
}

/**
 * Build a minimal authenticated subject with specific scopes.
 */
export function makeAuthenticatedSubject(scopes = [], grants = ['public', 'own']) {
  return {
    subjectKey: 'TEST_USER',
    authenticated: true,
    scopes,
    entries: ['home', 'personal_workspace', 'public_solution_network'],
    advancedEntries: [],
    grants,
  };
}

// ---------------------------------------------------------------------------
// Memory / search result constructors
// ---------------------------------------------------------------------------

/**
 * Build a memory entry (search result candidate).
 * @param {'public'|'enterprise'|'own'} visibility
 */
export function makeMemoryEntry(visibility = 'public', overrides = {}) {
  const titles = {
    public: 'OAuth callback returns 400 after redirect',
    enterprise: 'enterprise-private-seed-title',
    own: 'Personal project architecture notes',
  };
  const summaries = {
    public: 'Normalize callback URL and provider state before retry.',
    enterprise: 'Private enterprise seed that must never leak to anonymous.',
    own: 'My personal notes on service architecture.',
  };
  return {
    id: `entry_${visibility}_1`,
    type: visibility === 'public' ? 'Public Case' : 'Project Case',
    title: titles[visibility] ?? 'Generic entry',
    summary: summaries[visibility] ?? 'Generic summary',
    visibility,
    desensitized: visibility === 'public',
    tags: [visibility === 'public' ? 'oauth' : 'private'],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// MCP response constructors
// ---------------------------------------------------------------------------

/**
 * Build a quota-checked MCP response envelope.
 */
export function makeMcpQuotaCheckedResponse(overrides = {}) {
  return {
    http_status: 200,
    tool: 'axiqra.search_before_act',
    subject_key: 'BASE_USER',
    quota_window: 'day',
    quota_limit: 10,
    quota_used: 1,
    quota_remaining: 9,
    no_recall_performed: false,
    results: [],
    ...overrides,
  };
}

/**
 * Build a quota-exceeded MCP response envelope.
 */
export function makeMcpQuotaExceededResponse(overrides = {}) {
  return {
    http_status: 429,
    tool: 'axiqra.search_before_act',
    subject_key: 'BASE_USER',
    error_code: 'QUOTA_LIMITED',
    message: '今日 MCP 搜索次数已用完。',
    quota_window: 'day',
    quota_limit: 10,
    quota_used: 10,
    quota_remaining: 0,
    no_recall_performed: true,
    results: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// JSON fixture reader helper
// ---------------------------------------------------------------------------

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Load a JSON fixture relative to the repo root.
 * @param {string} relativePath - e.g. 'fixtures/v2.0/mcp/quota-boundary-fixtures.json'
 */
export async function readJson(relativePath) {
  return JSON.parse(await readFile(path.resolve(__dirname, '../../..', relativePath), 'utf8'));
}
