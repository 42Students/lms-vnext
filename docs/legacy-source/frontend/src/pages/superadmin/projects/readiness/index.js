import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import {
  Alert,
  Badge,
  Button,
  Card,
  Descriptions,
  Empty,
  Form,
  Input,
  Popconfirm,
  Progress,
  Radio,
  Select,
  Skeleton,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { CheckCircleFilled, LockOutlined, UnlockOutlined, DownloadOutlined } from "@ant-design/icons";
import { exportRowsToCsv } from "@/utils/csvExport";
import { showProjectErrorMessage } from "@/utils/projectErrorModal";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";
import SuperAdminGroupShell from "@/components/admin/SuperAdminGroupShell";
import { useSuperAdminScope } from "@/contexts/SuperAdminScopeContext";
import {
  fetchWithErrorHandling,
  getProjectReadiness,
  getProjectReleases,
  getProjectsByCollegePage,
  overrideProjectReadiness,
} from "@/api/Services/AdminService";
import {
  asArray,
  formatTimestamp,
  isArchivedStatus,
  normaliseCollegeScopedName,
  projectStatus,
  statusLabel,
  textOrDash,
  unwrapApiItem,
  unwrapApiList,
} from "@/components/admin/projects/adminProjectUtils";

const { Text } = Typography;

export default function SuperAdminProjectReadinessPage() {
  const router = useRouter();
  const { selectedCollegeId, scopeLoaded } = useSuperAdminScope();
  const collegeId = selectedCollegeId ?? null;
  const [form] = Form.useForm();

  const [projects, setProjects] = useState([]);
  // Paged like the college-admin page: the unpaged list returned every workspace of the college
  // with its full template content (tasks, sprints, blueprint), several MB on a real college.
  const [overrideProjects, setOverrideProjects] = useState([]);
  const [overridePage, setOverridePage] = useState(0);
  const [overrideTotal, setOverrideTotal] = useState(0);
  const [workspaceSearch, setWorkspaceSearch] = useState("");
  const [workspacePage, setWorkspacePage] = useState(0);
  const [workspaceTotal, setWorkspaceTotal] = useState(0);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState(null);
  const [projectId, setProjectId] = useState(null);
  const [readiness, setReadiness] = useState(null);
  const [releases, setReleases] = useState([]);
  const [releasesLoading, setReleasesLoading] = useState(false);
  const [releasesError, setReleasesError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [hydratedFromUrl, setHydratedFromUrl] = useState(false);
  const readinessSeq = useRef(0);
  const releasesSeq = useRef(0);
  const projectsSeq = useRef(0);
  // The override note the form loaded with — used to detect when the admin switches to a
  // DIFFERENT override direction than what's currently active, so the old direction's
  // justification doesn't silently ride along into the new one (e.g. switching Force Block →
  // Force Unlock while "reason for blocking" is still sitting in the Note field, which then gets
  // shown to the learner as the reason their submission is now unlocked).
  const loadedOverrideRef = useRef(undefined);

  // Kept mount-guarded and reusable (not just a plain useEffect body) so handleSubmit can also
  // call it to refresh the "Active overrides" list right after an override is applied/cleared —
  // otherwise that list would only reflect the pre-save state until the next full page load.
  const mountedRef = useRef(true);
  // The override form sits well below the workspace tables, so "Manage" scrolls to it.
  const overrideFormRef = useRef(null);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadProjects = async () => {
    if (!collegeId) return;
    // Same sequence guard as loadReadiness/loadReleases below. Without it, a slow response for
    // college A could land after the scope had already switched to B and repaint the Active
    // overrides table with A's rows under B's header.
    const requestId = ++projectsSeq.current;
    setProjectsLoading(true);
    setProjectsError(null);
    const [result, overridesResult] = await Promise.all([
      fetchWithErrorHandling(getProjectsByCollegePage(collegeId, { page: workspacePage, size: 25, search: workspaceSearch.trim() || undefined })),
      fetchWithErrorHandling(getProjectsByCollegePage(collegeId, { view: "READINESS_OVERRIDE", page: overridePage, size: 25 })),
    ]);
    if (!mountedRef.current || requestId !== projectsSeq.current) return;
    if (result.success && overridesResult.success) {
      const workspacePayload = unwrapApiItem(result) || {};
      const overridesPayload = unwrapApiItem(overridesResult) || {};
      setProjects(asArray(workspacePayload.records));
      setWorkspaceTotal(Number(workspacePayload.totalRecords) || 0);
      setOverrideProjects(asArray(overridesPayload.records));
      setOverrideTotal(Number(overridesPayload.totalRecords) || 0);
    } else {
      // Silently falling through to [] here previously rendered the "Active overrides" panel's
      // reassuring green "no manual override" empty state on a FAILED fetch — indistinguishable
      // from a genuinely clean college and defeating the point of this audit view. Surface the
      // failure instead so it can't be read as "confirmed clean".
      setProjects([]);
      setOverrideProjects([]);
      setWorkspaceTotal(0);
      setOverrideTotal(0);
      setProjectsError(result?.message || overridesResult?.message || "Failed to load project workspaces.");
    }
    setProjectsLoading(false);
  };

  useEffect(() => {
    // Everything below the college selector belongs to the college that was selected when it was
    // chosen. Reloading only `projects` left the selected workspace, its readiness, its releases
    // and the filled-in form pointing at the previous college — and Save then posted that id,
    // which came back as a bare AccessDenied.
    setProjectId(null);
    setReadiness(null);
    setReleases([]);
    setReleasesError(null);
    setError(null);
    readinessSeq.current += 1;
    releasesSeq.current += 1;
    // The override form only exists while a workspace is selected; resetting it unmounted (first
    // load) logged a useForm console error.
    if (projectId) form.resetFields();
    setWorkspacePage(0);
    setOverridePage(0);
    setWorkspaceSearch("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collegeId]);
  useEffect(() => { loadProjects(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [collegeId, workspacePage, overridePage, workspaceSearch]);

  // Workspaces already at their end-of-life shouldn't clutter the "pick a workspace to override"
  // search — mirrors the archived filter every other targeted admin action page (reassign-mentor,
  // at-risk) already applies. The Active-overrides table below deliberately does NOT apply this
  // filter (an override can be stuck on an archived workspace), so its "Manage" button can select
  // a project this list excludes — always keep the currently-selected project in the option list
  // even if archived, or the Select would show a blank/unmatched value for it.
  const selectableProjects = useMemo(() => {
    const nonArchived = asArray(projects).filter((project) => !isArchivedStatus(projectStatus(project)));
    if (!projectId || nonArchived.some((project) => String(project?.id) === String(projectId))) {
      return nonArchived;
    }
    const selected = asArray(projects).find((project) => String(project?.id) === String(projectId))
      || asArray(overrideProjects).find((project) => String(project?.id) === String(projectId));
    return selected ? [...nonArchived, selected] : nonArchived;
  }, [projects, overrideProjects, projectId]);

  // getProjectsByCollege already returns each workspace's full readiness block (same
  // buildReadinessDto the single-project fetch uses), so the "which workspaces currently have a
  // force override sitting on them" audit view is free — no separate endpoint needed. This
  // deliberately does NOT filter out archived workspaces, since a forgotten override left on an
  // archived workspace is exactly the kind of stale state this view exists to surface.
  const activeOverrides = useMemo(() => asArray(overrideProjects), [overrideProjects]);

  const loadReadiness = async (id) => {
    if (!id || !collegeId) return;
    // Switching the selected project fast (slow response for A, fast response for B) let A's
    // delayed response land after B's and overwrite the screen/form with A's data while
    // `projectId` state still held B — submitting then applied A's override to B. Guard with a
    // request sequence number so only the most-recently-issued call's response is applied.
    const requestId = ++readinessSeq.current;
    setLoading(true);
    setError(null);
    const result = await fetchWithErrorHandling(getProjectReadiness(id, collegeId));
    if (!mountedRef.current || requestId !== readinessSeq.current) return;
    if (result.success) {
      const dto = unwrapApiItem(result);
      setReadiness(dto);
      const loadedOverride = dto?.overrideActive ? String(dto?.overrideValue) : undefined;
      loadedOverrideRef.current = loadedOverride;
      form.setFieldsValue({
        // Previously defaulted to "clear" even when there was nothing to clear — a pre-selected
        // no-op action. Leave the choice genuinely unmade until the admin has seen the current
        // state and decided.
        override: loadedOverride,
        note: dto?.overrideNote || "",
      });
    } else {
      setReadiness(null);
      // A bookmarked/shared ?projectId= link (or the "Manage override" button on the workspace
      // detail page) can point at a project that belongs to a different college than whatever
      // the header scope currently has selected — the backend correctly 403s that, but the raw
      // "Access denied to this project" message gives the admin no actionable next step. Give a
      // clearer hint specifically for that case; leave every other failure's message as-is.
      setError(
        result?.status === 403
          ? "This workspace belongs to a different college — switch colleges in the header and try again."
          : result?.message || "Failed to load readiness."
      );
      // Previously the form kept whatever the last successfully-loaded project's override/note
      // values were, so a failed fetch for project B still showed project A's stale "Force
      // unlock" selection — indistinguishable from B's real state, and submittable as-is.
      form.resetFields();
    }
    setLoading(false);
  };

  // Previously the ONLY release visibility on this page was the aggregate count added to
  // `readiness` above — no titles, no dates, no per-release status.
  const loadReleases = async (id) => {
    if (!id || !collegeId) return;
    const requestId = ++releasesSeq.current;
    setReleasesLoading(true);
    setReleasesError(null);
    const result = await fetchWithErrorHandling(getProjectReleases(id, collegeId));
    if (!mountedRef.current || requestId !== releasesSeq.current) return;
    if (result.success) {
      setReleases(unwrapApiList(result));
    } else {
      setReleases([]);
      setReleasesError(result?.message || "Failed to load releases.");
    }
    setReleasesLoading(false);
  };

  const handleSelectProject = (id) => {
    setProjectId(id);
    setReadiness(null);
    setReleases([]);
    setReleasesError(null);
    loadReadiness(id);
    loadReleases(id);
  };

  // Restore the selected workspace from the URL on load, mirroring the ?fromMentorId= pattern in
  // reassign-mentor/index.js, so a shared/reloaded link — or the new "Manage override" button on
  // the workspace detail page — lands directly on the right workspace. Unlike fromMentorId (a real
  // numeric Faculty/Learner PK), a project's id is its slug (ProjectWorkspaceServiceImpl always
  // calls project.setSlug(...) on create and toDto() prefers the slug over the numeric PK) — a
  // Number() conversion here silently turns every real project id into NaN and no-ops.
  useEffect(() => {
    if (!router.isReady || hydratedFromUrl || !collegeId) return;
    const queryProjectId = router.query?.projectId;
    if (queryProjectId) {
      handleSelectProject(String(queryProjectId));
    }
    setHydratedFromUrl(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, hydratedFromUrl, collegeId]);

  // Keep the URL addressable/shareable — reflect the selected workspace into the query string
  // without triggering a navigation (shallow routing).
  useEffect(() => {
    if (!hydratedFromUrl) return;
    router.replace(
      { pathname: router.pathname, query: Object.fromEntries(Object.entries({ ...router.query, projectId: projectId || undefined }).filter(([, value]) => value !== undefined && value !== null && value !== "")) },
      undefined,
      { shallow: true }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, hydratedFromUrl]);

  const handleSubmit = async (values) => {
    if (!projectId) return;
    setSaving(true);
    try {
      const overrideValue = values.override === "clear" ? null : values.override === "true";
      const result = await fetchWithErrorHandling(
        overrideProjectReadiness(projectId, { collegeId, override: overrideValue, note: values.note || null })
      );
      if (!mountedRef.current) return;
      if (result.success) {
        message.success("Readiness updated");
        // overrideProjectReadiness already returns the freshly computed ProjectReadinessDTO
        // (buildReadinessDtoForProject), so re-fetching it via loadReadiness right after was a
        // redundant second round-trip. And the "Active overrides" table only needs THIS one
        // project's readiness to refresh — re-running loadProjects() re-fetched and
        // recomputed readiness for the entire college's workspace list (unbounded, full
        // task/sprint merge per workspace) just to update one row.
        const dto = unwrapApiItem(result);
        setReadiness(dto);
        const loadedOverride = dto?.overrideActive ? String(dto?.overrideValue) : undefined;
        loadedOverrideRef.current = loadedOverride;
        form.setFieldsValue({
          override: loadedOverride,
          note: dto?.overrideNote || "",
        });
        setProjects((prev) => prev.map((project) => (String(project?.id) === String(projectId) ? { ...project, readiness: dto } : project)));
      } else {
        showProjectErrorMessage(result?.message || "Failed to update readiness");
      }
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  };

  const totalTasks = Number(readiness?.totalTasks ?? 0);
  const completedTasks = Number(readiness?.completedTasks ?? 0);
  const totalSprints = Number(readiness?.totalSprints ?? 0);
  const completedSprints = Number(readiness?.completedSprints ?? 0);
  const combinedTotal = totalTasks + totalSprints;

  // Force Unlock/Block only ever change the tasks/sprints completeness gate — once a delivery
  // is Submitted/Accepted/Locked, buildReadinessDto's alreadySubmitted check wins unconditionally
  // and the override has NO effect (see backend buildReadinessDto). The page previously never
  // said this, so an admin could apply an override, see nothing change, and have no idea why.
  const submissionBlocksOverride = Boolean(readiness?.submissionExists);

  const overrideStateTag = (dto) => {
    if (!dto?.overrideActive) return <Text type="secondary">None</Text>;
    return dto.overrideValue ? (
      <Tag icon={<UnlockOutlined />} color="green">
        Force unlocked
      </Tag>
    ) : (
      <Tag icon={<LockOutlined />} color="volcano">
        Force blocked
      </Tag>
    );
  };

  const overrideColumns = [
    {
      title: "Workspace",
      key: "workspace",
      render: (_, project) => (
        <Space size={6}>
          <span>{normaliseCollegeScopedName(project, "Workspace")}</span>
          {isArchivedStatus(projectStatus(project)) ? <Tag>Archived</Tag> : null}
        </Space>
      ),
    },
    {
      title: "Override",
      key: "override",
      render: (_, project) => overrideStateTag(project?.readiness),
    },
    {
      title: "Note",
      key: "note",
      ellipsis: true,
      render: (_, project) => textOrDash(project?.readiness?.overrideNote),
    },
    {
      title: "By",
      key: "by",
      render: (_, project) => textOrDash(project?.readiness?.overrideByName),
    },
    {
      title: "At",
      key: "at",
      render: (_, project) => formatTimestamp(project?.readiness?.overrideAt),
    },
    {
      title: "",
      key: "action",
      render: (_, project) => (
        <Button
          type="link"
          // Selecting a workspace populates the override form further down the page, often below
          // the fold — without moving the viewport the click read as doing nothing at all.
          onClick={() => {
            handleSelectProject(project?.id);
            overrideFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
        >
          Manage
        </Button>
      ),
    },
  ];

  if (!collegeId) {
    return (
      <div className="ln-module admin-list-page">
        {/* Inside the tab strip, like At Risk: the bare alert dropped every way off this page, and it
            flashed before a saved college had restored. */}
        <SuperAdminGroupShell groupKey="projects">
          {scopeLoaded ? (
            <Alert
              type="warning"
              message="Select a college to continue"
              description="Choose a college in the header above to see its submission readiness."
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
          <h1 className="admin-list-page__title">Submission readiness</h1>
          <div className="admin-list-page__subtitle">See whether each team is ready to submit, and override the gate when you need to.</div>
        </div>
        <Space wrap>
        </Space>
      </div>

      <div className="admin-list-page__narrow-content">
        <Card
          style={{ marginBottom: 16 }}
          title="Active overrides"
          extra={
            <Space>
              <Badge count={overrideTotal} showZero color={overrideTotal ? "gold" : "default"} />
              <Button
                size="small"
                icon={<DownloadOutlined />}
                disabled={!activeOverrides.length}
                onClick={() =>
                  exportRowsToCsv(
                    "active-readiness-overrides.csv",
                    // Same exportRowsToCsv(filename, columns, rows) misuse as every other export in
                    // this module — not flagged by the audit that covered this page, but confirmed
                    // broken by the same test: only the mapped rows were passed, so they landed in
                    // the columns slot and `rows` was undefined, producing an empty file.
                    [
                      { label: "Workspace", key: "workspace" },
                      { label: "Override note", key: "overrideNote" },
                      { label: "Overridden by", key: "overrideBy" },
                      { label: "Overridden at", key: "overrideAt" },
                    ],
                    activeOverrides.map((p) => ({
                      workspace: normaliseCollegeScopedName(p, "Workspace"),
                      overrideNote: p?.readiness?.overrideNote ?? "",
                      overrideBy: p?.readiness?.overrideByName ?? "",
                      overrideAt: p?.readiness?.overrideAt ?? "",
                    }))
                  )
                }
              >
                Export CSV
              </Button>
            </Space>
          }
        >
          <Skeleton loading={projectsLoading} active paragraph={{ rows: 2 }}>
            {projectsError ? (
              // Never fall through to the green "all clear" empty state on a failed fetch — that
              // reads as a confirmed-clean college when it's actually just an unknown one, which
              // is worse than showing nothing for a page whose whole purpose is catching stale
              // overrides.
              <Alert
                type="error"
                showIcon
                message="Active overrides could not be loaded"
                description={projectsError}
              />
            ) : activeOverrides.length ? (
              <Table
                rowKey={(record) => record?.id ?? record?.slug ?? JSON.stringify(record)}
                dataSource={activeOverrides}
                columns={overrideColumns}
                pagination={overrideTotal > 25 ? { current: overridePage + 1, pageSize: 25, total: overrideTotal, showSizeChanger: false, onChange: (page) => setOverridePage(page - 1) } : false}
                scroll={{ x: "max-content" }}
                size="small"
              />
            ) : (
              <Empty
                image={<CheckCircleFilled style={{ fontSize: 28, color: "#52c41a" }} />}
                description="No workspace currently has a manual override — every gate is running on its own completion state."
              />
            )}
          </Skeleton>
        </Card>

        <Card title="Select workspace" style={{ marginBottom: 16 }}>
          {projectsError ? (
            <Alert type="error" showIcon message="Couldn't load workspaces" description={projectsError} style={{ marginBottom: 12 }} />
          ) : null}
          <Input.Search aria-label="Search workspaces by title or ID" placeholder="Search workspaces by title or ID" value={workspaceSearch}
            onChange={(e) => { setWorkspaceSearch(e.target.value); setWorkspacePage(0); }} allowClear style={{ width: 420, maxWidth: "100%", marginBottom: 8 }} />
          <Select
            showSearch
            loading={projectsLoading}
            style={{ width: 420, maxWidth: "100%" }}
            placeholder="Select a project workspace"
            value={projectId || undefined}
            onChange={handleSelectProject}
            optionFilterProp="label"
            options={asArray(selectableProjects).map((project) => ({
              value: project?.id,
              label: normaliseCollegeScopedName(project, "Workspace"),
            }))}
          />
          <Space style={{ marginTop: 8 }}>
            <Button disabled={workspacePage === 0 || projectsLoading} onClick={() => setWorkspacePage((page) => page - 1)}>Previous workspaces</Button>
            <Text>{workspaceTotal ? `${workspacePage * 25 + 1}–${Math.min((workspacePage + 1) * 25, workspaceTotal)} of ${workspaceTotal}` : "0 workspaces"}</Text>
            <Button disabled={projectsLoading || (workspacePage + 1) * 25 >= workspaceTotal} onClick={() => setWorkspacePage((page) => page + 1)}>Next workspaces</Button>
          </Space>
        </Card>

        {error ? <Alert type="error" message="Readiness could not be loaded" description={error} showIcon style={{ marginBottom: 16 }} /> : null}

        {projectId && error ? null : projectId ? (
          <Skeleton loading={loading} active paragraph={{ rows: 4 }}>
            <Card
              title="Current readiness"
              style={{ marginBottom: 16 }}
              extra={
                readiness ? (
                  <Tag color={readiness?.readyForSubmission ? "green" : "red"}>
                    {readiness?.readyForSubmission ? "Ready" : "Not ready"}
                  </Tag>
                ) : null
              }
            >
              <Space direction="vertical" size={16} style={{ width: "100%" }}>
                {combinedTotal > 0 ? (
                  <>
                    {/* This bar adds tasks and sprints into one figure — a client-side convenience
                        blend of two different units, not a number the server computes or the gate
                        consults. Sitting directly under the Ready/Not ready tag it reads as the
                        thing that decides it, so it says what it is. The per-unit counts are in
                        the table immediately below. */}
                    <Text strong>Task completion</Text>
                    <Progress percent={totalTasks ? Math.round(completedTasks * 100 / totalTasks) : 0} format={() => `${completedTasks}/${totalTasks} tasks`} />
                    <Text strong>Sprint completion</Text>
                    <Progress percent={totalSprints ? Math.round(completedSprints * 100 / totalSprints) : 0} format={() => `${completedSprints}/${totalSprints} sprints`} />
                    <Text type="secondary">{readiness?.overrideActive
                      ? "Task and sprint completion are separate measures; the manual override is independent of both."
                      : "Task and sprint completion are separate measures; the readiness verdict above is decided server-side."}</Text>
                  </>
                ) : null}
                <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">
                  <Descriptions.Item label="Tasks completed">
                    {totalTasks > 0 ? `${completedTasks}/${totalTasks}` : "No tasks defined"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Sprints completed">
                    {totalSprints > 0 ? `${completedSprints}/${totalSprints}` : "No sprints defined"}
                  </Descriptions.Item>
                  {/* Releases had zero admin-facing visibility anywhere before this. Informational
                      only — a release can never block or unblock readiness. */}
                  <Descriptions.Item label="Releases shipped">
                    {Number(readiness?.totalReleases ?? 0) > 0
                      ? `${readiness.shippedReleases ?? 0}/${readiness.totalReleases}`
                      : "No releases defined"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Submission status">
                    {readiness?.submissionExists ? statusLabel(readiness?.submissionStatus) : "Not submitted"}
                  </Descriptions.Item>
                  <Descriptions.Item label="State">{statusLabel(readiness?.readinessState)}</Descriptions.Item>
                  {readiness?.reason && readiness.reason !== readiness?.overrideNote ? (
                    // When an override note exists, the backend echoes it back verbatim as "reason"
                    // too — rendering both here would show the exact same sentence twice under two
                    // different labels. Only show Reason when it actually says something the
                    // Override note row below doesn't already say.
                    <Descriptions.Item label="Reason" span={2}>{textOrDash(readiness?.reason)}</Descriptions.Item>
                  ) : null}
                  <Descriptions.Item label="Override active">{overrideStateTag(readiness)}</Descriptions.Item>
                  {readiness?.overrideActive ? (
                    <>
                      <Descriptions.Item label="Override note" span={2}>{textOrDash(readiness?.overrideNote)}</Descriptions.Item>
                      <Descriptions.Item label="Overridden by">{textOrDash(readiness?.overrideByName)}</Descriptions.Item>
                      <Descriptions.Item label="Overridden at">{formatTimestamp(readiness?.overrideAt)}</Descriptions.Item>
                    </>
                  ) : null}
                </Descriptions>
              </Space>
            </Card>

            {/* This is the only per-release view anywhere in the admin console — before it, the
                aggregate "Releases shipped" count above was all there was: no titles, no dates, no
                per-release status, no way to tell WHICH releases shipped or when.

                It is arguably on the wrong page: releases do NOT feed the submission gate this
                screen exists to manage (the gate is tasks/sprints completeness plus the override),
                so a reader can reasonably assume shipping a release moves readiness. It doesn't.
                Kept here anyway rather than deleted, because deleting it would remove the data
                from the console altogether; the subtitle below says plainly that it is context,
                not an input. The real fix is a Releases section on the workspace itself. */}
            <Card title="Releases" extra={<Text type="secondary">Context only — releases do not affect readiness</Text>}>
              {releasesLoading ? (
                <Skeleton active paragraph={{ rows: 2 }} />
              ) : releasesError ? (
                <Alert type="error" showIcon message="Couldn't load releases" description={releasesError} />
              ) : releases.length === 0 ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No releases defined on this project." />
              ) : (
                <Table
                  size="small"
                  rowKey="releaseKey"
                  pagination={false}
                  dataSource={releases}
                  columns={[
                    { title: "Release", dataIndex: "title", key: "title" },
                    {
                      title: "Status",
                      dataIndex: "status",
                      key: "status",
                      render: (status) => (
                        <Tag color={status === "SHIPPED" ? "green" : status === "IN_PROGRESS" ? "blue" : "default"}>
                          {status === "SHIPPED" ? "Shipped" : status === "IN_PROGRESS" ? "In progress" : "Planned"}
                        </Tag>
                      ),
                    },
                    {
                      title: "Sprints",
                      key: "sprints",
                      render: (_, record) => `${record.completedSprintCount || 0}/${record.sprintCount || 0}`,
                    },
                    {
                      title: "Points",
                      key: "points",
                      render: (_, record) => `${record.completedPoints || 0}/${record.committedPoints || 0}`,
                    },
                    {
                      title: "Target date",
                      dataIndex: "targetDate",
                      key: "targetDate",
                      render: (value) => (value ? formatTimestamp(value) : "—"),
                    },
                  ]}
                />
              )}
            </Card>

            <Card title="Manual override" ref={overrideFormRef}>
              {submissionBlocksOverride ? (
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                  message="Force Unlock/Block will have no effect here"
                  description={
                    <>
                      This workspace already has a submission ({statusLabel(readiness?.submissionStatus)}) — the
                      submission gate takes priority over any readiness override. To let the learner resubmit,
                      the delivery needs to be reopened or have changes requested — a readiness override alone
                      will not unblock it. The mentor can do this, or an admin can use the Review action on the{" "}
                      Submissions dashboard.
                    </>
                  }
                />
              ) : null}
              <Form form={form} layout="vertical" onFinish={handleSubmit}>
                <Form.Item name="override" label="Override state" rules={[{ required: true, message: "Choose an override state" }]}>
                  <Radio.Group
                    onChange={(e) => {
                      // Switching to a DIFFERENT override direction than what's currently active
                      // (e.g. Force Block → Force Unlock) drops the old note — otherwise the
                      // previous direction's justification silently rides along and gets shown to
                      // the learner as the reason for the NEW, opposite state. Re-selecting the
                      // same direction, or picking Clear, leaves the note untouched.
                      if (e.target.value !== "clear" && e.target.value !== loadedOverrideRef.current) {
                        form.setFieldsValue({ note: "" });
                      }
                    }}
                  >
                    <Radio.Button value="true">Force unlock (ready)</Radio.Button>
                    <Radio.Button value="false">Force block (not ready)</Radio.Button>
                    {readiness?.overrideActive ? <Radio.Button value="clear">Clear override</Radio.Button> : null}
                  </Radio.Group>
                </Form.Item>
                <Form.Item
                  noStyle
                  shouldUpdate={(prev, next) => prev.override !== next.override}
                >
                  {({ getFieldValue }) => {
                    // overrideProjectReadiness discards the note entirely when override is null
                    // (the "Clear override" choice) — requiring it there forced a throwaway
                    // justification the backend never persists.
                    const clearing = getFieldValue("override") === "clear";
                    return (
                      <Form.Item
                        name="note"
                        label="Note"
                        rules={clearing ? [] : [{ required: true, message: "A note is required — it's shown to mentors and learners" }]}
                        extra={clearing ? "Not saved — clearing an override doesn't keep a note." : "Shown to the workspace's mentor and learners as the readiness reason."}
                      >
                        <Input.TextArea
                          rows={3}
                          maxLength={2000}
                          showCount
                          disabled={clearing}
                          placeholder="Reason for this override (visible to mentors and learners)"
                        />
                      </Form.Item>
                    );
                  }}
                </Form.Item>
                <Form.Item>
                  <Popconfirm
                    title="Apply this readiness override?"
                    description={
                      submissionBlocksOverride
                        ? "This workspace already has a submission, so this override will have no visible effect until that delivery is reopened."
                        : "This immediately changes whether the student can submit. It takes effect right away."
                    }
                    okText="Apply override"
                    okButtonProps={{ danger: true, loading: saving }}
                    onConfirm={() => form.submit()}
                  >
                    <Button type="primary" loading={saving}>
                      Save override
                    </Button>
                  </Popconfirm>
                </Form.Item>
              </Form>
            </Card>
          </Skeleton>
        ) : (
          <Alert type="info" showIcon message="Select a workspace" description="Pick a project workspace above, or click Manage on an active override, to view and control its readiness state." />
        )}
      </div>
      </SuperAdminGroupShell>
    </div>
  );
}

SuperAdminProjectReadinessPage.superAdminLayout = SuperAdminLayout;
