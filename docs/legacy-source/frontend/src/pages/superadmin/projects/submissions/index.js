import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { Alert, Button, Card, Col, Empty, Input, Modal, Popconfirm, Row, Select, Skeleton, Space, Statistic, Table, Tabs, Tag, Tooltip, Typography, message } from "antd";
import { CheckCircleOutlined, ClockCircleOutlined, EditOutlined, FileTextOutlined, InboxOutlined, SearchOutlined, DownloadOutlined } from "@ant-design/icons";
import { exportRowsToCsv } from "@/utils/csvExport";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";
import SuperAdminGroupShell from "@/components/admin/SuperAdminGroupShell";
import { useSuperAdminScope } from "@/contexts/SuperAdminScopeContext";
import { fetchWithErrorHandling, getProjectsByCollege } from "@/api/Services/AdminService";
import { adminReviewProjectDelivery } from "@/api/Services/projectService";
import {
  ageColor,
  ageLabel,
  asArray,
  formatTimestamp,
  isArchivedStatus,
  normaliseCollegeScopedName,
  projectMentorMember,
  projectStaleDays,
  projectStatus,
  reviewStatusColor,
  statusColor,
  statusLabel,
  submissionTypeLabel,
  textOrDash,
  unwrapApiList,
} from "@/components/admin/projects/adminProjectUtils";

const { Text } = Typography;

const getDelivery = (project) => project?.resolvedDelivery || project?.delivery || {};

// The backend's delivery review-status state machine (ProjectWorkspaceServiceImpl.applyDeliveryUpdate)
// only ever sets one of these six strings. "Draft" is reachable even on a workspace that has a real
// submittedAt: after a mentor requests changes, the learner can SAVE_DRAFT repeatedly while revising
// before resubmitting — that flips reviewStatus back to "Draft" without clearing submittedAt, so the
// workspace stays on the Submissions tab (see the `submissions` filter below) the whole time it's
// mid-revision.
const REVIEW_STATUS_OPTIONS = [
  { value: "Submitted", label: "Submitted" },
  { value: "Under Review", label: "Under Review" },
  { value: "Changes Requested", label: "Changes Requested" },
  { value: "Draft", label: "Draft (revising)" },
  { value: "Accepted", label: "Accepted" },
  { value: "Locked", label: "Locked" },
];

const reviewStatusOf = (project) => String(getDelivery(project)?.reviewStatus ?? "").trim().toLowerCase();

const isPendingReview = (project) => {
  const status = reviewStatusOf(project);
  return !status || status === "submitted" || status === "under review";
};

// A delivery sent back for changes — whether still showing the mentor's last verdict
// ("Changes Requested") or actively being reworked ("Draft") — has been reviewed once but is NOT
// finished. The old page's `reviewed = submitted - pendingReview` math silently folded both of
// these into the "Reviewed" stat alongside Accepted/Locked, overstating how much work was
// actually done and hiding that anything was in the learner's court at all.
const needsLearnerAction = (project) => {
  const status = reviewStatusOf(project);
  return status === "draft" || status === "changes requested";
};

const isReviewed = (project) => {
  const status = reviewStatusOf(project);
  return status === "accepted" || status === "locked";
};

const QUICK_FILTERS = [
  { key: "pending", label: "Pending review", match: isPendingReview },
  { key: "needsAction", label: "Needs student action", match: needsLearnerAction },
  { key: "reviewed", label: "Reviewed", match: isReviewed },
];

const pendingDays = (project) => {
  if (!isPendingReview(project)) return null;
  const submittedAt = getDelivery(project)?.submittedAt;
  if (!submittedAt) return null;
  const submitted = new Date(submittedAt);
  if (Number.isNaN(submitted.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - submitted.getTime()) / (1000 * 60 * 60 * 24)));
};

// Only http(s) links are opened or rendered — a delivery URL is free text on an unvalidated JSON
// blob, so a javascript:/data: scheme must never become a live link or a window.open target.
const safeHttpUrl = (value) => {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : null;
};

