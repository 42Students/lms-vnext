import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { message } from "antd";
import {
  getAccessToken,
  setAccessToken,
  setRefreshToken,
  hasRefreshToken,
  refreshAccessToken,
} from "@/utils/authUtils";
import { getColleges, getOrganizations } from "@/api/Services/AdminService";
import { setSuperAdminScope } from "@/api/Services/SuperAdminScopeService";

// Extracted from the old superadmin/index.js SPA (which held this as page-local useState) so it
// survives navigation between the new /superadmin/* routes — scope (which college/org you're
// acting as) is genuinely app-wide state, not per-page state. Every /superadmin/* page reads it
// via useSuperAdminScope() instead of receiving collegeId as a prop from a parent switch
// statement the way the old SPA did.
const SuperAdminScopeContext = createContext(null);

function decodeJwtPayload(token) {
  if (!token || typeof token !== "string") return {};
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return {};
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(payload);
    return JSON.parse(json) || {};
  } catch {
    return {};
  }
}

export function SuperAdminScopeProvider({ children }) {
  const [colleges, setColleges] = useState([]);
  const [collegesLoading, setCollegesLoading] = useState(false);
  const [collegesError, setCollegesError] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [organizationsLoading, setOrganizationsLoading] = useState(false);
  const [organizationsError, setOrganizationsError] = useState(false);
  const [selectedCollegeId, setSelectedCollegeId] = useState(null);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState(null);
  const [tenantLocked, setTenantLocked] = useState(false);
  const [scopeApplying, setScopeApplying] = useState(false);
  const [scopeApplyError, setScopeApplyError] = useState(null);
  const [scopeOutOfSync, setScopeOutOfSync] = useState(false);
  const [scopeLoaded, setScopeLoaded] = useState(false);

  // Tenant context lock (prevents accidental cross-tenant edits) — persisted like the old SPA.
  useEffect(() => {
    if (typeof window === "undefined") return;
    setTenantLocked(localStorage.getItem("superadmin_tenant_locked") === "true");
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("superadmin_tenant_locked", tenantLocked ? "true" : "false");
  }, [tenantLocked]);

  const fetchOrganizations = useCallback(async () => {
    setOrganizationsLoading(true);
    setOrganizationsError(false);
    try {
      const res = await getOrganizations();
      const list = Array.isArray(res?.data?.data) ? res.data.data : (Array.isArray(res?.data) ? res.data : []);
      setOrganizations(Array.isArray(list) ? list : []);
      return Array.isArray(list) ? list : [];
    } catch (e) {
      setOrganizationsError(true);
      throw e;
    } finally {
      setOrganizationsLoading(false);
    }
  }, []);

  const fetchColleges = useCallback(async () => {
    setCollegesLoading(true);
    setCollegesError(false);
    try {
      // `all: true` bypasses the backend's own self-scoping (CollegeController.fetchCollegeList) —
      // without it, this same endpoint narrows to just the currently-applied scope, so after
      // picking any one college here the switcher's own list would shrink to that single college
      // and every other page's dropdown would silently lose its other options.
      const res = await getColleges({ params: { all: true } });
      const payload = res?.data;
      const list = Array.isArray(payload?.data) ? payload.data : (Array.isArray(payload) ? payload : []);
      setColleges(list);
      return list;
    } catch (e) {
      setCollegesError(true);
      throw e;
    } finally {
      setCollegesLoading(false);
    }
  }, []);

  const applyScope = useCallback(async ({ organizationId = null, collegeId = null } = {}) => {
    setScopeApplying(true);
    setScopeApplyError(null);
    try {
      const res = await setSuperAdminScope({ organizationId, collegeId });
      const data = res?.data ?? null;
      if (data?.accessToken) setAccessToken(data.accessToken);
      if (data?.refreshToken) setRefreshToken(data.refreshToken);
      return data;
    } catch (e) {
      const err = e?.response?.data?.error || e?.response?.data?.message || e?.message || "SCOPE_SET_FAILED";
      setScopeApplyError(err);
      throw e;
    } finally {
      setScopeApplying(false);
    }
  }, []);

  const scopeErrorText = (e) => {
    const status = e?.response?.status;
    const data = e?.response?.data;
    const err = data?.error || data?.message || e?.message || "SCOPE_SET_FAILED";
    const details = data?.type || data?.message ? ` [${data?.type ?? "Error"}: ${data?.message ?? ""}]` : "";
    return status ? `${err}${details} (HTTP ${status})` : `${String(err)}${details}`;
  };

  // Initial load: hydrate access token if needed, fetch orgs+colleges, restore any saved
  // selection (validated against the fetched list, matching the old SPA's behavior exactly).
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        if (typeof window !== "undefined" && !getAccessToken() && hasRefreshToken()) {
          await refreshAccessToken();
        }
      } catch (_) {}

      fetchOrganizations().catch(() => {});

      try {
        const list = await fetchColleges();
        if (cancelled) return;
        const savedCollegeId = localStorage.getItem("superadmin_lms_college_id");
        if (!savedCollegeId) {
          setScopeLoaded(true);
          return;
        }
        const id = Number(savedCollegeId);
        const stillExists = list.some((c) => (c.id ?? c.collegeId) === id);
        if (!stillExists) {
          localStorage.removeItem("superadmin_lms_college_id");
          setScopeLoaded(true);
          return;
        }
        const college = list.find((c) => (c.id ?? c.collegeId) === id);
        const orgId = college?.orgId ?? college?.organizationId ?? null;

        // This effect re-runs on EVERY /superadmin/* navigation, not just once per session —
        // _app.js's `<AppErrorBoundary key={router.pathname}>` remounts the whole tree (including
        // this provider) on every route change (same root cause as the SuperAdminLayout auth-check
        // fix earlier). Unconditionally calling applyScope() here meant every single click through
        // the panel fired a POST to /auth/superadmin/scope that mints and overwrites BOTH the
        // access and refresh token, even when the scope hadn't changed at all — a needless
        // network dependency on every navigation, and a window where other components' concurrent
        // fetches (more of them on heavier pages like Tenant Setup/Feature Controls) could race
        // against that in-flight token rotation and intermittently fail auth. The already-current
        // access token already carries the scope as JWT claims (decodeJwtPayload, used below by
        // the out-of-sync check) — only re-apply scope over the network when the token doesn't
        // already reflect the saved selection (e.g. first login just after OTP verify).
        const currentClaims = decodeJwtPayload(getAccessToken());
        const tokenAlreadyScoped = (currentClaims?.collegeId ?? null) === id;
        if (!tokenAlreadyScoped) {
          // AWAIT, and only publish the scope afterwards. This is the same stale-token race that
          // was fixed in handleCollegeChange/handleOrganizationChange, still open on the restore
          // path: setSelectedCollegeId() + setScopeLoaded(true) used to run first, with an
          // un-awaited applyScope() fired alongside. Consumers gate their fetches on scopeLoaded,
          // so every page on a fresh load with a saved college requested that college's data
          // using a token that had not been rescoped yet — the backend answered 403 and the panel
          // showed "you do not have permission" until the user manually refreshed.
          //
          // The comment above is right that this path is rare (it needs a token whose claims do
          // not already match), but "first login just after OTP verify" is exactly when a new
          // superadmin hits it.
          try {
            await applyScope({ collegeId: id });
          } catch (_) {
            // Leave the scope unpublished rather than announcing a scope the token does not have.
            if (!cancelled) {
              message.error("Couldn't switch to your saved college. Pick it again from the header.");
              localStorage.removeItem("superadmin_lms_college_id");
              setScopeLoaded(true);
            }
            return;
          }
        }
        if (cancelled) return;
        setSelectedCollegeId(id);
        if (orgId != null) setSelectedOrganizationId(orgId);
        setScopeLoaded(true);
      } catch (_) {
        if (!cancelled) {
          message.error("Failed to load colleges. Please refresh.");
          setScopeLoaded(true);
        }
      }
    };
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Both handlers apply scope (mint + store the new access/refresh token) BEFORE touching
  // selectedCollegeId/selectedOrganizationId — every page's data-fetching keys off those two
  // values, so updating them first (as this used to) let child components re-render and fire
  // their fetches on the OLD token while asking for the NEW college's data. The backend's scope
  // check then correctly rejects that mismatch as "you don't have permission" — a race that a
  // manual page refresh accidentally fixes, since by then the rotated token has landed. Applying
  // scope first and updating state only after it resolves closes that window entirely: nothing
  // reads the new selectedCollegeId until the token that matches it is already in place.
  const handleCollegeChange = async (value) => {
    if (tenantLocked) {
      message.warning("Tenant lock is enabled. Unlock to change scope.", 2);
      return;
    }
    const newId = value ?? null;
    if (newId === selectedCollegeId) return;

    let orgId = null;
    if (newId != null) {
      const college = colleges.find((c) => (c.id ?? c.collegeId) === newId);
      orgId = college?.orgId ?? college?.organizationId ?? null;
    }

    try {
      await applyScope({ collegeId: newId });
    } catch (e) {
      message.error(`Failed to apply scope. ${scopeErrorText(e)}.`, 4);
      return;
    }

    if (orgId != null && orgId !== selectedOrganizationId) setSelectedOrganizationId(orgId);
    setSelectedCollegeId(newId);
    // Clearing the college (newId === null) is the ONLY way to clear scope now that the header
    // is college-only — the old SPA's separate org selector + "Clear scope" button are gone.
    // applyScope({ collegeId: null }) above defaults its own organizationId param to null too and
    // DOES correctly clear org server-side (the JWT comes back unscoped) — mirror that into local
    // selectedOrganizationId state too, or the backend considers you fully unscoped while the UI
    // still reads `scoped` as true forever, permanently locking Structure tab editing with no way
    // to escape via the header.
    if (newId == null) setSelectedOrganizationId(null);

    if (newId != null) {
      localStorage.setItem("superadmin_lms_college_id", String(newId));
    } else {
      localStorage.removeItem("superadmin_lms_college_id");
      if (colleges.length > 1) message.warning("Showing all colleges — data may be large.", 3);
    }
  };

  const handleOrganizationChange = async (value) => {
    if (tenantLocked) {
      message.warning("Tenant lock is enabled. Unlock to change scope.", 2);
      return;
    }
    const newOrgId = value ?? null;
    if (newOrgId === selectedOrganizationId) return;
    try {
      await applyScope({ organizationId: newOrgId, collegeId: null });
    } catch (e) {
      message.error(`Failed to apply scope. ${scopeErrorText(e)}.`, 4);
      return;
    }
    setSelectedOrganizationId(newOrgId);
    setSelectedCollegeId(null);
    localStorage.removeItem("superadmin_lms_college_id");
  };

  // Detect mismatch between UI-selected scope and JWT claims (prevents silent wrong-tenant edits).
  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setScopeOutOfSync(false);
      return;
    }
    const claims = decodeJwtPayload(token);
    const orgId = claims?.orgId ?? null;
    const collegeId = claims?.collegeId ?? null;
    const mismatch =
      (orgId ?? null) !== (selectedOrganizationId ?? null) ||
      (collegeId ?? null) !== (selectedCollegeId ?? null);
    setScopeOutOfSync(Boolean(mismatch));
  }, [selectedOrganizationId, selectedCollegeId, scopeApplying, scopeApplyError]);

  const filteredColleges = selectedOrganizationId
    ? colleges.filter((c) => (c?.orgId ?? c?.organizationId) === selectedOrganizationId)
    : colleges;

  const activeOrg = selectedOrganizationId != null
    ? organizations.find((o) => (o.id ?? o.orgId) === selectedOrganizationId)
    : null;
  const activeCollege = selectedCollegeId != null
    ? colleges.find((c) => (c.id ?? c.collegeId) === selectedCollegeId)
    : null;

  const value = {
    colleges,
    collegesLoading,
    collegesError,
    organizations,
    organizationsLoading,
    organizationsError,
    filteredColleges,
    selectedCollegeId,
    selectedOrganizationId,
    activeOrg,
    activeCollege,
    currentOrgName: activeOrg?.name ?? activeOrg?.orgName ?? "All Orgs",
    currentCollegeName: activeCollege?.name ?? activeCollege?.collegeName ?? "All Colleges",
    tenantLocked,
    setTenantLocked,
    scopeApplying,
    scopeApplyError,
    scopeOutOfSync,
    scopeLoaded,
    handleCollegeChange,
    handleOrganizationChange,
  };

  return <SuperAdminScopeContext.Provider value={value}>{children}</SuperAdminScopeContext.Provider>;
}

export function useSuperAdminScope() {
  const ctx = useContext(SuperAdminScopeContext);
  if (!ctx) throw new Error("useSuperAdminScope must be used within SuperAdminScopeProvider");
  return ctx;
}

// For components shared with college-admin pages (no provider there): the scope when inside the
// superadmin console, otherwise null.
export function useOptionalSuperAdminScope() {
  return useContext(SuperAdminScopeContext);
}
