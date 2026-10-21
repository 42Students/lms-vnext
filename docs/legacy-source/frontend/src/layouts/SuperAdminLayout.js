import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { notification, message } from "antd";
import SuperAdminSidebar from "@/components/Sidebar/SuperAdminSidebar";
import SuperAdminHeader from "@/components/Global/Header/SuperAdminHeader";
import SuperAdminLoginPage from "@/loginPages/SuperAdminLogin";
import DefaultLoginBackground from "@/loginPages/DefaultLoginBackground";
import LoginHeader from "@/components/Header/LoginHeader";
import Loader from "@/components/Loader/loader";
import { useRouteTransition } from "@/hooks/useRouteTransition";
import { SuperAdminScopeProvider } from "@/contexts/SuperAdminScopeContext";
import { loginUserAction } from "@/redux/store";
import {
  clearAllTokens,
  handleSessionExpired,
  hasRefreshToken,
  refreshAccessToken,
} from "@/utils/authUtils";
import { isConnectivityError } from "@/utils/apiError";

// There is deliberately no hardcoded phone allowlist here any more.
//
// This file used to keep its own copy of the superadmin numbers ("must match backend
// SUPER_ADMIN_PHONES"), carried over verbatim from the old SPA. Two copies of one list drift, and
// this pair had drifted in BOTH directions at once — verified against the running dev backend:
//
//   9676866700  frontend allowed it, backend answered 403   (dead entry, no access anyway)
//   9000000099  backend issued a superadmin token, frontend denied it
//
// The second case is the damaging one. A legitimate superadmin the backend accepts was met with
// "Access denied. You are not authorized to access Superadmin.", and — worse — the branch below
// calls clearAllTokens() + clearUser(), so being missing from a stale frontend constant logged
// that person out of the whole app.
//
// The backend is the only authority worth trusting here: it mints the superadmin principal (and
// alone knows app.super-admin-phones), and it re-checks on every superadmin API call, so a
// non-superadmin who somehow reached this console gets 403 on all of them regardless. The
// identifying claim it issues is id === 0 — every real learner, faculty member and college admin
// has a positive id — so that check below is the gate, and it needs no second list to agree with.

