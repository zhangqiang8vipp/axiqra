export function createAudit(eventName, payload, now = new Date()) {
  return {
    event_name: eventName,
    occurred_at: now.toISOString(),
    ...payload,
  };
}

export class AuditLog {
  constructor() {
    this.events = [];
  }

  append(eventName, payload, now) {
    const event = createAudit(eventName, payload, now);
    this.events.push(event);
    return event;
  }
}
