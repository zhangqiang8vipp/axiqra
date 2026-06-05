import test from 'node:test';
import assert from 'node:assert/strict';
import { redactTrace } from '../../src/s1-core/redaction.mjs';
import { makeTraceWithSecrets, makeTracePackage } from './helpers.mjs';

// ---------------------------------------------------------------------------
// Single string redaction
// ---------------------------------------------------------------------------

test('redacts api_key=xxx pattern in string', () => {
  assert.equal(
    redactTrace('Called with api_key=secret123'),
    'Called with api_key=[REDACTED]',
  );
});

test('redacts apiKey:xxx pattern in string', () => {
  assert.equal(
    redactTrace('Token: apiKey:sk-test-abc'),
    'Token: apiKey:[REDACTED]',
  );
});

test('redacts token=xxx pattern in string', () => {
  assert.equal(
    redactTrace('Auth: token=ghp_xxxx'),
    'Auth: token=[REDACTED]',
  );
});

test('redacts password:xxx pattern in string', () => {
  assert.equal(
    redactTrace('Login: password:MySecret1'),
    'Login: password:[REDACTED]',
  );
});

test('redacts case-insensitively (uppercase KEY)', () => {
  assert.equal(
    redactTrace('api_Key=mysecret'),
    'api_Key=[REDACTED]',
  );
});

test('redacts mixed case patterns', () => {
  assert.equal(
    redactTrace('Token=ABC123 apiKey:XYZ password:SECRET'),
    'Token=[REDACTED] apiKey:[REDACTED] password:[REDACTED]',
  );
});

test('string without secrets remains unchanged', () => {
  const clean = 'Normal OAuth callback processing without any secrets.';
  assert.equal(redactTrace(clean), clean);
});

// ---------------------------------------------------------------------------
// Object redaction
// ---------------------------------------------------------------------------

test('redacts secrets nested in object values', () => {
  const obj = {
    step: 1,
    summary: 'Called API with api_key=secret123',
    token: 'token=ghp_xxxx',
  };

  const redacted = redactTrace(obj);

  assert.equal(redacted.step, 1);
  assert.equal(redacted.summary, 'Called API with api_key=[REDACTED]');
  assert.equal(redacted.token, 'token=[REDACTED]');
});

test('redacts secrets in nested objects', () => {
  const obj = {
    config: {
      apiKey: 'apiKey:sk-test',
      password: 'password:secret',
    },
    message: 'Failed login',
  };

  const redacted = redactTrace(obj);

  assert.equal(redacted.config.apiKey, 'apiKey:[REDACTED]');
  assert.equal(redacted.config.password, 'password:[REDACTED]');
  assert.equal(redacted.message, 'Failed login');
});

test('returns empty object for empty object', () => {
  assert.deepEqual(redactTrace({}), {});
});

// ---------------------------------------------------------------------------
// Array redaction
// ---------------------------------------------------------------------------

test('redacts secrets in array elements', () => {
  const arr = [
    'First call with api_key=key1',
    'Second call with token=token2',
    'No secret here',
  ];

  const redacted = redactTrace(arr);

  assert.equal(redacted[0], 'First call with api_key=[REDACTED]');
  assert.equal(redacted[1], 'Second call with token=[REDACTED]');
  assert.equal(redacted[2], 'No secret here');
});

test('redacts secrets in objects inside arrays', () => {
  const arr = [
    { step: 1, action: 'Auth with password:secret1' },
    { step: 2, action: 'Call with api_key=key2' },
  ];

  const redacted = redactTrace(arr);

  assert.equal(redacted[0].action, 'Auth with password:[REDACTED]');
  assert.equal(redacted[1].action, 'Call with api_key=[REDACTED]');
  assert.equal(redacted[0].step, 1);
});

// ---------------------------------------------------------------------------
// Trace package redaction (integration)
// ---------------------------------------------------------------------------

test('redacts full trace package with secrets', () => {
  const trace = makeTraceWithSecrets();
  const redacted = redactTrace(trace);

  // forward_path summary should be redacted
  assert.equal(redacted.paths.forward_path[0].summary, 'Called external API with api_key=[REDACTED] and token=[REDACTED]');

  // failed_path summary should be redacted
  assert.equal(redacted.paths.failed_path[0].summary, 'Failed because password:[REDACTED] was wrong');

  // context.config should be redacted
  assert.equal(redacted.context.config.apiKey, 'apiKey:[REDACTED]');
});

test('redacts array of trace packages', () => {
  const traces = [makeTraceWithSecrets({ id: 'trace_1' }), makeTraceWithSecrets({ id: 'trace_2' })];

  const redacted = redactTrace(traces);

  assert.equal(redacted[0].paths.forward_path[0].summary, 'Called external API with api_key=[REDACTED] and token=[REDACTED]');
  assert.equal(redacted[1].paths.forward_path[0].summary, 'Called external API with api_key=[REDACTED] and token=[REDACTED]');
});

// ---------------------------------------------------------------------------
// Non-object primitives pass through
// ---------------------------------------------------------------------------

test('number passes through unchanged', () => {
  assert.equal(redactTrace(42), 42);
});

test('null passes through unchanged', () => {
  assert.equal(redactTrace(null), null);
});

test('undefined passes through unchanged', () => {
  assert.equal(redactTrace(undefined), undefined);
});

test('boolean passes through unchanged', () => {
  assert.equal(redactTrace(true), true);
  assert.equal(redactTrace(false), false);
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

test('empty string returns empty string', () => {
  assert.equal(redactTrace(''), '');
});

test('handles trace with null values', () => {
  const obj = { summary: 'Test', tags: null };
  const redacted = redactTrace(obj);
  assert.equal(redacted.summary, 'Test');
  assert.equal(redacted.tags, null);
});
