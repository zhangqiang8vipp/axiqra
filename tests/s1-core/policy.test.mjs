import test from 'node:test';
import assert from 'node:assert/strict';
import { S1Core } from '../../src/s1-core/index.mjs';
import { S1Policy } from '../../src/s1-core/policy.mjs';
import { S1Error } from '../../src/s1-core/errors.mjs';
import { DEFAULT_SUBJECTS } from '../../src/s1-core/defaults.mjs';
import { makeTracePackage, makeSubject, makeAuthenticatedSubject } from './helpers.mjs';

// ---------------------------------------------------------------------------
// getNavigation
// ---------------------------------------------------------------------------

test('getNavigation returns base entries for ANON', () => {
  const policy = new S1Policy({ subjects: DEFAULT_SUBJECTS });
  const nav = policy.getNavigation('ANON');

  assert.equal(nav.subject_key, 'ANON');
  assert.ok(nav.entries.includes('public_home'));
  assert.ok(nav.entries.includes('public_solution_network'));
  assert.ok(nav.entries.includes('public_case_search'));
});

test('getNavigation returns full entries for authenticated BASE_USER', () => {
  const policy = new S1Policy({ subjects: DEFAULT_SUBJECTS });
  const nav = policy.getNavigation('BASE_USER');

  assert.equal(nav.subject_key, 'BASE_USER');
  assert.ok(nav.entries.includes('home'));
  assert.ok(nav.entries.includes('personal_workspace'));
  assert.ok(nav.entries.includes('public_solution_network'));
  assert.equal(nav.entries.includes('enterprise_admin_console'), false);
  assert.equal(nav.rule, 'base_entries + membership + grants + advanced_entries -> ABAC filter');
});

test('getNavigation includes advanced entries for REVIEWER', () => {
  const policy = new S1Policy({ subjects: DEFAULT_SUBJECTS });
  const nav = policy.getNavigation('REVIEWER');

  assert.ok(nav.entries.includes('review_queue'));
  assert.equal(nav.rule, 'base_entries + membership + grants + advanced_entries -> ABAC filter');
});

test('getNavigation includes enterprise entries for ORG_ADMIN', () => {
  const policy = new S1Policy({ subjects: DEFAULT_SUBJECTS });
  const nav = policy.getNavigation('ORG_ADMIN');

  assert.ok(nav.entries.includes('enterprise_admin_console'));
  assert.ok(nav.entries.includes('tenant_policy'));
  assert.ok(nav.entries.includes('audit_export'));
});

test('getNavigation throws for unknown subject', () => {
  const policy = new S1Policy({ subjects: DEFAULT_SUBJECTS });

  assert.throws(
    () => policy.getNavigation('UNKNOWN_USER'),
    /Unknown subject/,
  );
});

// ---------------------------------------------------------------------------
// canSeeMemory
// ---------------------------------------------------------------------------

test('anonymous can only see public desensitized memory', () => {
  const policy = new S1Policy({ subjects: DEFAULT_SUBJECTS });
  const anon = policy.getSubject('ANON');
  const publicEntry = { visibility: 'public', desensitized: true };
  const enterpriseEntry = { visibility: 'enterprise', desensitized: false };
  const ownEntry = { visibility: 'own', desensitized: false };

  assert.equal(policy.canSeeMemory(anon, publicEntry), true);
  assert.equal(policy.canSeeMemory(anon, enterpriseEntry), false);
  assert.equal(policy.canSeeMemory(anon, ownEntry), false);
});

test('authenticated user with public grant can see public desensitized memory', () => {
  const policy = new S1Policy({ subjects: DEFAULT_SUBJECTS });
  const user = policy.getSubject('BASE_USER');

  assert.equal(policy.canSeeMemory(user, { visibility: 'public', desensitized: true }), true);
});

test('authenticated user without enterprise grant cannot see enterprise memory', () => {
  const policy = new S1Policy({ subjects: DEFAULT_SUBJECTS });
  const user = policy.getSubject('BASE_USER');

  assert.equal(policy.canSeeMemory(user, { visibility: 'enterprise', desensitized: false }), false);
});