function SuperAdminLayoutInner({ children }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const loginUser = useSelector((state) => state.loginUser);
  const [authChecking, setAuthChecking] = useState(true);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const isRouteTransitioning = useRouteTransition();

  useEffect(() => {
    // Keep session restoration gated on Redux login state. The app shell is intentionally
    // preserved across route changes now (AppErrorBoundary resets its error state without a
    // pathname key), so this effect normally stays mounted while navigating inside Superadmin.
    // The guard remains important for fresh loads and any future remount: refreshAccessToken()
    // rotates the refresh token and must not be fired redundantly on ordinary page navigation.
    if (loginUser?.isUserLoggedIn) {
      // The id-0 check further down only runs on the session-restore path. Someone already logged
      // in as a learner, mentor, faculty member or college admin who navigates to /superadmin/*
      // client-side reached this early return and rendered the whole superadmin console. Every
      // superadmin API still refuses them (verified: 403 for all four principals), so nothing
      // leaked — but the console appeared.
      //
      // Shows this layout's own login form, the same way the restore path below denies a
      // non-superadmin — rather than clearAllTokens(), which would log them out of the app they
      // are legitimately signed in to just for following one wrong link.
      if (loginUser?.id !== 0) {
        setShowLoginForm(true);
        setAuthChecking(false);
        return;
      }
      setShowLoginForm(false);
      setAuthChecking(false);
      return;
    }

    let timeoutId;
    const check = async () => {
      try {
        if (typeof window === "undefined") return;
        timeoutId = setTimeout(() => {
          // Slow transport is not proof that the credential is invalid. Warn without destroying
          // the session; refreshAccessToken has its own bounded network timeout and will settle.
          notification.warning({
            message: "Still reconnecting",
            description: "Session restore is taking longer than expected. Your sign-in has been kept while we wait for the connection.",
            duration: 6,
            key: "superadmin-auth-timeout",
          });
        }, 20000);

        if (!hasRefreshToken()) {
          setShowLoginForm(true);
          setAuthChecking(false);
          return;
        }

        await refreshAccessToken();
        const userData = JSON.parse(localStorage.getItem("userData") || "null");
        const userId = userData?.id ?? null;

        if (userId !== 0) {
          // Deny, but do NOT clearAllTokens()/clearUser() here. This branch is reached by anyone
          // signed in as a learner, mentor, faculty member or college admin who follows a single
          // /superadmin/* link on a fresh tab — Redux is not hydrated from storage, so the
          // early return above misses them. Wiping their tokens signed them out of the app they
          // were legitimately using, as a punishment for one wrong link. Showing this layout's
          // own login form denies access just as firmly and leaves their session alone, which is
          // what the comment on that early return already said the code was doing.
          message.error("Access denied. You are not authorized to access Superadmin.");
          setShowLoginForm(true);
          setAuthChecking(false);
          return;
        }

        dispatch(loginUserAction.setIsUserLoggedIn(true));
        dispatch(loginUserAction.handleUserData(userData));
        setShowLoginForm(false);
        setAuthChecking(false);
      } catch (error) {
        if (isConnectivityError(error)) {
          const cachedUser = JSON.parse(localStorage.getItem("userData") || "null");
          if (cachedUser?.id === 0) {
            dispatch(loginUserAction.setIsUserLoggedIn(true));
            dispatch(loginUserAction.handleUserData(cachedUser));
            setShowLoginForm(false);
            setAuthChecking(false);
            return;
          }
          // Without a verified cached superadmin identity, fall back to the login surface but keep
          // the refresh credential; a network outage alone must never erase authentication state.
          setShowLoginForm(true);
          setAuthChecking(false);
          return;
        }
        const currentPath =
          typeof window !== "undefined"
            ? `${window.location.pathname}${window.location.search}${window.location.hash}`
            : "/superadmin";
        handleSessionExpired(currentPath);
        dispatch(loginUserAction.clearUser());
        setShowLoginForm(true);
        setAuthChecking(false);
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
      }
    };
    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loginUser?.isUserLoggedIn]);

  // Super Admin route accessibility: focus the routed content after SPA navigation while
  // preserving the user's scroll position. The outer app shell stays mounted.
  useEffect(() => {
    if (authChecking || showLoginForm || typeof document === "undefined") return;
    const mainContent = document.getElementById("main-content");
    if (!mainContent) return;
    try {
      mainContent.focus({ preventScroll: true });
    } catch (_) {
      mainContent.focus();
    }
  }, [authChecking, showLoginForm, router.pathname]);

  if (authChecking) {
    return (
      <main>
        <div className="ln-page-loader">
          <Loader />
        </div>
      </main>
    );
  }

  if (showLoginForm) {
    // Matches src/pages/superadmin-login.js's wrapper exactly (login-page background + Header) —
    // without it, SuperAdminLoginPage renders with none of its expected page-level chrome, since
    // that chrome lives on the dedicated page, not inside SuperAdminLoginPage itself.
    return (
      <div className="login-page">
        <Head>
          <title>Superadmin - 42 LMS</title>
        </Head>
        <DefaultLoginBackground />
        <LoginHeader />
        <main>
          <SuperAdminLoginPage />
        </main>
      </div>
    );
  }

  return (
    <SuperAdminScopeProvider>
      <Head>
        <title>Superadmin · 42LMS</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="icon" type="image/png" href="/favicon.png" />
      </Head>
      <a className="lms-skip-link" href="#main-content">Skip to main content</a>
      <main>
        <section className="bg-gray s-fix-100vh">
          <div className="container-fluid px-0">
            <div className="d-flex">
              <SuperAdminSidebar />
              <div className="dashboard-container admin-layout-main w-100">
                <SuperAdminHeader />
                {/* `learn-projects` required — PageShell's own styling (shell padding, pill tabs,
                    content spacing) is SCSS-nested inside a `.learn-projects` ancestor, which
                    PageShell.jsx never renders itself. Same fix as AdminLayout.js. */}
                <div
                  id="main-content"
                  tabIndex={-1}
                  className={`ln-module learn-projects px-3 py-3 lms-route-surface ${isRouteTransitioning ? "is-route-transitioning" : "is-route-ready"}`}
                  aria-busy={isRouteTransitioning}
                  style={{ minHeight: "calc(100vh - 150px)" }}
                >
                  {children}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </SuperAdminScopeProvider>
  );
}

export default function SuperAdminLayout({ children }) {
  return <SuperAdminLayoutInner>{children}</SuperAdminLayoutInner>;
}
