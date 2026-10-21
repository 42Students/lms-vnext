import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Table, Button, Tag, Space, Modal, message, Typography, Descriptions, Select, Card, Divider, Form, Row, Col, Statistic, Spin, Popconfirm, Input, Checkbox, Alert, Timeline, Empty, Tooltip } from "antd";
import { ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, UserOutlined, RocketOutlined, ReloadOutlined, EditOutlined, CopyOutlined, DownloadOutlined, CalendarOutlined, HistoryOutlined } from "@ant-design/icons";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import {
  getInterviewsForApplication,
  scheduleInterview,
  cancelInterview,
  updateInterview,
  markInterviewCompleted,
} from "@/api/Services/interviewService";
import {
  getDepartmentsByCollege,
  getProgramsByCollege,
  getBatchesByCollege,
  getClassesByCollege,
  getColleges,
  getJobContext,
  getAdminJobById,
  getAdminHiringMetrics,
  getAdminJobApplications,
  getAdminJobApplication,
  updateAdminApplicationStatus,
  bulkUpdateAdminApplicationStatus,
  updateAdminApplicationNotes,
  attachAdminOfferLetter,
  exportAdminJobApplicationsCsv,
  getAdminApplicationHistory,
  getAdminResumePreviewUrl,
  getAdminApplicationScreening,
  rescreenAdminApplication,
} from "@/api/Services/AdminService";
import Title from "@/components/Global/titles/title";
import moment from "moment";
import { parsePlacementUtcDateTime, placementLocalDateKey, formatPlacementDateShort, formatPlacementDateTime } from "@/utils/placementDateTime";
import { downloadInterviewIcs } from "@/utils/icsExport";
import InterviewForm from "./InterviewForm";
import InterviewEditForm from "./InterviewEditForm";
import InterviewFeedbackForm from "./InterviewFeedbackForm";
import renderStructuredValue from "@/components/admin/projects/renderStructuredValue";
import { buildBulkStatusPreview, getAdminValidApplicationTransitions, partitionAdminTransitionTargets, reconcileSelectedApplicationIds } from "@/utils/placementApplicationTransitions";
import { DashboardSkeleton, ListSkeleton, RefreshStatus, TableSkeleton } from "@/components/Common/Skeletons";
import { PanelEmpty, StatusBadge, STATUS_TONE } from "@/components/Common/PanelStates";

const { Text, Paragraph, Title: AntTitle } = Typography;
const { Option } = Select;

const readQueryString = (value) =>
  Array.isArray(value) ? (value[0] || "") : (typeof value === "string" ? value : "");

const readQueryId = (value) => {
  const raw = Array.isArray(value) ? value[0] : value;
  const number = Number(raw);
  return Number.isInteger(number) && number > 0 ? number : undefined;
};

