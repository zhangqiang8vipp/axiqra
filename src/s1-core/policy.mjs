import { S1Error } from './errors.mjs';

export function publicOnly(entry) {
  return entry.visibility === 'public' && entry.desensitized === true;
}

export class S1Policy {
  constructor({ subjects, quotaLimit = 10 }) {
    this.subjects = structuredClone(subjects);
    this.quotaLimit = quotaLimit;
  }

  getSubject(subjectKey) {
    const subject = this.subjects[subjectKey];
    if (!subject) {
      throw new Error(`Unknown subject: ${subjectKey}`);
    }
    return subject;
  }

  getNavigation(subjectKey) {
    const subject = this.getSubject(subjectKey);
    return {
      subject_key: subject.subjectKey,
      entries: [...subject.entries, ...subject.advancedEntries],
      rule: 'base_entries + membership + grants + advanced_entries -> ABAC filter',
    };
  }

  canSeeMemory(subject, entry) {
    if (subject.authenticated !== true) return publicOnly(entry);
    if (publicOnly(entry)) return true;
    if (entry.visibility === 'enterprise') return subject.grants.includes('enterprise');
    if (entry.visibility === 'own') return subject.grants.includes('own');
    return false;
  }

  validateMcpSearch(subject, tokenScopes) {
    if (!subject.authenticated) {
      return { allowed: false, httpStatus: 401, errorCode: 'LOGIN_REQUIRED' };
    }
    if (!tokenScopes.includes('search:read') || !subject.scopes.includes('search:read')) {
      return { allowed: false, httpStatus: 403, errorCode: 'SCOPE_DENIED' };
    }
    return { allowed: true };
  }

  validateTraceWrite(subject) {
    if (!subject.authenticated || !subject.scopes.includes('trace:write')) {
      throw new S1Error('TRACE_WRITE_DENIED');
    }
  }

  validateReviewWrite(subject) {
    if (!subject.authenticated || !subject.scopes.includes('review:write')) {
      throw new S1Error('REVIEW_WRITE_DENIED');
    }
  }
}
