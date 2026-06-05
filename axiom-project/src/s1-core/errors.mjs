export const ERROR_CATALOG = {
  LOGIN_REQUIRED: {
    httpStatus: 401,
    message: 'MCP 搜索需要登录。',
    repairHint: '请先登录或创建接入会话。',
  },
  SCOPE_DENIED: {
    httpStatus: 403,
    message: 'Token 缺少必要 scope。',
    repairHint: '请重新授权 search:read 或 trace:write scope。',
  },
  QUOTA_LIMITED: {
    httpStatus: 429,
    message: '今日 MCP 搜索次数已用完。',
    repairHint: '等待次日重置，或通过显式套餐/企业策略申请更高额度。',
  },
  TRACE_WRITE_DENIED: {
    httpStatus: 403,
    message: '当前主体不能提交 Engineering Trace Package。',
    repairHint: '请确认登录态和 trace:write scope。',
  },
  REVIEW_WRITE_DENIED: {
    httpStatus: 403,
    message: '当前主体不能审核 Engineering Trace Package。',
    repairHint: '请确认 reviewer 身份和 review:write scope。',
  },
  TRACE_SCHEMA_INVALID: {
    httpStatus: 422,
    message: 'Engineering Trace Package 结构不完整。',
    repairHint: '请补齐 schema_version、task_goal、context、paths、evidence、authorization、writeback_meta。',
  },
  TRACE_NOT_FOUND: {
    httpStatus: 404,
    message: 'Engineering Trace Package 不存在。',
    repairHint: '请检查 trace_id。',
  },
  ROUTE_NOT_FOUND: {
    httpStatus: 404,
    message: 'API route 不存在。',
    repairHint: '请检查 method 和 path。',
  },
};

export class S1Error extends Error {
  constructor(code, options = {}) {
    const catalog = ERROR_CATALOG[code] ?? {};
    super(options.message ?? catalog.message ?? code);
    this.name = 'S1Error';
    this.code = code;
    this.httpStatus = options.httpStatus ?? catalog.httpStatus ?? 500;
    this.details = options.details ?? [];
    this.repairHint = options.repairHint ?? catalog.repairHint ?? '请查看审计日志和请求参数。';
  }
}

export function toErrorResponse(error, requestId = 'req_s1_error') {
  const s1Error = error instanceof S1Error
    ? error
    : new S1Error('ROUTE_NOT_FOUND', { message: error.message, httpStatus: 500 });
  return {
    request_id: requestId,
    schema_version: 's1.error.v1',
    http_status: s1Error.httpStatus,
    error_code: s1Error.code,
    message: s1Error.message,
    details: s1Error.details,
    repair_hint: s1Error.repairHint,
  };
}
