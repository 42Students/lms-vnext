import { Badge } from "antd";
import {
  ApartmentOutlined, BankOutlined, BellOutlined, BuildOutlined, CalendarOutlined, CheckCircleOutlined, SafetyCertificateOutlined,
  DashboardOutlined, FileTextOutlined, HistoryOutlined, IdcardOutlined, MessageOutlined,
  SolutionOutlined, TeamOutlined, UsergroupAddOutlined, PlayCircleOutlined, NotificationOutlined, CommentOutlined,
} from "@ant-design/icons";
import Image from "next/image";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { getMyAccess, getCounts } from "@/api/Services/TpoHubService";
import TpoModuleOff, { isPlacementsOff } from "@/components/tpo/TpoModuleOff";
import { getVerificationAccess } from "@/api/Services/VerificationService";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { studentNavigationMenu, teacherNavigationMenu, mentorNavigationMenu, recruiterNavigationMenu, tpoNavigationMenu, TPO_GROUP_LABELS /*, placementNavigationMenu */ } from "@/common/lists";
import React, { memo, useState, useEffect, useRef, useCallback, useMemo } from "react";
import { appAction } from "@/redux/store";
import * as ProfileService from "@/api/Services/ProfileService";
import { calculateCompletion, LEARNER_SECTIONS, FACULTY_SECTIONS } from "@/utils/profileUtils";
import { useRouter } from "next/router";
import { useFacultyProfileApis, getUserRole, isTpoRole } from "@/utils/roleUtils";
import { getSidebarActiveKey } from "@/utils/navigationActiveKey";
import useCollegeFeatureFlags from "@/utils/useCollegeFeatureFlags";
import { filterNavByFeatureFlags } from "@/utils/featureFlagNavFilter";

// Module-level (not component-level) cache of which user+role profile-completeness has already
// been fetched for. Sidebar is re-mounted on every course-tab/page navigation (it isn't a
// persistent Next.js layout), so the previous useRef-based guard reset to
// {userId: null, role: null} on every single navigation — the guard existed and looked correct
// in isolation, it just lived in the wrong place to ever fire. That
// sent the same ~10 profile sub-resource calls (education/skills/address/experiences/identity/
// contact/languages/certifications/publications-or-projects/awards-or-extracurricular) plus a
// teaching-assignment lookup on every single click, compounding real backend load. A module-level
// binding survives remounts for the lifetime of the page (only a full reload clears it, which is
// correct — a full reload already re-fetches everything else too).
let profileFetchCache = { userId: null, role: null };

const roleSidebarIconMap = {
  ApartmentOutlined, BankOutlined, BellOutlined, BuildOutlined, CalendarOutlined, CheckCircleOutlined, SafetyCertificateOutlined,
  DashboardOutlined, FileTextOutlined, HistoryOutlined, IdcardOutlined, MessageOutlined,
  SolutionOutlined, TeamOutlined, UsergroupAddOutlined, PlayCircleOutlined, NotificationOutlined, CommentOutlined,
};

