import ProfileDropdown from "@/components/Dropdowns/Profile/profiledropdown";
import { LinearProgress } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import Image from "next/image";
import { MenuOutlined } from "@ant-design/icons";
import { useState, useEffect, memo, useCallback, useMemo, useRef } from "react";
import { notification, AutoComplete, Input, Spin, Tag, Select, Modal, Tooltip, Typography } from "antd";
import MobileMenuDrawer from "../MobileMenuDrawer/MobileMenuDrawer";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { useRouter } from "next/router";
import { getFacultyCoursesPath } from "@/utils/facultyRouteUtils";
import { SearchOutlined } from "@ant-design/icons";
import { getCollegeDetails } from "@/api/Services/UserServices";
import TpoTopBar from "@/components/tpo/TpoTopBar";
import RecruiterTopBar from "@/components/recruiter/RecruiterTopBar";
import NotificationDropdown from "@/components/Dropdowns/Notification/NotifivationDropdown";
import { searchCourses, getPopularCourses, recordCourseSelection, recordCourseSelectionBySlug } from "@/api/Services/CourseSearchService";
import { getStudentCoursesBySemester } from "@/api/Services/SemesterService";
import { getActiveAssignmentsByFaculty } from "@/api/Services/FacultyAssignmentService";
import { debounce } from "lodash";
import { isFacultyRole, isAdminRole } from "@/utils/roleUtils";
import { getMemberships, switchOrg, switchOrgToken } from "@/api/Services/AuthOrgService";
import { refreshAccessToken, getStoredUserData, broadcastOrgSwitch, setAccessToken, setRefreshToken, isNativeAppShell } from "@/utils/authUtils";
import { loginUserAction } from "@/redux/store";
import { isRecruiterType } from "@/config/roles";

// Module-level cache, same reasoning and pattern as Sidebar.js's profileFetchCache: Header is
// re-mounted on every course-tab/page navigation, so a useState/useRef-scoped guard here would
// reset every time and refetch the faculty's/learner's full assigned-course list (and, for
// faculty, duplicate the same teaching-assignment lookup Sidebar-adjacent pages already make) on
// every single click. Cached by userId+role so a genuinely different user or role still refetches.
let assignedCourseIdsCache = { key: null, ids: null };

