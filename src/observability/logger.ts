import { reportErrorForAlert } from "@/modules/log-alerts/reporter";
import { createRequestId } from "@/lib/request-id";

export type LogSeverity =
  | "DEBUG"
  | "INFO"
  | "WARNING"
  | "ERROR";

export type StructuredLogRecord = {
  severity: LogSeverity;
  event: string;
  timestamp: string;
  [key: string]: unknown;
};

export function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    name: "UnknownError",
    message: String(error),
  };
}

export function createStructuredLogRecord(
  severity: LogSeverity,
  event: string,
  fields: Record<string, unknown> = {},
  now = new Date(),
): StructuredLogRecord {
  return {
    requestId: typeof fields.requestId === "string" ? fields.requestId : createRequestId(),
    ...fields,
    severity,
    event,
    timestamp: now.toISOString(),
  };
}

export function createErrorLogFields(error: unknown) {
  const serialized = serializeError(error);
  const stackTrace = serialized.stack;

  return {
    error_name: serialized.name,
    message:
      stackTrace ??
      `${serialized.name}: ${serialized.message}`,
    ...(stackTrace ? { stack_trace: stackTrace } : {}),
  };
}

export function writeStructuredLog(
  severity: LogSeverity,
  event: string,
  fields: Record<string, unknown> = {},
) {
  const line =
    JSON.stringify(
      createStructuredLogRecord(
        severity,
        event,
        fields,
      ),
    ) + "\n";

  if (severity === "ERROR" || severity === "WARNING") {
    process.stderr.write(line);
    return;
  }

  process.stdout.write(line);
}

export function logError(
  event: string,
  error: unknown,
  fields: Record<string, unknown> = {},
) {
  const requestId = typeof fields.requestId === "string" ? fields.requestId : createRequestId();
  writeStructuredLog("ERROR", event, { ...fields, requestId, ...createErrorLogFields(error) });
  void reportErrorForAlert({
    event, error, requestId,
    component: typeof fields.component === "string" ? fields.component : undefined,
    path: typeof fields.path === "string" ? fields.path :
      typeof fields.route === "string" ? fields.route : undefined,
    status: typeof fields.status === "number" ? fields.status : undefined,
    userId: typeof fields.userId === "string" ? fields.userId : undefined,
    collegeId: typeof fields.collegeId === "string" ? fields.collegeId : undefined,
  }).catch(() => undefined);
}

/** GR-05: informational lines also have a searchable request reference. */
export function logInfo(event: string, fields: Record<string, unknown> = {}) {
  writeStructuredLog("INFO", event, fields);
}
