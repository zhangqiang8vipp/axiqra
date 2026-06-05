import test from 'node:test';
import assert from 'node:assert/strict';
import { AuditLog, createAudit } from '../../src/s1-core/audit.mjs';

test('createAudit returns event with event_name, occurred_at, and payload', () => {
  const event = createAudit('test.event', { foo: 'bar' });

  assert.equal(event.event_name, 'test.event');
  assert.ok(event.occurred_at);
  assert.equal(event.foo, 'bar');
});

test('createAudit uses provided now value', () => {
  const fixedDate = new Date('2026-06-05T12:00:00Z');
  const event = createAudit('test.event', {}, fixedDate);

  assert.equal(event.occurred_at, fixedDate.toISOString());
});

test('AuditLog.append adds event to events array', () => {
  const log = new AuditLog();
  log.append('test.event', { foo: 'bar' });

  assert.equal(log.events.length, 1);
  assert.equal(log.events[0].event_name, 'test.event');
  assert.equal(log.events[0].foo, 'bar');
});

test('AuditLog.append returns the created event', () => {
  const log = new AuditLog();
  const event = log.append('test.event', { foo: 'bar' });

  assert.equal(event.event_name, 'test.event');
});

test('AuditLog is empty on construction', () => {
  const log = new AuditLog();
  assert.equal(log.events.length, 0);
});

test('multiple appends maintain event order', () => {
  const log = new AuditLog();
  log.append('event.1', { n: 1 });
  log.append('event.2', { n: 2 });
  log.append('event.3', { n: 3 });

  assert.equal(log.events.length, 3);
  assert.equal(log.events[0].event_name, 'event.1');
  assert.equal(log.events[1].event_name, 'event.2');
  assert.equal(log.events[2].event_name, 'event.3');
});

test('events array is accessible via .events getter', () => {
  const log = new AuditLog();
  log.append('event.a', { a: 1 });
  log.append('event.b', { b: 2 });

  assert.deepEqual(
    log.events.map((e) => e.event_name),
    ['event.a', 'event.b'],
  );
});
