import Head from "next/head";
import Sidebar from "@/components/Sidebar/Sidebar";
import DashboardTopPanel from "@/components/Global/Header/Header";
import { useRouter } from "next/router";
import { useState, useEffect, useRef } from "react";
import { useSwipeBack } from "@/hooks/useSwipeBack";
import { useRouteTransition } from "@/hooks/useRouteTransition";
import Loader from "@/components/Loader/loader";
import { useDispatch, useSelector } from "react-redux";
import { appAction, loginUserAction } from "@/redux/store";
import MobileFooter from "@/components/MobileFooter/MobileFooter";
import { getBrowserTitle } from "@/utils/pageTitle";
import { getSidebarActiveKey } from "@/utils/navigationActiveKey";
import {
  hasRefreshToken,
  refreshAccessToken,
  clearAllTokens,
  initCrossTabLogoutListener,
  initCrossTabOrgSwitchListener,
  getStoredUserData,
  handleSessionExpired,
  SESSION_EXPIRED_MESSAGE,
} from "@/utils/authUtils";
import { ConfigProvider, message } from "antd";
import tpoRecruiterTheme, { isTpoRecruiterPath } from "@/layouts/tpoRecruiterTheme";
import { resolveRoleFromUser, strictPortalRedirect, isStrictPortalRole, portalForRole, isInPortal } from "@/config/roles";
import { isConnectivityError } from "@/utils/apiError";

// Mentor route access used to be gated entirely on the account-level facultyType field
// ("MENTOR"), separate from ProjectMember.role (a project's own mentor/co-mentor roster).
// The backend's real per-project authorization (requireMentorProjectAccess) already treats
// a Co-Mentor/Reviewer as fully equal to the primary mentor — but a FACULTY account added as
// a Co-Mentor whose facultyType was never set to "MENTOR" (e.g. senior engineering staff
// provisioned as ordinary faculty) got force-logged-out the moment they opened their own
// project. /mentor/projects/* pages call the project-scoped API on load and get a proper 403
// if the viewer genuinely isn't a member, so this pre-gate doesn't need to duplicate that
// check for Projects specifically — it's only still needed for the OTHER /mentor pages
// (grading tools etc.) that have no per-resource check of their own.
const isGatedMentorPath = (pathname) =>
  typeof pathname === "string" && pathname.includes("mentor") && !pathname.includes("/mentor/projects");

