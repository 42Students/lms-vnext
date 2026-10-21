import React from "react";
import Axios from "axios";
import { message, notification } from "antd";
import { API_URL } from "@/config/appConfig";
import {
  getAccessToken,
  refreshAccessToken,
  handleSessionExpired,
  SESSION_EXPIRED_MESSAGE,
  SESSION_EXPIRED_REDIRECT_GUARD_KEY,
} from "@/utils/authUtils";
import { reportApiFailure, reportAuthFailureMidAction } from "@/utils/clientErrorReporting";
import { isApiAllowedForRecruiter, isRecruiterType } from "@/config/roles";
import { API_ERROR_KIND, getApiErrorKind, getApiErrorPresentation, isConnectivityError } from "@/utils/apiError";

/** True when the current access token belongs to a recruiter (industry) session. */
function isRecruiterSession() {
  try {
    const token = getAccessToken();
    if (!token || typeof token !== "string") return false;
    const part = token.split(".")[1];
    if (!part) return false;
    const json = typeof atob === "function" ? atob(part.replace(/-/g, "+").replace(/_/g, "/")) : null;
    const claims = json ? JSON.parse(json) : null;
    return isRecruiterType(claims?.userType);
  } catch (_) {
    return false;
  }
}

const Api = Axios.create({
  baseURL: `${API_URL}`,
  withCredentials: true,
  timeout: 30000,
  paramsSerializer: {
    serialize: (params = {}) => {
      const searchParams = new URLSearchParams();
      Object.entries(params || {}).forEach(([key, value]) => {
        if (value == null) return;
        if (Array.isArray(value)) {
          value.forEach((item) => {
            if (item == null) return;
            searchParams.append(key, String(item));
          });
          return;
        }
        searchParams.set(key, String(value));
      });
      return searchParams.toString();
    },
  },
  headers: {},
});

