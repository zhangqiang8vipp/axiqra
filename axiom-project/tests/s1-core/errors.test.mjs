import test from 'node:test';
import assert from 'node:assert/strict';
import { S1Error, ERROR_CATALOG, toErrorResponse } from '../../src/s1-core/errors.mjs';

// ---------------------------------------------------------------------------
// ERROR_CATALOG completeness
// ---------------------------------------------------------------------------

test('ERROR_CATALOG contains LOGIN_REQUIRED entry', () => {
  assert.ok(ERROR_CATALOG.LOGIN_REQUIRED);
  assert.equal(ERROR_CATALOG.LOGIN_REQUIRED.httpStatus, 401);
});

test('ERROR_CATALOG contains SCOPE_DENIED entry', () => {
  assert.ok(ERROR_CATALOG.SCOPE_DENIED);
  assert.equal(ERROR_CATALOG.SCOPE_DENIED.httpStatus, 403);
});

test('ERROR_CATALOG contains QUOTA_LIMITED entry', () => {
  assert.ok(ERROR_CATALOG.QUOTA_LIMITED);
  assert.equal(ERROR_CATALOG.QUOTA_LIMITED.httpStatus, 429);
});

test('ERROR_CATALOG contains TRACE_WRITE_DENIED entry', () => {
  assert.ok(ERROR_CATALOG.TRACE_WRITE_DENIED);
  assert.equal(ERROR_CATALOG.TRACE_WRITE_DENIED.httpStatus, 403);
});

test('ERROR_CATALOG contains REVIEW_WRITE_DENIED entry', () => {
  assert.ok(ERROR_CATALOG.REVIEW_WRITE_DENIED);
  assert.equal(ERROR_CATALOG.REVIEW_WRITE_DENIED.httpStatus, 403);
});

test('ERROR_CATALOG contains TRACE_SCHEMA_INVALID entry', () => {
  assert.ok(ERROR_CATALOG.TRACE_SCHEMA_INVALID);
  assert.equal(ERROR_CATALOG.TRACE_SCHEMA_INVALID.httpStatus, 422);
});

test('ERROR_CATALOG contains TRACE_NOT_FOUND entry', () => {
  assert.ok(ERROR_CATALOG.TRACE_NOT_FOUND);
  assert.equal(ERROR_CATALOG.TRACE_NOT_FOUND.httpStatus, 404);
});

test('ERROR_CATALOG contains ROUTE_NOT_FOUND entry', () => {
  assert.ok(ERROR_CATALOG.ROUTE_NOT_FOUND);
  assert.equal(ERROR_CATALOG.ROUTE_NOT_FOUND.httpStatus, 404);
});

// ---------------------------------------------------------------------------
// S1Error construction
// ---------------------------------------------------------------------------

test('S1Error has name S1Error', () => {
  const err = new S1Error('LOGIN_REQUIRED');
  assert.equal(err.name, 'S1Error');
});

test('S1Error has correct code from catalog', () => {
  const err = new S1Error('QUOTA_LIMITED');
  assert.equal(err.code, 'QUOTA_LIMITED');
});

test('S1Error has correct httpStatus from catalog', () => {
  const err = new S1Error('QUOTA_LIMITED');
  assert.equal(err.httpStatus, 429);
});

test('S1Error has message from catalog', () => {
  const err = new S1Error('LOGIN_REQUIRED');
  assert.equal(err.message, 'MCP 搜索需要登录。');
});

test('S1Error uses custom message over catalog message', () => {
  const err = new S1Error('LOGIN_REQUIRED', { message: 'Custom login error' });
  assert.equal(err.message, 'Custom login error');
});

test('S1Error uses custom httpStatus over catalog', () => {
  const err = new S1Error('LOGIN_REQUIRED', { httpStatus: 500 });
  assert.equal(err.httpStatus, 500);
});

test('S1Error has repairHint from catalog', () => {
  const err = new S1Error('LOGIN_REQUIRED');
  assert.ok(err.repairHint.includes('登录'));
});

test('S1Error uses custom repairHint over catalog', () => {
  const err = new S1Error('LOGIN_REQUIRED', { repairHint: 'Use SSO instead.' });
  assert.equal(err.repairHint, 'Use SSO instead.');
});

test('S1Error has details array', () => {
  const err = new S1Error('TRACE_SCHEMA_INVALID', {
    details: [{ field: 'task_goal', reason: 'required_string' }],
  });
  assert.deepEqual(err.details, [{ field: 'task_goal', reason: 'required_string' }]);
});

test('S1Error defaults to 500 for unknown error codes', () => {
  const err = new S1Error('UNKNOWN_CODE');
  assert.equal(err.httpStatus, 500);
  assert.equal(err.message, 'UNKNOWN_CODE');
});

test('S1Error is an instance of Error', () => {
  const err = new S1Error('LOGIN_REQUIRED');
  assert.ok(err instanceof Error);
});

// ---------------------------------------------------------------------------
// toErrorResponse
// ---------------------------------------------------------------------------

test('toErrorResponse returns s1.error.v1 schema', () => {
  const response = toErrorResponse(new S1Error('LOGIN_REQUIRED'), 'req_test');
  assert.equal(response.schema_version, 's1.error.v1');
});

test('toErrorResponse includes request_id', () => {
  const response = toErrorResponse(new S1Error('LOGIN_REQUIRED'), 'req_custom');
  assert.equal(response.request_id, 'req_custom');
});

test('toErrorResponse maps S1Error to error response shape', () => {
  const err = new S1Error('QUOTA_LIMITED', {
    details: [{ field: 'quota', reason: 'exceeded' }],
  });
  const response = toErrorResponse(err, 'req_quota');

  assert.equal(response.http_status, 429);
  assert.equal(response.error_code, 'QUOTA_LIMITED');
  assert.equal(response.message, err.message);
  assert.deepEqual(response.details, err.details);
  assert.equal(response.repair_hint, err.repairHint);
});

test('toErrorResponse wraps non-S1Error as 500 ROUTE_NOT_FOUND', () => {
  const genericError = new Error('Something went wrong');
  const response = toErrorResponse(genericError, 'req_generic');

  assert.equal(response.http_status, 500);
  assert.equal(response.error_code, 'ROUTE_NOT_FOUND');
  assert.equal(response.message, 'Something went wrong');
});
