/**
 * GR-114 / GR-118: bounded Cloud Logging backup for errors that may bypass
 * our in-process logger (startup failures, unexpected runtime failures).
 * Uses Workload Identity / metadata ADC; never logs provider responses,
 * access tokens, log text, or service-account metadata.
 */
import { redactAlertText, safeAlertPath, safeAlertLabel } from "./redaction";

export type CloudErrorRecord = {
  id: string;
  timestamp: Date;
  event: string;
  message: string;
  path: string;
  requestId?: string;
  component?: string;
};

type JsonObject = Record<string, unknown>;
type Transport = typeof fetch;

export function isCloudLogProject(project: unknown): project is string {
  return typeof project === "string" && /^[a-z][a-z0-9-]{4,61}[a-z0-9]$/.test(project);
}

export function isCloudLogNamespace(namespace: unknown): namespace is string {
  return typeof namespace === "string" && /^[a-z0-9][a-z0-9-]{0,62}$/.test(namespace);
}

export function buildCloudErrorFilter(start: Date, end: Date, namespace: string): string {
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) ||
      !isCloudLogNamespace(namespace) || end < start) throw new Error("INVALID_LOG_WINDOW");
  return [
    'resource.type="k8s_container"',
    'resource.labels.container_name="web"',
    'resource.labels.namespace_name="' + namespace + '"',
    "severity>=ERROR",
    'timestamp>"' + start.toISOString() + '"',
    'timestamp<="' + end.toISOString() + '"',
  ].join(" AND ");
}

function asObject(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as JsonObject : {};
}

function optionalText(value: unknown): string | undefined {
  return typeof value === "string" && value.length ? value : undefined;
}

/** Drop raw stack frames, unsafe IDs and any untrusted JSON payload fields. */
export function parseCloudErrorEntry(value: unknown): CloudErrorRecord | null {
  const entry = asObject(value);
  const insertId = optionalText(entry.insertId);
  const logName = optionalText(entry.logName);
  const time = typeof entry.timestamp === "string" ? new Date(entry.timestamp) : null;
  if (!insertId || !logName || !time || !Number.isFinite(time.getTime())) return null;
  const json = asObject(entry.jsonPayload);
  const message = optionalText(json.message) ?? optionalText(entry.textPayload) ??
    optionalText(json.exception) ?? "An application error was recorded";
  const requestId = optionalText(json.requestId);
  const id = logName + ":" + insertId;
  if (id.length > 1024) return null;
  return {
    id,
    timestamp: time,
    event: safeAlertLabel(json.event ?? "cloud.error", 80),
    // Structured application logs begin with "Error: ..." while the reporter
    // receives error.message; strip the standard name prefix for parity.
    message: redactAlertText(message.replace(/^(?:[A-Za-z]*Error|Exception):\s*/i, "")),
    path: safeAlertPath(json.path ?? json.route ?? "/"),
    requestId: requestId && /^(?:[0-9a-f]{8}|[0-9a-f-]{36})$/i.test(requestId)
      ? requestId : undefined,
    component: safeAlertLabel(json.component ?? "server", 80),
  };
}

export async function readCloudProviderJsonLimited(response: Response): Promise<unknown> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("LOG_PROVIDER_INVALID_RESPONSE");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 1_000_000) {
        await reader.cancel().catch(() => undefined);
        throw new Error("LOG_PROVIDER_RESPONSE_TOO_LARGE");
      }
      chunks.push(value);
    }
  } catch {
    throw new Error("LOG_PROVIDER_RESPONSE_TOO_LARGE");
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try { return JSON.parse(new TextDecoder().decode(bytes)) as unknown; }
  catch { throw new Error("LOG_PROVIDER_INVALID_RESPONSE"); }
}

async function boundedFetch(
  url: string,
  init: RequestInit,
  transport: Transport,
  timeoutMs = 5_000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try { return await transport(url, { ...init, signal: controller.signal }); }
  catch { throw new Error("LOG_PROVIDER_UNAVAILABLE"); }
  finally { clearTimeout(timer); }
}

export async function cloudLoggingAccessToken(transport: Transport = fetch): Promise<string> {
  const response = await boundedFetch(
    "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
    { headers: { "Metadata-Flavor": "Google" } }, transport, 2_500,
  );
  if (!response.ok) throw new Error("LOG_PROVIDER_AUTH_UNAVAILABLE");
  const result = asObject(await readCloudProviderJsonLimited(response));
  if (typeof result.access_token !== "string" || !result.access_token ||
      result.access_token.length > 4096) throw new Error("LOG_PROVIDER_AUTH_UNAVAILABLE");
  return result.access_token;
}

export async function readCloudLogErrorPage(input: {
  project: string;
  namespace: string;
  start: Date;
  end: Date;
  token: string;
  pageToken?: string;
  transport?: Transport;
}): Promise<{ errors: CloudErrorRecord[]; nextPageToken?: string }> {
  if (!isCloudLogProject(input.project) || !isCloudLogNamespace(input.namespace) ||
      !input.token || input.token.length > 4096) throw new Error("INVALID_LOG_CONFIGURATION");
  const body = {
    resourceNames: ["projects/" + input.project],
    filter: buildCloudErrorFilter(input.start, input.end, input.namespace),
    orderBy: "timestamp asc",
    pageSize: 100,
    ...(input.pageToken ? { pageToken: input.pageToken } : {}),
  };
  const response = await boundedFetch(
    "https://logging.googleapis.com/v2/entries:list",
    { method: "POST", headers: {
      "content-type": "application/json",
      Authorization: "Bearer " + input.token,
    }, body: JSON.stringify(body) },
    input.transport ?? fetch,
  );
  if (!response.ok) throw new Error("LOG_PROVIDER_UNAVAILABLE");
  const raw = asObject(await readCloudProviderJsonLimited(response));
  const entries = Array.isArray(raw.entries) ? raw.entries.slice(0, 100) : [];
  const errors = entries.map(parseCloudErrorEntry).filter((item): item is CloudErrorRecord => item !== null);
  const nextPageToken = optionalText(raw.nextPageToken);
  if (nextPageToken && nextPageToken.length > 1024) throw new Error("LOG_PROVIDER_INVALID_RESPONSE");
  return { errors, ...(nextPageToken ? { nextPageToken } : {}) };
}