Api.interceptors.request.use(
  (config) => {
    const method = (config?.method || "get").toLowerCase();
    if (method === "post" && /^\/?api\/v1\/lesson\/contents\/create(?:\?.*)?$/.test(config?.url || "")) {
      config.url = "/api/v1/faculty/lesson-contents/create";
    }
    if (method === "get" || method === "head") {
      if (config?.headers) {
        delete config.headers["Content-Type"];
        delete config.headers["content-type"];
      }
    } else {
      config.headers = config.headers || {};
      if (!config.headers["Content-Type"] && !config.headers["content-type"]) {
        config.headers["Content-Type"] = "application/json";
      }
    }
    if (!config?.skipAuth) {
      const token = getAccessToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    // recruiter sessions may only call the recruiter API and session endpoints (backend RecruiterFenceFilter). Shared
    // page chrome written for other roles is cancelled quietly here instead of producing 403 toasts.
    if (isRecruiterSession() && !isApiAllowedForRecruiter(config?.url || "")) {
      return Promise.reject(new Axios.CanceledError(`HR_FENCED ${method.toUpperCase()} ${config?.url || ""}`));
    }
    return config;
  },
  (error) => Promise.reject(error)
);

Api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const apiErr = error.response?.data;
    const errCode = apiErr?.error || apiErr?.code || apiErr?.message;
    const url = originalRequest?.url || '';

    // Abort/cancellation is a caller-owned state transition, never an auth or server failure.
    if (Axios.isCancel(error) || error?.code === "ERR_CANCELED" || error?.name === "AbortError") {
      return Promise.reject(error);
    }
    const shouldTreat403AsExpired = status === 403 &&
      (errCode === "Unauthorized" || errCode === "UNAUTHORIZED" || errCode === "SESSION_EXPIRED");

    const redirectOnce = () => {
      message.warning(SESSION_EXPIRED_MESSAGE, 3);
      const currentPath = typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}${window.location.hash}`
        : "";
      const redirectPath = handleSessionExpired(currentPath);
      if (typeof window === "undefined") return;
      try {
        const already = sessionStorage.getItem(SESSION_EXPIRED_REDIRECT_GUARD_KEY);
        if (already) return;
        sessionStorage.setItem(SESSION_EXPIRED_REDIRECT_GUARD_KEY, String(Date.now()));
      } catch (_) {}
      window.location.href = redirectPath;
    };

    const isPublicAuthEndpoint =
      url.includes('/api/v1/public/mobile-auth/start') ||
      url.includes('/api/v1/public/mobile-auth/send') ||
      url.includes('/api/v1/public/mobile-auth/verify') ||
      url.includes('/api/v1/public/tenant-bootstrap') ||
      url.includes('/api/v1/public/bug-tracker/logs-access/verify') ||
      url.includes('/api/v1/auth/handoff/consume');

    if ((status === 401 || shouldTreat403AsExpired) && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      if (url.includes('/auth/refresh') || url.includes('/auth/logout')) {
        // A genuine mid-action session loss -- the token-refresh mechanism itself failed, not just
        // one API call. This is the "auth failure while the user was doing something" case worth
        // flagging specifically, as opposed to the routine access-token-expired-then-silently-
        // refreshed cycle every user goes through periodically (never reported -- it isn't a bug).
        reportAuthFailureMidAction(typeof window !== "undefined" ? window.location.pathname : undefined);
        redirectOnce();
        return Promise.reject(error);
      }
      if (isPublicAuthEndpoint || url.includes('/users/login') || url.includes('/users/verifyOTP') ||
          url.includes('/learner/login') || url.includes('/learner/verifyOTP') ||
          url.includes('/faculty/login') || url.includes('/faculty/verifyOTP')) {
        // Expected user-input failures (wrong OTP, etc.) on the login/verify flow itself -- not
        // reported, this isn't a bug, it's normal auth UX.
        return Promise.reject(error);
      }
      try {
        const newToken = await refreshAccessToken();
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return Api(originalRequest);
      } catch (refreshError) {
        // refreshAccessToken signals an invalid/expired refresh token with REFRESH_FAILED. That Error has no HTTP status,
        // so the generic classifier would call it a network failure and keep a dead session alive; check it first.
        if (refreshError?.message !== "REFRESH_FAILED" && isConnectivityError(refreshError)) {
          const presentation = getApiErrorPresentation(refreshError);
          notification.warning({
            message: presentation.title,
            description: `${presentation.message} Your session has not been cleared.`,
            duration: 6,
            key: 'lms-network-error',
            btn: (
              <span role="button" tabIndex={0}
                onClick={() => { notification.destroy('lms-network-error'); refreshAccessToken().catch(() => {}); }}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.click()}>Retry</span>
            ),
          });
          return Promise.reject(refreshError);
        }
        reportAuthFailureMidAction(typeof window !== "undefined" ? window.location.pathname : undefined);
        redirectOnce();
        return Promise.reject(refreshError);
      }
    }

    const failureKind = getApiErrorKind(error);
    const failurePresentation = getApiErrorPresentation(error);
    // Attach normalized, user-safe semantics to every rejected API error. Page/form owners can
    // render 404/409/422 inline without parsing backend strings, while the interceptor keeps
    // global notifications limited to transport/permission/server cases to avoid duplicate toasts.
    try {
      error.lmsKind = failureKind;
      error.lmsPresentation = failurePresentation;
    } catch (_) {}

    // Transport failures are not empty states and should not expose Axios/debug text.
    // Offline is handled by the persistent global banner; timeout/network failures use
    // deduplicated notifications while the page keeps ownership of Retry.
    if (failureKind === API_ERROR_KIND.TIMEOUT) {
      notification.warning({
        message: "Request timed out",
        description: "The LMS took too long to respond. Your current screen has been kept; try again.",
        duration: 5,
        key: "lms-request-timeout",
      });
    } else if (failureKind === API_ERROR_KIND.NETWORK) {
      notification.error({
        message: "Connection problem",
        description: "We couldn't reach the LMS. Check your connection and try again.",
        duration: 5,
        key: "lms-network-request-error",
      });
    }

    // An ordinary 403 is an authorization decision, not a transient transport error.
    // Never replay mutations or duplicate requests after access is denied.
    if (status === 403) {
      if (errCode === "RECRUITER_ACCESS_DENIED") {
        // The backend fence refused a recruiter request the client-side fence missed: report, no toast.
        reportApiFailure({ endpoint: url, method: originalRequest?.method, statusCode: status,
          message: "RECRUITER_ACCESS_DENIED" });
        return Promise.reject(error);
      }
      if (typeof errCode === "string" && errCode.includes("FEATURE_DISABLED")) {
        message.warning({ content: "This module is currently disabled for your college.",
          duration: 4, key: "lms-feature-disabled" });
      } else {
        message.error("You don't have permission to perform this action.", 4);
        reportApiFailure({ endpoint: url, method: originalRequest?.method, statusCode: status,
          message: apiErr?.message || "Permission denied" });
      }
      return Promise.reject(error);
    }

    if (status >= 500) {
      notification.error({
        message: "Server Error",
        description: "Something went wrong on our end. Please try again later or contact support if the problem persists.",
        duration: 6,
        key: `lms-server-error-${status}`,
      });
      reportApiFailure({ endpoint: url, method: originalRequest?.method, statusCode: status,
        message: apiErr?.message || "Server error" });
    } else if (status && status !== 401) {
      // Any other 4xx we haven't already handled/excluded above (404, 409, 422, 429, ...).
      reportApiFailure({ endpoint: url, method: originalRequest?.method, statusCode: status,
        message: apiErr?.message || `Request failed with status ${status}` });
    } else if (!status) {
      // No response at all -- network drop, timeout, DNS failure, CORS block.
      reportApiFailure({ endpoint: url, method: originalRequest?.method, statusCode: null,
        message: error?.message || "Network error" });
    }
    return Promise.reject(error);
  }
);

export async function request(options) {
  const onSuccess = function (response) { return response.data; };
  const onError = function (error) { return Promise.reject(error); };
  return Api(options).then(onSuccess).catch(onError);
}

export default Api;
