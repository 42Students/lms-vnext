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

/** Never log arbitrary request bodies, headers, query strings or identities
 * through an informational log. Only bounded, typed operational fields survive.
 * Existing error logging retains its separately managed alerting contract.
 */
const INFO_FIELD_KEYS = new Set([
 "requestId","method","status","durationMs","attempt","count","limitedTo",
 "actorUserId","collegeId","component","name","circuitBreaker","route",
]);
export function privacySafeInfoLogFields(
 fields: Record<string, unknown>,
):Record<string, string | number | boolean | null> {
 const safe:Record<string, string | number | boolean | null>={};
 for(const [key,value] of Object.entries(fields)){
  if(!INFO_FIELD_KEYS.has(key))continue;
  if(value===null){safe[key]=null;continue;}
  if(typeof value==="number"){
   if(Number.isFinite(value)&&Math.abs(value)<=1_000_000_000)safe[key]=value;
   continue;
  }
  if(typeof value==="boolean"){safe[key]=value;continue;}
  if(typeof value!=="string"||value.length>128)continue;
  if(key==="route"){
   // Only static route templates, not real user path segments or query data.
   if(/^\/[a-zA-Z0-9_./\-\[\]]+$/.test(value)&&!value.includes(".."))
    safe[key]=value;
   continue;
  }
  if(key==="method"){
   if(["GET","POST","PUT","PATCH","DELETE"].includes(value))safe[key]=value;
   continue;
  }
  if(key==="name"||key==="component"||key==="circuitBreaker"){
   if(/^[a-zA-Z0-9_.:\- /]{1,128}$/.test(value))safe[key]=value;
   continue;
  }
  if(/^[a-zA-Z0-9_.:\-]{1,128}$/.test(value))safe[key]=value;
 }
 return safe;
}
/** Match arbitrary legacy printf messages to a stable taxonomy without
 * retaining unsanitized text in the event identifier.
 */
export function stableOperationalEvent(event:string):string {
 return /^[a-z][a-z0-9_.-]{0,119}$/.test(event)
  ? event : "legacy.request_message";
}
/** GR-05: informational lines have a safe request reference and no raw payload. */
export function logInfo(event: string, fields: Record<string, unknown> = {}) {
  writeStructuredLog("INFO", stableOperationalEvent(event),privacySafeInfoLogFields(fields));
}
export function logRequestInfo(
 event:string, rawRequestFields:Record<string, unknown>,
):void {
 logInfo(event,rawRequestFields);
}
