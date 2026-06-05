import { redactTrace } from './redaction.mjs';
import { validateEngineeringTracePackage } from './trace-schema.mjs';

export class TraceService {
  constructor({ store, policy, auditLog }) {
    this.store = store;
    this.policy = policy;
    this.auditLog = auditLog;
  }

  submitEngineeringTrace({ subjectKey, trace }) {
    const subject = this.policy.getSubject(subjectKey);
    this.policy.validateTraceWrite(subject);
    const normalizedTrace = validateEngineeringTracePackage(trace);
    const idempotencyKey = normalizedTrace.writeback_meta.idempotency_key;
    const existing = this.store.getTraceByIdempotency(idempotencyKey);
    if (existing) {
      this.auditLog.append('engineering_trace.idempotent_replay', {
        actor: { subject_key: subject.subjectKey },
        object: { trace_id: existing.id },
        decision: { result: 'replayed' },
      });
      return { ...existing, idempotent_replay: true };
    }
    const cleanTrace = redactTrace(normalizedTrace);
    const id = cleanTrace.id ?? this.store.nextTraceId();
    const stored = {
      ...cleanTrace,
      id,
      author_subject_key: subject.subjectKey,
      status: 'submitted',
      public_candidate: true,
    };
    this.store.saveTrace(stored);
    this.store.rememberTraceIdempotency(idempotencyKey, id);
    this.auditLog.append('engineering_trace.submitted', {
      actor: { subject_key: subject.subjectKey },
      object: { trace_id: id },
      decision: { result: 'submitted' },
    });
    return stored;
  }
}