test('authenticated user without own grant cannot see own memory', () => {
  const policy = new S1Policy({ subjects: DEFAULT_SUBJECTS });
  const user = policy.getSubject('BASE_USER');

  assert.equal(policy.canSeeMemory(user, { visibility: 'own', desensitized: false }), false);
});

test('ORG_ADMIN with enterprise grant can see enterprise memory', () => {
  const policy = new S1Policy({ subjects: DEFAULT_SUBJECTS });
  const admin = policy.getSubject('ORG_ADMIN');

  assert.equal(policy.canSeeMemory(admin, { visibility: 'enterprise', desensitized: false }), true);
});

// ---------------------------------------------------------------------------
// validateMcpSearch
// ---------------------------------------------------------------------------

test('rejects unauthenticated subject with LOGIN_REQUIRED', () => {
  const policy = new S1Policy({ subjects: DEFAULT_SUBJECTS });
  const anon = policy.getSubject('ANON');

  const result = policy.validateMcpSearch(anon, ['search:read']);

  assert.equal(result.allowed, false);
  assert.equal(result.httpStatus, 401);
  assert.equal(result.errorCode, 'LOGIN_REQUIRED');
});

test('rejects missing search:read scope with SCOPE_DENIED', () => {
  const policy = new S1Policy({ subjects: DEFAULT_SUBJECTS });
  const user = policy.getSubject('BASE_USER');

  const result = policy.validateMcpSearch(user, []);

  assert.equal(result.allowed, false);
  assert.equal(result.httpStatus, 403);
  assert.equal(result.errorCode, 'SCOPE_DENIED');
});

test('allows authenticated user with matching search:read scope', () => {
  const policy = new S1Policy({ subjects: DEFAULT_SUBJECTS });
  const user = policy.getSubject('BASE_USER');

  const result = policy.validateMcpSearch(user, ['search:read']);

  assert.equal(result.allowed, true);
});

// ---------------------------------------------------------------------------
// validateTraceWrite
// ---------------------------------------------------------------------------

test('rejects unauthenticated subject with TRACE_WRITE_DENIED', () => {
  const policy = new S1Policy({ subjects: DEFAULT_SUBJECTS });
  const anon = policy.getSubject('ANON');

  assert.throws(
    () => policy.validateTraceWrite(anon),
    /TRACE_WRITE_DENIED/,
  );
});

test('rejects authenticated subject missing trace:write scope', () => {
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
  const policy = new S1Policy({ subjects: customSubjects });
  const user = policy.getSubject('USER_NO_SCOPE');

  assert.throws(
    () => policy.validateTraceWrite(user),
    /TRACE_WRITE_DENIED/,
  );
});

test('allows authenticated subject with trace:write scope', () => {
  const policy = new S1Policy({ subjects: DEFAULT_SUBJECTS });
  const user = policy.getSubject('BASE_USER');

  // Should not throw
  policy.validateTraceWrite(user);
});

// ---------------------------------------------------------------------------
// validateReviewWrite
// ---------------------------------------------------------------------------

test('rejects unauthenticated subject with REVIEW_WRITE_DENIED', () => {
  const policy = new S1Policy({ subjects: DEFAULT_SUBJECTS });
  const anon = policy.getSubject('ANON');

  assert.throws(
    () => policy.validateReviewWrite(anon),
    /REVIEW_WRITE_DENIED/,
  );
});

test('rejects BASE_USER (no review:write scope) with REVIEW_WRITE_DENIED', () => {
  const policy = new S1Policy({ subjects: DEFAULT_SUBJECTS });
  const user = policy.getSubject('BASE_USER');

  assert.throws(
    () => policy.validateReviewWrite(user),
    /REVIEW_WRITE_DENIED/,
  );
});

test('allows REVIEWER with review:write scope', () => {
  const policy = new S1Policy({ subjects: DEFAULT_SUBJECTS });
  const reviewer = policy.getSubject('REVIEWER');

  // Should not throw
  policy.validateReviewWrite(reviewer);
});

test('allows ORG_ADMIN with review:write scope', () => {
  const policy = new S1Policy({ subjects: DEFAULT_SUBJECTS });
  const admin = policy.getSubject('ORG_ADMIN');

  // Should not throw
  policy.validateReviewWrite(admin);
});
