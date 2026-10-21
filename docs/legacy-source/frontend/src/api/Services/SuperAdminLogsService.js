import Api from "../ApiMethod";

export async function queryCloudLogs(payload = {}, signal) {
  const response = await Api.post("/api/v1/superadmin/logs/query", payload, { signal });
  return response.data;
}

export async function getCloudLogDetail(payload = {}, signal) {
  const response = await Api.post("/api/v1/superadmin/logs/detail", payload, { signal });
  return response.data;
}

export async function getLogAlertStatus(signal) {
  const response = await Api.get("/api/v1/superadmin/logs/status", { signal });
  return response.data;
}

export async function markLogsViewed() {
  await Api.post("/api/v1/superadmin/logs/mark-viewed");
}

export async function muteLogSignature(payload) {
  await Api.post("/api/v1/superadmin/logs/mute", payload);
}

export async function sendTestAlert() {
  const response = await Api.post("/api/v1/superadmin/logs/test-alert");
  return response.data;
}

export async function getKnownErrors(environment = "PRODUCTION", signal) {
  const response = await Api.get("/api/v1/superadmin/logs/known-errors", { params: { environment }, signal });
  return response.data;
}

const FILENAME_FROM_CONTENT_DISPOSITION = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i;

/**
 * Downloads every log entry matching the given filters across an explicit [since, until) range as
 * a single NDJSON file -- unlike queryCloudLogs, which only ever looks back a fixed preset duration
 * from "now" for the live view. Returns the raw blob plus the server-suggested filename (built from
 * the actual resolved range/environment) so the caller doesn't have to duplicate that formatting.
 */
export async function exportLogs({ environment, level, search, since, until, excludeTooling }, signal) {
  try {
    const response = await Api.post(
      "/api/v1/superadmin/logs/export",
      { environment, level, search, since, until, ...(excludeTooling ? { excludeTooling: true } : {}) },
      { signal, responseType: "blob" }
    );
    const disposition = response.headers?.["content-disposition"] || "";
    const match = disposition.match(FILENAME_FROM_CONTENT_DISPOSITION);
    const filename = match ? decodeURIComponent(match[1]) : "lms-logs.ndjson";
    return { blob: response.data, filename };
  } catch (error) {
    // With responseType "blob", a JSON error body from the backend (e.g. "Range is too wide")
    // arrives as a Blob too, not parsed JSON -- read it back out so callers get a real message
    // instead of a useless [object Blob].
    const blob = error?.response?.data;
    if (blob instanceof Blob && blob.type.includes("json")) {
      try {
        const text = await blob.text();
        const parsed = JSON.parse(text);
        const failure = new Error(parsed?.message || parsed?.error || "Logs could not be exported.");
        failure.status = error?.response?.status;
        throw failure;
      } catch (parseError) {
        if (parseError instanceof SyntaxError) {
          const failure = new Error("Logs could not be exported.");
          failure.status = error?.response?.status;
          throw failure;
        }
        throw parseError;
      }
    }
    throw error;
  }
}

export async function setKnownErrorStatus(id, payload) {
  const response = await Api.post(`/api/v1/superadmin/logs/known-errors/${id}/status`, payload);
  return response.data;
}

export async function muteKnownError(id, muted, reason) {
  await Api.post(`/api/v1/superadmin/logs/known-errors/${id}/mute`, { muted, reason: reason || null });
}

/** Names, class and college for the ids that appear on log lines. */
export async function getLogContext(payload, signal) {
  const response = await Api.post("/api/v1/superadmin/logs/context", payload, { signal });
  return response.data;
}

export async function getDeploys({ environment = "PRODUCTION", days = 7 } = {}, signal) {
  const response = await Api.get("/api/v1/superadmin/logs/deploys", { params: { environment, days }, signal });
  return response.data;
}

export async function getDeployHealth({ environment = "PRODUCTION", at }, signal) {
  const response = await Api.post("/api/v1/superadmin/logs/deploys/health", { environment, at }, { signal });
  return response.data;
}

export async function getLogDigest(hours = 24, signal) {
  const response = await Api.get("/api/v1/superadmin/logs/digest", { params: { hours }, signal });
  return response.data;
}

export async function sendLogDigest() {
  const response = await Api.post("/api/v1/superadmin/logs/digest/send");
  return response.data;
}

export async function linkKnownErrorIssue(id, issuePublicId) {
  const response = await Api.post(`/api/v1/superadmin/logs/known-errors/${id}/issue`, { issuePublicId });
  return response.data;
}