const Sidebar = ({ onClose, ...props }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const loginUser = useSelector(state => state.loginUser);
  const userRole = getUserRole(loginUser); // "FACULTY" | "LEARNER" | "ADMIN" | null
  const isMentorRole = userRole === "MENTOR";
  const isTeacherRole = userRole === "FACULTY";
  const isLearner = userRole === "LEARNER";
  const inTpoWorkspace = router.pathname === "/tpo" || router.pathname.startsWith("/tpo/");
  const usesRoleRowActiveState = inTpoWorkspace || userRole === "TPO" || userRole === "RECRUITER";
  const useFacultyApis = useFacultyProfileApis(loginUser);
  const { activeMenuItem, profilePercentage: storedProfilePercentage } = useSelector(state => state.app);
  // Seed from Redux (survives remounts) instead of always starting blank — a fresh Sidebar
  // instance after a navigation already knows the last-computed percentage.
  const [profilePercentage, setProfilePercentage] = useState(storedProfilePercentage ?? null);
  const panelRef = useRef(null);
  const listRef = useRef(null);
  const scrollRef = useRef(null);
  const indicatorRef = useRef(null);
  const indicatorFrameRef = useRef(null);
  const isFirstRender = useRef(true);

  // Route is the visual source of truth. Page-level dispatches can race the shared Sidebar
  // during navigation, which previously left a stale highlight on detail pages.
  const routeActiveKey = useMemo(() => {
    const key = getSidebarActiveKey(router.pathname);
    // Drive Day is part of Drives in the TPO workspace.
    if (inTpoWorkspace && key === "drive-day") return "drives";
    return key;
  }, [inTpoWorkspace, router.pathname, userRole]);

  // Keep Redux in sync for legacy consumers, but render from routeActiveKey above.
  useEffect(() => {
    if (!router.isReady) return;
    if (routeActiveKey && routeActiveKey !== activeMenuItem) {
      dispatch(appAction.setActiveMenuItem(routeActiveKey));
    }
  }, [activeMenuItem, dispatch, routeActiveKey, router.isReady]);

  // Slide the active indicator to the current menu item
  const updateIndicator = useCallback(() => {
    if (usesRoleRowActiveState || !listRef.current || !indicatorRef.current) return;
    const activeEl = listRef.current.querySelector('.fl-panel-module-list__item.active');
    if (activeEl) {
      // Disable transition on first render so indicator doesn't slide in from top
      if (isFirstRender.current) {
        indicatorRef.current.style.transition = 'none';
        isFirstRender.current = false;
        // Re-enable transition after a frame
        requestAnimationFrame(() => {
          if (indicatorRef.current) {
            indicatorRef.current.style.transition = '';
          }
        });
      }
      indicatorRef.current.style.top = `${activeEl.offsetTop}px`;
      indicatorRef.current.style.height = `${activeEl.offsetHeight}px`;
      indicatorRef.current.style.opacity = '1';

      // Deep links and long TPO menus should keep the active row visible.
      const viewport = scrollRef.current;
      if (viewport) {
        const top = activeEl.offsetTop;
        const bottom = top + activeEl.offsetHeight;
        if (top < viewport.scrollTop) viewport.scrollTop = top;
        else if (bottom > viewport.scrollTop + viewport.clientHeight) {
          viewport.scrollTop = bottom - viewport.clientHeight;
        }
      }
    } else {
      indicatorRef.current.style.opacity = '0';
    }
  }, [usesRoleRowActiveState]);

  const scheduleIndicatorUpdate = useCallback(() => {
    if (typeof window === "undefined") return;
    if (indicatorFrameRef.current) cancelAnimationFrame(indicatorFrameRef.current);
    indicatorFrameRef.current = requestAnimationFrame(updateIndicator);
  }, [updateIndicator]);

  useEffect(() => {
    scheduleIndicatorUpdate();
  }, [routeActiveKey, scheduleIndicatorUpdate]);

  // Legacy learner/faculty sidebars still use the sliding indicator. Keep it resilient to
  // geometry changes; TPO/recruiter return early because their active state belongs to the row itself.
  useEffect(() => {
    if (usesRoleRowActiveState) return undefined;
    const panel = panelRef.current;
    const list = listRef.current;
    if (!panel || !list) return undefined;

    const onGeometryChange = () => scheduleIndicatorUpdate();
    panel.addEventListener("mouseenter", onGeometryChange);
    panel.addEventListener("mouseleave", onGeometryChange);
    panel.addEventListener("transitionend", onGeometryChange);
    window.addEventListener("resize", onGeometryChange);

    let observer;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(onGeometryChange);
      observer.observe(list);
      observer.observe(panel);
    }

    return () => {
      panel.removeEventListener("mouseenter", onGeometryChange);
      panel.removeEventListener("mouseleave", onGeometryChange);
      panel.removeEventListener("transitionend", onGeometryChange);
      window.removeEventListener("resize", onGeometryChange);
      observer?.disconnect();
      if (indicatorFrameRef.current) cancelAnimationFrame(indicatorFrameRef.current);
    };
  }, [scheduleIndicatorUpdate, usesRoleRowActiveState]);

  // Skip profile API calls on the superadmin page
  // recruiter has no faculty/learner profile to score (its profile lives under /api/v1/hr).
  // The completeness ring is for students and teachers. Recruiters and TPOs have no personal profile to fill, and
  // fetching its 12 sections on every page load was most of the TPO workspace's first-load wait.
  const shouldSkipProfileCalls = router.pathname === "/superadmin" || userRole === "RECRUITER" || isTpoRole(loginUser);

  const fetchProfileCompleteness = async (forceRefresh = false) => {
    // Don't fetch profile data on the superadmin page
    if (shouldSkipProfileCalls) {
      return;
    }

    const userId = loginUser?.id;
    const roleKey = String(useFacultyApis);
    // Skip if already fetched for this user+role combo, unless forced (e.g. profileUpdated event)
    if (!forceRefresh && profileFetchCache.userId === userId && profileFetchCache.role === roleKey && profilePercentage !== null) {
      return;
    }

    try {
      const fromResult = (result, fallback) =>
        result?.status === "fulfilled" ? (result.value?.data?.data ?? fallback) : fallback;

      // Fetch minimal profile data in parallel and tolerate individual failures.
      const baseResults = await Promise.allSettled([
        useFacultyApis ? ProfileService.getFacultyExperiences(userId) : ProfileService.getLearnerExperiences(userId),
        useFacultyApis ? ProfileService.getFacultyEducation(userId) : ProfileService.getLearnerEducation(userId),
        useFacultyApis ? ProfileService.getFacultySkills(userId) : ProfileService.getLearnerSkills(userId),
        useFacultyApis ? ProfileService.getFacultySocial(userId) : ProfileService.getLearnerSocial(userId),
        useFacultyApis ? ProfileService.getFacultyAddress(userId) : ProfileService.getLearnerAddress(userId),
        useFacultyApis ? ProfileService.getFacultyPersonalDetails(userId) : ProfileService.getLearnerPersonalDetails(userId),
        useFacultyApis ? ProfileService.getFacultyIdentity(userId) : ProfileService.getLearnerIdentity(userId),
        useFacultyApis ? ProfileService.getFacultyContact(userId) : ProfileService.getLearnerContact(userId),
        useFacultyApis ? ProfileService.getFacultyLanguages(userId) : ProfileService.getLearnerLanguages(userId),
        useFacultyApis ? ProfileService.getFacultyCertifications(userId) : ProfileService.getLearnerCertifications(userId),
      ]);

      // Build profile data object
      const profileData = {
        experiences: fromResult(baseResults[0], []),
        qualifications: fromResult(baseResults[1], []),
        skills: fromResult(baseResults[2], []),
        social: fromResult(baseResults[3], {}),
        address: fromResult(baseResults[4], {}),
        personalDetails: fromResult(baseResults[5], {}),
        identity: fromResult(baseResults[6], {}),
        contact: fromResult(baseResults[7], {}),
        languages: fromResult(baseResults[8], []),
        certifications: fromResult(baseResults[9], []),
      };

      // Fetch learner-only sections if needed (not for Faculty)
      if (!useFacultyApis) {
        const learnerResults = await Promise.allSettled([
          ProfileService.getLearnerProjects(userId),
          ProfileService.getLearnerAchievements(userId),
          ProfileService.getLearnerExtracurricular(userId),
          ProfileService.getLearnerHobbies(userId),
        ]);
        profileData.projects = fromResult(learnerResults[0], []);
        profileData.achievements = fromResult(learnerResults[1], []);
        profileData.extracurricular = fromResult(learnerResults[2], []);
        profileData.hobbies = fromResult(learnerResults[3], []);
      } else {
        // Fetch faculty-only sections
        const facultyResults = await Promise.allSettled([
          ProfileService.getFacultyPublications(userId),
          ProfileService.getFacultyAwards(userId),
        ]);
        profileData.publications = fromResult(facultyResults[0], []);
        profileData.awards = fromResult(facultyResults[1], []);
      }

      // Calculate completion percentage
      const sections = useFacultyApis ? FACULTY_SECTIONS : LEARNER_SECTIONS;
      const { percentage } = calculateCompletion(profileData, sections);
      setProfilePercentage(percentage);
      dispatch(appAction.setProfilePercentage(percentage));
      // Mark this user+role as fetched so re-mounts don't trigger repeat calls
      profileFetchCache = { userId, role: String(useFacultyApis) };
    } catch (error) {
      setProfilePercentage(null);
      dispatch(appAction.setProfilePercentage(null));
    }
  };

  // Fetch profile completeness percentage (only once on mount or when user changes)
  useEffect(() => {
    // Don't fetch profile data on the superadmin page
    if (shouldSkipProfileCalls) {
      setProfilePercentage(null);
      dispatch(appAction.setProfilePercentage(null));
      return;
    }
    
    if (loginUser?.id) {
      fetchProfileCompleteness();
    } else {
      setProfilePercentage(null);
      dispatch(appAction.setProfilePercentage(null));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loginUser?.id, useFacultyApis, shouldSkipProfileCalls]);

  // Listen for profile updates to refresh percentage
  useEffect(() => {
    const handleProfileUpdate = () => {
      if (loginUser?.id) {
        // Clear the guard so the forced refresh actually runs
        profileFetchCache = { userId: null, role: null };
        fetchProfileCompleteness(true);
      }
    };
    
    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, [loginUser?.id]);

  // Menu and base path per user type (explicit so all roles are correct)
  const getMenuAndBasePath = () => {
    if (inTpoWorkspace && userRole !== "RECRUITER") {
      // TPOs, college admins (acting as TPO admin) and faculty added as TPO admins use the same workspace.
      return { menu: tpoNavigationMenu({ id: routeActiveKey }), basePath: "/tpo" };
    }
    if (userRole === "RECRUITER") {
      return { menu: recruiterNavigationMenu({ id: routeActiveKey }), basePath: "/recruiter" };
    }
    if (userRole === "TPO") {
      return { menu: tpoNavigationMenu({ id: routeActiveKey }), basePath: "/tpo" };
    }
    if (isMentorRole) {
      return { menu: mentorNavigationMenu({ id: routeActiveKey }), basePath: "/mentor" };
    }
    if (userRole === "FACULTY") {
      return { menu: teacherNavigationMenu({ id: routeActiveKey }), basePath: "/teacher" };
    }
    // LEARNER or null (e.g. before auth) - show learner menu
    return { menu: studentNavigationMenu({ id: routeActiveKey }), basePath: "/learn" };
  };
  const { menu: navigationMenu, basePath } = getMenuAndBasePath();
  // A Placement cell link for faculty the placement cell added as TPO admins (they are not TPO accounts themselves).
  const [placementLink, setPlacementLink] = useState(null);
  useEffect(() => {
    let cancelled = false;
    if (!loginUser?.id || inTpoWorkspace) { setPlacementLink(null); return undefined; }
    if (userRole === "FACULTY" && !isMentorRole) {
      fetchWithErrorHandling(getMyAccess()).then((res) => {
        if (!cancelled && res.success && res.data?.role) setPlacementLink({ modulename: "Placement cell", path: "placement-cell", href: "/tpo/home", group: "account", icon: "/assets/images/common/folder.svg" });
      });
    }
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loginUser?.id, userRole, inTpoWorkspace]);
  // SHELL-14: a subtle, distinct professional workspace identity for TPO - denser than the
  // learner/teacher layout it otherwise inherits verbatim, calmer than superadmin. Toggled on
  // <body> (not per-page) so it applies uniformly without touching every TPO page file.
  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    document.body.classList.toggle("tpo-workspace-active", Boolean(inTpoWorkspace));
    return () => document.body.classList.remove("tpo-workspace-active");
  }, [inTpoWorkspace]);

  const { projectsEnabled, placementsEnabled, modules } = useCollegeFeatureFlags();
  // Verification shows for the placement cell only when the college admin lets it verify profiles.
  const [tpoCanVerify, setTpoCanVerify] = useState(false);
  const menuItems = filterNavByFeatureFlags(
    [...(Array.isArray(navigationMenu) ? navigationMenu : []), ...(placementLink ? [placementLink] : [])],
    { projectsEnabled, placementsEnabled, modules }
  ).filter((m) => m.path !== "verification" || basePath !== "/tpo" || tpoCanVerify);

  // Sidebar workload indicators for TPO (SHELL-13): small meaningful counters only where they
  // save a trip - pending Requests and unread Messages, both already computed elsewhere (the
  // Requests queue and TpoTopBar's own unread count) so this is the same numbers, not new load.
  const isTpoAdmin = inTpoWorkspace && userRole !== "RECRUITER";
  const [tpoCounts, setTpoCounts] = useState({ requests: 0, messages: 0, team: 0, announcements: 0 });
  const [tpoModuleOff, setTpoModuleOff] = useState(false);
  useEffect(() => {
    if (!isTpoAdmin) return undefined;
    let cancelled = false;
    const load = async () => {
      const c = await fetchWithErrorHandling(getCounts());
      if (cancelled) return;
      setTpoModuleOff(isPlacementsOff(c));
      if (!c.success) return;
      setTpoCounts({ requests: Number(c.data?.requests) || 0, messages: Number(c.data?.messages) || 0, team: Number(c.data?.team) || 0, announcements: Number(c.data?.announcements) || 0 });
    };
    load();
    fetchWithErrorHandling(getVerificationAccess()).then((a) => { if (!cancelled) setTpoCanVerify(Boolean(a.success && a.data?.canVerify)); });
    const i = setInterval(load, 60000);
    return () => { cancelled = true; clearInterval(i); };
  }, [isTpoAdmin]);
  // Team: new messages in the conversations you follow (Team module V1), never asks (those live on Home).
  // Announcements: what 42 sent that you haven't read yet.
  const SIDEBAR_BADGE_COUNT = { requests: tpoCounts.requests, messages: tpoCounts.messages + tpoCounts.team, announcements: tpoCounts.announcements };

  const isTpoSidebar = basePath === "/tpo";
  // A recruiter has five pages: the rail stays open with its labels (icons alone were guesswork; recruiter UX audit, 19 Oct 2026).
  const sidebarRoleClass = isTpoSidebar ? "tpo-sidebar-panel" : userRole === "RECRUITER" ? "recruiter-sidebar-panel ln-learner-sidebar-expanded" : "";
  const sidebarHomeHref = userRole === "RECRUITER"
    ? "/recruiter/home"
    : inTpoWorkspace
      ? "/tpo/home"
      : userRole === "TPO"
        ? "/tpo/home"
        : userRole === "FACULTY" && !isMentorRole
          ? "/teacher/courses"
          : isMentorRole
            ? "/mentor/projects"
            : "/learn/courses";

  return (
    <nav aria-label="Main navigation" data-testid="sidebar">
      {isTpoAdmin && tpoModuleOff && <TpoModuleOff />}
      <div ref={panelRef} className={`fl-d-panel-l px-2 ${sidebarRoleClass}`.trim()}>
        <div className="mt-2" style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", height: "100%" }}>
          <div className="fl-d-panel-l__head p-2" style={{ flexShrink: 0 }}>
              <Link
              href={{ pathname: sidebarHomeHref }}
              onClick={() => dispatch(appAction.setActiveMenuItem(
                userRole === "RECRUITER" || inTpoWorkspace || userRole === "TPO" ? "home" : "courses"
              ))}
              data-testid="sidebar-home"
            >
              <img
                src="/assets/images/logo.svg"
                alt="42LMS logo"
                className="fl-d-panel-l__logo"
              />
            </Link>
          </div>


          <div ref={scrollRef} className="ln-hov__visible" style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", scrollbarWidth: "none", msOverflowStyle: "none" }}>
            <div className="fl-d-panel-l__body" style={{ height: "100%" }}>
              <ul className="fl-panel-module-list" ref={listRef}>
                {!usesRoleRowActiveState && <li className="fl-panel-module-list__indicator" ref={indicatorRef} aria-hidden="true" role="presentation" />}
                {menuItems.map((modulelist, i) => {
                  const prevGroup = i > 0 ? menuItems[i - 1].group : null;
                  const startsGroup = modulelist.group && modulelist.group !== prevGroup;
                  // TPO's groups get visible labels, including the first "Operate" group.
                  // Other roles get dividers only BETWEEN groups — never a stray line above Home.
                  const groupLabel = startsGroup ? TPO_GROUP_LABELS[modulelist.group] : null;
                  const showDivider = i > 0 && startsGroup && !groupLabel;
                  const href = { pathname: modulelist.href || basePath + "/" + modulelist.path };
                  const isActive = routeActiveKey === modulelist.path;
                  return (
                    <React.Fragment key={modulelist?.modulename ?? String(i)}>
                      {showDivider && !groupLabel && (
                        <li className="fl-panel-module-list__divider" role="separator" aria-hidden="true" />
                      )}
                      {groupLabel && (
                        <li className="fl-panel-module-list__section" role="separator" aria-hidden="true">{groupLabel}</li>
                      )}
                    <li
                      data-testid={`sidebar-item-${modulelist.path}`}
                      className={`fl-panel-module-list__item apply-pointer ${
                        isActive ? "active" : ""
                      }`}
                      onClick={() => {
                        dispatch(appAction.setActiveMenuItem(modulelist.path));
                        onClose?.();
                      }}
                    >
                      <Link
                        href={href}
                        className="fl-panel-module-list__link fl-module-link d-inline-flex align-items-center w-100"
                        aria-current={isActive ? "page" : undefined}
                        aria-label={`${modulelist?.modulename || "Menu"}${isActive ? " (current page)" : ""}`}
                        data-testid={`sidebar-link-${modulelist.path}`}
                      >
                        <div className="fl-module-link__icon" aria-hidden="true">
                          {(() => {
                            const IconComponent = roleSidebarIconMap[modulelist.icon];
                            if (IconComponent) return <IconComponent className="fl-module-link__ant-icon" />;
                            return (
                              <Image
                                src={modulelist.icon}
                                alt=""
                                width={20}
                                height={20}
                                className="fl-module-link__image-icon"
                              />
                            );
                          })()}
                        </div>
                        <span className="menu-txt text-capitalize" style={{ flex: 1 }}>
                          {modulelist?.modulename}
                        </span>
                        {Boolean(SIDEBAR_BADGE_COUNT[modulelist.path]) && (
                          <span className="fl-module-link__badge" aria-label={`${SIDEBAR_BADGE_COUNT[modulelist.path]} pending`}>
                            <Badge count={SIDEBAR_BADGE_COUNT[modulelist.path]} size="small" overflowCount={99} />
                          </span>
                        )}
                      </Link>
                    </li>
                    </React.Fragment>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default memo(Sidebar);
