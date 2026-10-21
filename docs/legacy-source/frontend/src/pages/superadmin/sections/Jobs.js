import React, { useState, useEffect, useCallback, useRef } from "react";
import { Alert, Table, Button, Tag, Space, Modal, message, Typography, Select, Popconfirm, Input, Pagination } from "antd";
import { PlusOutlined, EditOutlined, EyeOutlined, CloseCircleOutlined, DeleteOutlined, CalendarOutlined } from "@ant-design/icons";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import {
  searchAdminJobs,
  bulkUpdateAdminJobStatus,
  setAdminJobStatus,
  getColleges,
  deleteAdminJob,
  getAdminJobDeletionImpact,
  fetchWithErrorHandling,
} from "@/api/Services/AdminService";
import moment from "moment";
import JobForm from "./JobForm";
import StudentPlacementLookup from "./StudentPlacementLookup";
import { getJobTypeTag } from "@/utils/jobTagUtils";
import { parsePlacementUtcDateTime } from "@/utils/placementDateTime";
import { CardGridSkeleton, RefreshStatus, TableSkeleton } from "@/components/Common/Skeletons";
import { PanelEmpty, StatusBadge } from "@/components/Common/PanelStates";
import { withReturnTo } from "@/utils/navigationContext";

const { Text, Paragraph } = Typography;
const { Option } = Select;

function parseJobDate(raw) {
  return parsePlacementUtcDateTime(raw);
}

function isJobExpired(applicationDeadline) {
  const m = parseJobDate(applicationDeadline);
  return m ? m.isBefore(moment(), "minute") : false;
}

function formatJobDeadline(raw) {
  const m = parseJobDate(raw);
  return m ? m.format("DD MMM YYYY") : "—";
}

/**
 * @param {number|null} collegeId - When set (e.g. college admin), scope to this college and hide college selector.
 * @param {string} basePath - Base path for "View Applications" link (default "/superadmin", use "/college-admin" for college admin).
 */
