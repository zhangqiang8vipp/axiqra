import { S1Error } from './errors.mjs';

export class ReviewService {
  constructor({ store, policy, auditLog }) {
    this.store = store;
    this.policy = policy;
    this.auditLog = auditLog;
  }

  reviewTrace({ subjectKey, traceId, decision, publicTitle }) {
    const subject = this.policy.getSubject(subjectKey);
    this.policy.validateReviewWrite(subject);
    const trace = this.store.getTrace(traceId);
    if (!trace) {
      throw new S1Error('TRACE_NOT_FOUND', { details: [{ field: 'trace_id', reason: traceId }] });
    }
    const reviewed = {
      ...trace,
      status: decision === 'approve' ? 'approved' : 'rejected',
      reviewer_subject_key: subject.subjectKey,
    };
    this.store.saveTrace(reviewed);

    if (decision === 'approve') {
      this.store.publishMemory({
        id: `published_${traceId}`,
        type: 'Solution',
        title: publicTitle ?? trace.summary,
        summary: trace.worked ?? trace.summary,
        visibility: 'public',
        desensitized: true,
        tags: trace.tags ?? ['engineering-trace'],
      });
    }

    this.auditLog.append('engineering_trace.reviewed', {
      actor: { subject_key: subject.subjectKey },
      object: { trace_id: traceId },
      decision: { result: reviewed.status },
    });
    return reviewed;
  }
}
