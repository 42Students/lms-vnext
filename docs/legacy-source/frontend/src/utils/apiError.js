const pickFirstString = (...vals) => {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
};

export const API_ERROR_KIND = Object.freeze({
  CANCELED: "canceled",
  TIMEOUT: "timeout",
  OFFLINE: "offline",
  NETWORK: "network",
  AUTH: "auth",
  PERMISSION: "permission",
  NOT_FOUND: "not_found",
  CONFLICT: "conflict",
  VALIDATION: "validation",
  RATE_LIMIT: "rate_limit",
  SERVER: "server",
  UNKNOWN: "unknown",
});

export const getApiErrorStatus = (err) => err?.response?.status ?? null;

export const getApiErrorCode = (err) => {
  const data = err?.response?.data;
  if (!data) return null;
  if (typeof data === "string") return null;
  return pickFirstString(data?.error, data?.code, data?.status);
};

export const getApiErrorMessage = (err, fallback = "Something went wrong") => {
  const data = err?.response?.data;
  if (typeof data === "string" && data.trim()) return data.trim();

  if (data && typeof data === "object") {
    const msg = pickFirstString(
      data?.message,
      data?.error_description,
      data?.errorMessage,
      data?.error
    );
    if (msg) return msg;
  }

  const msg = pickFirstString(err?.message);
  return msg || fallback;
};

export const isAuthError = (err) => {
  const status = getApiErrorStatus(err);
  if (status === 401) return true;
  const code = (getApiErrorCode(err) || "").toUpperCase();
  return status === 403 && (code === "UNAUTHORIZED" || code === "SESSION_EXPIRED");
};

export const getApiErrorKind = (err) => {
  if (!err) return API_ERROR_KIND.UNKNOWN;
  if (err?.name === "CanceledError" || err?.name === "AbortError" || err?.code === "ERR_CANCELED") {
    return API_ERROR_KIND.CANCELED;
  }

  const status = getApiErrorStatus(err);
  const message = String(err?.message || "");
  if (
    err?.code === "ECONNABORTED" ||
    err?.code === "ETIMEDOUT" ||
    /timeout|timed out/i.test(message)
  ) {
    return API_ERROR_KIND.TIMEOUT;
  }

  if (isAuthError(err)) return API_ERROR_KIND.AUTH;
  if (status === 403) return API_ERROR_KIND.PERMISSION;
  if (status === 404) return API_ERROR_KIND.NOT_FOUND;
  if (status === 409) return API_ERROR_KIND.CONFLICT;
  if (status === 422 || status === 400) return API_ERROR_KIND.VALIDATION;
  if (status === 429) return API_ERROR_KIND.RATE_LIMIT;
  if (status >= 500) return API_ERROR_KIND.SERVER;

  if (status == null) {
    const browserOffline =
      typeof navigator !== "undefined" && navigator?.onLine === false;
    return browserOffline ? API_ERROR_KIND.OFFLINE : API_ERROR_KIND.NETWORK;
  }

  return API_ERROR_KIND.UNKNOWN;
};

export const getApiErrorPresentation = (err, fallback = "We couldn't complete that request.") => {
  const kind = getApiErrorKind(err);
  switch (kind) {
    case API_ERROR_KIND.CANCELED:
      return { kind, title: "Request cancelled", message: "The request was cancelled.", retryable: false };
    case API_ERROR_KIND.TIMEOUT:
      return { kind, title: "Request timed out", message: "The LMS took too long to respond. Try again.", retryable: true };
    case API_ERROR_KIND.OFFLINE:
      return { kind, title: "You're offline", message: "Reconnect to the internet, then try again. Your current screen has not been cleared.", retryable: true };
    case API_ERROR_KIND.NETWORK:
      return { kind, title: "Connection problem", message: "We couldn't reach the LMS. Check your connection and try again.", retryable: true };
    case API_ERROR_KIND.AUTH:
      return { kind, title: "Session expired", message: "Please sign in again to continue.", retryable: false };
    case API_ERROR_KIND.PERMISSION:
      return { kind, title: "Access not allowed", message: "You don't have permission to perform this action.", retryable: false };
    case API_ERROR_KIND.NOT_FOUND:
      return { kind, title: "No longer available", message: "This item could not be found. It may have been removed or moved.", retryable: false };
    case API_ERROR_KIND.CONFLICT:
      return { kind, title: "This changed elsewhere", message: "Refresh the latest data before trying again.", retryable: true };
    case API_ERROR_KIND.VALIDATION:
      return { kind, title: "Some information needs attention", message: "Review the highlighted or entered information and try again.", retryable: false };
    case API_ERROR_KIND.RATE_LIMIT:
      return { kind, title: "Too many requests", message: "Please wait a moment before trying again.", retryable: true };
    case API_ERROR_KIND.SERVER:
      return { kind, title: "LMS service problem", message: "The server couldn't complete the request. Try again shortly.", retryable: true };
    default:
      return { kind, title: "Something went wrong", message: fallback, retryable: true };
  }
};


export const isConnectivityError = (err) => {
  const kind = getApiErrorKind(err);
  return (
    kind === API_ERROR_KIND.TIMEOUT ||
    kind === API_ERROR_KIND.OFFLINE ||
    kind === API_ERROR_KIND.NETWORK
  );
};
