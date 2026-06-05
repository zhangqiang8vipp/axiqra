import { S1Error } from './errors.mjs';

export const TRACE_PACKAGE_SCHEMA_VERSION = 's1.trace.v1';

function requiredString(value, path, errors) {
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push({ field: path, reason: 'required_string' });
  }
}

function requiredObject(value, path, errors) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    errors.push({ field: path, reason: 'required_object' });
  }
}

function requiredArray(value, path, errors) {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push({ field: path, reason: 'required_non_empty_array' });
  }
}

export function validateEngineeringTracePackage(trace) {
  const errors = [];
  requiredObject(trace, 'trace', errors);
  if (errors.length > 0) {
    throw new S1Error('TRACE_SCHEMA_INVALID', { details: errors });
  }

  if (trace.schema_version !== TRACE_PACKAGE_SCHEMA_VERSION) {
    errors.push({ field: 'schema_version', reason: `must_equal_${TRACE_PACKAGE_SCHEMA_VERSION}` });
  }
  requiredString(trace.task_goal, 'task_goal', errors);
  requiredObject(trace.context, 'context', errors);
  requiredObject(trace.paths, 'paths', errors);
  requiredArray(trace.paths?.forward_path, 'paths.forward_path', errors);
  requiredArray(trace.evidence, 'evidence', errors);
  requiredObject(trace.authorization, 'authorization', errors);
  requiredObject(trace.writeback_meta, 'writeback_meta', errors);
  requiredString(trace.writeback_meta?.source_tool, 'writeback_meta.source_tool', errors);
  requiredString(trace.writeback_meta?.idempotency_key, 'writeback_meta.idempotency_key', errors);

  if (errors.length > 0) {
    throw new S1Error('TRACE_SCHEMA_INVALID', { details: errors });
  }

  const worked = trace.paths.forward_path
    .map((step) => step.summary ?? step.action ?? JSON.stringify(step))
    .join(' ');
  const failed = (trace.paths.failed_path ?? [])
    .map((step) => step.summary ?? step.action ?? JSON.stringify(step))
    .join(' ');

  return {
    ...trace,
    id: trace.id,
    summary: trace.summary ?? trace.task_goal,
    worked: trace.worked ?? worked,
    failed: trace.failed ?? failed,
    tags: trace.tags ?? trace.context?.tech_stack ?? ['engineering-trace'],
  };
}
