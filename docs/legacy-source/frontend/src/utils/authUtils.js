/**
 * JWT Authentication Utilities
 *
 * Handles token storage, refresh logic, session expiry UX, and cross-tab synchronization.
 */

import { API_URL } from '../config/appConfig';
import { isSameSiteRelativePath } from "@/utils/navigationContext";

// ===========================
// Token Storage
// ===========================

// Access token is stored in memory only (more secure against XSS)
let accessToken = null;

// Storage keys
const REFRESH_TOKEN_KEY = 'lms_refresh_token';
const USER_DATA_KEY = 'userData';
const IS_LOGGED_IN_KEY = 'isUserLoggedIn';
const ORG_SWITCH_BROADCAST_KEY = 'lms_org_switch_ts';
const REFRESH_LOCK_KEY = 'lms_refresh_lock';

/** Key for logout reason (session_expired vs user logout) - read once on login page then cleared */
export const SESSION_EXPIRED_KEY = 'lms_logout_reason';

/** Per-tab guard to avoid infinite redirect loops on session expiry */
export const SESSION_EXPIRED_REDIRECT_GUARD_KEY = 'lms_session_expired_redirected';

/** Short-lived in-tab return path kept only when authentication expires unexpectedly. */
export const SESSION_RETURN_PATH_KEY = 'lms_session_return_path';
const SESSION_RETURN_PATH_TTL_MS = 30 * 60 * 1000;

// Silent auto-refresh timer: refreshes the access token before it expires
let silentRefreshTimer = null;

/**
 * Get the current access token
 */
export const getAccessToken = () => accessToken;

/**
 * Decode JWT payload without verification (client-side only for expiry display).
 * Returns {} if invalid or not in browser.
 */
export function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string') return {};
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return {};
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(payload), c => c.charCodeAt(0))));
    return decoded || {};
  } catch {
    return {};
  }
}

/**
 * Set the access token (in memory) and schedule silent auto-refresh
 * 2 minutes before expiry. The refresh happens in the background
 * without any user-visible popup or interruption.
 */
export const setAccessToken = (token) => {
  accessToken = token;
  if (typeof window === 'undefined') return;
  if (silentRefreshTimer) {
    clearTimeout(silentRefreshTimer);
    silentRefreshTimer = null;
  }
  if (!token) return;
  const payload = decodeJwtPayload(token);
  const exp = payload.exp;
  if (typeof exp !== 'number') return;
  const refreshAt = (exp - 2 * 60) * 1000; // 2 minutes before expiry
  const now = Date.now();
  if (refreshAt <= now) return;
  silentRefreshTimer = setTimeout(async () => {
    silentRefreshTimer = null;
    try {
      await refreshAccessToken();
    } catch (err) {
      console.debug('Silent token refresh failed:', err.message);
    }
  }, refreshAt - now);
};

/**
 * Get the refresh token from localStorage
 */
export const getRefreshToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

/**
 * Set the refresh token in localStorage
 */
export const setRefreshToken = (token) => {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
};

/**
 * Clear all tokens and auth-related state (localStorage + sessionStorage).
 * Call on logout so no stale role/college or tokens persist (zero-trust).
 */
