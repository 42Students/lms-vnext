import { useEffect, useState } from "react";
import Api from "@/api/ApiMethod";
import { getAccessToken } from "@/utils/authUtils";

// Cache by user type, subject and college. Scope switching changes the access token.
let cachedKey = undefined;
let cachedFlags = null;
let cachedAt = 0;
let inFlight = null;
let inFlightKey = undefined;
const CACHE_TTL_MS = 60_000;
// Until a current, successful API response establishes access, optional nav is unavailable.
// This does not apply to Courses, which is always a core LMS module.
const DEFAULT_FLAGS = { projectsEnabled: false, placementsEnabled: false, modules: {} };

// Accept only optional-module keys from an old backend or cached response. Never let a
// retired Courses OFF value survive through client code and re-hide core LMS navigation.
const sanitizeFlags = (data) => {
  const modules = data?.modules && typeof data.modules === "object" ? data.modules : {};
  return {
    projectsEnabled: typeof modules.projects === "boolean" ? modules.projects : data?.projectsEnabled === true,
    placementsEnabled: typeof modules.placements === "boolean" ? modules.placements : data?.placementsEnabled === true,
    modules: Object.fromEntries(
      Object.entries(modules).filter(([module, value]) =>
        (module === "projects" || module === "placements" || module === "electives") && typeof value === "boolean")
    ),
  };
};

function decodeSubjectKey(token) {
  if (!token || typeof token !== "string") return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = typeof window !== "undefined" ? window.atob(payload) : null;
    if (!json) return null;
    const claims = JSON.parse(json);
    if (claims?.sub == null) return null;
    return `${claims.userType ?? "?"}:${claims.sub}:${claims?.collegeId ?? ""}`;
  } catch {
    return null;
  }
}

function isCacheFresh(key) {
  if (key == null) return false;
  return cachedKey === key && Date.now() - cachedAt < CACHE_TTL_MS;
}

function fetchFlags(key) {
  // recruiter (industry) sessions have no college module flags and may not call /features/mine.
  if (typeof key === "string" && key.startsWith("RECRUITER:")) return Promise.resolve(sanitizeFlags(DEFAULT_FLAGS));
  // Before the access token is read back (key null) a recruiter page still asked, and got a 403 on every page load (UX audit,
  // 19 Oct 2026). Recruiter pages all live under /recruiter.
  if (key == null && typeof window !== "undefined" && window.location?.pathname?.startsWith("/recruiter")) return Promise.resolve(sanitizeFlags(DEFAULT_FLAGS));
  if (isCacheFresh(key)) return Promise.resolve(sanitizeFlags(cachedFlags || DEFAULT_FLAGS));
  if (inFlight && inFlightKey === key) return inFlight;
  inFlightKey = key;
  inFlight = Api.get("/api/v1/features/mine")
    .then((response) => {
      const data = response?.data?.data ?? response?.data ?? DEFAULT_FLAGS;
      const flags = sanitizeFlags(data);
      cachedKey = key;
      cachedFlags = flags;
      cachedAt = Date.now();
      return flags;
    })
    // A failed lookup is NOT "every module is off": callers that explain a switched-off module
    // (ModuleGroupGuard) must be able to tell the two apart. Not cached, so the next call retries.
    .catch(() => ({ ...DEFAULT_FLAGS, failed: true }))
    .finally(() => {
      inFlight = null;
      inFlightKey = undefined;
    });
  return inFlight;
}

/** Per-user optional-module flags. Course availability is not configurable. */
export default function useCollegeFeatureFlags() {
  const currentKey = typeof window !== "undefined" ? decodeSubjectKey(getAccessToken()) : null;
  const [flags, setFlags] = useState(
    isCacheFresh(currentKey) ? sanitizeFlags(cachedFlags || DEFAULT_FLAGS) : DEFAULT_FLAGS
  );
  const [loading, setLoading] = useState(!isCacheFresh(currentKey));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      if (cancelled) return;
      // A scope/account switch can happen without an immediate navigation remount.
      if (decodeSubjectKey(getAccessToken()) !== currentKey) {
        setFlags(DEFAULT_FLAGS);
        setLoading(true);
        return;
      }
      if (isCacheFresh(currentKey)) {
        setFlags(sanitizeFlags(cachedFlags || DEFAULT_FLAGS));
        setLoading(false);
        return;
      }
      // Never keep previously enabled links visible while revalidation is pending or failed.
      setFlags(DEFAULT_FLAGS);
      setLoading(true);
      fetchFlags(currentKey).then((result) => {
        if (!cancelled) {
          setFlags(sanitizeFlags(result));
          setFailed(Boolean(result?.failed));
          setLoading(false);
        }
      });
    };
    const onFocus = () => { cachedAt = 0; refresh(); };
    refresh();
    const refreshInterval = window.setInterval(refresh, CACHE_TTL_MS);
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      window.clearInterval(refreshInterval);
      window.removeEventListener("focus", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentKey]);

  return { ...sanitizeFlags(flags), loading, failed };
}
