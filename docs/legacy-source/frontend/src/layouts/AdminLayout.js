import Head from "next/head";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState, useMemo } from "react";
import { useSwipeBack } from "@/hooks/useSwipeBack";
import { useRouteTransition } from "@/hooks/useRouteTransition";
import { loginUserAction, appAction } from "@/redux/store";
import Loader from "@/components/Loader/loader";
import AdminSidebar from "@/components/Sidebar/AdminSidebar";
import DashboardTopPanel from "@/components/Global/Header/Header";
import MobileFooter from "@/components/MobileFooter/MobileFooter";
import { adminRouteTitles } from "@/common/constant";
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
import { message } from "antd";
import { isConnectivityError } from "@/utils/apiError";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const [loaderSpin, setLoaderSpin] = useState(true);
  useSwipeBack();
  const isRouteTransitioning = useRouteTransition();
  const loginUser = useSelector((state) => state.loginUser);

  const activeMenuItem = useMemo(() => {
    const segment = router.pathname.replace("/college-admin/", "").replace("/college-admin", "").split("/")[0];
    return segment || "dashboard";
  }, [router.pathname]);

  useEffect(() => {
    dispatch(appAction.setActiveMenuItem(activeMenuItem));
  }, [activeMenuItem, dispatch]);

  const pageTitle = useMemo(() => {
    const title = adminRouteTitles[activeMenuItem];
    return title ? `${title} · 42LMS` : "Admin · 42LMS";
  }, [activeMenuItem]);

  // Session restoration with JWT refresh
  useEffect(() => {
    const restoreSession = async () => {
      if (!loginUser?.isUserLoggedIn && typeof window !== "undefined") {
        try {
          await refreshAccessToken();
          const loggedInUser = getStoredUserData();
          if (loggedInUser) {
            const isAdmin =
              loggedInUser?.userType === "FACULTY" &&
              loggedInUser?.facultyType === "ADMIN";
            if (!isAdmin) {
              clearAllTokens();
              dispatch(loginUserAction.clearUser());
              setLoaderSpin(false);
              router.push({ pathname: "/" });
              return;
            }
            dispatch(loginUserAction.setIsUserLoggedIn(true));
            dispatch(loginUserAction.handleUserData(loggedInUser));
            setLoaderSpin(false);
            return;
          }
        } catch (error) {
          if (isConnectivityError(error) && hasRefreshToken()) {
            const cachedUser = getStoredUserData();
            const cachedIsAdmin =
              cachedUser?.userType === "FACULTY" && cachedUser?.facultyType === "ADMIN";
            if (cachedIsAdmin) {
              // A temporary transport failure must not become a logout. Retain the cached admin
              // identity and refresh credential; later API calls can refresh once online again.
              dispatch(loginUserAction.setIsUserLoggedIn(true));
              dispatch(loginUserAction.handleUserData(cachedUser));
              setLoaderSpin(false);
              return;
            }
          }
          if (hasRefreshToken()) {
            console.debug("Admin session restore failed:", error);
            message.warning(SESSION_EXPIRED_MESSAGE, 3);
            const redirectPath = handleSessionExpired(router.asPath || router.pathname);
            dispatch(loginUserAction.clearUser());
            setLoaderSpin(false);
            router.push(redirectPath);
            return;
          }
        }
        clearAllTokens();
        dispatch(loginUserAction.clearUser());
        setLoaderSpin(false);
        router.push({ pathname: "/" });
        return;
      } else {
        // The role check above only runs on the session-restore path, i.e. for someone arriving
        // with no Redux state (a fresh page load). A user who is ALREADY logged in — a learner, a
        // mentor, a plain faculty member — reaching /college-admin/* by client-side navigation
        // (browser history, a stale link, a bookmark followed in-app) fell into this branch, which
        // did nothing but stop the spinner, and the whole admin console rendered for them.
        //
        // Their API calls all still fail closed (verified: every /api/v1/admin/** route returns 403
        // for learner, faculty and mentor tokens), so this exposed no data — but it presented a
        // console full of controls that cannot work.
        //
        // Deliberately does NOT clear tokens the way the restore path above does: this person has a
        // perfectly valid session for their own console, and destroying it would log them out of
        // the app for clicking one wrong link. Send them home instead.
        const isAdmin =
          loginUser?.userType === "FACULTY" && loginUser?.facultyType === "ADMIN";
        if (!isAdmin) {
          setLoaderSpin(false);
          router.push({ pathname: "/" });
          return;
        }
        setLoaderSpin(false);
      }
    };
    restoreSession();
  }, []);

  useEffect(() => {
    const cleanup = initCrossTabLogoutListener(() => {
      dispatch(loginUserAction.clearUser());
      router.push({ pathname: "/" });
    });
    return cleanup;
  }, [dispatch, router]);

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!loginUser?.isUserLoggedIn) return;
    const userType = loginUser?.userType;
    if (userType == null) return;

    const facultyType = loginUser?.facultyType;

    const isAdmin = userType === "FACULTY" && facultyType === "ADMIN";
    if (!isAdmin) {
      if (userType === "LEARNER") {
        router.push({ pathname: "/learn/courses" });
      } else if (facultyType === "MENTOR") {
        router.push({ pathname: "/mentor/projects" });
      } else if (userType === "FACULTY") {
        router.push({ pathname: "/teacher/courses" });
      }
    }
  }, [loginUser?.isUserLoggedIn, loginUser?.userType, loginUser?.facultyType, router]);

  // Admin route accessibility: focus the newly rendered content without moving the scroll
  // position. This mirrors the learner/faculty/mentor shell and gives keyboard/screen-reader
  // users an immediate, deterministic entry point after SPA navigation.
  useEffect(() => {
    if (loaderSpin || typeof document === "undefined") return;
    const mainContent = document.getElementById("main-content");
    if (!mainContent) return;
    try {
      mainContent.focus({ preventScroll: true });
    } catch (_) {
      mainContent.focus();
    }
  }, [loaderSpin, router.pathname]);

  if (loaderSpin) {
    return (
      <>
        <Head>
          <title>{pageTitle}</title>
          <meta name="description" content="42 LMS Admin Dashboard" />
          <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
          <link rel="icon" type="image/png" href="/favicon.png" />
        </Head>
        <main>
          <div className="ln-page-loader">
            <Loader />
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content="42 LMS Admin Dashboard" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="icon" type="image/png" href="/favicon.png" />
      </Head>
      <style>{`
        /* The shared .dashboard-container class hides its vertical scrollbar entirely
           (scrollbar-width: none). On short admin pages that's invisible, but on a long
           form (e.g. Create project template) the visible area can end right at the
           viewport edge with no cue that more content follows below — it just looks
           cut off / broken. Restore a normal, visible scrollbar for admin content only. */
        .dashboard-container.admin-layout-main {
          scrollbar-width: thin;
          -ms-overflow-style: auto;
        }
        .dashboard-container.admin-layout-main::-webkit-scrollbar {
          display: block;
          width: 10px;
        }
        .dashboard-container.admin-layout-main::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 6px;
        }
        .dashboard-container.admin-layout-main::-webkit-scrollbar-track {
          background: transparent;
        }

        /* Hide horizontal scrollbars in college admin (scroll still works) */
        .admin-layout-main .ant-table-wrapper .ant-table-body,
        .admin-layout-main .ant-table-wrapper .ant-table-content {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .admin-layout-main .ant-table-wrapper .ant-table-body::-webkit-scrollbar,
        .admin-layout-main .ant-table-wrapper .ant-table-content::-webkit-scrollbar {
          height: 0;
          display: none;
        }

        /* Admin: align buttons and cards */
        .admin-layout-main .ant-btn {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          text-align: center !important;
        }
        .admin-layout-main .ant-btn > span {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .admin-layout-main .ant-btn .anticon + span {
          margin-inline-start: 6px;
        }
        .admin-layout-main .ant-card {
          border-radius: 8px;
        }
        .admin-layout-main .ant-card-head {
          min-height: 48px;
          align-items: center;
        }
        .admin-layout-main .ant-card-head-title {
          padding: 12px 0;
          font-weight: 600;
        }
        .admin-layout-main .ant-card-extra {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }
        .admin-layout-main .ant-card-body {
          padding: 20px 24px;
        }
        .admin-layout-main .ant-space {
          display: inline-flex;
          align-items: center;
        }
        .admin-layout-main .ant-alert {
          border-radius: 8px;
        }
        .admin-layout-main .ant-alert-content {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .admin-layout-main .ant-modal-footer .ant-btn {
          min-width: 80px;
        }
        .admin-layout-main .ant-tag {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          margin: 0;
          padding: 2px 8px;
          line-height: 1.5;
        }
        .admin-layout-main .ant-tag .anticon {
          margin-inline-end: 4px;
          vertical-align: middle;
          line-height: 1;
        }
        /* Hide vertical scrollbar in interview calendar (scroll still works) */
        .admin-layout-main .scroll-container--interview-calendar,
        .admin-layout-main .scroll-container--interview-calendar .rbc-time-content,
        .admin-layout-main .calendar-wrapper .rbc-time-content {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        .admin-layout-main .scroll-container--interview-calendar::-webkit-scrollbar,
        .admin-layout-main .scroll-container--interview-calendar .rbc-time-content::-webkit-scrollbar,
        .admin-layout-main .calendar-wrapper .rbc-time-content::-webkit-scrollbar {
          width: 0 !important;
          display: none !important;
        }
        /* Reserve scrollbar width so top days row and scrollable time grid stay aligned */
        .admin-layout-main .scroll-container--interview-calendar .rbc-time-content,
        .admin-layout-main .calendar-wrapper .rbc-time-content {
          padding-right: 16px !important;
          box-sizing: border-box !important;
        }
        .admin-layout-main .scroll-container--interview-calendar .rbc-time-header-content,
        .admin-layout-main .calendar-wrapper .rbc-time-header-content {
          padding-right: 16px !important;
          box-sizing: border-box !important;
        }
      `}</style>
      <a className="lms-skip-link" href="#main-content">Skip to main content</a>
      <main>
        <section className="bg-gray s-fix-100vh">
          <div className="container-fluid px-0">
            <div className="d-flex">
              <AdminSidebar />
              <div className="dashboard-container admin-layout-main w-100">
                <DashboardTopPanel />
                {/* `learn-projects` is required here, not decorative — PageShell's own styling
                    (`.learn-projects__shell` padding, `.learn-projects__tabs`/`.learn-projects__tab`
                    pill styling, `.learn-projects__content` spacing) is SCSS-nested *inside* a
                    `.learn-projects` ancestor in _learn-projects.scss; PageShell.jsx never renders
                    that ancestor itself (see ProjectsShell.jsx, the pattern it was extracted from,
                    and contactsTabLayout.js which hit this exact gap before). Every admin page now
                    renders through AdminGroupShell/PageShell, so it belongs once here rather than
                    copy-pasted onto each of the ~22 pages that use it. */}
                <div
                  id="main-content"
                  tabIndex={-1}
                  className={`ln-module learn-projects px-3 py-3 lms-route-surface ${isRouteTransitioning ? "is-route-transitioning" : "is-route-ready"}`}
                  aria-busy={isRouteTransitioning}
                  style={{ minHeight: "calc(100vh - 85px)" }}
                >
                  {children}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <MobileFooter id={activeMenuItem} />
    </>
  );
}
