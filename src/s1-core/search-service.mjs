function includesQuery(entry, query) {
  const haystack = `${entry.title} ${entry.summary} ${(entry.tags ?? []).join(' ')}`.toLowerCase();
  return haystack.includes(String(query ?? '').toLowerCase());
}

export class SearchService {
  constructor({ store, policy, auditLog }) {
    this.store = store;
    this.policy = policy;
    this.auditLog = auditLog;
  }

  webSearch({ subjectKey = 'ANON', query, surface = 'public_solution_network' }) {
    const subject = this.policy.getSubject(subjectKey);
    const anonymous = subject.authenticated !== true;
    const visibleEntries = this.store
      .listMemory()
      .filter((entry) => this.policy.canSeeMemory(subject, entry));
    const results = visibleEntries.filter((entry) => includesQuery(entry, query));
    const response = {
      subject_key: subject.subjectKey,
      surface,
      query,
      mcp_available: false,
      login_cta_visible: anonymous,
      allowed_scope: anonymous ? ['public_space_desensitized'] : ['public_space_desensitized', 'granted_scope'],
      results: results.map((entry) => ({
        id: entry.id,
        type: entry.type,
        title: entry.title,
        visibility: entry.visibility,
        desensitized: entry.desensitized,
      })),
    };
    this.auditLog.append(anonymous ? 'anonymous.search.executed' : 'web.search.executed', {
      actor: { subject_key: subject.subjectKey },
      object: { surface, query },
      decision: { result: 'allow', result_count: response.results.length },
    });
    return response;
  }
}
