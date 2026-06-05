export function redactTrace(trace) {
  if (Array.isArray(trace)) {
    return trace.map((item) => redactTrace(item));
  }
  if (trace && typeof trace === 'object') {
    return Object.fromEntries(Object.entries(trace).map(([key, value]) => [key, redactTrace(value)]));
  }
  if (typeof trace === 'string') {
    return trace
      .replace(/(api[_-]?key|token|secret)=\S+/gi, '$1=[REDACTED]')
      .replace(/(password):\S+/gi, '$1:[REDACTED]');
  }
  return trace;
}
