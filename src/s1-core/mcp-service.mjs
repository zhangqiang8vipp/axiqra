export class McpSearchService {
  constructor({ store, policy, searchService, auditLog }) {
    this.store = store;
    this.policy = policy;
    this.searchService = searchService;
    this.auditLog = auditLog;
  }

  searchBeforeAct({ subjectKey, query, tokenScopes = ['search:read'], now = new Date() }) {
    const subject = this.policy.getSubject(subjectKey);
    const access = this.policy.validateMcpSearch(subject, tokenScopes);
    if (!access.allowed) {
      return this.#denyMcp(access.errorCode, access.httpStatus, subject, query, null);
    }

    const day = now.toISOString().slice(0, 10);
    const counterKey = `${subject.subjectKey}:${day}`;
    const used = this.store.getQuotaUsed(counterKey);
    if (used >= this.policy.quotaLimit) {
      const response = this.#denyMcp('QUOTA_LIMITED', 429, subject, query, {
        quota_window: 'day',
        quota_limit: this.policy.quotaLimit,
        quota_used: used,
        quota_remaining: 0,
      });
      response.no_recall_performed = true;
      return response;
    }

    const nextUsed = used + 1;
    this.store.setQuotaUsed(counterKey, nextUsed);
    const search = this.searchService.webSearch({ subjectKey, query, surface: 'mcp_search_before_act' });
    const response = {
      http_status: 200,
      tool: 'axiqra.search_before_act',
      subject_key: subject.subjectKey,
      quota_window: 'day',
      quota_limit: this.policy.quotaLimit,
      quota_used: nextUsed,
      quota_remaining: this.policy.quotaLimit - nextUsed,
      no_recall_performed: false,
      results: search.results,
    };
    this.auditLog.append('mcp.search.quota_checked', {
      actor: { subject_key: subject.subjectKey },
      object: { tool: response.tool, query },
      decision: { result: 'allow' },
      quota: {
        quota_limit: response.quota_limit,
        quota_used: response.quota_used,
        quota_remaining: response.quota_remaining,
      },
    });
    return response;
  }

  #denyMcp(errorCode, httpStatus, subject, query, quota) {
    const eventName = errorCode === 'QUOTA_LIMITED' ? 'mcp.search.quota_exceeded' : 'mcp.search.denied';
    const response = {
      http_status: httpStatus,
      tool: 'axiqra.search_before_act',
      subject_key: subject.subjectKey,
      error_code: errorCode,
      message: errorCode === 'QUOTA_LIMITED' ? '今日 MCP 搜索次数已用完。' : 'MCP 搜索被拒绝。',
      no_recall_performed: true,
      ...(quota ?? {}),
      results: [],
    };
    this.auditLog.append(eventName, {
      actor: { subject_key: subject.subjectKey },
      object: { tool: response.tool, query },
      decision: { result: 'deny', reason_code: errorCode },
      quota,
    });
    return response;
  }
}