export const clearAllTokens = ({ preserveSessionExpiryContext = false } = {}) => {
  accessToken = null;
  if (typeof window === 'undefined') return;
  if (silentRefreshTimer) {
    clearTimeout(silentRefreshTimer);
    silentRefreshTimer = null;
  }
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_DATA_KEY);
  localStorage.removeItem(IS_LOGGED_IN_KEY);
  // Tenant hygiene on shared/kiosk devices: don't leak the previous admin's recently-viewed
  // faculty/learner search suggestions (which may belong to a different college) to whoever
  // logs in next on this device.
  localStorage.removeItem('recentFaculty');
  localStorage.removeItem('recentLearners');
  localStorage.removeItem('recentCourses'); // BE-0173: course names and departments of the last account
  // TPO browser memory (recents, saved report filters, share recipients) belongs to the person who signed out, never the next
  // one on this device (BE-0107). The keys are per person and college now; this also clears the old shared ones.
  if (!preserveSessionExpiryContext) {
    try {
      const tpoKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('tpo.')) tpoKeys.push(k);
      }
      tpoKeys.forEach((k) => localStorage.removeItem(k));
    } catch (_) { /* storage blocked: nothing to clear */ }
  }

  // Explicit logout clears all tab-scoped auth/navigation context. Only the
  // session-expiry path keeps its reason/redirect guard/short-lived return path long
  // enough for the login surface to recover the interrupted workflow.
  try {
    const keep = preserveSessionExpiryContext
      ? new Set([
          SESSION_EXPIRED_KEY,
          SESSION_EXPIRED_REDIRECT_GUARD_KEY,
          SESSION_RETURN_PATH_KEY,
        ])
      : new Set();
    const keysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && !keep.has(k)) keysToRemove.push(k);
    }
    keysToRemove.forEach((k) => sessionStorage.removeItem(k));
  } catch (_) {
    // sessionStorage not available (e.g. private mode)
  }
  // Clear auth cookie used by Next.js middleware
  document.cookie = "lms_authenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  try {
    const host = window.location.hostname || "";
    const rootDomain = host.endsWith(".42lms.com") || host === "42lms.com" ? ".42lms.com" : "";
    if (rootDomain) {
      document.cookie = `lms_authenticated=; path=/; domain=${rootDomain}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
  } catch (_) {}
};

// ===========================
// Session Expiry UX (centralised)
// ===========================

/** User-facing message when session has expired */
export const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please log in again.';

/**
 * Get the redirect path after session expiry based on current path.
 * Superadmin -> /superadmin-login; main app -> / (main login).
 */
export const getSessionExpiryRedirectPath = (currentPath) => {
  if (!currentPath || typeof currentPath !== 'string') return '/';
  return currentPath.startsWith('/superadmin') ? '/superadmin-login' : '/';
};

/**
 * Set logout reason to session_expired (so login page can show a one-time message).
 * Call before clearAllTokens when logout is due to refresh failure / session expiry.
 */
export const setSessionExpiredReason = () => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(SESSION_EXPIRED_KEY, 'session_expired');
  } catch (_) {
    // sessionStorage not available (e.g. private mode)
  }
};

/**
 * Get and clear logout reason (for login page to show "You were logged out because your session expired").
 * @returns {'session_expired'|'user'|null}
 */
export const getAndClearLogoutReason = () => {
  if (typeof window === 'undefined') return null;
  try {
    const reason = sessionStorage.getItem(SESSION_EXPIRED_KEY);
    sessionStorage.removeItem(SESSION_EXPIRED_KEY);
    return reason || null;
  } catch {
    return null;
  }
};

const normalizeSessionReturnPath = (currentPath) => {
  if (typeof currentPath !== 'string') return null;
  const path = currentPath.trim();
  if (
    !path ||
    !isSameSiteRelativePath(path) ||
    /^\/(?:login|superadmin-login)(?:[/?#]|$)/i.test(path)
  ) {
    return null;
  }
  return path;
};

export const setSessionReturnPath = (currentPath) => {
  if (typeof window === 'undefined') return;
  const path = normalizeSessionReturnPath(currentPath);
  if (!path) return;
  try {
    sessionStorage.setItem(
      SESSION_RETURN_PATH_KEY,
      JSON.stringify({ path, at: Date.now() })
    );
  } catch (_) {
    // sessionStorage may be unavailable; expiry handling must still proceed.
  }
};

export const getAndClearSessionReturnPath = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_RETURN_PATH_KEY);
    sessionStorage.removeItem(SESSION_RETURN_PATH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const path = normalizeSessionReturnPath(parsed?.path);
    const at = Number(parsed?.at);
    const age = Date.now() - at;
    if (!path || !Number.isFinite(at) || age < 0 || age > SESSION_RETURN_PATH_TTL_MS) {
      return null;
    }
    return path;
  } catch (_) {
    try { sessionStorage.removeItem(SESSION_RETURN_PATH_KEY); } catch (_) {}
    return null;
  }
};

/**
 * Centralised "session expired" handling: set reason, clear tokens, return redirect path.
 * Caller is responsible for: (1) showing the user message, (2) redirect (window.location or router.push), (3) Redux clearUser if in app.
 */
export const handleSessionExpired = (currentPath) => {
  setSessionExpiredReason();
  setSessionReturnPath(currentPath);
  clearAllTokens({ preserveSessionExpiryContext: true });
  return getSessionExpiryRedirectPath(currentPath);
};

/**
 * Check if user has a refresh token (potentially logged in)
 */
export const hasRefreshToken = () => {
  return !!getRefreshToken();
};

// ===========================
// Token Refresh Logic
// ===========================

// Tracks in-flight refresh request to prevent duplicate calls
let refreshPromise = null;

const DEFAULT_REFRESH_TIMEOUT_MS = 15000;
const REFRESH_LOCK_TTL_MS = 20000;
const REFRESH_LOCK_POLL_MS = 150;

const getTabId = () => {
  if (typeof window === 'undefined') return 'server';
  try {
    let tabId = sessionStorage.getItem('lms_tab_id');
    if (!tabId) {
      tabId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem('lms_tab_id', tabId);
    }
    return tabId;
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function acquireRefreshLock() {
  if (typeof window === 'undefined') return null;
  const owner = getTabId();
  const startedAt = Date.now();

  while (Date.now() - startedAt < REFRESH_LOCK_TTL_MS) {
    try {
      const rawLock = localStorage.getItem(REFRESH_LOCK_KEY);
      const lock = rawLock ? JSON.parse(rawLock) : null;
      const lockExpired = !lock?.expiresAt || lock.expiresAt <= Date.now();

      if (!lock || lockExpired || lock.owner === owner) {
        const nextLock = { owner, expiresAt: Date.now() + REFRESH_LOCK_TTL_MS };
        localStorage.setItem(REFRESH_LOCK_KEY, JSON.stringify(nextLock));
        const savedLock = JSON.parse(localStorage.getItem(REFRESH_LOCK_KEY) || '{}');
        if (savedLock.owner === owner) return owner;
      }
    } catch {
      return null;
    }

    await sleep(REFRESH_LOCK_POLL_MS);
  }

  return null;
}

function releaseRefreshLock(owner) {
  if (typeof window === 'undefined' || !owner) return;
  try {
    const rawLock = localStorage.getItem(REFRESH_LOCK_KEY);
    const lock = rawLock ? JSON.parse(rawLock) : null;
    if (lock?.owner === owner) localStorage.removeItem(REFRESH_LOCK_KEY);
  } catch {
    // ignore lock cleanup failures
  }
}

/**
 * Refresh the access token using the refresh token.
 * Implements refresh-in-flight pattern to handle concurrent 401s.
 * 
 * @returns {Promise<string>} The new access token
 * @throws {Error} If refresh fails ('REFRESH_FAILED' or 'NETWORK_ERROR')
 */
export const refreshAccessToken = async () => {
  // If refresh is already in progress, wait for it
  if (refreshPromise) {
    return refreshPromise;
  }
  
  // Create the refresh promise
  refreshPromise = (async () => {
    const lockOwner = await acquireRefreshLock();
    try {
      const refreshToken = getRefreshToken();
      const isCookieMode = !refreshToken;
      const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
      const timeoutId = setTimeout(() => controller?.abort(), DEFAULT_REFRESH_TIMEOUT_MS);

      let response;
      try {
        response = await fetch(
          isCookieMode ? `${API_URL}/api/v1/auth/refresh-cookie` : `${API_URL}/api/v1/auth/refresh`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: isCookieMode ? undefined : JSON.stringify({ refreshToken }),
            ...(controller ? { signal: controller.signal } : {}),
          }
        );
      } catch (e) {
        // A bounded timeout is not the same thing as an invalid/expired refresh token.
        // Keep that distinction so shells can preserve a valid cached session through a
        // temporary outage instead of logging the user out.
        if (e?.name === "AbortError") {
          throw new Error("REFRESH_TIMEOUT");
        }
        throw new Error("NETWORK_ERROR");
      } finally {
        clearTimeout(timeoutId);
      }
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token is invalid/expired - need to re-login
          throw new Error('REFRESH_FAILED');
        }
        // Server error or network issue
        throw new Error('NETWORK_ERROR');
      }
      
      const data = await response.json();
      
      // Handle wrapped response (Response DTO) or direct response
      const authData = data.data || data;
      
      // Store new tokens (refresh token may be rotated and returned)
      setAccessToken(authData.accessToken);
      if (authData.refreshToken) setRefreshToken(authData.refreshToken);
      // Do not set `lms_authenticated` from JS.
      // Backend sets HttpOnly cookies (with correct Domain/SameSite/Secure) via `/auth/refresh-cookie` and login flows.
      // Setting a non-HttpOnly cookie with the same name can cause confusing cross-subdomain behavior.
      
      // Update user data in localStorage if returned
      if (authData.user) {
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(authData.user));
      }
      
      return authData.accessToken;
      
    } finally {
      releaseRefreshLock(lockOwner);
      // Clear the promise so next refresh can proceed
      refreshPromise = null;
    }
  })();
  
  return refreshPromise;
};

// ===========================
// Backend Logout
// ===========================

/**
 * Call backend logout to invalidate refresh token.
 * This is best-effort - we log out locally even if backend call fails.
 */
export const logoutFromBackend = async () => {
  const refreshToken = getRefreshToken();
  const headers = { 'Content-Type': 'application/json' };
  const token = getAccessToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const postLogout = async (url, body) => {
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timeoutId = setTimeout(() => controller?.abort(), 8000);
    try {
      await fetch(url, {
        method: 'POST',
        headers,
        credentials: 'include',
        body,
        ...(controller ? { signal: controller.signal } : {}),
      });
    } finally {
      clearTimeout(timeoutId);
    }
  };

  try {
    if (refreshToken) {
      await postLogout(`${API_URL}/api/v1/auth/logout`, JSON.stringify({ refreshToken }));
    }
  } catch (e) {
    console.debug('Token logout backend call failed (ignored):', e);
  }

  try {
    await postLogout(
      `${API_URL}/api/v1/auth/logout-cookie`,
      refreshToken ? JSON.stringify({ refreshToken }) : undefined
    );
  } catch (e) {
    console.debug('Cookie logout backend call failed (ignored):', e);
  }
};

// ===========================
// Cross-Tab Synchronization
// ===========================

/**
 * Initialize cross-tab logout listener.
 * When refresh token is removed in another tab, this tab should also logout.
 */
export const initCrossTabLogoutListener = (onLogout) => {
  if (typeof window === 'undefined') return;
  
  const handleStorageChange = (e) => {
    // If refresh token was removed in another tab
    if (e.key === REFRESH_TOKEN_KEY && e.newValue === null) {
      accessToken = null;
      if (onLogout) {
        onLogout();
      }
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
};

/**
 * Broadcast that an org switch just happened (cookies + principal scope changed).
 * Other tabs should refresh access token and reload to avoid "wrong org" UI.
 */
export const broadcastOrgSwitch = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ORG_SWITCH_BROADCAST_KEY, String(Date.now()));
  } catch (_) {}
};

/**
 * Initialize cross-tab org switch listener.
 * When another tab switches org, refresh access token (cookie-mode) and reload this tab.
 */
export const initCrossTabOrgSwitchListener = (onSwitch) => {
  if (typeof window === 'undefined') return;

  const handleStorageChange = (e) => {
    if (e.key === ORG_SWITCH_BROADCAST_KEY && e.newValue && e.newValue !== e.oldValue) {
      if (onSwitch) onSwitch();
    }
  };

  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
};

// ===========================
// Auth State Helpers
// ===========================

/**
 * Store auth response after login.
 * Call this after successful OTP verification.
 * 
 * @param {Object} authData - The auth response containing user and tokens
 */
export const storeAuthResponse = (authData) => {
  if (!authData) return null;
  
  // Handle wrapped response (Response DTO) or direct response
  const data = authData.data || authData;
  
  // Store tokens
  if (data.accessToken) {
    setAccessToken(data.accessToken);
  }
  if (data.refreshToken) {
    setRefreshToken(data.refreshToken);
  }
  
  // Store user data
  if (data.user) {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user));
    localStorage.setItem(IS_LOGGED_IN_KEY, 'true');
    try {
      sessionStorage.removeItem(SESSION_EXPIRED_KEY);
      sessionStorage.removeItem(SESSION_EXPIRED_REDIRECT_GUARD_KEY);
    } catch (_) {}
    // Do not set `lms_authenticated` from JS.
    // Backend sets the cookie (HttpOnly) on login/refresh-cookie/handoff consume.
    return data.user;
  }
  
  return null;
};

/**
 * Get stored user data from localStorage
 */
export const getStoredUserData = () => {
  if (typeof window === 'undefined') return null;
  
  const userData = localStorage.getItem(USER_DATA_KEY);
  if (userData) {
    try {
      return JSON.parse(userData);
    } catch (e) {
      return null;
    }
  }
  return null;
};

/**
 * Check if user is logged in (has user data and refresh token)
 */
export const isLoggedIn = () => {
  return hasRefreshToken() && !!getStoredUserData();
};

/**
 * Best-effort native shell detection for Capacitor-hosted WebView.
 * Keeps mobile app flows on the global host instead of relying on cross-host redirects.
 */
export const isNativeAppShell = () => {
  if (typeof window === 'undefined') return false;
  try {
    const capacitorNative = Boolean(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
    const userAgent = String(window.navigator?.userAgent || '');
    return capacitorNative || /\b42LMS-App\/\d+/i.test(userAgent);
  } catch (_) {
    return false;
  }
};
