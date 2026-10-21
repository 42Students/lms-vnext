import { API_URL } from "@/config/appConfig";
import { getAccessToken, refreshAccessToken } from "@/utils/authUtils";

const TRACKER_BASE = `${API_URL}/api/v1/public/bug-tracker`;
// Mutating actions (status/workflow/retest) live under the authenticated superadmin namespace,
// not /api/v1/public -- that path is entirely exempt from the backend's JWT filter, so nothing
// there can ever identify or restrict who's calling it. See SuperAdminBugTrackerController.
const TRACKER_ADMIN_BASE = `${API_URL}/api/v1/superadmin/bug-tracker`;

async function trackerRequest(path, { method = "GET", body, signal, base = TRACKER_BASE } = {}) {
  let token = null;
  if (base === TRACKER_ADMIN_BASE) {
    token = getAccessToken();
    if (!token) {
      // After a reload the in-memory token is empty, and a header-less request falls back to the
      // lms_authenticated cookie of whoever else is logged in on this domain (403, not 401).
      try { token = await refreshAccessToken(); } catch (_) { token = null; }
    }
  }
  const response = await fetch(`${base}${path}`, {
    method,
    credentials: "include",
    signal,
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  let data = null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    data = await response.json().catch(() => null);
  } else if (response.status !== 204) {
    data = await response.text().catch(() => null);
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      (typeof data === "string" && data) ||
      "Something went wrong. Please try again.";
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

export function createBugReport(payload) {
  return trackerRequest("/issues", { method: "POST", body: payload });
}

export function listBugReports(params = {}, signal) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.set(key, String(value));
  });
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return trackerRequest(`/issues${suffix}`, { signal });
}

export function getBugReport(publicId, signal) {
  return trackerRequest(`/issues/${encodeURIComponent(publicId)}`, { signal });
}

export function updateBugStatus(publicId, status) {
  return trackerRequest(`/issues/${encodeURIComponent(publicId)}/status`, {
    method: "PATCH",
    body: { status },
    base: TRACKER_ADMIN_BASE,
  });
}

export function listBugAttachments(publicId, signal) {
  return trackerRequest(
    `/issues/${encodeURIComponent(publicId)}/attachments`,
    { signal }
  );
}

export function presignBugAttachment(publicId, file) {
  return trackerRequest(
    `/issues/${encodeURIComponent(publicId)}/attachments/presign`,
    {
      method: "POST",
      body: {
        fileName: file.name || "screenshot.png",
        contentType: file.type,
        contentLength: file.size,
      },
    }
  );
}

export function confirmBugAttachment(publicId, storageKey, originalFilename) {
  return trackerRequest(
    `/issues/${encodeURIComponent(publicId)}/attachments/confirm`,
    {
      method: "POST",
      body: {
        storageKey,
        originalFilename: originalFilename || "screenshot.png",
      },
    }
  );
}

export async function uploadBugAttachment(publicId, file) {
  const presign = await presignBugAttachment(publicId, file);
  if (!presign?.uploadUrl || !presign?.storageKey) {
    throw new Error("Screenshot upload could not be prepared.");
  }

  const uploaded = await fetch(presign.uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });
  if (!uploaded.ok) {
    throw new Error(`Screenshot upload failed (HTTP ${uploaded.status}).`);
  }

  try {
    return await confirmBugAttachment(publicId, presign.storageKey, file.name);
  } catch (error) {
    // The R2 upload already succeeded. Keep the exact key so Retry can confirm
    // the same object instead of uploading another orphan copy.
    error.storageKey = presign.storageKey;
    throw error;
  }
}

export function updateBugWorkflow(publicId, payload) {
  return trackerRequest(`/issues/${encodeURIComponent(publicId)}/workflow`, {
    method: "PATCH",
    body: payload,
    base: TRACKER_ADMIN_BASE,
  });
}

export function retestBugReport(publicId, result, note) {
  return trackerRequest(`/issues/${encodeURIComponent(publicId)}/retest`, {
    method: "POST",
    body: {
      result,
      note: note?.trim() || null,
    },
    base: TRACKER_ADMIN_BASE,
  });
}

export function listBugActivity(publicId, signal) {
  return trackerRequest(
    `/issues/${encodeURIComponent(publicId)}/activity`,
    { signal }
  );
}
