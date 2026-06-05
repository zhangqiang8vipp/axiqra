import { S1Error, toErrorResponse } from './errors.mjs';

function ok(body, requestId) {
  return {
    request_id: requestId,
    schema_version: 's1.api.v1',
    http_status: body.http_status ?? 200,
    ...body,
  };
}

export class S1ApiAdapter {
  constructor({ core }) {
    this.core = core;
  }

  handle({ method, path, subjectKey = 'ANON', tokenScopes = [], body = {}, now = new Date(), requestId = 'req_s1_api' }) {
    try {
      if (method === 'GET' && path === '/api/navigation') {
        return ok(this.core.getNavigation(subjectKey), requestId);
      }
      if (method === 'GET' && path === '/api/search/public') {
        return ok(this.core.webSearch({ subjectKey, query: body.query, surface: body.surface ?? 'public_solution_network' }), requestId);
      }
      if (method === 'POST' && path === '/api/search/before-act') {
        return ok(this.core.searchBeforeAct({ subjectKey, query: body.query ?? body.task_goal, tokenScopes, now }), requestId);
      }
      if (method === 'POST' && path === '/api/traces') {
        return ok({ http_status: 201, trace: this.core.submitEngineeringTrace({ subjectKey, trace: body.trace_payload }) }, requestId);
      }
      const reviewMatch = path.match(/^\/api\/traces\/([^/]+)\/review$/);
      if (method === 'POST' && reviewMatch) {
        return ok({
          review: this.core.reviewTrace({
            subjectKey,
            traceId: reviewMatch[1],
            decision: body.decision,
            publicTitle: body.public_title,
          }),
        }, requestId);
      }
      throw new S1Error('ROUTE_NOT_FOUND', { details: [{ field: 'path', reason: `${method} ${path}` }] });
    } catch (error) {
      return toErrorResponse(error, requestId);
    }
  }
}