function SuperAdminProjectSubmissionsPageBody() {
  const router = useRouter();
  const { selectedCollegeId: collegeId, scopeLoaded } = useSuperAdminScope();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [projects, setProjects] = useState([]);
  const [activeTab, setActiveTab] = useState("submitted");
  const [reviewStatus, setReviewStatus] = useState(undefined);
  const [quickFilter, setQuickFilter] = useState(null);
  const [search, setSearch] = useState("");
  const [hydratedFromUrl, setHydratedFromUrl] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [reviewSaving, setReviewSaving] = useState(null);

  // Restore the review-status filter and active tab from the URL on load, mirroring the
  // ?fromMentorId= pattern in reassign-mentor/index.js, so a shared/reloaded link lands back on
  // the same filtered view.
  useEffect(() => {
    if (!router.isReady || hydratedFromUrl) return;
    const q = router.query;
    if (q.status !== undefined) {
      // Filtering itself (reviewStatusOf comparison below) is already case-insensitive, but the
      // Select only matches an exact-case option value — a differently-cased ?status= (e.g.
      // "submitted" or "SUBMITTED") filtered correctly while rendering the dropdown as blank,
      // making the admin think no filter was active. Normalize against the known option list.
      const candidate = String(q.status);
      const matched = REVIEW_STATUS_OPTIONS.find((option) => option.value.toLowerCase() === candidate.toLowerCase());
      setReviewStatus(matched ? matched.value : candidate);
    }
    // Both values, not just "notSubmitted": ?tab=submitted was a no-op that happened to
    // look right because Submitted is the default tab, and would have quietly broken the
    // moment that default changed.
    if (q.tab === "notSubmitted" || q.tab === "submitted") setActiveTab(String(q.tab));
    // Lets the At-risk page's "Review submission" row action deep-link straight to a specific
    // workspace here (workspace name in ?q=), instead of dumping the admin on an unfiltered list.
    if (q.q !== undefined) setSearch(String(q.q));
    setHydratedFromUrl(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, hydratedFromUrl]);

  // Keep the URL addressable/shareable — reflect the current filter/tab/search into the query
  // string without triggering a navigation (shallow routing).
  useEffect(() => {
    if (!hydratedFromUrl) return;
    router.replace(
      {
        pathname: router.pathname,
        query: Object.fromEntries(Object.entries({
          ...router.query,
          status: reviewStatus || undefined,
          tab: activeTab === "notSubmitted" ? "notSubmitted" : undefined,
          q: search.trim() || undefined,
        }).filter(([, value]) => value !== undefined && value !== null && value !== "")),
      },
      undefined,
      { shallow: true }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewStatus, activeTab, search, hydratedFromUrl]);

  const loadSubmissions = useCallback(
    async ({ mounted = { current: true } } = {}) => {
      if (!collegeId) return null;
      setLoading(true);
      setError(null);
      try {
        const result = await fetchWithErrorHandling(getProjectsByCollege(collegeId));
        if (!mounted.current) return null;
        if (result.success) {
          const list = asArray(unwrapApiList(result));
          setProjects(list);
          return list;
        }
        setProjects([]);
        setError(result?.message || "Failed to load submissions.");
        return null;
      } catch (e) {
        if (!mounted.current) return null;
        setProjects([]);
        setError(e?.message || "Failed to load submissions.");
        return null;
      } finally {
        if (mounted.current) setLoading(false);
      }
    },
    [collegeId]
  );

  useEffect(() => {
    const mounted = { current: true };
    loadSubmissions({ mounted });
    return () => {
      mounted.current = false;
    };
  }, [loadSubmissions]);

  // Archived workspaces are dead weight here — every other targeted admin page (reassign-mentor,
  // at-risk, readiness) already excludes them, but this one didn't, so an archived workspace's
  // stale delivery silently skewed the stat tiles and cluttered both tabs below with no way to
  // tell it apart from a live one.
  const activeProjects = useMemo(
    () => asArray(projects).filter((project) => !isArchivedStatus(projectStatus(project))),
    [projects]
  );

  const submissions = useMemo(
    () =>
      activeProjects.filter((project) => {
        // Every workspace gets an auto-created delivery record with status defaulting to
        // "Draft" the moment it's touched — that default is always a truthy string, so
        // `|| delivery?.status` was counting untouched workspaces as "submitted" and
        // inflating this dashboard's summary numbers well above the actual submission
        // count. submittedAt is the one field the backend only sets on a real SUBMIT action.
        const delivery = getDelivery(project);
        return Boolean(delivery?.submittedAt);
      }),
    [activeProjects]
  );

  // The other half of the picture a "submissions dashboard" exists for: which active workspaces
  // have NOT turned anything in at all. Previously invisible — the page only ever rendered rows
  // from `submissions` above, so a team that never submitted simply never appeared anywhere,
  // not even as a count.
  const notSubmitted = useMemo(() => {
    const submittedIds = new Set(submissions.map((project) => project?.id ?? project?.slug ?? project?.numericId));
    return activeProjects.filter((project) => !submittedIds.has(project?.id ?? project?.slug ?? project?.numericId));
  }, [activeProjects, submissions]);

  // Must match what the Workspace column's mentor line and the Reassign-mentor button actually
  // use (projectMentorMember, falling back to project?.mentor) — see the column render below.
  const matchesSearch = (project, query) => {
    // Match what the column actually renders (normaliseCollegeScopedName prefers `name` and
    // strips the college prefix), plus the raw title — searching only `title` meant a row
    // displayed by its name could not be found by typing that name.
    const workspaceName = `${normaliseCollegeScopedName(project, "")} ${project?.title ?? ""}`.toLowerCase();
    const mentorName = String(projectMentorMember(project)?.name ?? project?.mentor ?? "").toLowerCase();
    return workspaceName.includes(query) || mentorName.includes(query);
  };

  const filteredSubmissions = useMemo(() => {
    let list = submissions;
    if (quickFilter) {
      const bucket = QUICK_FILTERS.find((option) => option.key === quickFilter);
      if (bucket) list = list.filter(bucket.match);
    }
    if (reviewStatus) {
      list = list.filter((project) => reviewStatusOf(project) === reviewStatus.toLowerCase());
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((project) => matchesSearch(project, q));
    }
    return list;
  }, [submissions, quickFilter, reviewStatus, search]);

  const filteredNotSubmitted = useMemo(() => {
    if (!search.trim()) return notSubmitted;
    const q = search.trim().toLowerCase();
    return notSubmitted.filter((project) => matchesSearch(project, q));
  }, [notSubmitted, search]);

  const summary = useMemo(() => {
    const submitted = submissions.length;
    const pendingReview = submissions.filter(isPendingReview).length;
    const needsAction = submissions.filter(needsLearnerAction).length;
    const reviewed = submissions.filter(isReviewed).length;
    return { submitted, pendingReview, needsAction, reviewed, total: activeProjects.length, notSubmitted: notSubmitted.length };
  }, [submissions, activeProjects, notSubmitted]);

  const toggleQuickFilter = (key) => {
    setQuickFilter((prev) => (prev === key ? null : key));
  };

  const handleDownloadAttachment = (project) => {
    // Delivery attachmentUrl is a plain public R2 URL (same as everywhere else in this app now)
    // — open it directly, no signed-download redirect needed. Still scheme-checked: window.open on
    // a javascript: URL executes it in this origin, and this field is free text on a JSON blob.
    const delivery = getDelivery(project);
    const url = safeHttpUrl(delivery?.attachmentUrl || delivery?.submissionFileUrl);
    if (!url) {
      message.error("Could not resolve this submission's file.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // At-risk's "Open" action already threads why the admin is clicking through as a `?reason=`
  // the detail page shows if its own live recomputation disagrees — Submissions had the same
  // data available (review status / not-submitted) and simply never passed it, an inconsistency
  // with no reason behind it rather than a deliberate difference.
  const buildOpenReason = (project) => {
    const delivery = getDelivery(project);
    if (!delivery?.submittedAt) return "Not submitted";
    if (isPendingReview(project)) return "Pending review";
    if (needsLearnerAction(project)) return "Changes requested";
    return null;
  };

  const openReviewModal = (project) => {
    setReviewTarget(project);
    setReviewFeedback(getDelivery(project)?.feedback || "");
  };

  const closeReviewModal = () => {
    setReviewTarget(null);
    setReviewFeedback("");
  };

  // Per the "direct action" decision: an admin can settle a stuck submission themselves rather
  // than only being able to escalate/reassign. Reuses the same submitAction vocabulary
  // (ACCEPT/REQUEST_CHANGES/LOCK) the mentor review form sends via updateProjectSubmission —
  // adminReviewProjectDelivery is authorized separately (admin doesn't need to be a project
  // member) but applies the identical delivery-review logic on the backend.
  const handleReviewAction = async (action) => {
    if (!reviewTarget) return;
    const projectId = reviewTarget?.id ?? reviewTarget?.slug ?? reviewTarget?.numericId;
    if (!projectId) return;
    // Neither this page nor the backend (applyDeliveryUpdate has no feedback-required guard on
    // REQUEST_CHANGES) stopped a completely blank "Request changes" — the learner's workspace
    // flipped to Changes Requested with zero visible guidance on what to fix, and the
    // mentor-feedback expandable row won't even show an expand arrow since it's gated on
    // Boolean(feedback). Accept/Lock can stay optional; require text specifically here.
    if (action === "REQUEST_CHANGES" && !reviewFeedback?.trim()) {
      message.warning("Add feedback explaining what needs to change before requesting changes.");
      return;
    }
    setReviewSaving(action);
    try {
      await adminReviewProjectDelivery(projectId, collegeId, {
        delivery: {
          feedback: reviewFeedback?.trim(),
          version: getDelivery(reviewTarget)?.version ?? null,
          submitAction: action,
        },
      });
      message.success(
        action === "ACCEPT" ? "Submission accepted." : action === "REQUEST_CHANGES" ? "Changes requested." : "Submission locked."
      );
      closeReviewModal();
      loadSubmissions();
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to update this submission.");
      // On a 409 (someone else updated the delivery since the modal was opened), the modal
      // previously stayed open showing the now-stale snapshot (feedback/status) it was loaded
      // with — the admin had to manually close and reopen it to see what changed. Refresh the
      // list and swap in the latest version of this same project so the modal reflects reality.
      if (err?.response?.status === 409) {
        const refreshed = await loadSubmissions();
        const updated = (refreshed || []).find((p) => (p?.id ?? p?.slug ?? p?.numericId) === projectId);
        if (updated) {
          setReviewTarget(updated);
          setReviewFeedback(getDelivery(updated)?.feedback || "");
        } else {
          closeReviewModal();
        }
      }
    } finally {
      setReviewSaving(null);
    }
  };

  const renderActions = (project) => {
    const projectId = project?.id ?? project?.slug ?? project?.numericId;
    const mentorId = projectMentorMember(project)?.userId;
    const openReason = buildOpenReason(project);
    const openHref = `/superadmin/projects/workspaces/${encodeURIComponent(projectId || "")}/summary?from=submissions${openReason ? `&reason=${encodeURIComponent(openReason)}` : ""}`;
    return (
      <Space size={4} wrap>
        <Button type="link" size="small" onClick={() => router.push(openHref)}>
          Open
        </Button>
        {getDelivery(project)?.submittedAt ? (
          <Button type="link" size="small" onClick={() => openReviewModal(project)}>
            Review
          </Button>
        ) : null}
        {mentorId ? (
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => router.push(`/superadmin/projects/workspaces/reassign-mentor?fromMentorId=${mentorId}`)}>
            Reassign mentor
          </Button>
        ) : null}
      </Space>
    );
  };

  const submissionColumns = [
    {
      title: "Workspace",
      key: "workspace",
      render: (_, project) => (
        <div>
          <div style={{ fontWeight: 600 }}>{normaliseCollegeScopedName(project, "Workspace")}</div>
          {/* Must match the Reassign-mentor button's target below (projectMentorMember) — this
              used to show project?.mentor (backend's naive "first FACULTY member", no role check),
              which can name a different person than the role-aware mentor the button actually
              reassigns whenever a Co-Mentor/Reviewer was added before the real "Project Mentor". */}
          <Text type="secondary">{textOrDash(projectMentorMember(project)?.name || project?.mentor)}</Text>
        </div>
      ),
    },
    {
      title: "Submission type",
      key: "submissionType",
      render: (_, project) => submissionTypeLabel(getDelivery(project)?.submissionType),
    },
    {
      title: "Review status",
      key: "reviewStatus",
      render: (_, project) => {
        const status = getDelivery(project)?.reviewStatus;
        return <Tag color={reviewStatusColor(status)}>{textOrDash(status)}</Tag>;
      },
    },
    {
      title: "Pending",
      key: "pendingAge",
      sorter: (a, b) => (pendingDays(a) ?? -1) - (pendingDays(b) ?? -1),
      render: (_, project) => {
        const days = pendingDays(project);
        if (days === null) return <Text type="secondary">—</Text>;
        return <Tag color={ageColor(days)}>{ageLabel(days)}</Tag>;
      },
    },
    {
      title: "Submitted",
      key: "submitted",
      defaultSortOrder: "descend",
      sorter: (a, b) => new Date(getDelivery(a)?.submittedAt || 0).getTime() - new Date(getDelivery(b)?.submittedAt || 0).getTime(),
      render: (_, project) => {
        const delivery = getDelivery(project);
        return (
          <div>
            <div>{textOrDash(delivery?.submittedByName)}</div>
            <Text type="secondary">{formatTimestamp(delivery?.submittedAt)}</Text>
          </div>
        );
      },
    },
    {
      title: "Revisions",
      key: "revisionCount",
      // textOrDash treats 0 as falsy and would render it the same as truly-missing data —
      // a workspace with zero revisions is meaningfully different from one with no data at all.
      render: (_, project) => {
        const value = getDelivery(project)?.revisionCount;
        return value === null || value === undefined ? "—" : String(value);
      },
    },
    {
      title: "Reviewed by",
      key: "reviewedBy",
      // A dashboard whose whole purpose is monitoring submissions previously showed no reviewer
      // info at all — an admin scanning for a stuck/contested review had to open every workspace
      // individually just to see who (if anyone) had looked at it.
      render: (_, project) => {
        const delivery = getDelivery(project);
        if (!delivery?.reviewedByName) return <Text type="secondary">Not reviewed</Text>;
        return (
          <div>
            <div>
              {delivery.reviewedByName}
              {/* Distinguishes an admin-bypass review (adminReviewProjectDelivery) from a real
                  mentor review — both otherwise look identical here since reviewedByName alone
                  doesn't say whether the reviewer was actually on this project's team. */}
              {delivery.reviewedByType === "ADMIN" ? (
                <Tag color="orange" style={{ marginLeft: 6 }}>
                  Admin review
                </Tag>
              ) : null}
            </div>
            <Text type="secondary">{formatTimestamp(delivery.reviewedAt)}</Text>
          </div>
        );
      },
    },
    {
      title: "Submission",
      key: "submission",
      render: (_, project) => {
        const delivery = getDelivery(project);
        // attachmentUrl/submissionFileUrl are the same uploaded R2 file, and it is a plain public
        // URL opened directly — the presigned download endpoint this comment used to describe
        // (/{projectId}/delivery/download) no longer exists; see the note where it was removed in
        // AdminProjectController. sourceUrl is a genuinely separate, always-external pasted link
        // (GitHub, Drive, etc.). Both go through safeHttpUrl before being offered, since neither is
        // scheme-validated at write time on this JSON blob.
        const hasFile = Boolean(safeHttpUrl(delivery?.attachmentUrl || delivery?.submissionFileUrl));
        const externalLink = safeHttpUrl(delivery?.sourceUrl);
        // Gap fix: this column only ever showed the PRIMARY link/file -- the "Additional files &
        // links" list (up to MAX_DELIVERY_ATTACHMENTS/10) a learner can add on the mentor/learner
        // side was invisible on this cross-project review list entirely. Same fix as the
        // per-workspace Delivery page: at least a count here (the row-height cost of listing every
        // one in a dense table makes a full inline list the wrong call for THIS view specifically).
        const extraAttachments = Array.isArray(delivery?.attachments) ? delivery.attachments : [];
        if (!hasFile && !externalLink && extraAttachments.length === 0) return <Text type="secondary">No file/link</Text>;
        return (
          <Space direction="vertical" size={0}>
            {hasFile ? (
              <Button type="link" size="small" style={{ padding: 0, height: "auto" }} onClick={() => handleDownloadAttachment(project)}>
                {delivery?.fileName || "Download file"}
              </Button>
            ) : null}
            {externalLink ? (
              <a href={externalLink} target="_blank" rel="noreferrer noopener">
                Open link
              </a>
            ) : null}
            {extraAttachments.length > 0 ? (
              <Tooltip title={extraAttachments.map((item) => item?.label || item?.fileName || item?.url).filter(Boolean).join(", ")}>
                <Text type="secondary">+{extraAttachments.length} more</Text>
              </Tooltip>
            ) : null}
          </Space>
        );
      },
    },
    {
      title: "Actions",
      key: "action",
      fixed: "right",
      render: (_, project) => renderActions(project),
    },
  ];

  const notSubmittedColumns = [
    {
      title: "Workspace",
      key: "workspace",
      render: (_, project) => (
        <div>
          <div style={{ fontWeight: 600 }}>{normaliseCollegeScopedName(project, "Workspace")}</div>
          {/* Must match the Reassign-mentor button's target below (projectMentorMember) — this
              used to show project?.mentor (backend's naive "first FACULTY member", no role check),
              which can name a different person than the role-aware mentor the button actually
              reassigns whenever a Co-Mentor/Reviewer was added before the real "Project Mentor". */}
          <Text type="secondary">{textOrDash(projectMentorMember(project)?.name || project?.mentor)}</Text>
        </div>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_, project) => <Tag color={statusColor(projectStatus(project))}>{statusLabel(projectStatus(project))}</Tag>,
    },
    {
      title: "Progress",
      key: "progress",
      // draftSavedAt/draftSavedByName already existed on the delivery DTO but were never
      // rendered anywhere — the only signal available for a not-yet-submitted workspace was its
      // absence from the old submissions list, with no way to tell "never opened this" apart
      // from "has a draft in progress, just hasn't hit Submit yet".
      render: (_, project) => {
        const delivery = getDelivery(project);
        if (!delivery?.draftSavedAt) return <Text type="secondary">Not started</Text>;
        return (
          <div>
            <Tag color="blue">Draft saved</Tag>
            <div>
              <Text type="secondary">{formatTimestamp(delivery.draftSavedAt)}</Text>
            </div>
          </div>
        );
      },
    },
    {
      title: "Inactive",
      key: "inactive",
      sorter: (a, b) => (projectStaleDays(a) ?? -1) - (projectStaleDays(b) ?? -1),
      render: (_, project) => {
        const days = projectStaleDays(project);
        if (days === null) return <Text type="secondary">—</Text>;
        return <Tag color={ageColor(days)}>{ageLabel(days)}</Tag>;
      },
    },
    {
      title: "Actions",
      key: "action",
      fixed: "right",
      render: (_, project) => renderActions(project),
    },
  ];

  if (!collegeId) {
    return (
      <div className="ln-module admin-list-page">
        {/* Inside the shell: a missing scope is a state to recover from, and dropping the tab
            strip and every other navigation affordance is the one thing that makes it harder. */}
        <SuperAdminGroupShell groupKey="projects">
          {scopeLoaded ? (
            <Alert
              type="warning"
              message="No college selected"
              description="Pick a college in the header to view its submissions."
              showIcon
            />
          ) : (
            <Skeleton active paragraph={{ rows: 4 }} />
          )}
        </SuperAdminGroupShell>
      </div>
    );
  }

  return (
    <div className="ln-module admin-list-page">
      <SuperAdminGroupShell groupKey="projects">
      <div className="admin-list-page__header">
        <div>
          <h1 className="admin-list-page__title">Submissions dashboard</h1>
          <div className="admin-list-page__subtitle">Final project deliverables across all workspaces.</div>
        </div>
        <Space wrap>
        </Space>
      </div>

      {error ? <Alert type="error" message="Submissions could not be loaded" description={error} showIcon style={{ marginBottom: 16 }} /> : null}

      <Skeleton loading={loading} active paragraph={{ rows: 8 }}>
        {/* Only the stat tiles get the narrow-content cap — unlike Migrations/Readiness, this
            page's main content is a wide data table, which should stay full-width on a large
            monitor rather than being squeezed into a scroll box it doesn't need. */}
        <div className="admin-list-page__narrow-content">
          {/* Informational only — the Tabs below are the one real control for switching between
              Submitted/Not-submitted, so this row doesn't duplicate that as a second, less
              accessible click target.

              Which is exactly why "Submitted" and "Not submitted yet" are no longer here: those
              two cards restated the tab labels a few pixels below, which already carry the same
              counts. A stat that repeats the control under it is noise. These three answer
              something the tabs don't — how much of the queue is waiting on a reviewer, and how
              much is waiting on a learner. */}
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic title="Active workspaces" value={summary.total} prefix={<FileTextOutlined />} />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic
                  title="Pending review"
                  value={summary.pendingReview}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={summary.pendingReview > 0 ? { color: "#d48806" } : undefined}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card>
                <Statistic title="Needs student action" value={summary.needsAction} prefix={<InboxOutlined />} />
              </Card>
            </Col>
          </Row>

          {activeTab === "submitted" ? (
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              {QUICK_FILTERS.map((bucket) => {
                const value = bucket.key === "pending" ? summary.pendingReview : bucket.key === "needsAction" ? summary.needsAction : summary.reviewed;
                const icon = bucket.key === "reviewed" ? <CheckCircleOutlined /> : <ClockCircleOutlined />;
                const active = quickFilter === bucket.key;
                return (
                  <Col xs={24} sm={12} md={8} key={bucket.key}>
                    <Card
                      hoverable
                      role="button"
                      tabIndex={0}
                      aria-pressed={active}
                      onClick={() => toggleQuickFilter(bucket.key)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleQuickFilter(bucket.key);
                        }
                      }}
                      style={active ? { borderColor: "#0a7c88", boxShadow: "0 0 0 1px #0a7c88" } : undefined}
                    >
                      <Statistic title={bucket.label} value={value} prefix={icon} />
                    </Card>
                  </Col>
                );
              })}
            </Row>
          ) : null}
        </div>

        <Card
          title="Submissions"
          extra={
            <Space wrap>
              <Input
                allowClear
                placeholder="Search workspace or mentor"
                prefix={<SearchOutlined />}
                className="admin-list-page__filter"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {activeTab === "submitted" ? (
                <Select
                  allowClear
                  placeholder="Filter by review status"
                  className="admin-list-page__filter"
                  value={reviewStatus}
                  onChange={setReviewStatus}
                  options={REVIEW_STATUS_OPTIONS}
                />
              ) : null}
              {/* Exports whichever tab is on screen. It used to always map filteredSubmissions,
                  so on the Not submitted tab it downloaded the *submitted* rows — and was disabled
                  whenever that tab held rows and the other did not. The two tabs also carry
                  different columns: a not-yet-submitted workspace has no delivery to describe. */}
              <Button
                size="small"
                icon={<DownloadOutlined />}
                disabled={!(activeTab === "notSubmitted" ? filteredNotSubmitted : filteredSubmissions).length}
                onClick={() =>
                  activeTab === "notSubmitted"
                    ? exportRowsToCsv(
                        "project-not-submitted.csv",
                        // SASB-01 (wrong exportRowsToCsv arity, produced an empty file) fixed
                        // together with SASB-05/CASB-05 (this export was also thinner than the
                        // table it's exporting — missing mentor, draft-progress and inactivity,
                        // all real triage signals a college/super-admin chasing non-submitters
                        // needs and the on-screen table already shows).
                        [
                          { label: "Workspace", key: "workspace" },
                          { label: "Mentor", key: "mentor" },
                          { label: "Status", key: "status" },
                          { label: "Progress", key: "progress" },
                          { label: "Inactive", key: "inactive" },
                        ],
                        filteredNotSubmitted.map((p) => {
                          const delivery = getDelivery(p);
                          const staleDays = projectStaleDays(p);
                          return {
                            workspace: normaliseCollegeScopedName(p, "Workspace"),
                            mentor: projectMentorMember(p)?.name || p?.mentor || "",
                            status: statusLabel(projectStatus(p)),
                            progress: delivery?.draftSavedAt
                              ? `Draft saved ${formatTimestamp(delivery.draftSavedAt)}`
                              : "Not started",
                            inactive: staleDays === null ? "" : ageLabel(staleDays),
                          };
                        })
                      )
                    : exportRowsToCsv(
                        "project-submissions.csv",
                        // SASB-01: exportRowsToCsv(filename, columns, rows) needs a {label,key}[]
                        // columns array as its 2nd argument — this call passed only the mapped
                        // rows, so `rows` was undefined and every export downloaded an empty file.
                        [
                          { label: "Workspace", key: "workspace" },
                          { label: "Submission type", key: "submissionType" },
                          { label: "Review status", key: "reviewStatus" },
                          { label: "Submitted at", key: "submittedAt" },
                        ],
                        filteredSubmissions.map((p) => ({
                          workspace: normaliseCollegeScopedName(p, "Workspace"),
                          submissionType: getDelivery(p)?.submissionType ?? "",
                          reviewStatus: getDelivery(p)?.reviewStatus ?? "",
                          submittedAt: getDelivery(p)?.submittedAt ?? "",
                        }))
                      )
                }
              >
                Export CSV
              </Button>
            </Space>
          }
        >
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: "submitted",
                label: `Submitted (${summary.submitted})`,
                children: (
                  <>
                    {quickFilter ? (
                      <div style={{ marginBottom: 12 }}>
                        <Tag closable onClose={() => setQuickFilter(null)} color="blue">
                          {QUICK_FILTERS.find((option) => option.key === quickFilter)?.label}
                        </Tag>
                      </div>
                    ) : null}
                    {filteredSubmissions.length ? (
                      <Table
                        rowKey={(record) => String(record?.id ?? record?.slug ?? record?.numericId ?? record?.title)}
                        dataSource={filteredSubmissions}
                        columns={submissionColumns}
                        pagination={{ pageSize: 10, showSizeChanger: false }}
                        scroll={{ x: "max-content" }}
                        expandable={{
                          rowExpandable: (record) => Boolean(getDelivery(record)?.feedback),
                          expandedRowRender: (record) => (
                            <div>
                              <Text strong>Mentor feedback: </Text>
                              <Text>{getDelivery(record)?.feedback}</Text>
                            </div>
                          ),
                        }}
                      />
                    ) : (
                      <Empty
                        description={
                          search.trim() || quickFilter ? "No submissions match this search" : "No submissions yet"
                        }
                      />
                    )}
                  </>
                ),
              },
              {
                key: "notSubmitted",
                label: `Not submitted (${summary.notSubmitted})`,
                children: filteredNotSubmitted.length ? (
                  <Table
                    rowKey={(record) => String(record?.id ?? record?.slug ?? record?.numericId ?? record?.title)}
                    dataSource={filteredNotSubmitted}
                    columns={notSubmittedColumns}
                    pagination={{ pageSize: 10, showSizeChanger: false }}
                    scroll={{ x: "max-content" }}
                  />
                ) : (
                  <Empty
                    description={
                      // quickFilter has no effect on this tab's data (filteredNotSubmitted is
                      // derived from `search` alone) — referencing it here blamed a filter that
                      // isn't running, telling the admin a search/filter is hiding rows when a
                      // genuinely empty "everyone submitted" result is what they're looking at.
                      search.trim() ? "No workspaces match this search" : "Every active workspace has submitted"
                    }
                  />
                ),
              },
            ]}
          />
        </Card>
      </Skeleton>

      <Modal
        title={reviewTarget ? `Review — ${normaliseCollegeScopedName(reviewTarget, "Workspace")}` : "Review"}
        open={Boolean(reviewTarget)}
        onCancel={closeReviewModal}
        footer={null}
        destroyOnClose
      >
        {reviewTarget ? (
          <>
            <Text type="secondary">
              Current status: <Tag color={reviewStatusColor(getDelivery(reviewTarget)?.reviewStatus)}>{statusLabel(getDelivery(reviewTarget)?.reviewStatus, "Not reviewed")}</Tag>
            </Text>
            <div style={{ marginTop: 12, marginBottom: 12 }}>
              <Text strong>Feedback for the learner</Text>
              <Input.TextArea
                rows={4}
                value={reviewFeedback}
                onChange={(e) => setReviewFeedback(e.target.value)}
                placeholder="Optional for Accept/Lock — required for Request changes"
                style={{ marginTop: 4 }}
              />
            </div>
            <Space wrap>
              <Button onClick={closeReviewModal}>Cancel</Button>
              <Button
                danger
                loading={reviewSaving === "REQUEST_CHANGES"}
                disabled={!reviewFeedback?.trim() || (Boolean(reviewSaving) && reviewSaving !== "REQUEST_CHANGES")}
                onClick={() => handleReviewAction("REQUEST_CHANGES")}
              >
                Request changes
              </Button>
              <Button
                type="primary"
                loading={reviewSaving === "ACCEPT"}
                disabled={Boolean(reviewSaving) && reviewSaving !== "ACCEPT"}
                onClick={() => handleReviewAction("ACCEPT")}
              >
                Accept submission
              </Button>
              {/* Lock makes the delivery permanently uneditable for the learner, which is the
                  most consequential button in this modal and was the only one firing on a single
                  click — while Archive and the readiness override, both less final, are
                  Popconfirm-guarded elsewhere in this console. */}
              <Popconfirm
                title="Lock this submission?"
                description="The learner will no longer be able to edit or resubmit it."
                okText="Lock"
                okButtonProps={{ danger: true, loading: reviewSaving === "LOCK" }}
                onConfirm={() => handleReviewAction("LOCK")}
              >
                <Button
                  loading={reviewSaving === "LOCK"}
                  disabled={Boolean(reviewSaving) && reviewSaving !== "LOCK"}
                >
                  Lock submission
                </Button>
              </Popconfirm>
            </Space>
          </>
        ) : null}
      </Modal>
      </SuperAdminGroupShell>
    </div>
  );
}

// BE-0154/0155/0175/0176/0186: the page starts afresh for each college, so a header switch can't leave the last college's
// rows, selections, open dialogs or late answers on screen (or let a save act on them).
export default function SuperAdminProjectSubmissionsPage(props) {
  const { selectedCollegeId } = useSuperAdminScope();
  return <SuperAdminProjectSubmissionsPageBody key={selectedCollegeId ?? "none"} {...props} />;
}

SuperAdminProjectSubmissionsPage.superAdminLayout = SuperAdminLayout;