export default function Jobs({ collegeId = null, basePath = "/superadmin" }) {
  const router = useRouter();
  const loginUser = useSelector((state) => state.loginUser);
  const [colleges, setColleges] = useState([]);
  const [selectedCollegeId, setSelectedCollegeId] = useState(collegeId ?? null);
  const [jobs, setJobs] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [loadedScopeKey, setLoadedScopeKey] = useState(null);
  // Read through a ref inside the fetch callback: as a dependency it rebuilt the callback after every load and
  // re-ran the effects that call it (a duplicate request, plus their resets).
  const loadedScopeKeyRef = useRef(loadedScopeKey);
  loadedScopeKeyRef.current = loadedScopeKey;
  const [errorScopeKey, setErrorScopeKey] = useState(null);
  const [formVisible, setFormVisible] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "draft" | "active" | "closed"
  const [searchText, setSearchText] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [fetchError, setFetchError] = useState(null);
  const [selectedJobKeys, setSelectedJobKeys] = useState([]);
  const [bulkLoading, setBulkLoading] = useState({ action: null });
  const [statusActionError, setStatusActionError] = useState(null);
  const [bulkStatusError, setBulkStatusError] = useState(null);
  const actionLocksRef = useRef(new Set());
  const bulkStatusRef = useRef(false);
  const jobsAbortRef = useRef(null);
  const collegesAbortRef = useRef(null);
  const queryHydratedRef = useRef(false);
  const collegeScopeInitializedRef = useRef(false);
  const mutationRef = useRef(false);
  const confirmRef = useRef(false);

  const updateListQuery = useCallback((patch) => {
    if (!router.isReady) return;
    const next = { ...(router.query || {}), ...patch };
    if (!next.q) delete next.q;
    if (!next.status || next.status === "all") delete next.status;
    if (!next.page || Number(next.page) === 1) delete next.page;
    if (!next.size || Number(next.size) === 20) delete next.size;
    router.replace(
      { pathname: router.pathname, query: next },
      undefined,
      { shallow: true, scroll: false }
    );
  }, [router]);

  // Hydrate safe list controls from the URL so refresh/back/deep-links restore the same view.
  useEffect(() => {
    if (!router.isReady) return;
    const querySearch = Array.isArray(router.query.q) ? router.query.q[0] : router.query.q;
    const queryStatus = Array.isArray(router.query.status) ? router.query.status[0] : router.query.status;
    const queryPage = Math.max(1, Number(Array.isArray(router.query.page) ? router.query.page[0] : router.query.page) || 1);
    const querySizeRaw = Number(Array.isArray(router.query.size) ? router.query.size[0] : router.query.size);
    const querySize = [10, 20, 50, 100].includes(querySizeRaw) ? querySizeRaw : 20;
    const nextStatus = ["all", "draft", "active", "closed"].includes(String(queryStatus || "").toLowerCase())
      ? String(queryStatus).toLowerCase()
      : "all";
    const nextSearch = typeof querySearch === "string" ? querySearch : "";

    queryHydratedRef.current = false;
    setSearchText(nextSearch);
    setSearchDebounced(nextSearch);
    setStatusFilter(nextStatus);
    setCurrentPage(queryPage);
    setPageSize(querySize);
    setSelectedJobKeys([]);
    queryHydratedRef.current = true;
  }, [router.isReady, router.query.q, router.query.status, router.query.page, router.query.size]);

  // Debounce typed search but do not reset a page restored from Back/Forward.
  useEffect(() => {
    if (!queryHydratedRef.current || !router.isReady) return undefined;
    const querySearchRaw = Array.isArray(router.query.q) ? router.query.q[0] : router.query.q;
    const querySearch = typeof querySearchRaw === "string" ? querySearchRaw : "";
    if (searchText === querySearch) {
      setSearchDebounced(searchText);
      return undefined;
    }

    const t = setTimeout(() => {
      setSearchDebounced(searchText);
      setCurrentPage(1);
      setSelectedJobKeys([]);
      updateListQuery({ q: searchText, page: 1 });
    }, 400);
    return () => clearTimeout(t);
  }, [searchText, router.isReady, router.query.q, updateListQuery]);

  const handleStatusFilterChange = useCallback((value) => {
    setStatusFilter(value);
    setCurrentPage(1);
    setSelectedJobKeys([]);
    updateListQuery({ status: value, page: 1 });
  }, [updateListQuery]);

  const handlePageChange = useCallback((page, size) => {
    const nextSize = size || 20;
    setCurrentPage(page);
    setPageSize(nextSize);
    setSelectedJobKeys([]);
    updateListQuery({ page, size: nextSize });
  }, [updateListQuery]);

  const hasListFilters = Boolean(searchDebounced.trim()) || statusFilter !== "all";

  const clearListFilters = useCallback(() => {
    setSearchText("");
    setSearchDebounced("");
    setStatusFilter("all");
    setCurrentPage(1);
    setSelectedJobKeys([]);
    updateListQuery({ q: "", status: "all", page: 1 });
  }, [updateListQuery]);

  const jobsEmptyState = (
    <PanelEmpty
      compact
      title={hasListFilters ? "No drives match these filters" : "No drives yet"}
      description={
        hasListFilters
          ? "Try a different search or status, or clear the current filters."
          : "Create the first drive for this college when you're ready."
      }
      ctaLabel={hasListFilters ? "Clear filters" : "Create drive"}
      onCta={
        hasListFilters
          ? clearListFilters
          : () => {
              setEditingJob(null);
              setFormVisible(true);
            }
      }
    />
  );

  useEffect(() => {
    if (!collegeScopeInitializedRef.current) {
      collegeScopeInitializedRef.current = true;
      return;
    }
    if (!queryHydratedRef.current) return;
    setCurrentPage(1);
    setSelectedJobKeys([]);
    updateListQuery({ page: 1 });
  }, [selectedCollegeId]); // eslint-disable-line react-hooks/exhaustive-deps

  function getJobApplicationDeadline(job) {
    if (job?.applicationDeadline) return job.applicationDeadline;
    const dates = job?.importantDates || job?.important_dates;
    if (!Array.isArray(dates)) return null;
    const entry = dates.find(
      (d) => String(d?.label ?? "").trim().toLowerCase() === "application deadline"
    );
    return entry?.date ?? null;
  }

  const isCollegeScoped = collegeId != null && collegeId > 0;
  const enforceHeaderCollegeScope = basePath === "/superadmin";
  const jobsScopeKey = selectedCollegeId
    ? JSON.stringify([Number(selectedCollegeId), currentPage, pageSize, statusFilter, searchDebounced || ""])
    : null;
  const hasCurrentJobs = jobsScopeKey != null && loadedScopeKey === jobsScopeKey;
  const currentFetchError = errorScopeKey === jobsScopeKey ? fetchError : null;
  const initialJobsLoading = Boolean(jobsScopeKey && loading && !hasCurrentJobs && !currentFetchError);
  const jobsRefreshing = Boolean(jobsScopeKey && loading && hasCurrentJobs);
  // NOTE: Don't early-return before hooks (React rules-of-hooks).

  useEffect(() => {
    if (isCollegeScoped) {
      setSelectedCollegeId(collegeId);
    }
  }, [collegeId, isCollegeScoped]);

  useEffect(() => {
    return () => {
      jobsAbortRef.current?.abort();
      collegesAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!isCollegeScoped && !enforceHeaderCollegeScope) fetchColleges();
  }, [isCollegeScoped]);

  const fetchJobs = useCallback(async () => {
    const requestScopeKey = jobsScopeKey;
    if (!selectedCollegeId || !requestScopeKey) return;
    jobsAbortRef.current?.abort();
    const ac = new AbortController();
    jobsAbortRef.current = ac;
    const signal = ac.signal;
    const scopeChanged = loadedScopeKeyRef.current !== requestScopeKey;
    if (scopeChanged) {
      setJobs([]);
      setTotalElements(0);
      setSelectedJobKeys([]);
    }
    setLoading(true);
    setFetchError(null);
    setErrorScopeKey(null);
    try {
      // Server-side paginated/filtered/searched — this used to fetch the college's ENTIRE job
      // history unbounded on every load, fine at a handful of drives but not once a college has
      // run hundreds across multiple placement seasons.
      const response = await searchAdminJobs(selectedCollegeId, {
        page: currentPage - 1,
        size: pageSize,
        status: statusFilter,
        search: searchDebounced && searchDebounced.trim() ? searchDebounced.trim() : undefined,
        sortBy: "postedDate",
        sortDir: "desc",
      }, { signal });
      if (signal.aborted) return;
      const data = response?.data?.data ?? response?.data;
      const jobsData = Array.isArray(data?.content) ? data.content : [];
      setJobs(jobsData);
      setLoadedScopeKey(requestScopeKey);
      const newTotal = data?.totalElements ?? jobsData.length;
      setTotalElements(newTotal);
      if (newTotal > 0) {
        const lastPage = Math.ceil(newTotal / pageSize);
        if (currentPage > lastPage) {
          setCurrentPage(lastPage);
        }
      } else if (currentPage > 1) {
        setCurrentPage(1);
      }
    } catch (error) {
      if (error?.name === "AbortError" || error?.name === "CanceledError") return;
      setFetchError("Failed to load jobs. Please try again.");
      setErrorScopeKey(requestScopeKey);
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [selectedCollegeId, currentPage, pageSize, statusFilter, searchDebounced, jobsScopeKey]);

  useEffect(() => {
    if (selectedCollegeId) {
      fetchJobs();
    } else {
      setJobs([]);
      setTotalElements(0);
    }
  }, [selectedCollegeId, fetchJobs]);

  const fetchColleges = async () => {
    collegesAbortRef.current?.abort();
    const ac = new AbortController();
    collegesAbortRef.current = ac;
    const signal = ac.signal;
    const result = await fetchWithErrorHandling(getColleges({ signal }));
    if (signal.aborted) return;
    if (result.success) {
      const list = Array.isArray(result.data) ? result.data : result.data?.data ?? [];
      setColleges(list);
      if (list.length > 0 && !selectedCollegeId) {
        const userCollegeId = loginUser?.collegeId ?? loginUser?.college_id;
        const preferred = userCollegeId != null && list.some((c) => (c.id ?? c.collegeId) === userCollegeId)
          ? userCollegeId
          : list[0].id ?? list[0].collegeId;
        setSelectedCollegeId(preferred);
      }
    }
  };

  const handleCreate = () => {
    setEditingJob(null);
    setFormVisible(true);
  };

  const handleEdit = (job) => {
    setEditingJob(job);
    setFormVisible(true);
  };

  const handleViewApplications = (jobId) => {
    if (!selectedCollegeId) {
      message.warning("Please select a college first");
      return;
    }
    const params = new URLSearchParams({ type: "lms", collegeId: String(selectedCollegeId) });
    const path = `${basePath.replace(/\/$/, "")}/jobs/${jobId}/applications?${params.toString()}`;
    router.push(withReturnTo(path, router.asPath));
  };

  const handleToggleStatus = async (jobId, currentStatus, rejectOnFailure = true) => {
    const lockKey = `status:${jobId}`;
    if (actionLocksRef.current.has(lockKey)) return false;
    actionLocksRef.current.add(lockKey);
    const newStatus = !currentStatus;
    const actionCollegeId = selectedCollegeId;
    setStatusActionError(null);
    setActionLoading((prev) => ({ ...prev, [jobId]: { ...prev[jobId], toggle: true } }));
    try {
      const response = await setAdminJobStatus(jobId, newStatus, actionCollegeId);
      if (response?.data?.status !== "success") {
        throw new Error(response?.data?.message || "Failed to update job status");
      }
      message.success(`Job ${newStatus ? "opened" : "closed"} successfully`);
      if (String(actionCollegeId) === String(selectedCollegeId)) fetchJobs();
      return true;
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to update job status";
      if (String(actionCollegeId) === String(selectedCollegeId)) {
        setStatusActionError({ jobId, currentStatus, message: errorMessage });
      }
      if (rejectOnFailure) throw error;
      return false;
    } finally {
      actionLocksRef.current.delete(lockKey);
      setActionLoading((prev) => ({ ...prev, [jobId]: { ...prev[jobId], toggle: false } }));
    }
  };

  const handleBulkStatus = async (isActive) => {
    if (selectedJobKeys.length === 0 || bulkStatusRef.current) return false;
    const ids = [...selectedJobKeys];
    bulkStatusRef.current = true;
    setBulkLoading({ action: isActive ? "open" : "close" });
    setBulkStatusError(null);
    try {
      const response = await bulkUpdateAdminJobStatus(selectedCollegeId, ids, isActive);
      if (response?.data?.status !== "success") {
        throw new Error(response?.data?.message || "Bulk update failed");
      }
      const data = response.data.data ?? {};
      const failed = Array.isArray(data.failed) ? data.failed : [];
      if (failed.length > 0) {
        const failedIds = failed.map((row) => row.jobId ?? row.id).filter((id) => id != null);
        setSelectedJobKeys(failedIds);
        setBulkStatusError({
          isActive,
          message: `${data.updatedCount ?? 0} ${isActive ? "opened" : "closed"}, ${failed.length} failed. Retry will target only the failed drives.`,
        });
      } else {
        setSelectedJobKeys([]);
        message.success(`${data.updatedCount ?? ids.length} drive(s) ${isActive ? "opened" : "closed"}`);
      }
      fetchJobs();
      return failed.length === 0;
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || "Bulk update failed";
      setBulkStatusError({ isActive, message: errorMessage });
      return false;
    } finally {
      bulkStatusRef.current = false;
      setBulkLoading({ action: null });
    }
  };

  const handleDelete = async (jobId) => {
    if (mutationRef.current) return false;
    mutationRef.current = true;
    setActionLoading((prev) => ({ ...prev, [jobId]: { ...prev[jobId], delete: true } }));
    try {
      const response = await deleteAdminJob(jobId, selectedCollegeId);
      if (response?.data?.status === "success") {
        message.success("Job deleted successfully");
        fetchJobs();
        return true;
      } else {
        message.error(response?.data?.message || "Failed to delete job");
      }
    } catch (error) {
      message.error(error?.response?.data?.message || "Failed to delete job");
    } finally {
      mutationRef.current = false;
      setActionLoading((prev) => ({ ...prev, [jobId]: { ...prev[jobId], delete: false } }));
    }
    return false;
  };

  const handleDeleteRequest = async (record) => {
    if (!record?.id || !selectedCollegeId || mutationRef.current || confirmRef.current) return;
    mutationRef.current = true;
    const jobId = record.id;
    setActionLoading((prev) => ({ ...prev, [jobId]: { ...prev[jobId], deletePreview: true } }));
    try {
      const response = await getAdminJobDeletionImpact(jobId, selectedCollegeId);
      const impact = response?.data?.data ?? {};
      const activeApplications = Number(impact.activeApplicationCount || 0);
      const affectedLearners = Number(impact.affectedLearnerCount || 0);
      const openInterviews = Number(impact.openInterviewCount || 0);

      mutationRef.current = false;
      confirmRef.current = true;
      Modal.confirm({
        title: `Delete "${impact.jobTitle || record.jobTitle || "this job"}"?`,
        content: (
          <div>
            {activeApplications > 0 ? (
              <>
                <Paragraph style={{ marginBottom: 8 }}>
                  <strong>{activeApplications}</strong> active application(s) from{" "}
                  <strong>{affectedLearners}</strong> learner(s) are attached to this drive.
                </Paragraph>
                <Paragraph style={{ marginBottom: 8 }}>
                  Their application records will be preserved and affected learners will be notified.
                </Paragraph>
                {openInterviews > 0 && (
                  <Paragraph style={{ marginBottom: 8 }}>
                    <strong>{openInterviews}</strong> scheduled/confirmed interview(s) will be cancelled.
                  </Paragraph>
                )}
              </>
            ) : (
              <Paragraph style={{ marginBottom: 8 }}>No active learner applications are attached to this drive.</Paragraph>
            )}
            <Text type="secondary">The job listing will be removed and cannot be restored from this screen.</Text>
          </div>
        ),
        okText: "Delete drive",
        okType: "danger",
        cancelText: "Cancel",
        // BE-0112: a failed delete keeps the confirmation (and its impact summary) open for a retry.
        onOk: async () => {
          const deleted = await handleDelete(jobId);
          if (!deleted) throw new Error("delete failed");
        },
        onCancel: () => { confirmRef.current = false; },
        afterClose: () => { confirmRef.current = false; },
      });
    } catch (error) {
      mutationRef.current = false;
      message.error(error?.response?.data?.message || "Could not preview deletion impact. Nothing was deleted.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [jobId]: { ...prev[jobId], deletePreview: false } }));
    }
  };

  const handleFormSuccess = () => {
    setFormVisible(false);
    setEditingJob(null);
    fetchJobs();
  };

  const getStatusTag = (isActive, isDraft, expired = false) => {
    if (isDraft) return <StatusBadge status="draft" />;
    if (isActive && expired) {
      return <StatusBadge status="expired" label="Open · Expired" />;
    }
    return isActive
      ? <StatusBadge status="open" />
      : <StatusBadge status="closed" />;
  };

  const columns = [
    {
      title: "Job Title",
      dataIndex: "jobTitle",
      key: "jobTitle",
      width: 220,
      render: (text, record) => {
        const appDeadline = getJobApplicationDeadline(record);
        const expired = !record.isDraft && isJobExpired(appDeadline);
        return (
          <Space direction="vertical" size="small">
            <Space size="small" wrap>
              {getStatusTag(record.isActive, record.isDraft, expired)}
              <Text strong>{text}</Text>
            </Space>
            <Text type="secondary" style={{ fontSize: "12px" }}>{record.companyName}</Text>
          </Space>
        );
      },
    },
    {
      title: "Type",
      dataIndex: "jobType",
      key: "jobType",
      width: 110,
      render: (type) => getJobTypeTag(type),
    },
    {
      title: "Location",
      dataIndex: "location",
      key: "location",
      width: 130,
      render: (location) => location || "-",
    },
    {
      title: "Deadline",
      key: "applicationDeadline",
      width: 100,
      render: (_, record) => {
        const appDeadline = getJobApplicationDeadline(record);
        if (!appDeadline) return <Text type="secondary">—</Text>;
        const expired = isJobExpired(appDeadline);
        return (
          <Space size="small">
            <CalendarOutlined style={{ fontSize: 12, color: expired ? "#fa8c16" : "#8c8c8c" }} />
            <Text type={expired ? "secondary" : undefined} style={expired ? { textDecoration: "line-through" } : undefined}>
              {formatJobDeadline(appDeadline)}
            </Text>
          </Space>
        );
      },
    },
    {
      title: "Posted",
      key: "postedDate",
      width: 90,
      render: (_, record) => {
        const m = parseJobDate(record.postedDate || record.createdAt);
        return m ? <Text type="secondary">{m.format("DD MMM YYYY")}</Text> : <Text type="secondary">—</Text>;
      },
    },
    {
      title: "Applicants",
      key: "applicantCount",
      width: 90,
      render: (_, record) => {
        const count = record.applicationCount ?? record.applicantCount;
        return <Text>{count != null ? count : "—"}</Text>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 250,
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Button icon={<EyeOutlined />} size="small" onClick={() => handleViewApplications(record.id)} aria-label={`View applications for ${record.jobTitle ?? "job"}`}>
            View Applications
          </Button>
          <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)} aria-label={`Edit job ${record.jobTitle ?? ""}`}>
            Edit
          </Button>
          {!record.isDraft && (
            <Popconfirm
              title={`Are you sure you want to ${record.isActive ? "close" : "open"} this job?`}
              onConfirm={() => handleToggleStatus(record.id, record.isActive, true)}
              okText="Yes"
              cancelText="No"
              okButtonProps={{ size: "large" }}
              cancelButtonProps={{ size: "large" }}
            >
              <Button
                type={record.isActive ? "default" : "primary"}
                danger={record.isActive}
                size="small"
                loading={actionLoading[record.id]?.toggle}
                aria-label={`${record.isActive ? "Close" : "Open"} job ${record.jobTitle ?? ""}`}
              >
                {record.isActive ? "Close" : "Open"}
              </Button>
            </Popconfirm>
          )}
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            loading={actionLoading[record.id]?.delete || actionLoading[record.id]?.deletePreview}
            onClick={() => handleDeleteRequest(record)}
            aria-label={`Delete job ${record.jobTitle ?? ""}`}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const renderMobileJobCard = (record) => {
    const appDeadline = getJobApplicationDeadline(record);
    const expired = !record.isDraft && isJobExpired(appDeadline);
    const count = record.applicationCount ?? record.applicantCount;
    return (
      <div key={record.id} className="admin-jobs-mobile-card">
        <div className="admin-jobs-mobile-card__header">
          <span className="admin-jobs-mobile-card__title">{record.jobTitle}</span>
          {getStatusTag(record.isActive, record.isDraft, expired)}
        </div>
        {record.companyName && (
          <div className="admin-jobs-mobile-card__company">{record.companyName}</div>
        )}
        <div className="admin-jobs-mobile-card__meta">
          {getJobTypeTag(record.jobType)}
          {/* Draft is already the status chip in the header: said once. */}
        </div>
        <div className="admin-jobs-mobile-card__deadline">
          <CalendarOutlined style={{ fontSize: 12, marginRight: 4 }} />
          {appDeadline ? formatJobDeadline(appDeadline) : "—"} · {count != null ? `${count} applicants` : "—"}
        </div>
        <div className="admin-jobs-mobile-card__actions">
          <Button type="primary" size="small" icon={<EyeOutlined />} onClick={() => handleViewApplications(record.id)}>
            View
          </Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Edit
          </Button>
          {!record.isDraft && (
            <Popconfirm
              title={record.isActive ? "Close this job?" : "Open this job?"}
              onConfirm={() => handleToggleStatus(record.id, record.isActive, true)}
              okButtonProps={{ size: "large" }}
              cancelButtonProps={{ size: "large" }}
            >
              <Button size="small" loading={actionLoading[record.id]?.toggle}>
                {record.isActive ? "Close" : "Open"}
              </Button>
            </Popconfirm>
          )}
          <Button
            size="small"
            danger
            type="text"
            icon={<DeleteOutlined />}
            loading={actionLoading[record.id]?.delete || actionLoading[record.id]?.deletePreview}
            onClick={() => handleDeleteRequest(record)}
          >
            Delete
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-jobs-page">
      {enforceHeaderCollegeScope && !isCollegeScoped ? (
        <Alert
          type="warning"
          showIcon
          message="Select a College to manage Jobs"
          description="Jobs are treated as college-scoped in Superadmin. Use the header Organization/College selector."
        />
      ) : (
        <>
      <div className="admin-jobs-header ln-module__head bg-white">
        <h1 className="admin-jobs-title">{isCollegeScoped ? "Jobs" : "Jobs Management (LMS)"}</h1>
        <div className="admin-jobs-controls" style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
          <Space wrap>
            {!isCollegeScoped && !enforceHeaderCollegeScope && (
              <Select
                placeholder="Select college"
                value={selectedCollegeId}
                onChange={setSelectedCollegeId}
                style={{ minWidth: 200 }}
                allowClear={false}
              >
                {colleges.map((c) => (
                  <Option key={c.id} value={c.id}>
                    {c.name || c.id}
                  </Option>
                ))}
              </Select>
            )}
            <Input.Search
              placeholder="Search by job title or company"
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 260 }}
              aria-label="Search jobs"
            />
            <Select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              style={{ width: 120 }}
              aria-label="Filter by status"
            >
              <Option value="all">All</Option>
              <Option value="draft">Draft</Option>
              <Option value="active">Active</Option>
              <Option value="closed">Closed</Option>
            </Select>
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} disabled={!selectedCollegeId}>
            Create Job
          </Button>
        </div>
        {selectedJobKeys.length > 0 && (
          <div style={{ marginTop: 12, padding: "8px 12px", background: "#e6f4ff", border: "1px solid #91caff", borderRadius: 6 }}>
            <Space>
              <Text strong>{selectedJobKeys.length} selected</Text>
              <Popconfirm
                title={`Open ${selectedJobKeys.length} drive(s)?`}
                description="Learners will be able to apply to all of the selected drives."
                onConfirm={() => handleBulkStatus(true)}
                disabled={Boolean(bulkLoading.action)}
                okText="Open"
                cancelText="Cancel"
                okButtonProps={{ size: "large" }}
                cancelButtonProps={{ size: "large" }}
              >
                <Button size="small" loading={bulkLoading.action === "open"}>Open</Button>
              </Popconfirm>
              <Popconfirm
                title={`Close ${selectedJobKeys.length} drive(s)?`}
                description="Learners will no longer be able to apply to any of the selected drives."
                onConfirm={() => handleBulkStatus(false)}
                disabled={Boolean(bulkLoading.action)}
                okText="Close"
                okType="danger"
                cancelText="Cancel"
                okButtonProps={{ size: "large" }}
                cancelButtonProps={{ size: "large" }}
              >
                <Button size="small" danger loading={bulkLoading.action === "close"}>Close</Button>
              </Popconfirm>
            </Space>
          </div>
        )}
      </div>

      {selectedCollegeId && <StudentPlacementLookup key={selectedCollegeId} collegeId={selectedCollegeId} /* BE-0092 */ />}

      {!selectedCollegeId ? (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <Text type="secondary" style={{ fontSize: 14 }}>{isCollegeScoped ? "No college assigned. Contact your administrator." : "Select a college above to manage job postings."}</Text>
        </div>
      ) : currentFetchError && !hasCurrentJobs ? (
        <div
          className="admin-jobs-error-card"
          style={{
            padding: "48px 24px",
            textAlign: "center",
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #f0f0f0",
          }}
        >
          <CloseCircleOutlined style={{ fontSize: 48, color: "#ff4d4f", marginBottom: 16 }} />
          <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>{currentFetchError}</Text>
          <Button type="primary" onClick={() => fetchJobs()}>
            Try Again
          </Button>
        </div>
      ) : (
        <>
          {statusActionError ? (
            <Alert
              type="error"
              showIcon
              message="Drive status was not changed"
              description={statusActionError.message}
              action={
                <Button size="small"
                  onClick={() => handleToggleStatus(statusActionError.jobId, statusActionError.currentStatus, false)}
                  disabled={Boolean(actionLoading[statusActionError.jobId]?.toggle)}>
                  Retry
                </Button>
              }
              closable
              onClose={() => setStatusActionError(null)}
              style={{ marginBottom: 16 }}
            />
          ) : null}
          {bulkStatusError ? (
            <Alert
              type="warning"
              showIcon
              message="Some drive statuses were not changed"
              description={bulkStatusError.message}
              action={<Button size="small" onClick={() => handleBulkStatus(bulkStatusError.isActive)} disabled={Boolean(bulkLoading.action)}>Retry failed</Button>}
              closable
              onClose={() => setBulkStatusError(null)}
              style={{ marginBottom: 16 }}
            />
          ) : null}
          {jobsRefreshing ? <RefreshStatus label="Refreshing drives…" /> : null}
          {currentFetchError && hasCurrentJobs ? (
            <Alert
              type="warning"
              showIcon
              message="Couldn't refresh drives"
              description="Showing the last drives loaded for these filters."
              action={<Button size="small" onClick={fetchJobs}>Retry</Button>}
              style={{ marginBottom: 16 }}
            />
          ) : null}
          <div className="admin-jobs-desktop">
            {initialJobsLoading ? (
              <TableSkeleton rows={10} columns={8} label="Loading drives" />
            ) : (
            <Table
              columns={columns}
              dataSource={jobs}
              rowKey="id"
              rowSelection={{
                selectedRowKeys: selectedJobKeys,
                onChange: setSelectedJobKeys,
                getCheckboxProps: (record) => ({ disabled: record.isDraft }),
              }}
              locale={{ emptyText: jobsEmptyState }}
              pagination={{
                current: currentPage,
                pageSize,
                total: totalElements,
                showSizeChanger: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
                onChange: (page, size) => { setCurrentPage(page); setPageSize(size || 20); setSelectedJobKeys([]); },
              }}
              scroll={{ x: "max-content" }}
              aria-label="Jobs table"
            />
            )}
          </div>
          <div className="admin-jobs-mobile">
            {initialJobsLoading ? (
              <CardGridSkeleton cards={4} columns={1} compact label="Loading drives" />
            ) : (
              <>
                <div className="admin-jobs-mobile-cards">
                  {jobs.length === 0 ? (
                    jobsEmptyState
                  ) : (
                    jobs.map(renderMobileJobCard)
                  )}
                </div>
                {totalElements > pageSize && (
                  <div style={{ padding: "16px 0", textAlign: "center" }}>
                    <Pagination
                      current={currentPage}
                      pageSize={pageSize}
                      total={totalElements}
                      simple
                      onChange={handlePageChange}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      <Modal
        title={editingJob ? "Edit Job" : "Create Job"}
        open={formVisible}
        destroyOnClose
        onCancel={() => {
          setFormVisible(false);
          setEditingJob(null);
        }}
        footer={null}
        width={800}
        className="admin-list-page-modal"
      >
        <JobForm
          job={editingJob}
          organizationId={editingJob?.organizationId}
          collegeId={selectedCollegeId ?? editingJob?.collegeId}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setFormVisible(false);
            setEditingJob(null);
          }}
        />
      </Modal>
        </>
      )}
    </div>
  );
}
