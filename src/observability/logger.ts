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
    ...fields,
    severity,
    event,
    timestamp: now.toISOString(),
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
  writeStructuredLog("ERROR", event, {
    ...fields,
    error: serializeError(error),
  });
}