const DashboardHeader = () => {
  const { Text } = Typography;
  const router = useRouter();
  const dispatch = useDispatch();
  const [menuDrawerOpen, setMenuDrawerOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const loading = useSelector(state => state.loader.isLoading);
  const [searchValue, setSearchValue] = useState("");
  const [courseOptions, setCourseOptions] = useState([]);
  const [popularCourses, setPopularCourses] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const loginUser = useSelector(state => state.loginUser);
  const [api, contextHolder] = notification.useNotification();
  const [org, setOrg] = useState("");
  const [memberships, setMemberships] = useState([]);
  const [serverCurrentMembershipKey, setServerCurrentMembershipKey] = useState(null);
  const [switching, setSwitching] = useState(false);
  const [pendingMembershipKey, setPendingMembershipKey] = useState(null);
  const isTeacherRole = isFacultyRole(loginUser);
  const isAdmin = isAdminRole(loginUser);
  // recruiter (industry recruiter) and TPO portals have no course features: no course search, and none of
  // the learner/faculty course lookups behind it. recruiter also has no notification feed.
  const isRecruiter = isRecruiterType(loginUser?.userType);
  const inTpoWorkspace = router.pathname === "/tpo" || router.pathname.startsWith("/tpo/");
  const isTpoUser = loginUser?.userType === "FACULTY" && (loginUser?.facultyType === "TPO" || inTpoWorkspace);
  // A course search on the placement pages found nothing a student came there for (student UX audit, 20 Oct 2026).
  const hidesCourseSearch = isRecruiter || isTpoUser || router.pathname.startsWith("/learn/my-placements");
  const isNativeShell = useMemo(() => isNativeAppShell(), []);
  // For Student: only courses in their class/semester. For Faculty: only assigned courses. For Admin: null = all.
  const assignedCourseIdsCacheKey = loginUser?.id != null ? `${loginUser.id}:${isAdmin ? "admin" : isTeacherRole ? "faculty" : "learner"}` : null;
  const [assignedCourseIds, setAssignedCourseIds] = useState(
    assignedCourseIdsCacheKey && assignedCourseIdsCache.key === assignedCourseIdsCacheKey ? assignedCourseIdsCache.ids : null
  );

  useEffect(() => {
    // recruiter is not a college member account; its college name comes with its own session data.
    loginUser?.collegeId && !isRecruiterType(loginUser?.userType) &&
      getCollegeDetails({ collegeId: loginUser?.collegeId }).then(res => {
        setOrg(res?.data);
      });
  }, [loginUser?.collegeId]);

  // If auth scope changes (switch succeeded), clear transient switch UI state.
  // Also ensures we don't leave a sticky "Switching..." toast around if something re-renders oddly.
  useEffect(() => {
    if (!loginUser?.isUserLoggedIn) return;
    setPendingMembershipKey(null);
    setSwitching(false);
    try { api.close("org-switching"); } catch (_) {}
    // Don't force dropdown open/closed here; just reset switching state.
  }, [loginUser?.collegeId, loginUser?.orgId, loginUser?.userType, loginUser?.facultyType, loginUser?.isUserLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  const orgName = useMemo(() => {
    const n =
      org?.name ??
      org?.collegeName ??
      org?.college_name ??
      org?.data?.name ??
      org?.data?.collegeName ??
      org?.data?.college_name ??
      null;
    const s = typeof n === "string" ? n.trim() : "";
    return s.length ? s : null;
  }, [org]);

  const formatMembershipText = useCallback((value) => {
    return typeof value === "string" && value.trim() ? value.trim() : "";
  }, []);

  const toTitleCase = useCallback((value) => {
    const text = formatMembershipText(value);
    if (!text) return "";
    return text
      .toLowerCase()
      .split(/[\s_-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }, [formatMembershipText]);

  const splitMembershipLabel = useCallback((value) => {
    const text = formatMembershipText(value);
    if (!text) return { title: "", role: "" };
    const parts = text.split(/•|\u2022/).map((part) => part.trim()).filter(Boolean);
    if (parts.length >= 2) {
      return {
        title: parts.slice(0, -1).join(" • "),
        role: parts[parts.length - 1],
      };
    }
    return { title: text, role: "" };
  }, [formatMembershipText]);

  const isGenericCollegeLabel = useCallback((value) => /^college(\s+#?\d+)?$/i.test(formatMembershipText(value)), [formatMembershipText]);

  const formatHostTitle = useCallback((host) => {
    const text = formatMembershipText(host);
    if (!text) return "";
    const firstSegment = text.split(".")[0] || "";
    return toTitleCase(firstSegment.replace(/\d+$/g, "").replace(/-/g, " ")) || text;
  }, [formatMembershipText, toTitleCase]);

  const getMembershipDisplay = useCallback((membership) => {
    if (!membership) return { title: "", subtitle: "", roleLabel: "", host: "" };

    const parsed = splitMembershipLabel(membership.label);
    const host = formatMembershipText(membership.host);
    const collegeName = formatMembershipText(membership.collegeName);
    const organizationName = formatMembershipText(membership.organizationName);
    const title = parsed.title
      || (!isGenericCollegeLabel(collegeName) ? collegeName : "")
      || formatHostTitle(host)
      || (membership.collegeId != null ? `College ${membership.collegeId}` : "Workspace");
    const subtitle = organizationName && organizationName.toLowerCase() !== title.toLowerCase() ? organizationName : "";
    const role = toTitleCase(parsed.role) || toTitleCase(membership.role) || toTitleCase(membership.userType) || "Account";
    const facultyType = toTitleCase(membership.facultyType);
      const roleLabel = facultyType && facultyType !== role ? `${role} - ${facultyType}` : role;
      const compactRoleLabel = role;

    return { title, subtitle, roleLabel, compactRoleLabel, host };
  }, [formatHostTitle, formatMembershipText, isGenericCollegeLabel, splitMembershipLabel, toTitleCase]);

  useEffect(() => {
    if (!loginUser?.isUserLoggedIn) {
      setMemberships([]);
      setServerCurrentMembershipKey(null);
      return;
    }
    getMemberships()
      .then((res) => {
        const data = res?.data?.memberships ?? res?.data?.data?.memberships ?? [];
        const currentMembership = res?.data?.currentMembership ?? res?.data?.data?.currentMembership ?? null;
        const currentKey = res?.data?.currentMembershipKey ?? res?.data?.data?.currentMembershipKey ?? null;
        setMemberships(Array.isArray(data) ? data : []);
        setServerCurrentMembershipKey(typeof currentKey === "string" && currentKey.trim() ? currentKey.trim() : null);
        // Future-proof: if backend ever changes key format, currentMembership can still be used to compute hints.
        // We don't store the whole object in state yet; the key is enough.
        void currentMembership;
      })
      .catch(() => {
        setMemberships([]);
        setServerCurrentMembershipKey(null);
      });
  }, [loginUser?.isUserLoggedIn]);

  const lastMembershipKey = useMemo(() => {
    if (typeof window === "undefined") return null;
    if (!loginUser?.isUserLoggedIn) return null;
    try {
      const k = localStorage.getItem("lms_last_membership_key");
      return k && String(k).trim() ? String(k).trim() : null;
    } catch (_) {
      return null;
    }
  }, [loginUser?.isUserLoggedIn, memberships?.length]);

  const activeMembership = useMemo(() => {
    if (!Array.isArray(memberships) || memberships.length === 0) return null;

    const currentCollegeId = loginUser?.collegeId ?? loginUser?.college_id ?? loginUser?.collegeID ?? null;
    const currentOrgId = loginUser?.orgId ?? loginUser?.org_id ?? loginUser?.organizationId ?? loginUser?.organization_id ?? null;
    const currentUserType = loginUser?.userType ?? loginUser?.user_type ?? null;
    const currentFacultyType = loginUser?.facultyType ?? loginUser?.faculty_type ?? null;

    const matchesCurrentScope = (m) => {
      if (!m) return false;
      if (currentCollegeId != null && m.collegeId != null && Number(m.collegeId) !== Number(currentCollegeId)) return false;
      if (currentOrgId != null && m.organizationId != null && Number(m.organizationId) !== Number(currentOrgId)) return false;
      if (currentUserType && m.userType && String(m.userType) !== String(currentUserType)) return false;
      if (String(currentUserType || "").toUpperCase() === "FACULTY" && currentFacultyType && m.facultyType) {
        if (String(m.facultyType) !== String(currentFacultyType)) return false;
      }
      return true;
    };

    // 0) Best source of truth: server-reported current membership key (derived from JWT).
    if (serverCurrentMembershipKey) {
      const byServer = memberships.find((m) => m && String(m.key) === String(serverCurrentMembershipKey)) || null;
      if (byServer) return byServer;
    }

    // 1) If we have a last selected membership key and it matches current JWT scope, prefer it.
    if (lastMembershipKey) {
      const byKey = memberships.find((m) => m && String(m.key) === String(lastMembershipKey)) || null;
      if (byKey && matchesCurrentScope(byKey)) return byKey;
    }

    // 2) Otherwise find the best match for the current JWT scope.
    const candidates = memberships.filter(matchesCurrentScope);
    if (candidates.length === 1) return candidates[0];
    if (candidates.length > 1) {
      // Prefer "more specific" matches: facultyType match first, then stable by key.
      const userTypeUpper = String(currentUserType || "").toUpperCase();
      const wantFacultyType = userTypeUpper === "FACULTY" ? String(currentFacultyType || "") : "";
      const sorted = [...candidates].sort((a, b) => {
        const aFt = wantFacultyType && a?.facultyType ? (String(a.facultyType) === wantFacultyType ? 1 : 0) : 0;
        const bFt = wantFacultyType && b?.facultyType ? (String(b.facultyType) === wantFacultyType ? 1 : 0) : 0;
        if (bFt !== aFt) return bFt - aFt;
        return String(a?.key || "").localeCompare(String(b?.key || ""));
      });
      return sorted[0] || null;
    }

    // 3) Fallback: if we can't match, just pick the first (prevents empty UI).
    return memberships[0] || null;
  }, [memberships, loginUser, lastMembershipKey, serverCurrentMembershipKey]);

  const activeMembershipKey = useMemo(() => activeMembership?.key || null, [activeMembership]);

  const activeMembershipDisplay = useMemo(() => {
    return getMembershipDisplay(activeMembership);
  }, [activeMembership, getMembershipDisplay]);

  // The college's one logo (super admin > Manage College > Branding), shown beside its name in the top bar.
  const activeCollegeLogo = typeof activeMembership?.logoUrl === "string" && activeMembership.logoUrl.trim()
    ? activeMembership.logoUrl.trim()
    : "";
  const collegeLogoEl = activeCollegeLogo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={activeCollegeLogo}
      alt=""
      className="ln-org-logo"
      style={{ width: 28, height: 28, flex: "0 0 28px", objectFit: "contain", borderRadius: 6, border: "1px solid #e7ecf2", background: "#fff", padding: 2, marginRight: 8 }}
    />
  ) : null;

  const switcherMembershipCount = useMemo(() => {
    return Array.isArray(memberships) ? memberships.length : 0;
  }, [memberships]);

  const membershipOptions = useMemo(() => {
    if (!Array.isArray(memberships) || memberships.length === 0) return [];
    const byGroup = new Map();
    for (const m of memberships) {
      if (!m || !m.key) continue;
      const display = getMembershipDisplay(m);
      const groupLabel = display.title;
      if (!byGroup.has(groupLabel)) byGroup.set(groupLabel, []);
      const hostHint = display.host ? `@${display.host}` : "";
      const switchable = m.switchable !== false && typeof m.host === "string" && m.host.trim();
      const unverified = m.switchWarning === "DOMAIN_UNVERIFIED" || m.hostVerified === false;
      const disabled = !switchable;
      const isLastUsed = Boolean(lastMembershipKey) && String(m.key) === String(lastMembershipKey);
      const labelNode = (
        <span className="ln-org-switcher-option">
          <span className="ln-org-switcher-option__text">
            <span className="ln-org-switcher-option__title">{display.roleLabel || "Account"}</span>
            <span className="ln-org-switcher-option__sub">
              {display.subtitle ? <span>{display.subtitle}</span> : null}
              {hostHint ? <span className="ln-org-switcher-option__host">{hostHint}</span> : null}
            </span>
          </span>
          <span className="ln-org-switcher-option__tags">
            {isLastUsed && <span className="ln-org-switcher-chip ln-org-switcher-chip--info">Last used</span>}
            {unverified && <span className="ln-org-switcher-chip ln-org-switcher-chip--warn">Unverified</span>}
            {disabled && <span className="ln-org-switcher-chip ln-org-switcher-chip--danger">No domain</span>}
          </span>
        </span>
      );
      const triggerTitle = orgName || display.title || "Workspace";
      const triggerNode = (
        <span className="ln-org-switcher-trigger">
          <Text className="ln-org-switcher-trigger__title" ellipsis>{triggerTitle}</Text>
        </span>
      );
      byGroup.get(groupLabel).push({
        value: m.key,
        label: labelNode,
        triggerLabel: triggerNode,
        disabled,
        _search: `${display.title} ${display.subtitle} ${display.roleLabel} ${hostHint} ${unverified ? "unverified" : ""} ${disabled ? "no domain" : ""}`.toLowerCase(),
      });
    }
    // Stable sort groups and options for predictable UX
    const groups = Array.from(byGroup.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    return groups.map(([label, options]) => ({
      label,
      options: options.sort((a, b) => String(a._search || "").localeCompare(String(b._search || ""))),
    }));
  }, [memberships, lastMembershipKey, getMembershipDisplay]);

  const filterMembershipOption = useCallback((input, option) => {
    const q = typeof input === "string" ? input.trim().toLowerCase() : "";
    if (!q) return true;
    const s = option?._search != null ? String(option._search) : (option?.label != null ? String(option.label).toLowerCase() : "");
    return s.includes(q);
  }, []);

  const normalizeHostOnly = useCallback((hostRaw) => {
    if (typeof hostRaw !== "string") return null;
    let host = hostRaw.trim();
    if (!host) return null;
    host = host.replace(/^https?:\/\//i, "");
    const slash = host.indexOf("/");
    if (slash > 0) host = host.substring(0, slash);
    // Strip :port (best-effort; doesn't support raw IPv6 without brackets)
    if (host.startsWith("[")) {
      const end = host.indexOf("]");
      if (end > 1) host = host.substring(1, end);
    } else {
      const colon = host.indexOf(":");
      if (colon > 0) host = host.substring(0, colon);
    }
    host = host.toLowerCase();
    if (host.startsWith("www.")) host = host.substring(4);
    return host || null;
  }, []);

  const handleOrgSwitch = async (targetKey) => {
    if (!targetKey || switching) return;
    if (activeMembershipKey && String(targetKey) === String(activeMembershipKey)) return;

    const selected = Array.isArray(memberships) ? memberships.find((m) => m && String(m.key) === String(targetKey)) : null;
    const switchWarning = selected?.switchWarning || null;
    const isUnverified = switchWarning === "DOMAIN_UNVERIFIED" || selected?.hostVerified === false;

    // "God tier" UX: warn before switching to an unverified domain (easy to misconfigure during onboarding).
    if (isUnverified) {
      const ok = await new Promise((resolve) => {
        Modal.confirm({
          title: "This college domain is not verified",
          icon: <ExclamationCircleOutlined />,
          content: "Switching may fail if the domain is not ready. Continue anyway?",
          okText: "Continue",
          cancelText: "Cancel",
          onOk: () => resolve(true),
          onCancel: () => resolve(false),
        });
      });
      if (!ok) return;
    }

    setPendingMembershipKey(String(targetKey));
    setSwitching(true);
    // God-tier UX: show an explicit "switching" toast that stays until success/failure.
    try {
      api.open({
        key: "org-switching",
        message: "Switching workspace…",
        description: "Please wait. Don’t close this tab.",
        duration: 0,
      });
    } catch (_) {}
    try {
      try { localStorage.setItem("lms_last_membership_key", String(targetKey)); } catch (_) {}
      // Handoff page reads this for a friendlier "Switching..." label.
      try {
        const label =
          selected?.label ||
          `${selected?.organizationName || "Org"} • ${selected?.collegeName || "College"} • ${selected?.role || selected?.userType || ""}`.trim();
        if (label) localStorage.setItem("lms_handoff_target_label", String(label));
      } catch (_) {}

      const res = await (isNativeShell ? switchOrgToken(targetKey) : switchOrg(targetKey));
      const payload = res?.data?.data ?? res?.data ?? null;
      const targetHost = payload?.targetHost;
      const handoffToken = payload?.handoffToken;
      const switchType = payload?.switchType;
      const nextAccessToken = typeof payload?.accessToken === "string" && payload.accessToken.trim() ? payload.accessToken.trim() : null;
      const nextRefreshToken = typeof payload?.refreshToken === "string" && payload.refreshToken.trim() ? payload.refreshToken.trim() : null;
      if (nextAccessToken) setAccessToken(nextAccessToken);
      if (nextRefreshToken) setRefreshToken(nextRefreshToken);
      if (payload?.error === "TARGET_HOST_MISSING") {
        api.error({
          message: "Switch failed",
          description: "Target organization domain is not configured.",
          duration: 4,
        });
        setSwitching(false);
        setPendingMembershipKey(null);
        try { api.close("org-switching"); } catch (_) {}
        return;
      }
      if (payload?.error === "HANDOFF_UNAVAILABLE") {
        api.error({
          message: "Switch failed",
          description: "Cross-domain handoff is unavailable. Please contact support.",
          duration: 5,
        });
        setSwitching(false);
        setPendingMembershipKey(null);
        try { api.close("org-switching"); } catch (_) {}
        return;
      }
      if (isNativeShell) {
        try {
          await refreshAccessToken();
          const user = getStoredUserData();
          if (user) {
            dispatch(loginUserAction.setIsUserLoggedIn(true));
            dispatch(loginUserAction.handleUserData(user));
          }
        } catch (_) {}
        try { api.close("org-switching"); } catch (_) {}
        window.location.reload();
        return;
      }
      if (typeof targetHost === "string" && targetHost.trim()) {
        const host = targetHost.trim();
        const hostForUrl = host.replace(/^https?:\/\//i, "").split("/")[0];
        const proto = typeof window !== "undefined" ? window.location.protocol : "https:";
        // Notify other tabs to refresh/reload (org scope changed)
        try { broadcastOrgSwitch(); } catch (_) {}
        // Same-host switch: no redirect needed. Refresh session to hydrate FE state for new scope.
        // Prefer backend contract (hostChange/switchType) over client-side inference.
        const backendSaysSameHost = switchType === "SAME_HOST" || (payload?.hostChange === false);
        if (backendSaysSameHost) {
          try {
            await refreshAccessToken();
            const user = getStoredUserData();
            if (user) {
              dispatch(loginUserAction.setIsUserLoggedIn(true));
              dispatch(loginUserAction.handleUserData(user));
            }
          } catch (_) {}
          try { api.close("org-switching"); } catch (_) {}
          window.location.reload();
          return;
        }

        // If backend didn't provide switchType, fall back to host comparison (older servers).
        if (typeof window !== "undefined" && switchType == null && payload?.hostChange == null) {
          const currentHost = normalizeHostOnly(window.location.host);
          const targetHostOnly = normalizeHostOnly(host);
          if (currentHost && targetHostOnly && currentHost === targetHostOnly) {
            try {
              await refreshAccessToken();
              const user = getStoredUserData();
              if (user) {
                dispatch(loginUserAction.setIsUserLoggedIn(true));
                dispatch(loginUserAction.handleUserData(user));
              }
            } catch (_) {}
            try { api.close("org-switching"); } catch (_) {}
            window.location.reload();
            return;
          }
        }
        if (handoffToken) {
          // If host contains a port, keep it; otherwise use host as-is.
          try { api.close("org-switching"); } catch (_) {}
          window.location.href = `${proto}//${hostForUrl}/auth/handoff?token=${encodeURIComponent(handoffToken)}`;
        } else {
          api.error({
            message: "Switch failed",
            description: "Handoff token missing; cannot switch domains safely.",
            duration: 5,
          });
          setSwitching(false);
          setPendingMembershipKey(null);
          try { api.close("org-switching"); } catch (_) {}
        }
        return;
      }
      api.error({
        message: "Switch failed",
        description: "Target organization domain is not configured.",
        duration: 4,
      });
      setSwitching(false);
      setPendingMembershipKey(null);
      try { api.close("org-switching"); } catch (_) {}
    } catch (e) {
      const err = e?.response?.data?.error || e?.response?.data?.message || null;
      if (err === "TARGET_HOST_MISSING") {
        api.error({ message: "Switch failed", description: "Target organization domain is not configured.", duration: 4 });
      } else if (err === "HANDOFF_UNAVAILABLE") {
        api.error({ message: "Switch failed", description: "Cross-domain handoff is unavailable. Please contact support.", duration: 5 });
      } else {
        api.error({
          message: "Switch failed",
          description: "You don't have access to that organization.",
          duration: 4,
        });
      }
      setSwitching(false);
      setPendingMembershipKey(null);
      try { api.close("org-switching"); } catch (_) {}
    }
  };

  // Fetch assigned course IDs for Student (courses in their class) and Faculty (courses they teach). Admin sees all (no filter).
  useEffect(() => {
    if (!loginUser?.id) {
      setAssignedCourseIds(null);
      return;
    }
    if (hidesCourseSearch) {
      setAssignedCourseIds(new Set());
      return;
    }
    if (isAdmin) {
      setAssignedCourseIds(null); // Admin: no filter, show all courses in college
      return;
    }
    // Already fetched for this exact user+role (surviving a Header remount from navigation) —
    // skip refetching the same list every time the search box is shown again.
    if (assignedCourseIdsCache.key === assignedCourseIdsCacheKey && assignedCourseIdsCache.ids != null) {
      setAssignedCourseIds(assignedCourseIdsCache.ids);
      return;
    }
    if (isTeacherRole) {
      getActiveAssignmentsByFaculty(loginUser.id)
        .then((res) => {
          const data = res?.data?.data ?? res?.data;
          const list = Array.isArray(data) ? data : [];
          const ids = new Set(list.map((a) => a.slug ?? a.course_slug ?? a.course_id ?? a.courseId).filter(Boolean));
          assignedCourseIdsCache = { key: assignedCourseIdsCacheKey, ids };
          setAssignedCourseIds(ids);
        })
        .catch(() => setAssignedCourseIds(new Set()));
      return;
    }
    // Learner: courses in their batch/semester
    getStudentCoursesBySemester(loginUser.id)
      .then((res) => {
        const data = res?.data?.data ?? res?.data;
        const courses = data?.courses ?? (Array.isArray(data) ? data : []);
        const ids = new Set((courses || []).map((c) => c.slug || c.id).filter(Boolean));
        assignedCourseIdsCache = { key: assignedCourseIdsCacheKey, ids };
        setAssignedCourseIds(ids);
      })
      .catch(() => setAssignedCourseIds(new Set()));
  }, [loginUser?.id, isAdmin, isTeacherRole, hidesCourseSearch, assignedCourseIdsCacheKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load popular courses on mount
  useEffect(() => {
    if (loginUser?.isUserLoggedIn && !hidesCourseSearch) {
      loadPopularCourses();
    }
  }, [loginUser?.isUserLoggedIn, hidesCourseSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Show default (recent + popular) suggestions; refresh when assigned courses load so filtering applies
  useEffect(() => {
    if (!searchValue && popularCourses.length >= 0) {
      showDefaultSuggestions();
    }
  }, [searchValue, popularCourses, assignedCourseIds]);

  // Admin: no filter. Student/Faculty: only courses assigned to them.
  const filterByAssigned = useCallback(
    (courses) => {
      if (courses == null || !Array.isArray(courses)) return [];
      if (assignedCourseIds == null) return courses; // Admin or not yet loaded: show all
      return courses.filter((c) => c && assignedCourseIds.has(c.slug || c.id));
    },
    [assignedCourseIds]
  );

  const loadPopularCourses = async () => {
    try {
      const response = await getPopularCourses(10);
      if (response?.data?.data) {
        setPopularCourses(response.data.data);
        showDefaultSuggestions();
      }
    } catch (error) {
    }
  };

  const showDefaultSuggestions = () => {
    const recent = JSON.parse(localStorage.getItem("recentCourses") || "[]");
    const recentFiltered = filterByAssigned(recent);
    const popularFiltered = filterByAssigned(popularCourses);
    const suggestions = [];

    if (recentFiltered.length > 0) {
      suggestions.push({
        label: "Recent",
        options: recentFiltered.slice(0, 5).map(course => ({
          value: `recent:${course.slug || course.id}`,
          label: (
            <div>
              <div>{course.courseName || course.displayName}</div>
              {course.deptName && (
                <Tag color="blue" style={{ fontSize: 10, marginTop: 4 }}>
                  {course.deptName}
                </Tag>
              )}
            </div>
          ),
          course: course,
        })),
      });
    }

    if (popularFiltered.length > 0) {
      suggestions.push({
        label: "Popular",
        options: popularFiltered.slice(0, 5).map(course => ({
          value: `popular:${course.slug || course.id}`,
          label: (
            <div>
              <div>{course.courseName || course.displayName}</div>
              {course.deptName && (
                <Tag color="volcano" style={{ fontSize: 10, marginTop: 4 }}>
                  {course.deptName}
                </Tag>
              )}
            </div>
          ),
          course: course,
        })),
      });
    }

    setCourseOptions(suggestions);
  };

  // Debounced search function
  // BE-0174: each course search has a number; a slower older answer can't replace the newer one's options.
  const courseSearchSeq = useRef(0);
  const debouncedSearch = useMemo(
    () =>
      debounce(async (query) => {
        const seq = ++courseSearchSeq.current;
        if (!query || query.trim().length < 1) {
          showDefaultSuggestions();
          setSearchLoading(false);
          return;
        }

        setSearchLoading(true);
        try {
          const response = await searchCourses(query.trim(), 15);
          if (seq !== courseSearchSeq.current) return;
          if (response?.data?.status === "success" && response?.data?.data) {
            const filtered =
              assignedCourseIds == null
                ? response.data.data
                : response.data.data.filter((c) => c && (assignedCourseIds.has(c.id) || assignedCourseIds.has(c.slug)));
            // Keyed by course, not name: two courses called "Java Programming" made duplicate React
            // keys and either pick could open the same course.
            const formatted = filtered.map(course => ({
              value: `search:${course.slug || course.id}`,
              label: (
                <div>
                  <div>{course.courseName || course.displayName}</div>
                  {course.deptName && (
                    <Tag color="blue" style={{ fontSize: 10, marginTop: 4 }}>
                      {course.deptName}
                    </Tag>
                  )}
                </div>
              ),
              course: course,
            }));

            // No group when nothing matched, so the dropdown shows "No courses found" instead of
            // an empty "Search Results" heading.
            setCourseOptions(formatted.length ? [{ label: "Search Results", options: formatted }] : []);
          } else {
            setCourseOptions([]);
          }
        } catch (error) {
          if (seq === courseSearchSeq.current) setCourseOptions([]);
        } finally {
          if (seq === courseSearchSeq.current) setSearchLoading(false);
        }
      }, 200),
    [assignedCourseIds]
  );

  const handleSearch = (value) => {
    setSearchValue(value);
    courseSearchSeq.current += 1; // typing invalidates any search already on its way
    debouncedSearch(value);
  };

  const handleSelect = (value, option) => {
    const course = option.course;
    if (!course) return;

    // Save to recent courses (dedupe by slug and id so same course appears once)
    const recent = JSON.parse(localStorage.getItem("recentCourses") || "[]");
    const isSameCourse = (c) =>
      (c?.slug && course?.slug && c.slug === course.slug) ||
      (c?.id != null && course?.id != null && c.id === course.id);
    const updated = [course, ...recent.filter((c) => !isSameCourse(c))].slice(0, 10);
    localStorage.setItem("recentCourses", JSON.stringify(updated));

    // Record selection for popularity (prefer slug to avoid exposing course ID)
    if (course.slug) {
      recordCourseSelectionBySlug(course.slug).catch(() => {});
    } else if (course.id) {
      recordCourseSelection(course.id).catch(() => {});
    }

    // Navigate to course
    // Use slug if available, fallback to id for backwards compatibility
    const courseIdentifier = course.slug || course.id;
    
    // Admin uses /college-admin/courses, Teacher -> /teacher, Learner -> /learn.
    // Teacher/learner go straight to /home: the bare [courseId]/index.js route under both of
    // those only ever client-redirects to /home itself (see courseHref's own comment on this),
    // so linking to it directly here would cost this navigation an extra mount + skeleton flash
    // for nothing. /college-admin/courses/[id] is a real page, not a redirect stub -- unaffected.
    if (isAdmin) {
      router.push({ pathname: `/college-admin/courses/${courseIdentifier}` });
    } else if (isTeacherRole) {
      router.push({ pathname: `${getFacultyCoursesPath(router.pathname, loginUser?.facultyType)}/${courseIdentifier}/home` });
    } else {
      router.push({ pathname: `/learn/courses/${courseIdentifier}/home` });
    }

    setSearchValue("");
    setCourseOptions([]);
  };

  const handleFocus = () => {
    if (!searchValue) {
      showDefaultSuggestions();
    }
  };

  return (
    <>
      {loading && <LinearProgress aria-label="Loading page" />}
      <MobileMenuDrawer
        open={menuDrawerOpen}
        onClose={() => setMenuDrawerOpen(false)}
        onAfterClose={() => menuButtonRef.current?.focus()}
      />
      {contextHolder}
      <div className={`ln-dashboard-header bg-white ln-head ln-head--pd30 d-flex justify-content-between p-3 ${isTpoUser ? "tpo-shell-header" : isRecruiter ? "recruiter-shell-header" : ""}`}>
        <div className="ln-mob-ham col-1">
          <button
            ref={menuButtonRef}
            type="button"
            className="ln-mob-ham-btn"
            aria-label="Open navigation menu"
            aria-expanded={menuDrawerOpen}
            aria-haspopup="dialog"
            onClick={() => setMenuDrawerOpen(true)}
            style={{ minWidth: 44, minHeight: 44, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <MenuOutlined
              aria-hidden="true"
              style={{ color: "#84828B", fontSize: "23px" }}
              className="menu-side-icon ms-2 pb-1"
            />
          </button>
        </div>
          {hidesCourseSearch ? (isTpoUser ? <TpoTopBar /> : isRecruiter ? <RecruiterTopBar /> : <div className="ln-glob-sch col-4" aria-hidden="true" />) : (
          <div className="ln-glob-sch col-4">
            <AutoComplete
              style={{ width: "100%" }}
              options={courseOptions}
              onSearch={handleSearch}
              onSelect={handleSelect}
              onFocus={handleFocus}
              value={searchValue}
              allowClear
              notFoundContent={
                searchLoading ? (
                  <span role="status" aria-live="polite">
                    <Spin size="small" aria-hidden="true" />
                    <span className="sr-only">Searching courses</span>
                  </span>
                ) : (
                  "No courses found. Try a different search."
                )
              }
              filterOption={false} // We handle filtering on the backend
              dropdownStyle={{ maxHeight: "min(400px, calc(100vh - 80px))", overflow: "auto" }}
            >
              <Input aria-label="Search courses" placeholder="Search Courses (e.g., Java, Data Structures, CS...)" />
            </AutoComplete>
          </div>
          )}
        {/* )} */}

        {(orgName || activeMembershipDisplay?.title || org?.logo || (Array.isArray(memberships) && memberships.length > 0)) && (
          <div className="ln-org-text-mob d-flex gap-1 align-items-center justify-content-center">
            {collegeLogoEl}
            {/* Hide workspace count in topbar to reduce noise. */}
            {Array.isArray(memberships) && memberships.length > 1 ? (
              <Select
                size="small"
                className="ln-org-switcher ln-org-switcher--mobile"
                aria-label="Switch workspace"
                popupClassName="ln-org-switcher-dropdown"
                dropdownStyle={{ minWidth: "min(420px, 92vw)", maxWidth: "92vw" }}
                getPopupContainer={() => document.body}
                placement="bottomRight"
                style={{ minWidth: 128 }}
                value={(pendingMembershipKey || activeMembershipKey) || undefined}
                loading={switching}
                disabled={switching}
                onChange={handleOrgSwitch}
                placeholder="Switch"
                showSearch
                optionFilterProp="label"
                optionLabelProp="triggerLabel"
                filterOption={filterMembershipOption}
                options={membershipOptions}
              />
            ) : (
              <span className="ln-org-current ln-org-current--mobile">
                <span className="ln-org-current__title black">{orgName || activeMembershipDisplay?.title}</span>
              </span>
            )}
          </div>
        )}

        <div className={`gap-3 d-flex justify-content-end align-items-center ${isTpoUser ? "tpo-shell-header__account" : isRecruiter ? "recruiter-shell-header__account" : ""}`}>
          {(orgName || activeMembershipDisplay?.title || org?.logo || (Array.isArray(memberships) && memberships.length > 0)) && (
            <div className="ln-org-text-desk d-flex align-items-center">
              {collegeLogoEl}
              {/* Hide workspace count in topbar to reduce noise. */}
              {Array.isArray(memberships) && memberships.length > 1 ? (
              <Select
                size="small"
                className="ln-org-switcher"
                popupClassName="ln-org-switcher-dropdown"
                dropdownStyle={{ minWidth: "min(460px, 92vw)", maxWidth: "92vw" }}
                getPopupContainer={() => document.body}
                placement="bottomRight"
                style={{ minWidth: 220, maxWidth: 320 }}
                value={(pendingMembershipKey || activeMembershipKey) || undefined}
                loading={switching}
                disabled={switching}
                onChange={handleOrgSwitch}
                  placeholder="Switch workspace"
                  showSearch
                  optionFilterProp="label"
                  optionLabelProp="triggerLabel"
                  filterOption={filterMembershipOption}
                  options={membershipOptions}
                />
              ) : (
                <div className="ln-org-current">
                  <Text className="ln-org-current__title black" ellipsis>
                    {orgName || activeMembershipDisplay?.title}
                  </Text>
                </div>
              )}
            </div>
          )}
          <div className="d-flex gap-1 justify-content-center align-items-center ">
            {/*Notification Dropdown  */}
            {/* TPO already has its own bell in TpoTopBar (getBell/TpoHubService) - showing this
                global one too meant two unread-count bells in the same header (SHELL-02).
                College admins neither send nor receive in-app notifications (their feed is always
                empty and there is no page to "view all" on), so the bell only ever opened an empty
                panel and read as broken. Hidden for them, like recruiter. */}
            {!isRecruiter && !isTpoUser && !isAdmin && (
              <div className="ln-head-notif">
                <NotificationDropdown />
              </div>
            )}
            {/*My profile Dropdown  */}
            <ProfileDropdown />
          </div>
        </div>
      </div>
    </>
  );

};

export default memo(DashboardHeader);
