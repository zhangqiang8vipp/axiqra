export class S1Store {
  constructor({ memory = [] } = {}) {
    this.memory = structuredClone(memory);
    this.traces = new Map();
    this.quotaCounters = new Map();
    this.idempotencyIndex = new Map();
  }

  listMemory() {
    return this.memory;
  }

  publishMemory(entry) {
    this.memory.push(entry);
    return entry;
  }

  getQuotaUsed(counterKey) {
    return this.quotaCounters.get(counterKey) ?? 0;
  }

  setQuotaUsed(counterKey, value) {
    this.quotaCounters.set(counterKey, value);
  }

  nextTraceId() {
    return `trace_${this.traces.size + 1}`;
  }

  saveTrace(trace) {
    this.traces.set(trace.id, trace);
    return trace;
  }

  getTrace(traceId) {
    return this.traces.get(traceId);
  }

  getTraceByIdempotency(idempotencyKey) {
    const traceId = this.idempotencyIndex.get(idempotencyKey);
    return traceId ? this.getTrace(traceId) : null;
  }

  rememberTraceIdempotency(idempotencyKey, traceId) {
    this.idempotencyIndex.set(idempotencyKey, traceId);
  }
}
