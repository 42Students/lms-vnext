import Link from "next/link";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import Layout from "@/layouts/layout";
import AdminLayout from "@/layouts/AdminLayout";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";
import {
  ROLE,
  homePathForRole,
  resolveRoleFromUser,
} from "@/config/roles";
import { getStoredUserData } from "@/utils/authUtils";

function NotFoundContent({ homeHref = "/" }) {
  return (
    <div
      style={{
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "2rem",
        background: "#fafbfc",
      }}
    >
      <h1 style={{ fontSize: "4rem", fontWeight: 800, margin: 0, color: "#1e9aa8" }}>404</h1>
      <h2 style={{ fontSize: "1.5rem", margin: "1rem 0 0.5rem", color: "#1a1d21" }}>Page Not Found</h2>
      <p style={{ color: "#6b7280", margin: "0 0 2rem", maxWidth: 420 }}>
        The page you are looking for doesn&apos;t exist, moved, or is no longer available.
      </p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="ln-btn ln-btn--default"
        >
          Go back
        </button>
        <Link href={homeHref} className="ln-btn ln-btn--pri">
          Go to home
        </Link>
      </div>
    </div>
  );
}

export default function Custom404() {
  const loginUser = useSelector((state) => state.loginUser);
  const [persistedUser, setPersistedUser] = useState(null);

  // 404 opts out of the automatic page layout, so on a hard refresh Redux can still be empty
  // even though this tab has a valid persisted session. Recover just enough identity here to
  // mount the correct role layout; that layout remains responsible for normal token refresh and
  // authorization checks.
  useEffect(() => {
    if (loginUser?.isUserLoggedIn || typeof window === "undefined") {
      setPersistedUser(null);
      return;
    }
    try {
      const stored = getStoredUserData();
      const hadLocalSession = Boolean(localStorage.getItem("isUserLoggedIn") || stored);
      if (hadLocalSession && stored && resolveRoleFromUser(stored)) {
        setPersistedUser({ ...stored, isUserLoggedIn: true });
      }
    } catch (_) {
      setPersistedUser(null);
    }
  }, [loginUser?.isUserLoggedIn]);

  const effectiveUser = loginUser?.isUserLoggedIn ? loginUser : persistedUser;
  const role = resolveRoleFromUser(effectiveUser);
  const authenticated = Boolean(effectiveUser?.isUserLoggedIn && role);
  const content = <NotFoundContent homeHref={authenticated ? homePathForRole(role) : "/"} />;

  if (!authenticated) return content;
  if (role === ROLE.SUPER_ADMIN) return <SuperAdminLayout>{content}</SuperAdminLayout>;
  if (role === ROLE.ADMIN) return <AdminLayout>{content}</AdminLayout>;

  return <Layout preserveRoleShell>{content}</Layout>;
}

// The page selects its own role-aware shell so public 404s stay public while authenticated
// sessions keep their normal navigation/header context.
Custom404.nolayout = true;