export default function JobApplications({ jobType, fortyTwoLearnId, collegeId: propCollegeId, basePath = "/superadmin", shortlistedMode = false }) {
  const router = useRouter();
  const { jobId, type, status: statusQueryParam } = router.query;
  const loginUser = useSelector((state) => state.loginUser);
  const isAdminMode = basePath === "/college-admin" || shortlistedMode;
  const enforceHeaderCollegeScope = basePath === "/superadmin";
  const [job, setJob] = useState(null);
  // True per-status counts for the whole job (not just the current page) — the status tiles
  // below used to count only `applications`, which in admin mode is a single server page, so a
  // job with thousands of applicants showed tiny tile numbers next to a header correctly saying
  // "Applications (8000)".
  const [jobStatusCounts, setJobStatusCounts] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeApplicationsScopeKey, setActiveApplicationsScopeKey] = useState(null);
  const [loadedApplicationsScopeKey, setLoadedApplicationsScopeKey] = useState(null);
  const [fetchErrorScopeKey, setFetchErrorScopeKey] = useState(null);
  const [loadedJobScopeKey, setLoadedJobScopeKey] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [interviews, setInterviews] = useState({}); // applicationId -> interviews array
  const [interviewsLoading, setInterviewsLoading] = useState(false);
  const [interviewsError, setInterviewsError] = useState(null);
  const [interviewActionKey, setInterviewActionKey] = useState(null);
  const [interviewActionError, setInterviewActionError] = useState(null);
  const interviewActionRef = useRef(null);
  const [interviewFormVisible, setInterviewFormVisible] = useState(false);
  const [schedulingForApplication, setSchedulingForApplication] = useState(null);
  const [editingInterview, setEditingInterview] = useState(null);
  const [feedbackForInterview, setFeedbackForInterview] = useState(null);

  const hierarchyAbortRef = useRef(null);
  const appsAbortRef = useRef(null);
  const queryHydratedRef = useRef(false);
  const mutationRef = useRef(false);
  const confirmRef = useRef(false);
  const exportRef = useRef(false);
  
  // Hierarchy data for onboarding (college-scoped)
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [batches, setBatches] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(null);
  const [selectedProgramId, setSelectedProgramId] = useState(null);
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  // College name lookup (id -> name) for table and modal
  const [collegesMap, setCollegesMap] = useState({});
  // statusUpdatedBy ID -> name (from applications API)
  const [statusUpdatedByNames, setStatusUpdatedByNames] = useState({});
  // Pagination and bulk (admin mode)
  // Deep-linked from the Drives landing page's "needs attention" queue (?status=APPLIED etc.) so
  // clicking a queue item lands directly on the relevant filter instead of a blank "ALL" list.
  const VALID_STATUS_TABS = ["ALL", "APPLIED", "SHORTLISTED", "ASSESSMENT", "INTERVIEW", "WAITLISTED", "REJECTED", "OFFERED", "WITHDRAWN"];
  const defaultStatusTab = shortlistedMode ? "ASSESSMENT" : "ALL";
  const normalizedStatusQuery = Array.isArray(statusQueryParam) ? statusQueryParam[0] : statusQueryParam;
  const [statusTab, setStatusTab] = useState(() =>
    VALID_STATUS_TABS.includes(normalizedStatusQuery) ? normalizedStatusQuery : defaultStatusTab
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalElements, setTotalElements] = useState(0);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [csvExporting, setCsvExporting] = useState(false);
  // "Select all N matching filter" — without this, bulk actions only ever reach the current
  // page (max 100 rows); triaging a drive with 1,000+ applicants meant re-selecting ~10+ times.
  const [selectAllMatching, setSelectAllMatching] = useState(false);
  const bulkCount = selectAllMatching ? totalElements : selectedRowKeys.length;
  const SELECT_ALL_MATCHING_CAP = 3000;
  // Filters (5.5, 5.6)
  const [filterSource, setFilterSource] = useState(undefined);
  const [filterDepartmentId, setFilterDepartmentId] = useState(undefined);
  const [filterProgramId, setFilterProgramId] = useState(undefined);
  const [filterBatchId, setFilterBatchId] = useState(undefined);
  const filteredPrograms = useMemo(
    () => programs.filter((p) => !filterDepartmentId || (p.deptId ?? p.dept_id ?? p.departmentId) === filterDepartmentId),
    [programs, filterDepartmentId]
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");

  const updateApplicationQuery = useCallback((patch) => {
    if (!router.isReady || !isAdminMode) return;
    const next = { ...(router.query || {}), ...patch };

    if (!next.q) delete next.q;
    if (!next.source) delete next.source;
    if (!next.dept) delete next.dept;
    if (!next.program) delete next.program;
    if (!next.batch) delete next.batch;
    if (!next.page || Number(next.page) === 1) delete next.page;
    if (!next.size || Number(next.size) === 20) delete next.size;
    if (!next.status || next.status === defaultStatusTab) delete next.status;

    router.replace(
      { pathname: router.pathname, query: next },
      undefined,
      { shallow: true, scroll: false }
    );
  }, [router, isAdminMode, defaultStatusTab]);

  const clearSecondaryApplicationFilters = useCallback(() => {
    setSearchQuery("");
    setSearchDebounced("");
    setFilterSource(undefined);
    setFilterDepartmentId(undefined);
    setFilterProgramId(undefined);
    setFilterBatchId(undefined);
    setCurrentPage(1);
    updateApplicationQuery({
      q: "",
      source: undefined,
      dept: undefined,
      program: undefined,
      batch: undefined,
      page: 1,
    });
  }, [updateApplicationQuery]);

  const hasSecondaryApplicationFilters = Boolean(
    searchQuery ||
    filterSource ||
    filterDepartmentId ||
    filterProgramId ||
    filterBatchId
  );
  const hasApplicationFilters =
    hasSecondaryApplicationFilters || statusTab !== defaultStatusTab;

  const clearAllApplicationFilters = useCallback(() => {
    setSearchQuery("");
    setSearchDebounced("");
    setFilterSource(undefined);
    setFilterDepartmentId(undefined);
    setFilterProgramId(undefined);
    setFilterBatchId(undefined);
    setStatusTab(defaultStatusTab);
    setCurrentPage(1);
    updateApplicationQuery({
      q: "",
      source: undefined,
      dept: undefined,
      program: undefined,
      batch: undefined,
      status: defaultStatusTab,
      page: 1,
    });
  }, [defaultStatusTab, updateApplicationQuery]);
  // Move to Assessment modal
  const [assessmentModalVisible, setAssessmentModalVisible] = useState(false);
  const [assessmentModalApplicationIds, setAssessmentModalApplicationIds] = useState([]);
  const [assessmentModalUrl, setAssessmentModalUrl] = useState("");
  const [assessmentModalSaveToJob, setAssessmentModalSaveToJob] = useState(true);
  const [assessmentModalLoading, setAssessmentModalLoading] = useState(false);
  // Single reject: modal with optional reason
  const [rejectModal, setRejectModal] = useState({ visible: false, applicationId: null, reason: "" });
  // Bulk reject: modal with optional reason (applied to all)
  const [bulkRejectModal, setBulkRejectModal] = useState({ visible: false, reason: "", targetIds: [] });
  // Phase 7 - 21.3.3: Bulk partial failure details modal
  const [bulkFailureModal, setBulkFailureModal] = useState({ visible: false, count: 0, failed: [] });
  // Phase 6 - 17.5: Error state with retry
  const [fetchError, setFetchError] = useState(null);
  // Internal notes edit modal
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  // Application history (Gap 8.2) - for detail modal
  const [applicationHistory, setApplicationHistory] = useState({ data: [], loading: false, fetched: false, error: null });
  const [notesEditValue, setNotesEditValue] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSaveError, setNotesSaveError] = useState("");
  const originalNotesRef = useRef("");
  // Resume inline preview — resumeUrl on the application object is a bare, permanent, unsigned
  // R2 URL; it must be resolved through the resume-preview endpoint (short-lived presigned GET)
  // on each open rather than used directly, same protection the learner's own profile page
  // already gets for its resume view.
  const [resumePreviewUrl, setResumePreviewUrl] = useState(null);
  const [resumePreviewLoading, setResumePreviewLoading] = useState(false);
  // P3 in the audit: ApplicationScreening detail was a "near-total black box" -- only
  // screeningScore/explanation surfaced anywhere. Loaded on demand (not on every modal open) since
  // most applications reviewed in a sitting are never opened for this level of detail.
  const [screeningDetail, setScreeningDetail] = useState({ data: null, loading: false, fetched: false, error: null });
  const [rescreening, setRescreening] = useState(false);
  // Offer letter attach/update modal
  const [offerLetterModalVisible, setOfferLetterModalVisible] = useState(false);
  const [offerLetterEditValue, setOfferLetterEditValue] = useState("");
  const [offerLetterSaving, setOfferLetterSaving] = useState(false);
  const [offerLetterSaveError, setOfferLetterSaveError] = useState("");
  const originalOfferLetterRef = useRef("");

  // Determine job type from props or query param
  const currentJobType = jobType || type || "lms";
  // Phase 6 - 19.1: resolvedCollegeId from job context API when collegeId missing (deep link)
  const [resolvedCollegeId, setResolvedCollegeId] = useState(null);
  const [contextAccessDenied, setContextAccessDenied] = useState(false);
  const collegeId = (propCollegeId ?? loginUser?.collegeId ?? resolvedCollegeId ?? null);
  const contextMissing = (collegeId == null);
  const organizationId = loginUser?.organizationId ?? job?.organizationId ?? null;

  const missingCollegeContext = enforceHeaderCollegeScope && propCollegeId == null;
  const jobScopeKey = collegeId != null && jobId != null ? `${collegeId}:${jobId}` : null;
  const applicationsScopeKey = jobScopeKey
    ? JSON.stringify([
        jobScopeKey,
        currentJobType,
        (isAdminMode || shortlistedMode) ? statusTab : null,
        (isAdminMode || shortlistedMode) ? currentPage : null,
        (isAdminMode || shortlistedMode) ? pageSize : null,
        (isAdminMode || shortlistedMode) ? filterSource ?? null : null,
        (isAdminMode || shortlistedMode) ? filterDepartmentId ?? null : null,
        (isAdminMode || shortlistedMode) ? filterProgramId ?? null : null,
        (isAdminMode || shortlistedMode) ? filterBatchId ?? null : null,
        (isAdminMode || shortlistedMode) ? searchDebounced || "" : "",
      ])
    : null;
  const hasCurrentJob = jobScopeKey != null && loadedJobScopeKey === jobScopeKey && job != null;
  const hasCurrentApplications = applicationsScopeKey != null && loadedApplicationsScopeKey === applicationsScopeKey;
  const currentFetchError = activeApplicationsScopeKey != null && fetchErrorScopeKey === activeApplicationsScopeKey ? fetchError : null;
  const initialApplicationsLoading = loading && !hasCurrentApplications;
  const applicationsRefreshing = loading && hasCurrentApplications;

  const closeNotesEditor = () => {
    if (notesSaving) return;
    if (notesEditValue === originalNotesRef.current) {
      setNotesModalVisible(false);
      setNotesSaveError("");
      return;
    }
    Modal.confirm({
      title: "Discard note changes?",
      content: "Your unsaved internal notes will be lost.",
      okText: "Discard changes",
      okButtonProps: { danger: true },
      onOk: () => {
        setNotesModalVisible(false);
        setNotesSaveError("");
        setNotesEditValue(originalNotesRef.current);
      },
    });
  };

  const closeOfferLetterEditor = () => {
    if (offerLetterSaving) return;
    if ((offerLetterEditValue || "").trim() === (originalOfferLetterRef.current || "").trim()) {
      setOfferLetterModalVisible(false);
      setOfferLetterSaveError("");
      return;
    }
    Modal.confirm({
      title: "Discard offer letter changes?",
      content: "Your unsaved offer letter link will be lost.",
      okText: "Discard changes",
      okButtonProps: { danger: true },
      onOk: () => {
        setOfferLetterModalVisible(false);
        setOfferLetterSaveError("");
        setOfferLetterEditValue(originalOfferLetterRef.current);
      },
    });
  };

  // Cleanup all in-flight requests on unmount
  useEffect(() => {
    return () => {
      hierarchyAbortRef.current?.abort();
      appsAbortRef.current?.abort();
    };
  }, []);

  // When collegeId is missing, we do NOT auto-resolve it from the job's own college and
  // rewrite the URL to match — that would let an admin with no (or a mismatched) college
  // assignment reach another college's applications just by knowing/guessing a jobId. Every
  // surface must supply collegeId itself (from the authenticated admin's own assignment, or
  // an explicit superadmin-mode selection) rather than have this component infer it.
  useEffect(() => {
    if (!jobId) return;
    if (missingCollegeContext) return;
    if (enforceHeaderCollegeScope) return;
    if (isAdminMode) return;
    const hasCollege = propCollegeId != null || loginUser?.collegeId != null || resolvedCollegeId != null;
    if (hasCollege) return;
    const parsedJobId = parseInt(jobId, 10);
    if (Number.isNaN(parsedJobId) || parsedJobId <= 0) return;
    setContextAccessDenied(false);
    getJobContext(parsedJobId)
      .then((res) => {
        const data = res?.data?.data ?? res?.data;
        const cid = data?.collegeId;
        if (cid != null) {
          setResolvedCollegeId(cid);
          if (router.query.collegeId !== String(cid)) {
            router.replace({ pathname: router.pathname, query: { ...router.query, collegeId: cid } }, undefined, { shallow: true });
          }
        }
      })
      .catch((err) => {
        const status = err?.response?.status;
        if (status === 403 || status === 401) {
          setContextAccessDenied(true);
        }
      });
  }, [jobId, propCollegeId, loginUser?.collegeId, resolvedCollegeId, enforceHeaderCollegeScope]);

  // For display only: ensure we always have a stable name for the currently-scoped college.
  useEffect(() => {
    if (collegeId == null) return;
    setCollegesMap((prev) => (prev[collegeId] != null ? prev : { ...prev, [collegeId]: `College ${collegeId}` }));
  }, [collegeId]);

  useEffect(() => {
    if (missingCollegeContext) return;
    if (!jobId || contextMissing) return;
    fetchHierarchyData();
  }, [jobId, collegeId, contextMissing]);

  // URL is the durable list-state source for admin triage. Refresh, Back and copied deep links
  // restore the same status/search/cohort/page instead of silently returning to defaults.
  useEffect(() => {
    if (!router.isReady || !isAdminMode) return;

    const rawStatus = readQueryString(router.query.status).toUpperCase();
    const nextStatus = VALID_STATUS_TABS.includes(rawStatus) ? rawStatus : defaultStatusTab;
    const nextSearch = readQueryString(router.query.q);
    const rawSource = readQueryString(router.query.source).toUpperCase();
    const nextSource = ["INTERNAL", "EXTERNAL"].includes(rawSource) ? rawSource : undefined;
    const nextDepartment = readQueryId(router.query.dept);
    const nextProgram = readQueryId(router.query.program);
    const nextBatch = readQueryId(router.query.batch);
    const nextPage = Math.max(1, readQueryId(router.query.page) || 1);
    const sizeCandidate = readQueryId(router.query.size);
    const nextSize = [10, 20, 50, 100].includes(sizeCandidate) ? sizeCandidate : 20;

    queryHydratedRef.current = false;
    setStatusTab(nextStatus);
    setSearchQuery(nextSearch);
    setSearchDebounced(nextSearch);
    setFilterSource(nextSource);
    setFilterDepartmentId(nextDepartment);
    setFilterProgramId(nextProgram);
    setFilterBatchId(nextBatch);
    setCurrentPage(nextPage);
    setPageSize(nextSize);
    setSelectedRowKeys([]);
    setSelectAllMatching(false);
    queryHydratedRef.current = true;
  }, [
    router.isReady,
    router.query.status,
    router.query.q,
    router.query.source,
    router.query.dept,
    router.query.program,
    router.query.batch,
    router.query.page,
    router.query.size,
    isAdminMode,
    defaultStatusTab,
  ]);

  // Debounce typed search, but never reset a page that was just restored from the URL.
  useEffect(() => {
    if (!isAdminMode) {
      const t = setTimeout(() => setSearchDebounced(searchQuery), 400);
      return () => clearTimeout(t);
    }
    if (!queryHydratedRef.current || !router.isReady) return undefined;

    const querySearch = readQueryString(router.query.q);
    if (searchQuery === querySearch) {
      setSearchDebounced(searchQuery);
      return undefined;
    }

    const t = setTimeout(() => {
      setSearchDebounced(searchQuery);
      setCurrentPage(1);
      setSelectedRowKeys([]);
      setSelectAllMatching(false);
      updateApplicationQuery({ q: searchQuery, page: 1 });
    }, 400);
    return () => clearTimeout(t);
  }, [searchQuery, isAdminMode, router.isReady, router.query.q, updateApplicationQuery]);

  useEffect(() => {
    if (missingCollegeContext) return;
    if (!jobId || contextMissing) return;
    fetchJobAndApplications();
  }, [jobId, currentJobType, collegeId, contextMissing, (isAdminMode || shortlistedMode) ? statusTab : null, (isAdminMode || shortlistedMode) ? currentPage : null, (isAdminMode || shortlistedMode) ? pageSize : null, (isAdminMode || shortlistedMode) ? filterSource : null, (isAdminMode || shortlistedMode) ? filterDepartmentId : null, (isAdminMode || shortlistedMode) ? filterProgramId : null, (isAdminMode || shortlistedMode) ? filterBatchId : null, (isAdminMode || shortlistedMode) ? searchDebounced : null]);

  const handleStatusTabChange = useCallback((tab) => {
    setStatusTab(tab);
    setCurrentPage(1);
    setSelectedRowKeys([]);
    setSelectAllMatching(false);
    updateApplicationQuery({ status: tab, page: 1 });
  }, [updateApplicationQuery]);

  const handleSourceFilterChange = useCallback((value) => {
    setFilterSource(value);
    setCurrentPage(1);
    setSelectedRowKeys([]);
    setSelectAllMatching(false);
    updateApplicationQuery({ source: value, page: 1 });
  }, [updateApplicationQuery]);

  const handleDepartmentFilterChange = useCallback((value) => {
    setFilterDepartmentId(value);
    setFilterProgramId(undefined);
    setFilterBatchId(undefined);
    setCurrentPage(1);
    setSelectedRowKeys([]);
    setSelectAllMatching(false);
    updateApplicationQuery({ dept: value, program: undefined, batch: undefined, page: 1 });
  }, [updateApplicationQuery]);

  const handleProgramFilterChange = useCallback((value) => {
    setFilterProgramId(value);
    setFilterBatchId(undefined);
    setCurrentPage(1);
    setSelectedRowKeys([]);
    setSelectAllMatching(false);
    updateApplicationQuery({ program: value, batch: undefined, page: 1 });
  }, [updateApplicationQuery]);

  const handleBatchFilterChange = useCallback((value) => {
    setFilterBatchId(value);
    setCurrentPage(1);
    setSelectedRowKeys([]);
    setSelectAllMatching(false);
    updateApplicationQuery({ batch: value, page: 1 });
  }, [updateApplicationQuery]);

  const handleApplicationsPageChange = useCallback((page, size) => {
    const nextSize = size || 20;
    setCurrentPage(page);
    setPageSize(nextSize);
    setSelectedRowKeys([]);
    setSelectAllMatching(false);
    updateApplicationQuery({ page, size: nextSize });
  }, [updateApplicationQuery]);

  // Refetch when user returns to the tab so list stays in sync with other admins.
  // fetchJobAndApplications itself owns selection reconciliation for EVERY successful refresh;
  // keeping a second focus-only prune here would duplicate state updates and could disagree on
  // numeric-vs-string Ant Table keys.
  useEffect(() => {
    if (missingCollegeContext) return;
    const onFocus = () => {
      if (!jobId || contextMissing) return;
      fetchJobAndApplications();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [jobId, contextMissing]);

  const fetchHierarchyData = async () => {
    if (!collegeId) return;
    hierarchyAbortRef.current?.abort();
    const ac = new AbortController();
    hierarchyAbortRef.current = ac;
    const signal = ac.signal;
    try {
      const requests = [
        getDepartmentsByCollege(collegeId),
        getProgramsByCollege(collegeId),
        getBatchesByCollege(collegeId),
        getClassesByCollege(collegeId),
      ];
      // In Superadmin we avoid global lookups; college name can be shown as "College <id>".
      if (!enforceHeaderCollegeScope) {
        requests.push(getColleges());
      }

      const [deptRes, progRes, batchRes, classRes, collegesRes] = await Promise.all(requests);
      if (signal.aborted) return;
      const ok = (r) => r?.data?.status === "success" || r?.data?.status === "OK";
      const toList = (r) => (Array.isArray(r?.data?.data) ? r.data.data : Array.isArray(r?.data) ? r.data : []);
      if (ok(deptRes)) setDepartments(toList(deptRes));
      if (ok(progRes)) setPrograms(toList(progRes));
      if (ok(batchRes)) setBatches(toList(batchRes));
      if (ok(classRes)) setClasses(toList(classRes));
      if (!enforceHeaderCollegeScope && collegesRes?.data) {
        const list = Array.isArray(collegesRes.data) ? collegesRes.data : collegesRes.data?.data ?? [];
        const map = {};
        list.forEach((c) => { if (c?.id != null) map[c.id] = c.name || c.collegeName || `College ${c.id}`; });
        setCollegesMap(map);
      }
    } catch (error) {
      if (error?.name === "AbortError" || error?.code === "ERR_CANCELED") return;
      message.warning("Some dropdown data failed to load");
    }
  };

  const fetchAllApplicationsForJob = async (jobIdToLoad, collegeIdToLoad, signal, baseParams = {}) => {
    const pageSizeForFullFetch = 100;
    let page = 0;
    let totalPages = 1;
    let merged = [];
    let names = {};

    while (page < totalPages) {
      const response = await getAdminJobApplications(
        jobIdToLoad,
        collegeIdToLoad,
        { ...baseParams, page, size: pageSizeForFullFetch },
        { signal }
      );
      const data = response?.data?.data ?? response?.data ?? {};
      const rows = data?.content ?? (Array.isArray(data) ? data : []);
      merged = merged.concat(rows);
      names = { ...names, ...(data?.statusUpdatedByNames || {}) };

      const parsedTotalPages = Number(data?.totalPages);
      if (Number.isFinite(parsedTotalPages) && parsedTotalPages > 0) {
        totalPages = parsedTotalPages;
      } else {
        totalPages = rows.length < pageSizeForFullFetch ? page + 1 : page + 2;
      }
      page += 1;
      if (signal?.aborted) break;
    }

    return { rows: merged, statusUpdatedByNames: names };
  };

  const fetchJobAndApplications = async () => {
    const parsedJobId = parseInt(jobId, 10);
    if (Number.isNaN(parsedJobId) || parsedJobId <= 0) {
      message.error("Invalid job ID");
      setLoading(false);
      return;
    }
    appsAbortRef.current?.abort();
    const ac = new AbortController();
    appsAbortRef.current = ac;
    const signal = ac.signal;
    const requestApplicationsScopeKey = applicationsScopeKey;
    const requestJobScopeKey = jobScopeKey;
    const applicationScopeChanged = loadedApplicationsScopeKey !== requestApplicationsScopeKey;
    const jobChanged = loadedJobScopeKey !== requestJobScopeKey;
    setActiveApplicationsScopeKey(requestApplicationsScopeKey);
    if (applicationScopeChanged) {
      setApplications([]);
      setTotalElements(0);
      setStatusUpdatedByNames({});
      setSelectedRowKeys([]);
      setSelectAllMatching(false);
    }
    if (jobChanged) {
      setJob(null);
      setJobStatusCounts(null);
    }
    setLoading(true);
    setFetchError(null);
    setFetchErrorScopeKey(null);
    let existingApps = [];
    let applicationsFetchSucceeded = true;
    try {
      let currentJob = null;

      // Admin (college-scoped) job and applications
      if (collegeId) {
        try {
          const jobResponse = await getAdminJobById(parsedJobId, collegeId);
          if (jobResponse?.data?.status === "success") {
            currentJob = jobResponse.data.data;
            setJob(currentJob);
            setLoadedJobScopeKey(requestJobScopeKey);
          }
          // Fire-and-forget: true per-status counts for the whole job, not just this page.
          getAdminHiringMetrics(collegeId, { jobId: parsedJobId })
            .then((res) => {
              if (res?.data?.status === "success") setJobStatusCounts(res.data.data || null);
            })
            .catch(() => {});
          if (isAdminMode || shortlistedMode) {
            const applicationsResponse = await getAdminJobApplications(parsedJobId, collegeId, {
              page: currentPage - 1,
              size: pageSize,
              applicationStatus: (statusTab === "ALL" && !shortlistedMode) ? undefined : statusTab,
              source: filterSource,
              departmentId: filterDepartmentId,
              programId: filterProgramId,
              batchId: filterBatchId,
              search: searchDebounced && searchDebounced.trim() ? searchDebounced.trim() : undefined,
            });
            if (applicationsResponse?.data?.status === "success") {
              const data = applicationsResponse.data.data ?? applicationsResponse.data;
              const raw = data?.content ?? (Array.isArray(data) ? data : []);
              existingApps = raw;
              setTotalElements(data?.totalElements ?? raw.length);
              setStatusUpdatedByNames(data?.statusUpdatedByNames ?? {});
            }
          } else {
            const allApps = await fetchAllApplicationsForJob(parsedJobId, collegeId, signal, {
              applicationStatus: (statusTab === "ALL" && !shortlistedMode) ? undefined : statusTab,
            });
            existingApps = allApps.rows;
            setStatusUpdatedByNames(allApps.statusUpdatedByNames || {});
          }
        } catch (error) {
          applicationsFetchSucceeded = false;
          const msg = error?.response?.data?.message;
          setFetchError(msg || "Failed to load job and applications. Please try again.");
          setFetchErrorScopeKey(requestApplicationsScopeKey);

        }
      }

      // Only overwrite applications when this fetch actually succeeded — on failure, keep
      // showing the last-known-good data instead of wiping it to a misleading empty state;
      // the fetchError banner already communicates the failure.
      if (!signal.aborted && applicationsFetchSucceeded) {
        setApplications(existingApps);
        setLoadedApplicationsScopeKey(requestApplicationsScopeKey);
        // Selection is stateful across pagination/filter refreshes. Reconcile it to the rows
        // that actually came back from this successful fetch so deleted/moved/filtered-out IDs
        // cannot survive as invisible bulk targets.
        setSelectedRowKeys((prev) => reconcileSelectedApplicationIds(prev, existingApps));
      }
      return existingApps;

    } catch (error) {
      if (error?.name === "AbortError" || error?.code === "ERR_CANCELED") return existingApps;
      const msg = error?.response?.data?.message;
      setFetchError(msg || "Failed to load job and applications. Please try again.");
      setFetchErrorScopeKey(requestApplicationsScopeKey);

      return existingApps;
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  };

  // handleViewDetails re-renders whatever object it's given verbatim — if a caller passes back
  // the same pre-change object after an action that changed the application's own status
  // server-side (e.g. scheduling round 1 flips APPLIED status to INTERVIEW), the modal shows a
  // stale "Current Status" and stale action buttons until it's closed and reopened. Call this
  // after any in-modal action instead of handleViewDetails(selectedApplication) directly — it
  // refetches the list and re-opens the modal with whichever row is now actually current.
  const refreshSelectedApplicationDetails = async (applicationId) => {
    if (!applicationId || !jobId || !collegeId) return;
    try {
      // Fetch by application identity, not from the currently-filtered/paginated table. A status
      // mutation can intentionally move this row out of the active filter, and falling back to the
      // old row in that case leaves the modal showing stale status/actions.
      const response = await getAdminJobApplication(parseInt(jobId, 10), applicationId, collegeId);
      const fresh = response?.data?.data ?? null;
      if (!fresh?.id) throw new Error("Application detail response was empty");
      await handleViewDetails(fresh);
    } catch (error) {
      setDetailModalVisible(false);
      setSelectedApplication(null);
      message.error(
        error?.response?.data?.message
          || "The application changed, but its latest details could not be loaded. Refresh and reopen it."
      );
    }
  };

  const handleStatusChange = async (applicationId, newStatus, rejectionReason = null) => {
    if (mutationRef.current) return false;
    if (!collegeId || !jobId) {
      message.error("Missing job or college context");
      return;
    }
    const id = (typeof applicationId === "number") ? applicationId : parseInt(applicationId, 10);
    if (Number.isNaN(id) || id <= 0) return;
    mutationRef.current = true;
    setActionLoading((prev) => ({ ...prev, [applicationId]: true }));
    try {
      const response = await updateAdminApplicationStatus(
        parseInt(jobId, 10),
        id,
        newStatus,
        collegeId,
        undefined,
        newStatus === "REJECTED" ? rejectionReason : undefined
      );
      if (response?.data?.status === "success") {
        message.success("Application status updated successfully");
        fetchJobAndApplications();
        return true;
      } else {
        message.error(response?.data?.message || "Failed to update status");
        return false;
      }
    } catch (error) {
      const msg = error?.response?.data?.message;
      message.error(msg || "Failed to update application status");
      return false;
    } finally {
      mutationRef.current = false;
      setActionLoading((prev) => ({ ...prev, [applicationId]: false }));
    }
  };

  const handleViewDetails = async (application) => {
    setSelectedApplication(application);
    setApplicationHistory({ data: [], loading: false, fetched: false, error: null });
    setInterviewsError(null);
    setScreeningDetail({ data: null, loading: false, fetched: false, error: null });
    setDetailModalVisible(true);
    if (!organizationId) return; // Skip interview fetch; details modal still opens
    setInterviewsLoading(true);
    try {
      const response = await getInterviewsForApplication(application.id, organizationId);
      if (response?.data?.status === "success") {
        setInterviews(prev => ({ ...prev, [application.id]: response.data.data ?? [] }));
        setInterviewsError(null);
      }
    } catch (error) {
      setInterviewsError(error?.response?.data?.message || "Failed to load interviews");
      setInterviews(prev => ({ ...prev, [application.id]: undefined }));
    } finally {
      setInterviewsLoading(false);
    }
  };

  const fetchApplicationHistory = async () => {
    if (!selectedApplication?.id || !job?.id || !collegeId || selectedApplication.isExternalPending) return;
    setApplicationHistory((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const res = await getAdminApplicationHistory(job.id, selectedApplication.id, collegeId);
      if (res?.data?.status !== "success" || !Array.isArray(res.data.data)) {
        throw new Error(res?.data?.message || "Invalid status history response");
      }
      const items = (res.data.data || []).filter((h) => h && (h.newStatus || h.oldStatus));
      setApplicationHistory({ data: items, loading: false, fetched: true, error: null });
    } catch (e) {
      const error = e?.response?.data?.message || e?.message || "Failed to load status history";
      message.error(error);
      // Unknown history must not be presented as "No status history recorded".
      setApplicationHistory((prev) => ({ ...prev, loading: false, fetched: true, error }));
    }
  };

  const fetchScreeningDetail = async () => {
    if (!selectedApplication?.id || !collegeId) return;
    setScreeningDetail((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const res = await getAdminApplicationScreening(selectedApplication.id, collegeId);
      setScreeningDetail({ data: res?.data?.data ?? null, loading: false, fetched: true, error: null });
    } catch (e) {
      const error = e?.response?.data?.message || "Failed to load screening detail";
      message.error(error);
      // Null data means "not screened yet" only after a successful response. A failed lookup is
      // an unknown screening state and gets its own retryable error UI.
      setScreeningDetail((prev) => ({ ...prev, loading: false, fetched: true, error }));
    }
  };

  const handleRescreen = async () => {
    if (!selectedApplication?.id || !collegeId || mutationRef.current) return;
    mutationRef.current = true;
    setRescreening(true);
    try {
      const res = await rescreenAdminApplication(selectedApplication.id, collegeId);
      setScreeningDetail({ data: res?.data?.data ?? null, loading: false, fetched: true, error: null });
      message.success("Application re-screened");
    } catch (e) {
      message.error(e?.response?.data?.message || "Failed to re-screen application");
    } finally {
      mutationRef.current = false;
      setRescreening(false);
    }
  };

  const handleScheduleInterview = (application) => {
    if (!organizationId) {
      message.warning("Missing organization context. Cannot schedule interview.");
      return;
    }
    // Check if learner exists (external applications may not have onboarded learners)
    if (!application.learner || !application.learner.id) {
      message.warning("Cannot schedule interview for external applications that haven't been onboarded. Please onboard the candidate first.");
      return;
    }
    // Verify application status allows scheduling
    if (!["SHORTLISTED", "ASSESSMENT", "INTERVIEW", "OFFERED"].includes(application.applicationStatus)) {
      message.warning("Can only schedule interviews for SHORTLISTED, ASSESSMENT, INTERVIEW, or OFFERED applications");
      return;
    }
    setSchedulingForApplication(application);
    setInterviewFormVisible(true);
  };

  const handleInterviewFormSuccess = async () => {
    const applicationJustScheduled = schedulingForApplication;
    setInterviewFormVisible(false);
    setSchedulingForApplication(null);
    // Backend already sets status to INTERVIEW when scheduling Round 1; no redundant status update (Gap #22)
    message.success("Interview scheduled and candidate notified.");
    fetchJobAndApplications();
    if (selectedApplication) {
      refreshSelectedApplicationDetails(selectedApplication?.id);
    }
  };

  const handleEditInterview = (inv) => {
    if (!organizationId) {
      message.warning("Missing organization context. Cannot edit interview.");
      return;
    }
    setEditingInterview(inv);
  };

  const handleEditInterviewSuccess = () => {
    setEditingInterview(null);
    if (selectedApplication) refreshSelectedApplicationDetails(selectedApplication.id);
  };

  const handleFeedbackClick = (inv) => {
    setFeedbackForInterview(inv);
  };

  const handleFeedbackSuccess = () => {
    setFeedbackForInterview(null);
    if (selectedApplication) refreshSelectedApplicationDetails(selectedApplication.id);
  };

  const runInterviewStatusAction = async (kind, interviewId, interviewRecord, rejectOnFailure = true) => {
    if (!interviewId || interviewActionRef.current != null) return false;
    const effectiveOrgId = organizationId
      ?? interviewRecord?.organizationId
      ?? (selectedApplication?.organizationId ?? selectedApplication?.job?.organizationId);
    if (!effectiveOrgId) {
      message.warning(`Missing organization context. Cannot ${kind === "cancel" ? "cancel" : "update"} interview.`);
      return false;
    }

    const key = `${kind}:${interviewId}`;
    interviewActionRef.current = key;
    setInterviewActionKey(key);
    setInterviewActionError(null);
    try {
      let response;
      if (kind === "completed") {
        response = await markInterviewCompleted(interviewId, effectiveOrgId);
      } else if (kind === "no-show") {
        response = await updateInterview(interviewId, { interviewStatus: "NO_SHOW" }, effectiveOrgId);
      } else {
        response = await cancelInterview(interviewId, effectiveOrgId);
      }

      if (response?.data?.status !== "success") {
        throw new Error(response?.data?.message || "Interview status update failed");
      }

      const successMessage =
        kind === "completed" ? "Interview marked as Completed"
          : kind === "no-show" ? "Interview marked as No Show"
            : "Interview cancelled successfully";
      message.success(successMessage);
      if (selectedApplication) refreshSelectedApplicationDetails(selectedApplication.id);
      return true;
    } catch (error) {
      const detail = error?.response?.data?.message || error?.message || "Interview status update failed";
      setInterviewActionError({ kind, interviewId, interviewRecord, message: detail });

      if (kind === "cancel" && error?.response?.status === 409 && selectedApplication) {
        refreshSelectedApplicationDetails(selectedApplication.id);
      }
      if (rejectOnFailure) throw error;
      return false;
    } finally {
      interviewActionRef.current = null;
      setInterviewActionKey(null);
    }
  };

  const handleMarkNoShow = (interviewId, interviewRecord, rejectOnFailure = true) =>
    runInterviewStatusAction("no-show", interviewId, interviewRecord, rejectOnFailure);

  const handleMarkCompleted = (interviewId, interviewRecord, rejectOnFailure = true) =>
    runInterviewStatusAction("completed", interviewId, interviewRecord, rejectOnFailure);

  const handleCancelInterview = (interviewId, interviewRecord, rejectOnFailure = true) =>
    runInterviewStatusAction("cancel", interviewId, interviewRecord, rejectOnFailure);

  const getStatusTag = (status) => {
    const statusConfig = {
      APPLIED: { tone: STATUS_TONE.info, icon: <ClockCircleOutlined />, text: "Applied" },
      SHORTLISTED: { tone: STATUS_TONE.success, icon: <CheckCircleOutlined />, text: "Shortlisted" },
      ASSESSMENT: { tone: STATUS_TONE.warning, icon: <ClockCircleOutlined />, text: "Assessment" },
      INTERVIEW: { tone: STATUS_TONE.info, icon: <UserOutlined />, text: "Interview" },
      WAITLISTED: { tone: STATUS_TONE.warning, icon: <ClockCircleOutlined />, text: "Waitlisted" },
      OFFERED: { tone: STATUS_TONE.success, icon: <CheckCircleOutlined />, text: "Offered" },
      REJECTED: { tone: STATUS_TONE.error, icon: <CloseCircleOutlined />, text: "Rejected" },
      HIRED: { tone: STATUS_TONE.success, icon: <CheckCircleOutlined />, text: "Hired" },
      WITHDRAWN: { tone: STATUS_TONE.neutral, icon: <CloseCircleOutlined />, text: "Withdrawn" },
    };
    const config = statusConfig[status] || {
      tone: STATUS_TONE.neutral,
      text: status || "Unknown",
    };
    return (
      <StatusBadge
        status={status || "unknown"}
        label={config.text}
        tone={config.tone}
        icon={config.icon}
      />
    );
  };

  // Human-readable labels for status values
  const STATUS_LABELS = {
    APPLIED: "Applied",
    SHORTLISTED: "Shortlisted",
    ASSESSMENT: "Assessment",
    INTERVIEW: "Interview",
    WAITLISTED: "Waitlisted",
    OFFERED: "Offered",
    REJECTED: "Rejected",
    HIRED: "Hired",
  };

  const getStatusOptions = (currentStatus) => {
    const allStatuses = ["APPLIED", "SHORTLISTED", "ASSESSMENT", "INTERVIEW", "WAITLISTED", "OFFERED", "REJECTED", "HIRED"];
    return allStatuses.filter(status => status !== currentStatus);
  };

  const getSourceTag = (source) => {
    const sourceLabels = {
      INTERNAL: { color: "blue", text: "Internal" },
      EXTERNAL: { color: "orange", text: "External" },
    };
    const config = sourceLabels[source] || { color: "default", text: source || "Unknown" };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // Shared with the bulk preflight below so row actions and bulk actions use exactly the same
  // client-side state machine. The backend remains authoritative and re-validates every row.
  const getValidStatusTransitions = getAdminValidApplicationTransitions;

  const BULK_CHUNK_SIZE = 100;
  const SELECT_ALL_MATCHING_PAGE_SIZE = 100;

  // Walks every page matching the current filter (not just the loaded page) to collect ids for
  // "select all N matching filter". Capped so a runaway filter (e.g. accidentally "ALL" on a
  // huge job) can't trigger thousands of sequential requests silently.
  const fetchAllMatchingApplicationTargets = async () => {
    const targets = [];
    let page = 0;
    const filters = {
      applicationStatus: (statusTab === "ALL" && !shortlistedMode) ? undefined : statusTab,
      source: filterSource,
      departmentId: filterDepartmentId,
      programId: filterProgramId,
      batchId: filterBatchId,
      search: searchDebounced && searchDebounced.trim() ? searchDebounced.trim() : undefined,
    };
    while (targets.length < SELECT_ALL_MATCHING_CAP) {
      const res = await getAdminJobApplications(parseInt(jobId, 10), collegeId, {
        page,
        size: SELECT_ALL_MATCHING_PAGE_SIZE,
        ...filters,
      });
      if (res?.data?.status !== "success") break;
      const data = res.data.data ?? res.data;
      const rows = data?.content ?? (Array.isArray(data) ? data : []);
      rows.forEach((r) => targets.push({ id: r.id, status: r.applicationStatus }));
      const total = data?.totalElements ?? rows.length;
      page += 1;
      if (rows.length === 0 || targets.length >= total || page * SELECT_ALL_MATCHING_PAGE_SIZE >= total) break;
    }
    if (targets.length >= SELECT_ALL_MATCHING_CAP) {
      message.warning(`Only the first ${SELECT_ALL_MATCHING_CAP} matching applications were selected — narrow the filter to reach the rest.`, 6);
    }
    return targets;
  };

  const resolveBulkTargets = async () => {
    if (selectAllMatching) {
      return fetchAllMatchingApplicationTargets();
    }
    const byId = new Map(applications.map((row) => [Number(row.id), row]));
    return selectedRowKeys
      .map((key) => typeof key === "string" && /^\d+$/.test(key) ? Number(key) : key)
      .filter((key) => typeof key === "number" && !Number.isNaN(key))
      .map((id) => ({ id, status: byId.get(id)?.applicationStatus }));
  };

  // Splits into ≤100-id chunks (the backend's own per-request cap) and aggregates results —
  // without this, "select all matching filter" could never actually reach past the first 100.
  const runBulkUpdateChunked = async (ids, newStatus, assessmentUrl, rejectionReason, saveAssessmentUrlToJob = true) => {
    let updatedCount = 0;
    const failed = [];
    for (let i = 0; i < ids.length; i += BULK_CHUNK_SIZE) {
      const chunk = ids.slice(i, i + BULK_CHUNK_SIZE);
      const res = await bulkUpdateAdminApplicationStatus(
        parseInt(jobId, 10), collegeId, chunk, newStatus, assessmentUrl, rejectionReason, saveAssessmentUrlToJob
      );
      if (res?.data?.status === "success") {
        const data = res?.data?.data ?? {};
        updatedCount += data.updatedCount ?? 0;
        if (Array.isArray(data.failed)) failed.push(...data.failed);
      } else {
        chunk.forEach((id) => failed.push({ applicationId: id, reason: res?.data?.message || "Request failed" }));
      }
    }
    return { updatedCount, failed };
  };

  const openAssessmentModal = (applicationIds) => {
    const ids = (Array.isArray(applicationIds) ? applicationIds : [applicationIds])
      .filter((k) => (typeof k === "number" && !Number.isNaN(k)) || (typeof k === "string" && /^\d+$/.test(k)))
      .map((k) => typeof k === "string" ? parseInt(k, 10) : k);
    if (ids.length === 0) {
      message.warning("Select at least one internal application");
      return;
    }
    setAssessmentModalApplicationIds(ids);
    setAssessmentModalUrl(job?.assessmentUrl || "");
    setAssessmentModalSaveToJob(true);
    setAssessmentModalVisible(true);
  };

  const handleAssessmentModalConfirm = async () => {
    if (mutationRef.current) return;
    const url = (assessmentModalUrl || "").trim();
    if (url && !/^https?:\/\/\S+$/.test(url)) {
      message.error("Must be a valid URL starting with http:// or https://");
      return;
    }
    const saveToJob = assessmentModalSaveToJob;
    const ids = assessmentModalApplicationIds;
    const assessmentUrlToSend = url || null;
    mutationRef.current = true;
    setAssessmentModalLoading(true);
    try {
      if (ids.length === 1) {
        const res = await updateAdminApplicationStatus(
          parseInt(jobId, 10),
          ids[0],
          "ASSESSMENT",
          collegeId,
          assessmentUrlToSend,
          undefined,
          saveToJob
        );
        if (res?.data?.status === "success") {
          message.success("Application moved to Assessment");
          setAssessmentModalVisible(false);
          fetchJobAndApplications();
        } else {
          message.error(res?.data?.message || "Failed to update status");
        }
      } else {
        const { updatedCount: count, failed } = await runBulkUpdateChunked(
          ids, "ASSESSMENT", assessmentUrlToSend, undefined, saveToJob
        );
        if (failed.length > 0) {
          setBulkFailureModal({ visible: true, count, failed });
          message.warning(`${count} moved, ${failed.length} failed. See details.`, 5);
        } else {
          message.success(`${count} application(s) moved to Assessment`);
        }
        setAssessmentModalVisible(false);
        setSelectedRowKeys([]);
        setSelectAllMatching(false);
        fetchJobAndApplications();
      }
    } catch (e) {
      message.error(e?.response?.data?.message || "Failed to move to Assessment");
    } finally {
      mutationRef.current = false;
      setAssessmentModalLoading(false);
    }
  };

  const handleBulkStatusChange = async (newStatus, rejectionReason = null) => {
    if (mutationRef.current || confirmRef.current) return;
    mutationRef.current = true;
    setBulkLoading(true);
    let targets;
    try {
      targets = await resolveBulkTargets();
    } finally {
      mutationRef.current = false;
      setBulkLoading(false);
    }
    if (targets.length === 0) {
      message.warning("Select at least one application");
      return;
    }

    const { valid, invalid } = partitionAdminTransitionTargets(targets, newStatus);
    if (invalid.length > 0) {
      const statusSummary = [...new Set(invalid.map((item) => item.status || "UNKNOWN"))].join(", ");
      message.warning(
        `Nothing changed. ${invalid.length} selected application(s) cannot move to ${STATUS_LABELS[newStatus] || newStatus} from their current stage${statusSummary ? ` (${statusSummary})` : ""}. Narrow the selection and try again.`,
        8
      );
      return;
    }
    const ids = valid.map((item) => item.id);

    if (newStatus === "ASSESSMENT") {
      openAssessmentModal(ids);
      return;
    }
    if (newStatus === "REJECTED") {
      setBulkRejectModal({ visible: true, reason: "", targetIds: ids });
      return;
    }
    // PVN-001.24: Shortlist / Interview / Waitlist / Offer / Hire all notify students, and Hire
    // withdraws their other applications - review the real numbers and names before it goes out.
    // (Reject and Assessment already have their own modals above.)
    const execute = async () => {
      if (mutationRef.current) return;
      mutationRef.current = true;
      setBulkLoading(true);
      try {
        const { updatedCount: count, failed } = await runBulkUpdateChunked(ids, newStatus, undefined, rejectionReason);
        const failCount = failed.length;
        if (failCount > 0) {
          if (failCount > 2) {
            setBulkFailureModal({ visible: true, count, failed });
            message.warning(`${count} updated, ${failCount} failed. See details.`, 5);
          } else {
            const msg = count > 0
              ? `${count} updated, ${failCount} failed: ${failed.map((f) => `#${f.applicationId} (${f.reason || "unknown"})`).join("; ")}`
              : `All ${failCount} failed: ${failed.map((f) => `#${f.applicationId} (${f.reason || "unknown"})`).join("; ")}`;
            message.warning(msg, 8);
          }
        } else {
          message.success(`${count} application(s) updated to ${STATUS_LABELS[newStatus] || newStatus}`);
        }
        setSelectedRowKeys([]);
        setSelectAllMatching(false);
        fetchJobAndApplications();
      } catch (e) {
        message.error(e?.response?.data?.message || "Bulk update failed");
      } finally {
        mutationRef.current = false;
        setBulkLoading(false);
      }
    };
    const byId = new Map(applications.map((row) => [Number(row.id), row]));
    const preview = buildBulkStatusPreview(ids, newStatus, byId, STATUS_LABELS[newStatus] || newStatus);
    confirmRef.current = true;
    Modal.confirm({
      title: preview.title,
      okText: `Move to ${STATUS_LABELS[newStatus] || newStatus}`,
      okButtonProps: preview.danger ? { danger: true } : undefined,
      content: (
        <div>
          <ul style={{ margin: "0 0 8px", paddingLeft: 18 }}>
            {preview.consequences.map((line) => <li key={line}>{line}</li>)}
          </ul>
          <Typography.Text type="secondary">
            {preview.sample.join(", ")}{preview.more > 0 ? ` and ${preview.more} more` : ""}
          </Typography.Text>
        </div>
      ),
      onOk: async () => {
        confirmRef.current = false;
        await execute();
      },
      onCancel: () => { confirmRef.current = false; },
      afterClose: () => { confirmRef.current = false; },
    });
  };

  const executeBulkReject = async () => {
    const ids = bulkRejectModal.targetIds || [];
    if (ids.length === 0 || mutationRef.current) return;
    mutationRef.current = true;
    setBulkLoading(true);
    try {
      const { updatedCount: count, failed } = await runBulkUpdateChunked(ids, "REJECTED", undefined, bulkRejectModal.reason?.trim() || null);
      const failCount = failed.length;
      if (failCount > 0) {
        if (failCount > 2) {
          setBulkFailureModal({ visible: true, count, failed });
          message.warning(`${count} rejected, ${failCount} failed. See details.`, 5);
        } else {
          const msg = count > 0
            ? `${count} rejected, ${failCount} failed: ${failed.map((f) => `#${f.applicationId} (${f.reason || "unknown"})`).join("; ")}`
            : `All ${failCount} failed: ${failed.map((f) => `#${f.applicationId} (${f.reason || "unknown"})`).join("; ")}`;
          message.warning(msg, 8);
        }
      } else {
        message.success(`${count} application(s) rejected`);
      }
      setBulkRejectModal({ visible: false, reason: "", targetIds: [] });
      setSelectedRowKeys([]);
      setSelectAllMatching(false);
      fetchJobAndApplications();
    } catch (e) {
      message.error(e?.response?.data?.message || "Bulk reject failed");
    } finally {
      mutationRef.current = false;
      setBulkLoading(false);
    }
  };

  const columns = [
    {
      title: "Learner Name",
      key: "learnerName",
      width: 200,
      // Keep candidate identity anchored while admins swipe through the wide mobile table.
      // The row-selection checkbox remains Ant Design's leftmost control; this becomes the
      // first data column that stays visible instead of forcing users to remember whose row
      // they are editing after scrolling to status/actions.
      fixed: "left",
      render: (_, record) => {
        const learner = record.learner;
        return learner ? `${learner.firstName || ""} ${learner.lastName || ""}`.trim() : "-";
      },
    },
    {
      title: "Email",
      key: "email",
      width: 200,
      render: (_, record) => record.learner?.contactMail || "-",
    },
    {
      title: "College",
      key: "college",
      width: 150,
      render: (_, record) => {
        const cid = record.learner?.collegeId ?? record.learner?.college_id;
        if (cid == null) return "-";
        return collegesMap[cid] ?? `College #${cid}`;
      },
    },
    {
      title: "Source",
      dataIndex: "source",
      key: "source",
      width: 120,
      render: (source) => getSourceTag(source),
      // Source selection lives only in the toolbar Select above (server-side `source` param) —
      // same reasoning as the Current Status column below: a separate client-side column filter
      // here could silently disagree with that Select (e.g. toolbar=Internal, column
      // filter=External) and produce an empty table with no explanation.
    },
    {
      title: "Current Status",
      dataIndex: "applicationStatus",
      key: "applicationStatus",
      width: 150,
      render: (status) => getStatusTag(status),
      // Status selection lives only in the tab strip above (which drives the server-side
      // `applicationStatus` param). A separate client-side column filter here used to silently
      // disagree with the active tab — e.g. picking "Interview" while the tab was "Applied"
      // produced an empty table with no explanation.
    },
    {
      title: "Applied Date",
      dataIndex: "appliedAt",
      key: "appliedAt",
      width: 150,
      render: (date) => formatPlacementDateShort(date),
    },
    {
      // Without this, an application stuck untouched for weeks looks identical to one updated
      // five minutes ago — an admin working hundreds of rows has no way to spot neglected
      // candidates without eyeballing the Applied Date column one row at a time.
      title: "Age",
      key: "age",
      width: 110,
      sorter: (a, b) => {
        const aTime = parsePlacementUtcDateTime(a.statusUpdatedAt || a.appliedAt)?.valueOf() ?? 0;
        const bTime = parsePlacementUtcDateTime(b.statusUpdatedAt || b.appliedAt)?.valueOf() ?? 0;
        return aTime - bTime;
      },
      defaultSortOrder: !shortlistedMode ? "ascend" : undefined,
      render: (_, record) => {
        const ts = record.statusUpdatedAt || record.appliedAt;
        if (!ts) return <Text type="secondary">—</Text>;
        const parsedTs = parsePlacementUtcDateTime(ts);
        if (!parsedTs) return <Text type="secondary">—</Text>;
        const days = Math.floor((Date.now() - parsedTs.valueOf()) / (1000 * 60 * 60 * 24));
        // Deliberately NOT red/orange/green (Status column) or blue (the INTERVIEW status Tag) —
        // a neutral gray-to-amber scale keeps "how stale" visually distinct from "what state."
        const dotColor = days >= 14 ? "#ad6800" : days >= 7 ? "#8c8c8c" : "#d9d9d9";
        return (
          <Space size={6}>
            <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: dotColor }} />
            <Text type={days >= 7 ? undefined : "secondary"}>{days === 0 ? "today" : `${days}d`}</Text>
          </Space>
        );
      },
    },
    {
      title: "Match Score",
      dataIndex: "screeningScore",
      key: "screeningScore",
      width: 110,
      sorter: (a, b) => (a.screeningScore ?? -1) - (b.screeningScore ?? -1),
      render: (score, record) => {
        if (score == null) return <Text type="secondary">—</Text>;
        const pct = Math.round(score * 100);
        // Purple/cyan scale, not red/orange/green (Status), blue/geekblue (INTERVIEW status Tag),
        // or gold/amber (the Age column's staleness dot) — a red or blue "40% match" read as
        // "rejected"/"interviewing" rather than "weak match," and gold was too easily confused
        // with the amber staleness dot on a stale+mediocre-match row.
        const color = pct >= 70 ? "purple" : pct >= 40 ? "cyan" : "default";
        return (
          <Space size={4}>
            <Tag color={color}>{pct}%</Tag>
            {record.isPartialScore && (
              <Tooltip title="This score excludes some evaluation criteria due to missing data">
                <Tag color="orange">Partial</Tag>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 300,
      fixed: "right",
      render: (_, record) => {
        const validNext = getValidStatusTransitions(record.applicationStatus);
        return (
          <Space>
            <Button size="small" onClick={() => handleViewDetails(record)}>
              View Details
            </Button>
            <Select
              placeholder="Move to..."
              style={{ width: 160 }}
              value={undefined}
              onChange={(value) => {
                if (!validNext.includes(value)) {
                  message.warning(`Cannot move from ${STATUS_LABELS[record.applicationStatus]} to ${STATUS_LABELS[value]}`);
                  return;
                }
                // Interview = schedule first (form with date, time, meeting link); status is set after submit
                if (value === "INTERVIEW") {
                  handleScheduleInterview(record);
                  return;
                }
                // Assessment = show modal for optional link
                if (value === "ASSESSMENT") {
                  openAssessmentModal([record.id]);
                  return;
                }
                // Destructive action: show reject modal with optional reason
                if (value === "REJECTED") {
                  setRejectModal({ visible: true, applicationId: record.id, reason: "" });
                  return;
                }
                // Reinstating a rejected application used to be a single silent click with no
                // confirmation — the next reviewer had no reason to suspect there was hidden
                // history. The rejection reason itself is preserved (visible via History) but a
                // deliberate confirm step here is still worth it before undoing a rejection.
                if (record.applicationStatus === "REJECTED" && value === "APPLIED") {
                  Modal.confirm({
                    title: "Reinstate this application?",
                    content: record.rejectionReason
                      ? `This candidate was previously rejected: "${record.rejectionReason}". Reinstating moves them back to Applied for another look.`
                      : "This candidate was previously rejected. Reinstating moves them back to Applied for another look.",
                    okText: "Reinstate",
                    cancelText: "Cancel",
                    onOk: () => handleStatusChange(record.id, value),
                  });
                  return;
                }
                handleStatusChange(record.id, value);
              }}
              loading={actionLoading[record.id]}
              disabled={actionLoading[record.id] || validNext.length === 0}
            >
              {validNext.map((status) => (
                <Option key={status} value={status}>
                  {/* REJECTED is the one destructive choice in this list — bulk Reject buttons
                      elsewhere on this page are already styled danger/red; this option wasn't,
                      so the destructive action looked identical to every safe one until after
                      it was already picked. */}
                  <span style={status === "REJECTED" ? { color: "#ff4d4f" } : undefined}>
                    {STATUS_LABELS[status] || status}
                  </span>
                </Option>
              ))}
            </Select>
          </Space>
        );
      },
    },
  ];

  if (loading && !hasCurrentJob) {
    return (
      <div style={{ minHeight: 300 }}>
        <DashboardSkeleton metrics={4} label="Loading job applications" />
      </div>
    );
  }

  if (contextMissing) {
    const isAdminPath = basePath === "/college-admin";
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <AntTitle level={4}>Job Applications</AntTitle>
        {contextAccessDenied ? (
          <Alert
            type="error"
            message="Access denied"
            description="You do not have access to this job's college. Use Jobs to select a job within your assigned college."
            showIcon
            style={{ marginTop: 16, marginBottom: 16, textAlign: "left" }}
          />
        ) : (
          <Paragraph type="secondary" style={{ marginTop: 16 }}>
            {isAdminPath
              ? "You must be assigned to a college to view job applications. Contact your administrator." : "Open from Superadmin -> Jobs (select a college), then click View Applications on a job."}
          </Paragraph>
        )}
        <Button type="primary" style={{ marginTop: 16 }} onClick={() => router.push(isAdminPath ? "/college-admin/jobs" : "/superadmin/dashboard")}>
          {isAdminPath ? "Back to Jobs" : "Go to Superadmin"}
        </Button>
      </div>
    );
  }

  return (
    <div>
      {missingCollegeContext ? (
        <Alert
          type="warning"
          showIcon
          message="Missing College context"
          description="Open Job Applications from the Jobs page after selecting Organization + College in the header (the link must include `collegeId`)."
          action={
            <Button type="primary" onClick={() => router.push("/superadmin/dashboard")} style={{ marginTop: 8 }}>
              Back to Superadmin
            </Button>
          }
        />
      ) : (
        <>
      <div style={{ marginBottom: 16 }}>
        <Space wrap>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => {
              if (shortlistedMode) {
                const qs = collegeId ? `?collegeId=${collegeId}` : "";
                router.push(`/college-admin/jobs/${jobId}/applications${qs}`);
              } else if (basePath === "/college-admin") {
                router.push("/college-admin/jobs");
              } else {
                router.push("/superadmin?selectedKey=jobs");
              }
            }}
          >
            {shortlistedMode ? "Back to Applications" : "Back to Jobs"}
          </Button>
          {basePath === "/college-admin" && !shortlistedMode && jobId && (
            <Button
              type="primary"
              onClick={() => {
                const qs = collegeId ? `?collegeId=${collegeId}` : "";
                router.push(`/college-admin/jobs/${jobId}/shortlisted${qs}`);
              }}
            >
              Manage Shortlisted
            </Button>
          )}
        </Space>
      </div>

      {applicationsRefreshing ? <RefreshStatus label="Refreshing applications…" /> : null}
      {currentFetchError && (
        <Alert
          type={hasCurrentApplications ? "warning" : "error"}
          message={hasCurrentApplications ? "Couldn't refresh applications" : "Failed to load data"}
          description={hasCurrentApplications ? "Showing the last applications loaded for these filters." : currentFetchError}
          action={
            <Button size="small" type="primary" onClick={() => { setFetchError(null); fetchJobAndApplications(); }}>
              Retry
            </Button>
          }
          showIcon
          closable
          onClose={() => setFetchError(null)}
          style={{ marginBottom: 16 }}
        />
      )}
      {hasCurrentJob && job && (
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16} align="middle">
            <Col flex="auto">
              <AntTitle level={4} style={{ marginBottom: 4 }}>{job.jobTitle}</AntTitle>
              <Text type="secondary">{job.companyName}</Text>
              {job.location && <Text type="secondary"> &middot; {job.location}</Text>}
            </Col>
            <Col>
              <StatusBadge status={job.isActive ? "open" : "closed"} />
            </Col>
          </Row>
          {applications.length > 0 && (
            <>
              <Divider style={{ margin: "12px 0" }} />
              <Row gutter={16}>
                {["APPLIED", "SHORTLISTED", "ASSESSMENT", "INTERVIEW", "WAITLISTED", "OFFERED", "HIRED", "REJECTED"].map(status => {
                  const count = jobStatusCounts
                    ? Number(jobStatusCounts[status.toLowerCase()] ?? 0)
                    : applications.filter(a => a.applicationStatus === status).length;
                  if (count === 0) return null;
                  return (
                    <Col key={status}>
                      <Statistic title={STATUS_LABELS[status]} value={count} valueStyle={{ fontSize: 20 }} />
                    </Col>
                  );
                })}
              </Row>
            </>
          )}
        </Card>
      )}

      {/* Moved out of the always-visible summary card — it's a transient, Assessment-tab-only
          action, not a fact about the job that belongs at the same visual rank as the funnel
          counts above. */}
      {statusTab === "ASSESSMENT" && job?.assessmentUrl && (
        <Alert
          type="info"
          showIcon={false}
          style={{ marginBottom: 16 }}
          message={
            <Space wrap style={{ width: "100%", justifyContent: "space-between" }}>
              <span>
                <Text strong>Assessment link: </Text>
                <Text code style={{ wordBreak: "break-all" }}>{job.assessmentUrl}</Text>
              </span>
              <Button
                type="default"
                size="small"
                icon={<CopyOutlined />}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(job.assessmentUrl);
                    message.success("Assessment link copied to clipboard");
                  } catch {
                    message.error("Failed to copy");
                  }
                }}
              >
                Copy
              </Button>
            </Space>
          }
        />
      )}

      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <Title title={`Applications (${isAdminMode ? totalElements : applications.length})`} />
          {(isAdminMode || shortlistedMode) && jobId && collegeId && (
            <Button
              size="small"
              icon={<DownloadOutlined />}
              loading={csvExporting}
              onClick={async () => {
                if (exportRef.current) return;
                exportRef.current = true;
                setCsvExporting(true);
                try {
                  const res = await exportAdminJobApplicationsCsv(parseInt(jobId, 10), collegeId, {
                    applicationStatus: (statusTab === "ALL" && !shortlistedMode) ? undefined : statusTab,
                    source: filterSource,
                    departmentId: filterDepartmentId,
                    programId: filterProgramId,
                    batchId: filterBatchId,
                    search: searchDebounced && searchDebounced.trim() ? searchDebounced.trim() : undefined,
                  });
                  const blob = res?.data;
                  if (!blob) {
                    message.error("Export failed");
                    return;
                  }
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `applications-job-${jobId}.csv`;
                  a.click();
                  window.URL.revokeObjectURL(url);
                  message.success("Export downloaded");
                } catch (e) {
                  message.error(e?.response?.data?.message || "Export failed");
                } finally {
                  exportRef.current = false;
                  setCsvExporting(false);
                }
              }}
            >
              Export CSV
            </Button>
          )}
        </div>
        {(isAdminMode || shortlistedMode) && (
          // A bordered segmented-control strip — previously these were plain buttons sitting in
          // the same row/weight as Export CSV, so status navigation didn't read as "you are
          // here," it read as more buttons competing with an unrelated action.
          <div
            style={{
              display: "flex", flexWrap: "wrap", gap: 2, padding: 3,
              background: "#f5f5f5", border: "1px solid #f0f0f0", borderRadius: 8,
            }}
          >
            {(shortlistedMode ? ["ASSESSMENT", "INTERVIEW", "WAITLISTED", "OFFERED"] : ["ALL", "APPLIED", "SHORTLISTED", "ASSESSMENT", "INTERVIEW", "WAITLISTED", "REJECTED"]).map((tab) => (
              <Button
                key={tab}
                type={statusTab === tab ? "primary" : "text"}
                size="small"
                onClick={() => handleStatusTabChange(tab)}
              >
                {tab === "ALL" ? "All" : STATUS_LABELS[tab] || tab}
              </Button>
            ))}
            {isAdminMode && !shortlistedMode && (
              // A separate, quieter escape hatch rather than a peer tab — withdrawn
              // applications are soft-deleted and excluded from every other view/count by
              // design; a candidate walking away should still be findable, just not part of
              // the primary triage flow.
              <Button
                type={statusTab === "WITHDRAWN" ? "primary" : "text"}
                danger={statusTab !== "WITHDRAWN"}
                size="small"
                onClick={() => handleStatusTabChange("WITHDRAWN")}
              >
                Withdrawn
              </Button>
            )}
          </div>
        )}
      </div>

      {(isAdminMode || shortlistedMode) && (
        <div style={{ marginBottom: 16, padding: 12, background: "#fafafa", border: "1px solid #f0f0f0", borderRadius: 8 }}>
          <Row gutter={8} align="middle">
            <Col>
              <Input.Search
                placeholder="Search by name or email"
                allowClear
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onSearch={() => {
                  setCurrentPage(1);
                  updateApplicationQuery({ q: searchQuery, page: 1 });
                }}
                style={{ width: 180 }}
                aria-label="Search applications"
              />
            </Col>
            <Col>
              <Select
                placeholder="Source"
                allowClear
                value={filterSource}
                onChange={handleSourceFilterChange}
                style={{ width: 120 }}
                aria-label="Filter by source"
              >
                <Option value="INTERNAL">Internal</Option>
                <Option value="EXTERNAL">External</Option>
              </Select>
            </Col>
            <Col>
              <Select
                placeholder="Department"
                allowClear
                value={filterDepartmentId}
                onChange={handleDepartmentFilterChange}
                style={{ width: 150 }}
                showSearch
                filterOption={(i, o) => (o?.children ?? "").toLowerCase().includes(i.toLowerCase())}
                aria-label="Filter by department"
              >
                {departments.map((d) => <Option key={d.id} value={d.id}>{d.name}</Option>)}
              </Select>
            </Col>
            <Col>
              <Select
                placeholder="Program"
                allowClear
                value={filterProgramId}
                onChange={handleProgramFilterChange}
                style={{ width: 150 }}
                showSearch
                filterOption={(i, o) => (o?.children ?? "").toLowerCase().includes(i.toLowerCase())}
                aria-label="Filter by program"
              >
                {filteredPrograms.map((p) => <Option key={p.id} value={p.id}>{p.name}</Option>)}
              </Select>
            </Col>
            <Col>
              <Select
                placeholder="Batch"
                allowClear
                value={filterBatchId}
                onChange={handleBatchFilterChange}
                style={{ width: 120 }}
                showSearch
                filterOption={(i, o) => (o?.children ?? "").toLowerCase().includes(i.toLowerCase())}
                aria-label="Filter by batch"
              >
                {batches.map((b) => <Option key={b.id} value={b.id}>{b.name || b.batchName || `Batch ${b.id}`}</Option>)}
              </Select>
            </Col>
            {(searchQuery || filterSource || filterDepartmentId || filterProgramId || filterBatchId) && (
              // 5 independently-clearable filters with no single reset — an admin who set several
              // and wants a clean slate had to clear each one individually.
              <Col>
                <Button
                  type="link"
                  size="small"
                  style={{ padding: 0 }}
                  onClick={clearSecondaryApplicationFilters}
                >
                  Clear filters
                </Button>
              </Col>
            )}
          </Row>
        </div>
      )}
      {isAdminMode && !selectAllMatching && selectedRowKeys.length > 0 && selectedRowKeys.length === applications.length && totalElements > applications.length && (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 8 }}
            message={
              <span>
                All {applications.length} on this page selected.{" "}
                <Button type="link" size="small" style={{ padding: 0 }} onClick={() => setSelectAllMatching(true)}>
                  Select all {totalElements} matching this filter
                </Button>
              </span>
            }
          />
        )}
        {isAdminMode && selectAllMatching && (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 8 }}
            message={
              <span>
                All {totalElements} matching this filter are selected.{" "}
                <Button type="link" size="small" style={{ padding: 0 }} onClick={() => { setSelectAllMatching(false); setSelectedRowKeys([]); }}>
                  Clear selection
                </Button>
              </span>
            }
          />
        )}
        <Space wrap>
          {isAdminMode && selectAllMatching && bulkCount > 0 && (
            // Once "select all matching filter" is active, the count alone ("Reject (247)")
            // doesn't say what filter those 247 rows came from — an admin who set filters,
            // stepped away, and came back had to remember. Echo it right where the action is.
            <Text type="secondary" style={{ fontSize: 12 }}>
              in {statusTab === "ALL" ? "All statuses" : STATUS_LABELS[statusTab] || statusTab}
              {filterDepartmentId && departments.find((d) => d.id === filterDepartmentId) ? ` · Dept: ${departments.find((d) => d.id === filterDepartmentId).name}` : ""}
              {filterProgramId && programs.find((p) => p.id === filterProgramId) ? ` · Program: ${programs.find((p) => p.id === filterProgramId).name}` : ""}
              {filterBatchId && batches.find((b) => (b.id ?? b.batchId) === filterBatchId) ? ` · Batch: ${(batches.find((b) => (b.id ?? b.batchId) === filterBatchId)).name || (batches.find((b) => (b.id ?? b.batchId) === filterBatchId)).batchName}` : ""}
              {filterSource ? ` · Source: ${filterSource}` : ""}
              {searchDebounced?.trim() ? ` · "${searchDebounced.trim()}"` : ""}
              :
            </Text>
          )}
          {(isAdminMode || shortlistedMode) && bulkCount > 0 && (
            <>
              {!shortlistedMode && (
                <>
                  <Popconfirm
                    title={`Shortlist ${bulkCount} application(s)?`}
                    onConfirm={() => handleBulkStatusChange("SHORTLISTED")}
                    okText="Shortlist"
                    cancelText="Cancel"
                  >
                    <Button size="small" loading={bulkLoading}>
                      Shortlist ({bulkCount})
                    </Button>
                  </Popconfirm>
                  <Button size="small" loading={bulkLoading} danger onClick={() => handleBulkStatusChange("REJECTED")}>
                    Reject ({bulkCount})
                  </Button>
                  <Popconfirm
                    title={`Move ${bulkCount} application(s) to Assessment?`}
                    onConfirm={() => handleBulkStatusChange("ASSESSMENT")}
                    okText="Move"
                    cancelText="Cancel"
                  >
                    <Button size="small" loading={bulkLoading}>
                      Move to Assessment ({bulkCount})
                    </Button>
                  </Popconfirm>
                </>
              )}
              {shortlistedMode && statusTab === "ASSESSMENT" && (
                <>
                  <Popconfirm
                    title={`Mark ${bulkCount} application(s) as Passed?`}
                    onConfirm={() => handleBulkStatusChange("INTERVIEW")}
                    okText="Mark Passed"
                    cancelText="Cancel"
                  >
                    <Button size="small" loading={bulkLoading}>
                      Mark Passed ({bulkCount})
                    </Button>
                  </Popconfirm>
                  <Button size="small" loading={bulkLoading} danger onClick={() => handleBulkStatusChange("REJECTED")}>
                    Mark Failed ({bulkCount})
                  </Button>
                </>
              )}
              {shortlistedMode && statusTab === "INTERVIEW" && (
                <>
                  <Popconfirm
                    title={`Move ${bulkCount} application(s) to Offered?`}
                    onConfirm={() => handleBulkStatusChange("OFFERED")}
                    okText="Move"
                    cancelText="Cancel"
                  >
                    <Button size="small" loading={bulkLoading}>
                      Move to Offered ({bulkCount})
                    </Button>
                  </Popconfirm>
                  <Button size="small" loading={bulkLoading} danger onClick={() => handleBulkStatusChange("REJECTED")}>
                    Reject ({bulkCount})
                  </Button>
                </>
              )}
              {shortlistedMode && statusTab === "OFFERED" && (
                <>
                  <Popconfirm
                    title={`Mark ${bulkCount} application(s) as Hired?`}
                    onConfirm={() => handleBulkStatusChange("HIRED")}
                    okText="Mark Hired"
                    cancelText="Cancel"
                  >
                    <Button size="small" loading={bulkLoading}>
                      Mark Hired ({bulkCount})
                    </Button>
                  </Popconfirm>
                  <Button size="small" loading={bulkLoading} danger onClick={() => handleBulkStatusChange("REJECTED")}>
                    Reject ({bulkCount})
                  </Button>
                </>
              )}
            </>
          )}
          <Button type="default" icon={<ReloadOutlined />} onClick={() => fetchJobAndApplications()} loading={loading}>
            Refresh
          </Button>
        </Space>

      <Modal
        title="Move to Assessment"
        open={assessmentModalVisible}
        onCancel={() => {
          if (mutationRef.current) return;
          const original = job?.assessmentUrl || "";
          const changed = (assessmentModalUrl || "").trim() !== original || assessmentModalSaveToJob !== true;
          if (!changed) { setAssessmentModalVisible(false); return; }
          Modal.confirm({
            title: "Discard assessment changes?",
            content: "The unsaved assessment link/options will be lost.",
            okText: "Discard",
            okButtonProps: { danger: true },
            cancelText: "Keep editing",
            onOk: () => setAssessmentModalVisible(false),
          });
        }}
        onOk={handleAssessmentModalConfirm}
        confirmLoading={assessmentModalLoading}
        okText="Move to Assessment"
        destroyOnClose
        aria-label="Move selected candidates to assessment stage with optional link"
      >
        <div style={{ marginBottom: 16 }}>
          {(!job?.assessmentUrl && !assessmentModalUrl?.trim()) && (
            <Alert
              type="warning"
              showIcon
              message="No assessment link provided"
              description="Candidates will see 'Link shared soon' in My Applications. Add the link below, or add it later from the Application Details."
              style={{ marginBottom: 16 }}
            />
          )}
          <Paragraph type="secondary">
            {assessmentModalApplicationIds.length === 1
              ? "Add an optional assessment link to share with the candidate. They will receive an in-app notification."
              : `Add an optional assessment link to share with ${assessmentModalApplicationIds.length} candidates. They will receive in-app notifications.`}
          </Paragraph>
        </div>
        <Form layout="vertical">
          <Form.Item
            label="Assessment URL"
            validateStatus={assessmentModalUrl && !/^$|^https?:\/\/\S+$/.test(assessmentModalUrl.trim()) ? "error" : undefined}
            help={
              assessmentModalUrl && !/^$|^https?:\/\/\S+$/.test(assessmentModalUrl.trim())
                ? "Must be a valid URL starting with http:// or https://"
                : "Link to the online assessment/exam. Max 2048 characters. Optional."
            }
          >
            <Input
              placeholder="https://..."
              value={assessmentModalUrl}
              onChange={(e) => setAssessmentModalUrl(e.target.value)}
              maxLength={2048}
              showCount
            />
          </Form.Item>
          <Form.Item>
            <Checkbox
              checked={assessmentModalSaveToJob}
              onChange={(e) => setAssessmentModalSaveToJob(e.target.checked)}
            >
              Save this URL to the job for future use
            </Checkbox>
            <Paragraph type="secondary" style={{ marginTop: 4, marginBottom: 0, fontSize: 12 }}>
              {assessmentModalSaveToJob
                ? "The link will be saved to the job so you can reuse it when moving more candidates later."
                : "If unchecked, the link is used for this move only and is not saved to the job. Add it again next time or from Job form."}
            </Paragraph>
          </Form.Item>
        </Form>
      </Modal>

      <div className="admin-job-applications-table">
      {initialApplicationsLoading ? (
        <TableSkeleton rows={10} columns={8} label="Loading applications" />
      ) : currentFetchError && !hasCurrentApplications ? null : (
      <Table
        columns={columns}
        dataSource={applications}
        rowKey="id"
        rowSelection={isAdminMode ? {
          selectedRowKeys,
          onChange: (keys) => {
            setSelectAllMatching(false);
            setSelectedRowKeys(keys.filter((k) => typeof k === "number" || (typeof k === "string" && /^\d+$/.test(k))));
          },
          getCheckboxProps: (record) => ({ disabled: record.isExternalPending || record.source === "EXTERNAL" }),
        } : undefined}
        pagination={isAdminMode ? {
          current: currentPage,
          pageSize,
          total: totalElements,
          showSizeChanger: true,
          pageSizeOptions: ["10", "20", "50", "100"],
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} applications`,
          onChange: handleApplicationsPageChange,
        } : {
          pageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ["10", "25", "50", "100"],
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} applications`,
        }}
        scroll={{ x: "max-content" }}
        locale={{
          emptyText: applications.length === 0 && !loading ? (
            <PanelEmpty
              compact
              title={hasApplicationFilters ? "No applications match these filters" : "No applications yet"}
              description={
                hasApplicationFilters
                  ? "Try another status, search, or cohort filter, or clear the current filters."
                  : "Applicants will appear here when they apply. Share the drive with eligible learners to get started."
              }
              ctaLabel={hasApplicationFilters ? "Clear filters" : undefined}
              onCta={hasApplicationFilters ? clearAllApplicationFilters : undefined}
            />
          ) : undefined,
        }}
      />
      )}
      </div>

      <Modal
        title="Application Details"
        open={detailModalVisible}
        destroyOnClose
        aria-label="Application details and status history"
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedApplication(null);
          setApplicationHistory({ data: [], loading: false, fetched: false, error: null });
        }}
        footer={null}
        width={800}
        className="admin-list-page-modal"
      >
        {selectedApplication && (
          <>
          {/* Split from one flat 12-row Descriptions block into labeled groups — previously the
              most-used fields (status, resume, notes) got no more visual weight than "Phone."
              Grouped with Dividers inside one bordered surface, rather than three separately
              bordered boxes, so it still reads as one record instead of three unrelated tables. */}
          <div style={{ border: "1px solid #f0f0f0", borderRadius: 8, padding: "4px 16px 16px" }}>
          <Divider orientation="left" style={{ marginTop: 8 }}>Candidate</Divider>
          <Descriptions column={1}>
            <Descriptions.Item label="Learner Name">
              {selectedApplication.learner
                ? `${selectedApplication.learner.firstName || ""} ${selectedApplication.learner.lastName || ""}`.trim()
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              {selectedApplication.learner?.contactMail || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Phone">
              {selectedApplication.learner?.contactMobile || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="College">
              {(() => {
                const cid = selectedApplication.learner?.collegeId ?? selectedApplication.learner?.college_id;
                if (cid == null) return "-";
                return collegesMap[cid] ?? `College #${cid}`;
              })()}
            </Descriptions.Item>
          </Descriptions>

          <Divider orientation="left">Status &amp; decision</Divider>
          <Descriptions column={1}>
            <Descriptions.Item label="Current Status">
              {getStatusTag(selectedApplication.applicationStatus)}
            </Descriptions.Item>
            {selectedApplication.applicationStatus === "REJECTED" && selectedApplication.rejectionReason && (
              <Descriptions.Item label="Rejection feedback">
                <Paragraph style={{ marginBottom: 0, whiteSpace: "pre-wrap" }}>{selectedApplication.rejectionReason}</Paragraph>
              </Descriptions.Item>
            )}
            {selectedApplication.applicationStatus === "WITHDRAWN" && selectedApplication.statusBeforeWithdrawal && (
              <Descriptions.Item label="Status before withdrawal">
                {getStatusTag(selectedApplication.statusBeforeWithdrawal)}
              </Descriptions.Item>
            )}
            {selectedApplication.papRequested != null && (
              <Descriptions.Item label="PAP requested">
                {selectedApplication.papRequested ? <Tag color="gold">Yes</Tag> : <Tag>No</Tag>}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Applied Date">
              {formatPlacementDateTime(selectedApplication.appliedAt)}
            </Descriptions.Item>
            <Descriptions.Item label="Last Updated">
              {(() => {
                const name = selectedApplication.statusUpdatedBy != null
                  ? (statusUpdatedByNames[String(selectedApplication.statusUpdatedBy)] ?? `User #${selectedApplication.statusUpdatedBy}`)
                  : null;
                return name
                  ? `${name} on ${formatPlacementDateTime(selectedApplication.statusUpdatedAt)}`
                  : formatPlacementDateTime(selectedApplication.statusUpdatedAt);
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="Source">
              {getSourceTag(selectedApplication.source || "INTERNAL")}
            </Descriptions.Item>
          </Descriptions>

          <Divider orientation="left">Documents &amp; notes</Divider>
          <Descriptions column={1}>
            <Descriptions.Item label="Resume">
              {selectedApplication.resumeUrl && /^https:\/\//i.test(selectedApplication.resumeUrl) ? (
                <Space>
                  <Button
                    size="small"
                    loading={resumePreviewLoading}
                    onClick={async () => {
                      setResumePreviewLoading(true);
                      try {
                        const url = await getAdminResumePreviewUrl(selectedApplication.applicationId || selectedApplication.id);
                        if (url) setResumePreviewUrl(url);
                        else message.error("Could not load resume preview");
                      } catch {
                        message.error("Could not load resume preview");
                      } finally {
                        setResumePreviewLoading(false);
                      }
                    }}
                  >
                    Preview
                  </Button>
                  <Button
                    type="link"
                    size="small"
                    loading={resumePreviewLoading}
                    onClick={async () => {
                      setResumePreviewLoading(true);
                      try {
                        const url = await getAdminResumePreviewUrl(selectedApplication.applicationId || selectedApplication.id);
                        if (url) window.open(url, "_blank", "noopener,noreferrer");
                        else message.error("Could not open resume");
                      } catch {
                        message.error("Could not open resume");
                      } finally {
                        setResumePreviewLoading(false);
                      }
                    }}
                  >
                    Open in new tab
                  </Button>
                </Space>
              ) : selectedApplication.resumeUrl ? (
                <Text type="secondary">Resume link unavailable (invalid URL)</Text>
              ) : (
                <Text type="secondary">No resume provided</Text>
              )}
            </Descriptions.Item>
            {selectedApplication.applicationStatus === "ASSESSMENT" && (job?.assessmentUrl || selectedApplication.assessmentUrl) && (
              <Descriptions.Item label="Assessment Link">
                <Space direction="vertical" size={4}>
                  <Tag color="blue">Assessment</Tag>
                  {/^https:\/\//i.test((job?.assessmentUrl || selectedApplication.assessmentUrl || "").trim()) ? (
                    <a
                      href={(job?.assessmentUrl || selectedApplication.assessmentUrl || "").trim()}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ wordBreak: "break-all" }}
                    >
                      {String(job?.assessmentUrl || selectedApplication.assessmentUrl || "").trim()}
                    </a>
                  ) : (
                    <Text type="secondary">Assessment link unavailable (invalid URL)</Text>
                  )}
                  <Button
                    type="link"
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => {
                      const url = (job?.assessmentUrl || selectedApplication.assessmentUrl || "").trim();
                      if (url) {
                        navigator.clipboard.writeText(url).then(() => message.success("Link copied"));
                      }
                    }}
                  >
                    Copy link
                  </Button>
                </Space>
              </Descriptions.Item>
            )}
            {["OFFERED", "HIRED"].includes(selectedApplication.applicationStatus) && isAdminMode && (
              <Descriptions.Item label="Offer Letter">
                <Space direction="vertical" size={4}>
                  {selectedApplication.offerLetterUrl && /^https:\/\//i.test(selectedApplication.offerLetterUrl) ? (
                    <a href={selectedApplication.offerLetterUrl} target="_blank" rel="noopener noreferrer" style={{ wordBreak: "break-all" }}>
                      {selectedApplication.offerLetterUrl}
                    </a>
                  ) : selectedApplication.offerLetterUrl ? (
                    <Text type="secondary">Offer letter link unavailable (invalid URL)</Text>
                  ) : (
                    <Text type="secondary">No offer letter attached</Text>
                  )}
                  <Button
                    type="link"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => {
                      const value = selectedApplication.offerLetterUrl || "";
                      setOfferLetterEditValue(value);
                      originalOfferLetterRef.current = value;
                      setOfferLetterSaveError("");
                      setOfferLetterModalVisible(true);
                    }}
                  >
                    {selectedApplication.offerLetterUrl ? "Update link" : "Attach offer letter link"}
                  </Button>
                </Space>
              </Descriptions.Item>
            )}
            {isAdminMode && !selectedApplication.isExternalPending && (
              <Descriptions.Item label="Internal Notes">
                <Space direction="vertical" style={{ width: "100%" }}>
                  {selectedApplication.internalNotes ? (
                    <Paragraph style={{ marginBottom: 0, whiteSpace: "pre-wrap" }}>{selectedApplication.internalNotes}</Paragraph>
                  ) : (
                    <Text type="secondary">No notes</Text>
                  )}
                  <Button type="link" size="small" icon={<EditOutlined />} onClick={() => {
                    const value = selectedApplication.internalNotes || "";
                    setNotesEditValue(value);
                    originalNotesRef.current = value;
                    setNotesSaveError("");
                    setNotesModalVisible(true);
                  }}>
                    Edit notes
                  </Button>
                </Space>
              </Descriptions.Item>
            )}
            {selectedApplication.resumeHistory != null && (
              <Descriptions.Item label="Resume version submitted">
                {/* P2 in the audit: resumeHistory was 0 refs -- shape isn't guaranteed elsewhere in
                    the codebase, so this renders whatever came back rather than assuming a schema. */}
                <div style={{ maxHeight: 160, overflow: "auto" }}>
                  {typeof selectedApplication.resumeHistory === "string"
                    ? selectedApplication.resumeHistory
                    : renderStructuredValue(selectedApplication.resumeHistory)}
                </div>
              </Descriptions.Item>
            )}
          </Descriptions>

          <Divider orientation="left">
            <Space>
              Screening
              <Button size="small" onClick={fetchScreeningDetail} loading={screeningDetail.loading}>
                {screeningDetail.fetched ? "Refresh" : "Load detail"}
              </Button>
              {isAdminMode && (
                <Button size="small" type="primary" onClick={handleRescreen} loading={rescreening}>
                  Re-screen
                </Button>
              )}
            </Space>
          </Divider>
          {!screeningDetail.fetched && !screeningDetail.loading && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              Only the overall score shows in the list. Load detail to see the full breakdown (matched/missing skills,
              per-dimension scores, screening method, and why anything was excluded).
            </Text>
          )}
          {screeningDetail.error && (
            <Alert
              type="warning"
              showIcon
              message="Screening detail unavailable"
              description={screeningDetail.error}
              action={<Button size="small" onClick={fetchScreeningDetail} loading={screeningDetail.loading}>Retry</Button>}
            />
          )}
          {screeningDetail.fetched && !screeningDetail.error && !screeningDetail.data && (
            <Empty description="Not screened yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
          {screeningDetail.data && (
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Overall score">{screeningDetail.data.overallScore ?? "-"}</Descriptions.Item>
              <Descriptions.Item label="Skill score">{screeningDetail.data.skillScore ?? "-"}</Descriptions.Item>
              <Descriptions.Item label="Education score">{screeningDetail.data.educationScore ?? "-"}</Descriptions.Item>
              <Descriptions.Item label="Partial score">{screeningDetail.data.isPartialScore ? "Yes" : "No"}</Descriptions.Item>
              <Descriptions.Item label="Status">{screeningDetail.data.screeningStatus ?? "-"}</Descriptions.Item>
              <Descriptions.Item label="Method / version">
                {[screeningDetail.data.screeningMethod, screeningDetail.data.screeningVersion].filter(Boolean).join(" / ") || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Screened at">{formatPlacementDateTime(screeningDetail.data.screenedAt)}</Descriptions.Item>
              {screeningDetail.data.matchedSkills && (
                <Descriptions.Item label="Matched skills">
                  <Space wrap>
                    {(Array.isArray(screeningDetail.data.matchedSkills) ? screeningDetail.data.matchedSkills : [screeningDetail.data.matchedSkills])
                      .map((s, i) => <Tag color="green" key={i}>{String(s)}</Tag>)}
                  </Space>
                </Descriptions.Item>
              )}
              {screeningDetail.data.missingSkills && (
                <Descriptions.Item label="Missing skills">
                  <Space wrap>
                    {(Array.isArray(screeningDetail.data.missingSkills) ? screeningDetail.data.missingSkills : [screeningDetail.data.missingSkills])
                      .map((s, i) => <Tag color="red" key={i}>{String(s)}</Tag>)}
                  </Space>
                </Descriptions.Item>
              )}
              {screeningDetail.data.explanation && (
                <Descriptions.Item label="Explanation">
                  <Paragraph style={{ marginBottom: 0, whiteSpace: "pre-wrap" }}>{screeningDetail.data.explanation}</Paragraph>
                </Descriptions.Item>
              )}
              {screeningDetail.data.excludedAttributes && (
                <Descriptions.Item label="Excluded attributes">
                  {renderStructuredValue(screeningDetail.data.excludedAttributes)}
                </Descriptions.Item>
              )}
            </Descriptions>
          )}
          </div>
          </>
        )}
        {selectedApplication && (
          <div style={{ marginTop: 16 }}>
            {/* Missing org message (Gap #10) */}
            {!organizationId && (
              <Alert
                type="warning"
                message="Unable to load interviews (missing organization context)."
                description="Organization not set for this job. Some features may be limited."
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}
            {/* Existing Interviews - Loading state (Gap #23) */}
            {organizationId && interviewsLoading && interviews[selectedApplication.id] === undefined && (
              <ListSkeleton rows={3} avatar={false} label="Loading scheduled interviews" />
            )}
            {/* Interview fetch error (Gap #15) */}
            {organizationId && interviewsError && (
              <Alert
                type="error"
                message="Failed to load interviews"
                description={interviewsError}
                action={
                  <Button size="small" onClick={() => refreshSelectedApplicationDetails(selectedApplication?.id)}>
                    Retry
                  </Button>
                }
                style={{ marginBottom: 16 }}
              />
            )}
            {interviews[selectedApplication.id] && interviews[selectedApplication.id].length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <Divider orientation="left" style={{ fontSize: 14 }}>
                  <Space>
                    Scheduled Interviews
                    {(() => {
                      const firstWithDate = interviews[selectedApplication.id].find((i) => i.scheduledDate && !["CANCELLED"].includes(i.interviewStatus));
                      if (!firstWithDate || !job?.id) return null;
                      // Every other rendering of this same field in this modal converts to
                      // local time before display — this link must compute the local calendar
                      // day too, or it can navigate to the wrong day (the UTC day) for anyone
                      // not at UTC+0.
                      const dateStr = placementLocalDateKey(firstWithDate.scheduledDate);
                      if (!dateStr) return null;
                      const cid = job?.collegeId ?? job?.college_id;
                      const prefix = basePath === "/college-admin" ? "/college-admin" : "/superadmin";
                      const params = new URLSearchParams();
                      params.set("date", dateStr);
                      params.set("jobId", job.id);
                      if (fortyTwoLearnId) params.set("fortyTwoLearnId", fortyTwoLearnId);
                      else if (cid) params.set("collegeId", cid);
                      const calUrl = `${prefix}/calendar?${params.toString()}`;
                      return (
                        <Button type="link" size="small" icon={<CalendarOutlined />} onClick={() => { setDetailModalVisible(false); router.push(calUrl); }}>
                          View in calendar
                        </Button>
                      );
                    })()}
                  </Space>
                </Divider>
                {interviewActionError ? (
                  <Alert
                    type="error"
                    showIcon
                    message={
                      interviewActionError.kind === "completed" ? "Interview was not marked completed"
                        : interviewActionError.kind === "no-show" ? "Interview was not marked no-show"
                          : "Interview was not cancelled"
                    }
                    description={interviewActionError.message}
                    action={
                      <Button
                        size="small"
                        onClick={() => runInterviewStatusAction(
                          interviewActionError.kind,
                          interviewActionError.interviewId,
                          interviewActionError.interviewRecord,
                          false
                        )}
                        disabled={interviewActionKey != null}
                      >
                        Retry
                      </Button>
                    }
                    closable
                    onClose={() => setInterviewActionError(null)}
                    style={{ marginBottom: 12 }}
                  />
                ) : null}
                <Space direction="vertical" style={{ width: "100%" }}>
                  {interviews[selectedApplication.id].map((inv) => {
                    const roundLabel = inv.interviewType
                      ? inv.interviewType.charAt(0).toUpperCase() + inv.interviewType.slice(1).toLowerCase() + " Round"
                      : "Interview";
                    const INV_STATUS_CONFIG = {
                      SCHEDULED: { status: "scheduled", tone: STATUS_TONE.info, label: "Scheduled" },
                      CONFIRMED: { status: "active", tone: STATUS_TONE.success, label: "Confirmed" },
                      CANCELLED: { status: "failed", tone: STATUS_TONE.error, label: "Cancelled" },
                      RESCHEDULE_REQUESTED: { status: "pending", tone: STATUS_TONE.warning, label: "Reschedule requested" },
                      COMPLETED: { status: "evaluated", tone: STATUS_TONE.success, label: "Completed" },
                      NO_SHOW: { status: "failed", tone: STATUS_TONE.error, label: "No show" },
                    };
                    const interviewStatus =
                      INV_STATUS_CONFIG[inv.interviewStatus] ||
                      { status: "pending", tone: STATUS_TONE.neutral, label: inv.interviewStatus || "Unknown" };
                    const canEdit = !["CANCELLED", "COMPLETED", "NO_SHOW"].includes(inv.interviewStatus);
                    const canSubmitFeedback = ["COMPLETED", "NO_SHOW"].includes(inv.interviewStatus) && inv.feedbackRating == null && inv.feedbackSubmittedAt == null;
                    const canMarkNoShow = ["SCHEDULED", "CONFIRMED"].includes(inv.interviewStatus);
                    const canMarkCompleted = ["SCHEDULED", "CONFIRMED"].includes(inv.interviewStatus);
                    const isRescheduleRequested = inv.interviewStatus === "RESCHEDULE_REQUESTED";
                    const completedKey = `completed:${inv.id}`;
                    const noShowKey = `no-show:${inv.id}`;
                    const cancelKey = `cancel:${inv.id}`;
                    const rowBusy = [completedKey, noShowKey, cancelKey].includes(interviewActionKey);
                    return (
                      <Card key={inv.id} size="small" style={{ background: isRescheduleRequested ? "#fff7e6" : "#fafafa", borderColor: isRescheduleRequested ? "#ffd591" : undefined }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                          <Space wrap>
                            <Text strong>{roundLabel}</Text>
                            <StatusBadge
                              status={interviewStatus.status}
                              label={interviewStatus.label}
                              tone={interviewStatus.tone}
                            />
                            {isRescheduleRequested && (
                              <Text type="secondary">Candidate requested a new time</Text>
                            )}
                          </Space>
                          <Space wrap>
                            {canEdit && (
                              <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditInterview(inv)}>
                                {isRescheduleRequested ? "Pick new slot" : "Edit"}
                              </Button>
                            )}
                            {canSubmitFeedback && (
                              <Button type="link" size="small" onClick={() => handleFeedbackClick(inv)}>
                                Submit feedback
                              </Button>
                            )}
                            {canMarkCompleted && (
                              <Popconfirm
                                title="Mark as Completed?"
                                description="Confirm this interview round was held and completed."
                                onConfirm={() => handleMarkCompleted(inv.id, inv)}
                                okText="Yes, Completed"
                                cancelText="No"
                                okButtonProps={{ type: "primary", loading: interviewActionKey === completedKey }}
                                cancelButtonProps={{ disabled: interviewActionKey === completedKey }}
                                disabled={rowBusy && interviewActionKey !== completedKey}
                              >
                                <Button type="link" size="small" loading={interviewActionKey === completedKey}
                                  disabled={rowBusy && interviewActionKey !== completedKey}>Mark Completed</Button>
                              </Popconfirm>
                            )}
                            {canMarkNoShow && (
                              <Popconfirm
                                title="Mark as No Show?"
                                description="The candidate did not attend this interview."
                                onConfirm={() => handleMarkNoShow(inv.id, inv)}
                                okText="Yes"
                                cancelText="No"
                                okButtonProps={{ loading: interviewActionKey === noShowKey }}
                                cancelButtonProps={{ disabled: interviewActionKey === noShowKey }}
                                disabled={rowBusy && interviewActionKey !== noShowKey}
                              >
                                <Button type="link" size="small" loading={interviewActionKey === noShowKey}
                                  disabled={rowBusy && interviewActionKey !== noShowKey}>Mark as No Show</Button>
                              </Popconfirm>
                            )}
                            {inv.interviewStatus !== "CANCELLED" && (
                              <Popconfirm
                                title="Cancel this interview?"
                                onConfirm={() => handleCancelInterview(inv.id, inv)}
                                okText="Yes"
                                cancelText="No"
                                okButtonProps={{ danger: true, loading: interviewActionKey === cancelKey }}
                                cancelButtonProps={{ disabled: interviewActionKey === cancelKey }}
                                disabled={rowBusy && interviewActionKey !== cancelKey}
                              >
                                <Button type="text" danger size="small" loading={interviewActionKey === cancelKey}
                                  disabled={rowBusy && interviewActionKey !== cancelKey}>Cancel</Button>
                              </Popconfirm>
                            )}
                            {inv.interviewStatus === "CANCELLED" && (
                              <Button
                                type="link"
                                size="small"
                                onClick={() => {
                                  setSchedulingForApplication(selectedApplication);
                                  setEditingInterview({ ...inv, _rescheduleFromCancelled: true });
                                  setInterviewFormVisible(true);
                                }}
                              >
                                Reschedule
                              </Button>
                            )}
                            {inv.scheduledDate && inv.interviewStatus !== "CANCELLED" && (
                              <Button
                                type="link"
                                size="small"
                                icon={<CalendarOutlined />}
                                onClick={() => downloadInterviewIcs({
                                  title: `${inv.interviewType || "Interview"} — ${selectedApplication?.learner?.firstName || ""} ${selectedApplication?.learner?.lastName || ""}`.trim(),
                                  startDate: inv.scheduledDate,
                                  durationMinutes: inv.durationMinutes,
                                  location: inv.location,
                                  description: inv.roundDescription || "",
                                })}
                              >
                                Add to calendar
                              </Button>
                            )}
                          </Space>
                        </div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {inv.scheduledDate
                            ? formatPlacementDateTime(inv.scheduledDate)
                            : "No date"}
                          {inv.interviewMode && ` · ${inv.interviewMode === "ONLINE" ? "Online" : "In-person"}`}
                        </Text>
                        {inv.location && (
                          <div style={{ marginTop: 4 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>{inv.location}</Text>
                          </div>
                        )}
                        {inv.interviewerName && (
                          <div style={{ marginTop: 4 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>Interviewer: {inv.interviewerName}</Text>
                          </div>
                        )}
                        {inv.feedbackRating != null && (
                          <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #f0f0f0" }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Feedback: {inv.feedbackRating}/5 stars · {{ PROCEED_NEXT_ROUND: "Proceed to next round", HIRE: "Hire", REJECT: "Reject", HOLD: "Hold" }[inv.feedbackRecommendAction] ?? (inv.feedbackRecommendAction ?? "—")}
                            </Text>
                            {inv.feedbackComments && <div><Text type="secondary" style={{ fontSize: 12 }}>{inv.feedbackComments}</Text></div>}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </Space>
              </div>
            )}
            {organizationId && !interviewsLoading && !interviewsError && interviews[selectedApplication.id] && interviews[selectedApplication.id].length === 0 && (
              <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>No interviews scheduled yet.</Text>
            )}

            {/* Status history - Gap 8.2 (only for JobApplication, not external pending) */}
            {!selectedApplication.isExternalPending && (
              <div style={{ marginTop: 16, marginBottom: 16 }}>
                <Divider orientation="left" style={{ fontSize: 14 }}>
                  <Space>
                    <HistoryOutlined />
                    Status History
                    {!applicationHistory.fetched && (
                      <Button type="link" size="small" onClick={fetchApplicationHistory} loading={applicationHistory.loading}>
                        Load history
                      </Button>
                    )}
                  </Space>
                </Divider>
                {applicationHistory.loading ? (
                  <ListSkeleton rows={3} avatar={false} label="Loading application history" />
                ) : applicationHistory.error ? (
                  <Alert
                    type="warning"
                    showIcon
                    message="Status history unavailable"
                    description={applicationHistory.error}
                    action={<Button size="small" onClick={fetchApplicationHistory}>Retry</Button>}
                  />
                ) : applicationHistory.fetched && applicationHistory.data.length === 0 ? (
                  <Text type="secondary" style={{ fontSize: 12 }}>No status history recorded</Text>
                ) : applicationHistory.fetched && applicationHistory.data.length > 0 ? (
                  <Timeline
                    items={applicationHistory.data.map((h, idx) => {
                      const STATUS_LABELS_H = { APPLIED: "Applied", SHORTLISTED: "Shortlisted", ASSESSMENT: "Assessment", INTERVIEW: "Interview", WAITLISTED: "Waitlisted", OFFERED: "Offered", HIRED: "Hired", REJECTED: "Rejected", WITHDRAWN: "Withdrawn" };
                      const label = h.oldStatus
                        ? `${STATUS_LABELS_H[h.oldStatus] || h.oldStatus} → ${STATUS_LABELS_H[h.newStatus] || h.newStatus}`
                        : (STATUS_LABELS_H[h.newStatus] || h.newStatus);
                      const raw = h.changedAt;
                      const dateStr = raw ? formatPlacementDateTime(raw, "—") : "—";
                      return {
                        children: (
                          <div key={idx}>
                            <div style={{ fontWeight: 500, fontSize: 13 }}>{label}</div>
                            <Text type="secondary" style={{ fontSize: 11 }}>{dateStr}</Text>
                            {h.rejectionReason && h.newStatus === "REJECTED" && (
                              <div style={{ marginTop: 2, fontSize: 11, color: "#666" }}>Feedback: {h.rejectionReason}</div>
                            )}
                          </div>
                        ),
                      };
                    })}
                  />
                ) : null}
              </div>
            )}

            {selectedApplication.learner?.id && ["SHORTLISTED", "ASSESSMENT", "INTERVIEW", "OFFERED"].includes(selectedApplication.applicationStatus) && (
              <Button type="primary" onClick={() => { setDetailModalVisible(false); handleScheduleInterview(selectedApplication); }}>
                Schedule Interview
              </Button>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="Edit Internal Notes"
        open={notesModalVisible}
        destroyOnClose
        onCancel={closeNotesEditor}
        onOk={async () => {
          if (!selectedApplication || !job?.id || !collegeId) return;
          setNotesSaveError("");
          setNotesSaving(true);
          try {
            const res = await updateAdminApplicationNotes(job.id, selectedApplication.id, collegeId, notesEditValue, selectedApplication.version);
            if (res?.data?.status === "success" && res?.data?.data) {
              const savedVersion = res.data.data.version;
              setSelectedApplication((prev) => prev ? { ...prev, internalNotes: res.data.data.internalNotes, version: savedVersion } : null);
              setApplications((prev) => prev.map((a) => (a.id === selectedApplication.id ? { ...a, internalNotes: res.data.data.internalNotes, version: savedVersion } : a)));
              message.success("Notes updated");
              originalNotesRef.current = res.data.data.internalNotes || "";
              setNotesModalVisible(false);
              setNotesSaveError("");
            } else {
              const errorMessage = res?.data?.message || "Failed to update notes";
              setNotesSaveError(errorMessage);

            }
          } catch (err) {
            const errorMessage = err?.response?.data?.message || "Failed to update notes";
            setNotesSaveError(errorMessage);

          } finally {
            mutationRef.current = false;
            setNotesSaving(false);
          }
        }}
        confirmLoading={notesSaving}
        okText="Save"
        okButtonProps={{ disabled: notesSaving }}
        cancelButtonProps={{ disabled: notesSaving }}
        closable={!notesSaving}
        maskClosable={false}
        keyboard={!notesSaving}
        width={500}
      >
        {notesSaveError ? <Alert type="error" showIcon message="Notes were not saved" description={notesSaveError}
          closable onClose={() => setNotesSaveError("")} style={{ marginBottom: 12 }} /> : null}
        <Input.TextArea
          rows={5}
          value={notesEditValue}
          onChange={(e) => setNotesEditValue(e.target.value)}
          placeholder="Add internal notes (visible only to admins)..."
          maxLength={2000}
          showCount
        />
      </Modal>

      <Modal
        title="Resume Preview"
        open={!!resumePreviewUrl}
        onCancel={() => setResumePreviewUrl(null)}
        footer={[
          <Button key="open" onClick={() => window.open(resumePreviewUrl, "_blank", "noopener,noreferrer")}>Open in new tab</Button>,
          <Button key="close" type="primary" onClick={() => setResumePreviewUrl(null)}>Close</Button>,
        ]}
        width={800}
        destroyOnClose
      >
        {resumePreviewUrl && (
          <iframe
            src={resumePreviewUrl}
            title="Resume preview"
            style={{ width: "100%", height: "70vh", border: "1px solid #f0f0f0" }}
            sandbox="allow-same-origin allow-scripts"
          />
        )}
      </Modal>

      <Modal
        title="Attach Offer Letter"
        open={offerLetterModalVisible}
        destroyOnClose
        onCancel={closeOfferLetterEditor}
        onOk={async () => {
          if (!selectedApplication || !job?.id || !collegeId || mutationRef.current) return;
          const trimmed = (offerLetterEditValue || "").trim();
          if (!/^https?:\/\/.+/.test(trimmed)) {
            setOfferLetterSaveError("Enter a valid http:// or https:// link.");
            return;
          }
          setOfferLetterSaveError("");
          setOfferLetterSaving(true);
          try {
            const res = await attachAdminOfferLetter(job.id, selectedApplication.id, collegeId, trimmed);
            if (res?.data?.status === "success" && res?.data?.data) {
              const { offerLetterUrl, offerLetterSentAt } = res.data.data;
              setSelectedApplication((prev) => prev ? { ...prev, offerLetterUrl, offerLetterSentAt } : null);
              setApplications((prev) => prev.map((a) => (a.id === selectedApplication.id ? { ...a, offerLetterUrl, offerLetterSentAt } : a)));
              message.success("Offer letter attached");
              originalOfferLetterRef.current = offerLetterUrl || trimmed;
              setOfferLetterModalVisible(false);
              setOfferLetterSaveError("");
            } else {
              const errorMessage = res?.data?.message || "Failed to attach offer letter";
              setOfferLetterSaveError(errorMessage);

            }
          } catch (err) {
            const errorMessage = err?.response?.data?.message || "Failed to attach offer letter";
            setOfferLetterSaveError(errorMessage);

          } finally {
            mutationRef.current = false;
            setOfferLetterSaving(false);
          }
        }}
        confirmLoading={offerLetterSaving}
        okText="Save"
        okButtonProps={{ disabled: offerLetterSaving }}
        cancelButtonProps={{ disabled: offerLetterSaving }}
        closable={!offerLetterSaving}
        maskClosable={false}
        keyboard={!offerLetterSaving}
        width={500}
      >
        {offerLetterSaveError ? <Alert type="error" showIcon message="Offer letter was not attached" description={offerLetterSaveError}
          closable onClose={() => setOfferLetterSaveError("")} style={{ marginBottom: 12 }} /> : null}
        <Input
          value={offerLetterEditValue}
          onChange={(e) => setOfferLetterEditValue(e.target.value)}
          placeholder="https://... link to the offer letter document"
          maxLength={2048}
        />
      </Modal>

      <Modal
        title={schedulingForApplication
          ? `Schedule Interview — ${schedulingForApplication.learner?.firstName || ""} ${schedulingForApplication.learner?.lastName || ""}`.trim()
          : "Schedule Interview"
        }
        open={interviewFormVisible}
        onCancel={() => {
          setInterviewFormVisible(false);
          setSchedulingForApplication(null);
          setEditingInterview(null);
        }}
        // BE-0110: closing goes through the form's own Cancel/Close, which asks before dropping changes and waits for a save.
        closable={false}
        keyboard={false}
        maskClosable={false}
        footer={null}
        width={600}
        destroyOnClose
      >
        {schedulingForApplication && (
          <InterviewForm
            application={schedulingForApplication}
            job={job}
            existingInterviewsCount={(interviews[schedulingForApplication?.id] || []).length}
            organizationId={organizationId ?? schedulingForApplication.organizationId ?? schedulingForApplication.job?.organizationId ?? selectedApplication?.organizationId ?? selectedApplication?.job?.organizationId}
            prefillInterview={editingInterview?._rescheduleFromCancelled ? editingInterview : null}
            onSuccess={handleInterviewFormSuccess}
            onCancel={() => {
              setInterviewFormVisible(false);
              setSchedulingForApplication(null);
              setEditingInterview(null);
            }}
          />
        )}
      </Modal>

      <Modal
        title={editingInterview?.interviewStatus === "RESCHEDULE_REQUESTED"
          ? "Pick new slot (Reschedule)"
          : `Edit Interview — ${editingInterview?.learner?.firstName || ""} ${editingInterview?.learner?.lastName || ""}`.trim()
        }
        open={!!editingInterview}
        onCancel={() => setEditingInterview(null)}
        // BE-0110: closing goes through the form's own Cancel/Close, which asks before dropping changes and waits for a save.
        closable={false}
        keyboard={false}
        maskClosable={false}
        footer={null}
        width={600}
        destroyOnClose
      >
        {editingInterview && (
          <InterviewEditForm
            interview={editingInterview}
            organizationId={organizationId ?? editingInterview.organizationId ?? selectedApplication?.organizationId ?? selectedApplication?.job?.organizationId}
            onSuccess={handleEditInterviewSuccess}
            onCancel={() => setEditingInterview(null)}
          />
        )}
      </Modal>

      {/* Single reject modal with optional reason */}
      <Modal
        title="Reject candidate"
        open={rejectModal.visible}
        onCancel={() => {
          if (mutationRef.current) return;
          if (!(rejectModal.reason || "").trim()) {
            setRejectModal({ visible: false, applicationId: null, reason: "" });
            return;
          }
          Modal.confirm({
            title: "Discard rejection reason?",
            content: "The unsaved rejection reason will be lost.",
            okText: "Discard",
            okButtonProps: { danger: true },
            cancelText: "Keep editing",
            onOk: () => setRejectModal({ visible: false, applicationId: null, reason: "" }),
          });
        }}
        okText="Reject"
        okType="danger"
        onOk={async () => {
          const ok = await handleStatusChange(rejectModal.applicationId, "REJECTED", rejectModal.reason?.trim() || null);
          if (ok) setRejectModal({ visible: false, applicationId: null, reason: "" });
        }}
        confirmLoading={actionLoading[rejectModal.applicationId]}
      >
        <Paragraph>They will be notified by email.</Paragraph>
        <Form.Item label="Reason (optional)" style={{ marginBottom: 0 }}>
          <Input.TextArea
            rows={3}
            placeholder="e.g. Does not meet requirements"
            maxLength={500}
            showCount
            value={rejectModal.reason}
            onChange={(e) => setRejectModal((prev) => ({ ...prev, reason: e.target.value }))}
          />
        </Form.Item>
      </Modal>

      {/* Bulk reject modal with optional reason (applied to all) - Phase 6 17.2, Phase 7 21.6.1: ARIA */}
      <Modal
        title={`Reject ${bulkCount} application(s)?`}
        open={bulkRejectModal.visible}
        onCancel={() => {
          if (mutationRef.current) return;
          if (!(bulkRejectModal.reason || "").trim()) {
            setBulkRejectModal({ visible: false, reason: "", targetIds: [] });
            return;
          }
          Modal.confirm({
            title: "Discard bulk rejection reason?",
            content: "The unsaved reason for these candidates will be lost.",
            okText: "Discard",
            okButtonProps: { danger: true },
            cancelText: "Keep editing",
            onOk: () => setBulkRejectModal({ visible: false, reason: "", targetIds: [] }),
          });
        }}
        aria-label="Confirm bulk rejection of applications"
        okText="Yes, reject all"
        okType="danger"
        onOk={executeBulkReject}
        confirmLoading={bulkLoading}
        destroyOnClose
      >
        <Alert
          type="warning"
          message="This action cannot be undone"
          description="All selected candidates will be moved to Rejected and notified by email. You cannot restore them from this screen."
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Form.Item label="Reason (optional, applied to all)" style={{ marginBottom: 0 }}>
          <Input.TextArea
            rows={3}
            placeholder="e.g. Position closed"
            maxLength={500}
            showCount
            value={bulkRejectModal.reason}
            onChange={(e) => setBulkRejectModal((prev) => ({ ...prev, reason: e.target.value }))}
          />
        </Form.Item>
      </Modal>

      {/* Phase 7 - 21.3.3: Bulk partial failure details modal */}
      <Modal
        title="Bulk update partial failure"
        open={bulkFailureModal.visible}
        onCancel={() => setBulkFailureModal({ visible: false, count: 0, failed: [] })}
        footer={[
          <Button key="close" onClick={() => setBulkFailureModal({ visible: false, count: 0, failed: [] })}>
            Close
          </Button>,
        ]}
        width={500}
      >
        <Alert
          type="warning"
          message={bulkFailureModal.count > 0 ? `${bulkFailureModal.count} updated, ${bulkFailureModal.failed.length} failed` : `All ${bulkFailureModal.failed.length} failed`}
          description="The following applications could not be updated:"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <div style={{ maxHeight: 300, overflowY: "auto" }}>
          {bulkFailureModal.failed.map((f, i) => (
            <div key={i} style={{ padding: "6px 0", borderBottom: i < bulkFailureModal.failed.length - 1 ? "1px solid #f0f0f0" : "none" }}>
              <Text strong>Application #{f.applicationId}</Text>
              <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{f.reason || "Unknown error"}</div>
            </div>
          ))}
        </div>
      </Modal>

      <Modal
        title={`Submit Feedback — ${feedbackForInterview?.learner?.firstName || ""} ${feedbackForInterview?.learner?.lastName || ""}`.trim()}
        open={!!feedbackForInterview}
        onCancel={() => setFeedbackForInterview(null)}
        // BE-0110: closing goes through the form's own Cancel/Close, which asks before dropping changes and waits for a save.
        closable={false}
        keyboard={false}
        maskClosable={false}
        footer={null}
        width={500}
        destroyOnClose
      >
        {feedbackForInterview && (
          <InterviewFeedbackForm
            interview={feedbackForInterview}
            onSuccess={handleFeedbackSuccess}
            onCancel={() => setFeedbackForInterview(null)}
          />
        )}
      </Modal>
        </>
      )}
    </div>
  );
}