export default function Layout({ children, preserveRoleShell = false }) {
  const router = useRouter();
  const [loaderSpin, setLoaderSpin] = useState(true);
  useSwipeBack();
  const isRouteTransitioning = useRouteTransition();
  const loginUser = useSelector(state => state.loginUser);
  const loader = useSelector(state => state.loader);
  const app = useSelector(state => state.app);
  const dispatch = useDispatch();
  const hasRestored = useRef(false);
  const browserTitle = getBrowserTitle(router.pathname, app?.activeMenuItem);
  const layoutRole = resolveRoleFromUser(loginUser);
  const preserveStrictPortalShell = preserveRoleShell && isStrictPortalRole(layoutRole);
  const inTpoRecruiter = isTpoRecruiterPath(router.pathname) || preserveStrictPortalShell;
  // A hook for the few touch and contrast rules that must also reach portals (modals, drawers, dropdowns).
  useEffect(() => {
    document.body.classList.toggle("portal-tpo-recruiter", inTpoRecruiter);
    return () => document.body.classList.remove("portal-tpo-recruiter");
  }, [inTpoRecruiter]);
  useEffect(() => {
    if (!router.isReady) return;
    const routeModule = getSidebarActiveKey(router.pathname);
    dispatch(appAction.setActiveMenuItem(routeModule));
  }, [dispatch, router.isReady, router.pathname]);
  // Session restoration with JWT refresh
  useEffect(() => {
    const restoreSession = async () => {
      if (hasRestored.current) return;
      if (!router.isReady) return;
      if (!loginUser?.isUserLoggedIn && typeof window !== "undefined") {
        const hadLocalAuth = Boolean(localStorage.getItem("isUserLoggedIn") || getStoredUserData());
        try {
          await refreshAccessToken();
          const loggedInUser = getStoredUserData();

          if (loggedInUser) {
            // Unknown account type: sign out rather than guess a portal. recruiter / TPO (strict-portal
            // roles, src/config/roles.js) are sent to their own portal instead of being signed out.
            const restoredRole = resolveRoleFromUser(loggedInUser);
            if (!restoredRole) {
              clearAllTokens();
              dispatch(loginUserAction.clearUser());
              hasRestored.current = true;
              router.push({ pathname: "/" });
              setLoaderSpin(false);
              return;
            }
            const restoreRedirect = preserveRoleShell
              ? null
              : strictPortalRedirect(restoredRole, router.pathname);
            if (restoreRedirect) {
              dispatch(loginUserAction.setIsUserLoggedIn(true));
              dispatch(loginUserAction.handleUserData(loggedInUser));
              hasRestored.current = true;
              router.push({ pathname: restoreRedirect });
              setLoaderSpin(false);
              return;
            }
            const isAdmin = loggedInUser?.userType === "FACULTY" && loggedInUser?.facultyType === "ADMIN";
            const isMentor = loggedInUser?.userType === "FACULTY" && loggedInUser?.facultyType === "MENTOR";

            if (
              (loggedInUser?.userType === "LEARNER" &&
                (router.pathname.includes("teacher") || router.pathname.includes("mentor") || router.pathname.includes("superadmin") ||
                 (router.pathname.includes("college-admin") && !isAdmin))) ||
              (loggedInUser?.userType === "FACULTY" &&
                (router.pathname.includes("learn") || router.pathname.includes("superadmin") ||
                 (router.pathname.includes("college-admin") && !isAdmin) ||
                 (isAdmin && (router.pathname.includes("teacher") || router.pathname.includes("mentor"))) ||
                 (isMentor && router.pathname.includes("teacher")) ||
                 (!isAdmin && !isMentor && isGatedMentorPath(router.pathname))))
            ) {
              clearAllTokens();
              dispatch(loginUserAction.clearUser());
              hasRestored.current = true;
              router.push({ pathname: "/" });
              setLoaderSpin(false);
              return;
            }

            dispatch(loginUserAction.setIsUserLoggedIn(true));
            dispatch(loginUserAction.handleUserData(loggedInUser));
            hasRestored.current = true;
            setLoaderSpin(false);
            return;
          }
        } catch (error) {
          if (isConnectivityError(error) && (hasRefreshToken() || hadLocalAuth)) {
            const cachedUser = getStoredUserData();
            if (cachedUser) {
              // Transport failure is not evidence that the session expired. Keep the known local
              // identity and refresh credential so the API layer can recover when connectivity
              // returns, rather than logging the user out for a temporary outage.
              dispatch(loginUserAction.setIsUserLoggedIn(true));
              dispatch(loginUserAction.handleUserData(cachedUser));
              hasRestored.current = true;
              setLoaderSpin(false);
              return;
            }
          }
          if (hasRefreshToken() || hadLocalAuth) {
            console.error("Session restore failed:", error);
            message.warning(SESSION_EXPIRED_MESSAGE, 3);
            const redirectPath = handleSessionExpired(router.asPath || router.pathname);
            dispatch(loginUserAction.clearUser());
            hasRestored.current = true;
            router.push(redirectPath);
            setLoaderSpin(false);
            return;
          }
        }

        // No refresh token - check legacy localStorage auth
        let isUserLoggedIn = localStorage.getItem("isUserLoggedIn");
        let loggedInUser = getStoredUserData();
        const legacyRole = resolveRoleFromUser(loggedInUser);
        const legacyRedirect =
          legacyRole && !preserveRoleShell
            ? strictPortalRedirect(legacyRole, router.pathname)
            : null;
        const isAdmin = loggedInUser?.userType === "FACULTY" && loggedInUser?.facultyType === "ADMIN";
        const isMentor = loggedInUser?.userType === "FACULTY" && loggedInUser?.facultyType === "MENTOR";

        if (
          !isUserLoggedIn ||
          !legacyRole ||
          legacyRedirect ||
          (loggedInUser?.userType === "LEARNER" &&
            (router.pathname.includes("teacher") || router.pathname.includes("mentor") || router.pathname.includes("superadmin") ||
             (router.pathname.includes("college-admin") && !isAdmin))) ||
          (loggedInUser?.userType === "FACULTY" &&
            (router.pathname.includes("learn") || router.pathname.includes("superadmin") ||
             (router.pathname.includes("college-admin") && !isAdmin) ||
             (isAdmin && (router.pathname.includes("teacher") || router.pathname.includes("mentor"))) ||
             (isMentor && router.pathname.includes("teacher")) ||
             (!isAdmin && !isMentor && isGatedMentorPath(router.pathname))))
        ) {
          clearAllTokens();
          dispatch(loginUserAction.clearUser());
          hasRestored.current = true;
          router.push({ pathname: "/" });
          setLoaderSpin(false);
          return;
        }
        dispatch(loginUserAction.setIsUserLoggedIn(true));
        dispatch(
          loginUserAction.handleUserData({
            ...getStoredUserData(),
          })
        );
        hasRestored.current = true;
        setLoaderSpin(false);
      } else {
        hasRestored.current = true;
        setLoaderSpin(false);
      }
    };

    restoreSession();
  }, [router.isReady, preserveRoleShell]);

  // Initialize cross-tab logout listener
  useEffect(() => {
    const cleanup = initCrossTabLogoutListener(() => {
      dispatch(loginUserAction.clearUser());
      router.push({ pathname: "/" });
    });

    return cleanup;
  }, [dispatch]);

  // Keep multiple tabs in-sync when org switch happens in any tab
  useEffect(() => {
    const cleanup = initCrossTabOrgSwitchListener(async () => {
      try {
        if (!hasRefreshToken()) return;
        await refreshAccessToken();
        const user = getStoredUserData();
        if (user) {
          dispatch(loginUserAction.setIsUserLoggedIn(true));
          dispatch(loginUserAction.handleUserData(user));
        }
      } catch (_) {
      } finally {
        window.location.reload();
      }
    });
    return cleanup;
  }, [dispatch]);

  // Safety timeout: force-dismiss loader after 10 seconds to avoid permanent blocking
  useEffect(() => {
    const safety = setTimeout(() => setLoaderSpin(false), 10000);
    return () => clearTimeout(safety);
  }, []);

  // Redirect logged-in Admin away from /teacher (they should only use /college-admin), and re-guard
  // every client-side pathname change (not just the initial hard-load restoreSession check
  // above) so a learner can't end up with mentor-only controls rendered by navigating to a
  // /mentor/... URL via SPA back/forward — restoreSession only re-validates on a fresh load.
  useEffect(() => {
    if (!router.isReady) return;
    if (loginUser?.isUserLoggedIn && typeof window !== "undefined") {
      // recruiter / TPO are confined to their own portals, and other roles are kept out of them.
      const strictRedirect = preserveRoleShell
        ? null
        : strictPortalRedirect(resolveRoleFromUser(loginUser), router.pathname);
      if (strictRedirect) {
        router.push({ pathname: strictRedirect });
        return;
      }
      const isAdmin = loginUser?.userType === "FACULTY" && loginUser?.facultyType === "ADMIN";
      const isMentor = loginUser?.userType === "FACULTY" && loginUser?.facultyType === "MENTOR";
      const isLearner = loginUser?.userType === "LEARNER";
      if (isAdmin && (router.pathname.includes("teacher") || router.pathname.includes("mentor"))) {
        router.push({ pathname: "/college-admin/dashboard" });
      } else if (isMentor && router.pathname.includes("teacher")) {
        router.push({ pathname: "/mentor/projects" });
      } else if (
        loginUser?.userType === "FACULTY" &&
        !isAdmin &&
        !isMentor &&
        isGatedMentorPath(router.pathname)
      ) {
        // Non-mentor FACULTY subtypes (Coordinator, Professor, etc.) aren't offered the
        // /mentor link in the Sidebar, but a bookmark/direct URL could still land them there.
        router.push({ pathname: "/teacher/courses" });
      } else if (
        isLearner &&
        (router.pathname.includes("teacher") ||
          router.pathname.includes("mentor") ||
          (router.pathname.includes("college-admin") && !isAdmin))
      ) {
        router.push({ pathname: "/learn/projects" });
      }
    }
  }, [loginUser?.isUserLoggedIn, loginUser?.userType, loginUser?.facultyType, router.pathname, router.isReady, preserveRoleShell]);

  // Focus management: move focus to #main-content after route change
  useEffect(() => {
    const mainContent = document.getElementById("main-content");
    if (mainContent) {
      try {
        mainContent.focus({ preventScroll: true });
      } catch (_) {
        mainContent.focus();
      }
    }
  }, [router.pathname]);

  // recruiter / TPO portals use the same page frame as the learner/teacher/mentor portals.
  const isStrictPortalRoute =
    preserveStrictPortalShell ||
    (isStrictPortalRole(layoutRole) && isInPortal(router.pathname, portalForRole(layoutRole)));
  const isLearnOrTeacherRoute =
    preserveRoleShell ||
    router.pathname.includes("learn") ||
    router.pathname.includes("teacher") ||
    router.pathname.includes("mentor") ||
    isStrictPortalRoute ||
    router.pathname.startsWith("/tpo");
  const isLearnerRoute = router.pathname.includes("learn");

  const themed = (node) => (inTpoRecruiter ? <ConfigProvider theme={tpoRecruiterTheme}>{node}</ConfigProvider> : node);
  return (
    <>
      {!loaderSpin && !loader?.isLoading ? themed(
        <>
          <Head>
            <title className="text-">
              {browserTitle}
            </title>
            <meta name="description" content="" />
            <link rel="icon" type="image/png" href="/favicon.png" />
          </Head>
          <a className="lms-skip-link" href="#main-content">Skip to main content</a>
          <main>
            <section className={`bg-gray s-fix-100vh ${isLearnOrTeacherRoute ? "learn-layout" : ""} ${isLearnerRoute ? "learn-layout--learner" : ""}`}>
              <div className="container-fluid px-0">
                <div className="d-flex">
                  <Sidebar />
                  <div className={`dashboard-container w-100 ${isLearnOrTeacherRoute ? "learn-dashboard" : ""}`}>
                    <DashboardTopPanel />
                    {/* <Service /> */}
                    {isLearnOrTeacherRoute ? (
                      <div
                        id="main-content"
                        className={`learn-page-wrapper lms-route-surface ${isRouteTransitioning ? "is-route-transitioning" : "is-route-ready"}`}
                        aria-busy={isRouteTransitioning}
                        tabIndex={-1}
                      >
                        {children}
                      </div>
                    ) : (
                      <div id="main-content" tabIndex={-1}>{children}</div>
                    )}
                  </div>
                  {/* <div className='ln-chat-box'>
                <Chat />
              </div> */}
                </div>
              </div>
            </section>
          </main>
          <MobileFooter id={app?.activeMenuItem} />
        </>
      ) : (
        <div className="ln-page-loader">
          <Loader />
        </div>
      )}
    </>
  );
}
