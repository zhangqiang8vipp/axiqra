import { AuditLog } from './audit.mjs';
import { S1ApiAdapter } from './api-adapter.mjs';
import { DEFAULT_MEMORY, DEFAULT_SUBJECTS } from './defaults.mjs';
import { McpSearchService } from './mcp-service.mjs';
import { S1McpAdapter } from './mcp-adapter.mjs';
import { S1Policy } from './policy.mjs';
import { ReviewService } from './review-service.mjs';
import { SearchService } from './search-service.mjs';
import { S1Store } from './store.mjs';
import { TraceService } from './trace-service.mjs';

export class S1Core {
  constructor({ subjects = DEFAULT_SUBJECTS, memory = DEFAULT_MEMORY, quotaLimit = 10, store = null } = {}) {
    this.auditLog = new AuditLog();
    this.store = store ?? new S1Store({ memory });
    this.policy = new S1Policy({ subjects, quotaLimit });
    this.searchService = new SearchService({ store: this.store, policy: this.policy, auditLog: this.auditLog });
    this.mcpService = new McpSearchService({
      store: this.store,
      policy: this.policy,
      searchService: this.searchService,
      auditLog: this.auditLog,
    });
    this.traceService = new TraceService({ store: this.store, policy: this.policy, auditLog: this.auditLog });
    this.reviewService = new ReviewService({ store: this.store, policy: this.policy, auditLog: this.auditLog });
    this.api = new S1ApiAdapter({ core: this });
    this.mcp = new S1McpAdapter({ core: this });
  }

  get auditEvents() {
    return this.auditLog.events;
  }

  getNavigation(subjectKey) {
    return this.policy.getNavigation(subjectKey);
  }

  webSearch({ subjectKey = 'ANON', query, surface = 'public_solution_network' }) {
    return this.searchService.webSearch({ subjectKey, query, surface });
  }

  searchBeforeAct({ subjectKey, query, tokenScopes = ['search:read'], now = new Date() }) {
    return this.mcpService.searchBeforeAct({ subjectKey, query, tokenScopes, now });
  }

  submitEngineeringTrace({ subjectKey, trace }) {
    return this.traceService.submitEngineeringTrace({ subjectKey, trace });
  }

  reviewTrace({ subjectKey, traceId, decision, publicTitle }) {
    return this.reviewService.reviewTrace({ subjectKey, traceId, decision, publicTitle });
  }
}

export function runS1ClosedLoopDemo() {
  const core = new S1Core();
  const anonymousBefore = core.webSearch({ subjectKey: 'ANON', query: 'OAuth callback' });
  const mcpBefore = core.searchBeforeAct({ subjectKey: 'BASE_USER', query: 'OAuth callback' });
  const trace = core.submitEngineeringTrace({
    subjectKey: 'BASE_USER',
    trace: {
      id: 'trace_oauth_callback_retry',
      schema_version: 's1.trace.v1',
      task_goal: 'OAuth callback retry normalization',
      context: { tech_stack: ['next.js', 'oauth'], environment: 'sample' },
      paths: {
        forward_path: [{ order: 1, summary: 'Normalize callback URL and provider state before retry. token=abc123' }],
        failed_path: [{ order: 1, summary: 'Retrying with stale provider state failed.' }],
      },
      evidence: [{ type: 'test_output', ref: 'tests/s1-core/s1_core_closed_loop.test.mjs' }],
      authorization: { visibility_scope: 'public_candidate', license_scope: 'sample' },
      writeback_meta: { source_tool: 'codex', idempotency_key: 'idem_trace_oauth_callback_retry' },
      tags: ['oauth', 'callback', 'retry'],
    },
  });
  const reviewed = core.reviewTrace({
    subjectKey: 'REVIEWER',
    traceId: trace.id,
    decision: 'approve',
    publicTitle: 'OAuth callback retry normalization',
  });
  const anonymousAfter = core.webSearch({ subjectKey: 'ANON', query: 'retry normalization' });
  return {
    anonymousBefore,
    mcpBefore,
    trace,
    reviewed,
    anonymousAfter,
    auditEvents: core.auditEvents,
  };
}
