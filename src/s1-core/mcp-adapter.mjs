import { toErrorResponse, S1Error } from './errors.mjs';

export class S1McpAdapter {
  constructor({ core }) {
    this.core = core;
  }

  call(toolName, args = {}, context = {}) {
    const requestId = context.requestId ?? 'req_s1_mcp';
    try {
      if (toolName === 'axiqra.search_before_act') {
        return {
          request_id: requestId,
          schema_version: 's1.mcp.v1',
          ...this.core.searchBeforeAct({
            subjectKey: context.subjectKey,
            query: args.task_goal ?? args.query,
            tokenScopes: context.tokenScopes ?? [],
            now: context.now ?? new Date(),
          }),
        };
      }
      if (toolName === 'axiqra.submit_trace') {
        return {
          request_id: requestId,
          schema_version: 's1.mcp.v1',
          http_status: 201,
          trace: this.core.submitEngineeringTrace({
            subjectKey: context.subjectKey,
            trace: args.trace_payload,
          }),
        };
      }
      throw new S1Error('ROUTE_NOT_FOUND', { details: [{ field: 'toolName', reason: toolName }] });
    } catch (error) {
      return toErrorResponse(error, requestId);
    }
  }
}
