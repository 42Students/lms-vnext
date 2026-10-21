import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Button, Spin, message } from "antd";
import { useDispatch } from "react-redux";
import Api from "@/api/ApiMethod";
import { loginUserAction } from "@/redux/store";
import { clearAllTokens, getStoredUserData, refreshAccessToken, storeAuthResponse } from "@/utils/authUtils";
import { getTenantBootstrapFromStorage } from "@/utils/tenantUtils";
import { getFacultyBasePath } from "@/utils/facultyRouteUtils";
import { homePathForRole, isInPortal, isStrictPortalRole, portalForRole, resolveRoleFromUser } from "@/config/roles";

export default function AuthHandoffPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const consumeStartedRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [targetLabel, setTargetLabel] = useState(null);

  const token = useMemo(() => {
    const nextToken = router?.query?.token;
    return typeof nextToken === "string" && nextToken.trim() ? nextToken.trim() : null;
  }, [router?.query?.token]);

  const nextPath = useMemo(() => {
    const raw = router?.query?.next;
    if (typeof raw !== "string" || !raw.trim()) return null;
    const value = raw.trim();
    if (!value.startsWith("/")) return null;
    if (value.startsWith("//")) return null;
    return value;
  }, [router?.query?.next]);

  const routeUser = (user) => {
    if (!user) return false;
    dispatch(loginUserAction.setIsUserLoggedIn(true));
    dispatch(loginUserAction.handleUserData(user));
    // recruiter / TPO: only their own portal is a valid destination (src/config/roles.js).
    const handoffRole = resolveRoleFromUser(user);
    if (isStrictPortalRole(handoffRole)) {
      const nextPathOnly = typeof nextPath === "string" ? nextPath.split("?")[0] : null;
      router.replace(nextPathOnly && isInPortal(nextPathOnly, portalForRole(handoffRole))
        ? nextPath
        : homePathForRole(handoffRole));
      return true;
    }
    const facultyBasePath = getFacultyBasePath("", user?.facultyType);
    const allowedNextPath =
      user.userType === "FACULTY"
        ? (user.facultyType === "ADMIN"
            ? (nextPath?.startsWith("/college-admin") ? nextPath : null)
            : (nextPath?.startsWith("/teacher") || nextPath?.startsWith("/mentor") ? nextPath : null))
        : (user.userType === "LEARNER"
            ? (nextPath?.startsWith("/learn") ? nextPath : null)
            : null);
    if (allowedNextPath) {
      router.replace(allowedNextPath);
      return true;
    }
    if (user.userType === "FACULTY") {
      router.replace(
        user.facultyType === "ADMIN"
          ? "/college-admin/dashboard"
          : `${facultyBasePath}/courses`
      );
      return true;
    }
    if (user.userType === "LEARNER") {
      router.replace("/learn/courses");
      return true;
    }
    return false;
  };

  const resolveFallbackLoginUrl = () => {
    if (typeof window === "undefined") return "/login";
    try {
      const bootstrap = getTenantBootstrapFromStorage();
      const globalHost = typeof bootstrap?.globalHost === "string" ? bootstrap.globalHost.trim() : "";
      if (globalHost) {
        return `${window.location.protocol}//${globalHost}/login`;
      }
    } catch (_) {}
    return "/login";
  };

  useEffect(() => {
    try {
      const storedLabel = localStorage.getItem("lms_handoff_target_label");
      if (storedLabel && String(storedLabel).trim()) {
        setTargetLabel(String(storedLabel).trim());
      }
    } catch (_) {}

    if (!router?.isReady) return;
    if (!token) {
      setError("Missing handoff token");
      return;
    }
    if (consumeStartedRef.current) return;
    consumeStartedRef.current = true;

    let cancelled = false;
    setLoading(true);
    setError(null);

    Api.post("/api/v1/auth/handoff/consume", { token }, { skipAuth: true })
      .then(async (response) => {
        if (cancelled) return;
        try { localStorage.removeItem("lms_handoff_target_label"); } catch (_) {}

        const auth = response?.data?.auth || response?.data?.data?.auth || null;
        const userFromAuth = auth ? storeAuthResponse(auth) : null;
        if (routeUser(userFromAuth)) return;

        try {
          await refreshAccessToken();
          const restoredUser = getStoredUserData();
          if (routeUser(restoredUser)) return;
        } catch (_) {
          // fall through to login below
        }

        clearAllTokens();
        window.location.replace(resolveFallbackLoginUrl());
      })
      .catch((nextError) => {
        if (cancelled) return;
        const nextMessage =
          nextError?.response?.data?.error ||
          nextError?.response?.data?.message ||
          "Handoff failed";
        setError(nextMessage);
        clearAllTokens();
        message.error(nextMessage);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [router?.isReady, token, nextPath]);

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 520 }}>
        {loading ? (
          <>
            <Spin size="large" />
            <div style={{ marginTop: 16, fontSize: 16 }}>
              Switching account{targetLabel ? ` - ${targetLabel}` : "..."}
            </div>
          </>
        ) : error ? (
          <>
            <div style={{ fontSize: 16, marginBottom: 12 }}>Organization switch failed.</div>
            <div style={{ marginBottom: 16, color: "#666" }}>{String(error)}</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              <Button type="primary" onClick={() => window.location.replace(resolveFallbackLoginUrl())}>Back to Login</Button>
              <Button onClick={() => router.reload()}>Retry</Button>
            </div>
          </>
        ) : (
          <div style={{ fontSize: 16 }}>
            Preparing account switch{targetLabel ? ` - ${targetLabel}` : "..."}
          </div>
        )}
      </div>
    </main>
  );
}

AuthHandoffPage.nolayout = true;
