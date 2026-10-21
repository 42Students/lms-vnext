import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import { Alert, Button, Empty, Input, Pagination, Progress, Select, Space, Tag } from "antd";
import { RightOutlined } from "@ant-design/icons";
import ProjectsShell from "./ProjectsShell";
import { compareNumberedTeamProjects } from "@/utils/projectListOrdering";
import { getProjectsPage, normalizeProjectsList } from "@/api/Services/projectService";
import { RefreshStatus, SkeletonRegion } from "@/components/Common/Skeletons";

const STALE_AFTER_DAYS = 7;

// Matches $clrThird in the app's SCSS variables (the brand teal used for "in progress/active"
// throughout the Projects module, e.g. the Overview tab's donut chart) — previously this file used
// AntD's generic "cyan" preset for the status Tag (a visibly different, bluer teal) while the
// progress bar below used this exact hex, so the two "same status" indicators on one card didn't
// actually match.
const STATUS_TEAL = "#2db7c4";

// Shape-matched loading state for the card grid below — mirrors .learn-projects-card's own DOM
// structure (tag/title/subtitle row, progress bar, action line) with shimmer-fill boxes instead
// of a centered <Spin/>, so the page doesn't visibly swap from "spinner" to "card grid" once data
// lands (the same flash-of-one-shape-then-another bug fixed on the Dashboard and Attendance pages).
function ProjectCardSkeleton() {
  return (
    <div className="learn-projects-card-skeleton" aria-hidden="true">
      <div className="learn-projects-card-skeleton__top">
        <div className="learn-projects-card-skeleton__meta">
          <span className="learn-projects-card-skeleton__tag" />
          <span className="learn-projects-card-skeleton__title" />
          <span className="learn-projects-card-skeleton__subtitle" />
        </div>
        <span className="learn-projects-card-skeleton__chevron" />
      </div>
      <div className="learn-projects-card-skeleton__progress">
        <div className="learn-projects-card-skeleton__progress-label">
          <span />
          <span />
        </div>
        <span className="learn-projects-card-skeleton__progress-bar" />
      </div>
      <span className="learn-projects-card-skeleton__action" />
    </div>
  );
}

const isProjectArchived = (project) => String(project?.status || "").toLowerCase().includes("archiv");

// "Under Review" is set both by a genuine fresh learner submission AND by a mentor's own "Reopen
// for revision" action, which bumps reviewedAt but leaves submittedAt at its old value — the
// reviewStatus string alone can't tell these apart. Without this, reopening a delivery the mentor
// already reviewed immediately re-shows "Needs review" on their own project list, even though the
// learner hasn't touched anything since.
const deliveryNeedsMentorReview = (delivery) => {
  const reviewStatus = String(delivery?.reviewStatus || "").toLowerCase();
  if (reviewStatus !== "submitted" && reviewStatus !== "under review") return false;
  const submittedAt = delivery?.submittedAt ? dayjs(delivery.submittedAt) : null;
  const reviewedAt = delivery?.reviewedAt ? dayjs(delivery.reviewedAt) : null;
  if (!submittedAt || !submittedAt.isValid() || !reviewedAt || !reviewedAt.isValid()) return true;
  return submittedAt.isAfter(reviewedAt);
};

const isProjectStalled = (project) => {
  const statusLower = String(project?.status || "").toLowerCase();
  // "blocked" was missing from this exclusion — an administratively blocked project is stale
  // by definition (that's usually why it got blocked), and flagging it "Stalled" on top of
  // "Blocked" is a redundant, confusing alarm for a state that already has its own explanation.
  // The card's "Blocked" tag is actually driven by the independent `blocker` free-text field
  // (not `status`), so that must be checked too or a project with status="Active" but a
  // blocker note still shows both tags after going idle.
  if (statusLower.includes("archiv") || statusLower.includes("complet") || statusLower.includes("done") || statusLower.includes("block") || project?.blocker) {
    return false;
  }
  const activityTimestamps = (project?.resolvedActivity || [])
    .map((entry) => entry?.when)
    .filter(Boolean)
    .map((value) => dayjs(value))
    .filter((value) => value.isValid());
  // The Projects LIST endpoint doesn't include resolvedActivity (only the single-project detail
  // fetch does), so every project used to fall through to "no timestamps -> stalled" and get
  // flagged regardless of real activity. Fall back to the project's own updatedAt, and only
  // when there's truly no signal at all, assume NOT stalled rather than alarming the mentor.
  const timestamps = activityTimestamps.length
    ? activityTimestamps
    : [project?.lastActivityAt].filter(Boolean).map((value) => dayjs(value)).filter((value) => value.isValid());
  if (!timestamps.length) return false;
  const latest = timestamps.reduce((a, b) => (a.isAfter(b) ? a : b));
  return dayjs().diff(latest, "day") >= STALE_AFTER_DAYS;
};

function ProjectsContent() {
  const router = useRouter();
  const loginUser = useSelector((state) => state.loginUser);
  const onMentorRoute = router.pathname?.startsWith("/mentor");
  // basePath is purely a routing concern and stays URL-derived, but gating mentor-only UI
  // (needsReview/stalled flags below) on the URL alone let a learner who deep-links to
  // /mentor/projects see mentor-only badges flash before any layout-level redirect guard
  // commits. Use the actual authenticated role for anything that changes what's rendered.
  // facultyType must be checked too — plain FACULTY (Coordinator, Professor, etc.) landing on
  // /mentor/projects via a direct URL shouldn't be treated as a real mentor here.
  const isMentor = onMentorRoute && loginUser?.userType === "FACULTY" && loginUser?.facultyType === "MENTOR";
  const basePath = onMentorRoute ? "/mentor/projects" : "/learn/projects";
  const [projects, setProjects] = useState([]);
  const [pageNumber, setPageNumber] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [attentionFilter, setAttentionFilter] = useState(undefined);
  const [filtersHydrated, setFiltersHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorScopeKey, setErrorScopeKey] = useState(null);
  const [loadedScopeKey, setLoadedScopeKey] = useState(null);
  const [retryKey, setRetryKey] = useState(0);
  const requestScopeKey = JSON.stringify([
    pageNumber,
    pageSize,
    search,
    statusFilter || "",
    attentionFilter || "",
  ]);
  const scopeHasSettledData = loadedScopeKey === requestScopeKey;
  const currentError = errorScopeKey === requestScopeKey ? error : null;
  const initialLoading = !scopeHasSettledData && !currentError;
  const refreshing = loading && scopeHasSettledData;
  const defaultProjectId = scopeHasSettledData ? projects[0]?.id : undefined;
  // getMyProjects returns every non-deleted membership regardless of workspace status, so a
  // long-finished/archived project from a past term stayed mixed into current active work in raw
  // API order with nothing but a plain status Tag to tell them apart. A stable sort (archived
  // last, otherwise unchanged) keeps current work at the top without hiding archived history.
  const sortedProjects = useMemo(
    () =>
      [...projects]
        .map((project, index) => ({ project, index }))
        .sort((a, b) => {
          const aArchived = String(a.project?.status || "").toLowerCase().includes("archiv") ? 1 : 0;
          const bArchived = String(b.project?.status || "").toLowerCase().includes("archiv") ? 1 : 0;
          const archiveOrder = aArchived - bArchived;
          if (archiveOrder) return archiveOrder;

          // Keep unrelated projects in the backend's recency order. When both titles are clearly
          // part of the same "Team N" series, use numeric ordering so Team 10 cannot sit between
          // Team 1 and Team 2.
          const teamOrder = compareNumberedTeamProjects(a.project, b.project);
          return teamOrder || a.index - b.index;
        })
        .map(({ project }) => project),
    [projects]
  );

  // Keep discovery state addressable: a learner/mentor can bookmark or share the exact queue
  // they are looking at instead of losing search/filter context on Back or reload.
  useEffect(() => {
    if (!router.isReady || filtersHydrated) return;
    const q = router.query;
    const restoredSearch = typeof q.search === "string" ? q.search : "";
    setSearchInput(restoredSearch);
    setSearch(restoredSearch);
    setStatusFilter(typeof q.status === "string" ? q.status : undefined);
    setAttentionFilter(typeof q.attention === "string" ? q.attention : undefined);
    setPageNumber(Math.max(0, Number(q.page) || 0));
    setFiltersHydrated(true);
  }, [router.isReady, filtersHydrated, router.query]);

  useEffect(() => {
    if (!filtersHydrated) return;
    const timer = window.setTimeout(() => {
      setSearch((current) => {
        const next = searchInput.trim();
        if (current !== next) setPageNumber(0);
        return next;
      });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput, filtersHydrated]);

  useEffect(() => {
    if (!filtersHydrated) return;
    router.replace({
      pathname: router.pathname,
      query: {
        ...router.query,
        search: search || undefined,
        status: statusFilter || undefined,
        attention: attentionFilter || undefined,
        page: pageNumber || undefined,
      },
    }, undefined, { shallow: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, attentionFilter, pageNumber, filtersHydrated]);

  useEffect(() => {
    if (!filtersHydrated) return undefined;
    let mounted = true;

    async function loadProjects() {
      const scopeKey = requestScopeKey;
      setLoading(true);
      setError(null);
      setErrorScopeKey(null);
      try {
        const response = await getProjectsPage({ page: pageNumber, size: pageSize, search, status: statusFilter, attention: attentionFilter });
        if (!mounted) return;
        const result = response?.data?.data ?? response?.data ?? response;
        if (!result || !Array.isArray(result.records)) {
          throw new Error("The projects page did not return a valid records array.");
        }
        const total = Number(result.totalRecords) || 0;
        setProjects(normalizeProjectsList(result.records));
        setTotalRecords(total);
        setLoadedScopeKey(scopeKey);
        if (result.records.length === 0 && total > 0 && pageNumber > 0) {
          setPageNumber((current) => Math.max(0, current - 1));
        }
      } catch (err) {
        if (mounted) {
          // Keep the last successful scope in memory. It stays visible only when it belongs to
          // the current filters/page; a different scope renders its own loading/error state.
          setError(err?.message || "Failed to load projects.");
          setErrorScopeKey(scopeKey);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadProjects();

    return () => {
      mounted = false;
    };
  }, [pageNumber, pageSize, retryKey, requestScopeKey, search, statusFilter, attentionFilter, filtersHydrated]);

  return (
    <ProjectsShell
      title="Projects"
      subtitle="Choose a project to open its workspace."
      fallbackProjectId={defaultProjectId}
      showTabs={false}
    >
      {refreshing ? <RefreshStatus label="Refreshing projects…" /> : null}
      {currentError ? (
        <Alert
          type={scopeHasSettledData ? "warning" : "error"}
          showIcon
          message={scopeHasSettledData ? "Couldn't refresh projects" : "Projects could not be loaded"}
          description={scopeHasSettledData
            ? "Showing the last projects loaded for this view."
            : "Check your connection, then try again. Your project data has not been changed."}
          action={<Button size="small" onClick={() => setRetryKey((current) => current + 1)}>Retry</Button>}
          style={{ marginBottom: 16 }}
        />
      ) : null}

      <div className="learn-projects-detail__card" style={{ marginBottom: 16 }}>
        <Space wrap style={{ width: "100%" }}>
          <Input.Search
            allowClear
            value={searchInput}
            aria-label="Search my projects"
            placeholder="Search project title, course or slug"
            onChange={(event) => setSearchInput(event.target.value)}
            onSearch={(value) => { setSearchInput(value); setSearch(value.trim()); setPageNumber(0); }}
            style={{ width: 300, maxWidth: "100%" }}
          />
          <Select
            allowClear
            value={statusFilter}
            aria-label="Filter projects by status"
            placeholder="All statuses"
            onChange={(value) => { setStatusFilter(value); setPageNumber(0); }}
            style={{ width: 170 }}
            options={[
              { value: "CURRENT", label: "Current only" },
              { value: "ACTIVE", label: "Active" },
              { value: "IN_PROGRESS", label: "In progress" },
              { value: "READY", label: "Ready" },
              { value: "BLOCKED", label: "Blocked" },
              { value: "ARCHIVED", label: "Archived" },
            ]}
          />
          <Select
            allowClear
            value={attentionFilter}
            aria-label="Filter projects needing attention"
            placeholder="All attention states"
            onChange={(value) => { setAttentionFilter(value); setPageNumber(0); }}
            style={{ width: 210 }}
            options={[
              ...(isMentor ? [{ value: "MENTOR_REVIEW", label: "Needs my review" }] : [{ value: "LEARNER_ACTION", label: "Needs my action" }]),
              { value: "BLOCKED", label: "Blocked" },
            ]}
          />
          {(search || statusFilter || attentionFilter) ? (
            <Button onClick={() => { setSearchInput(""); setSearch(""); setStatusFilter(undefined); setAttentionFilter(undefined); setPageNumber(0); }}>
              Clear filters
            </Button>
          ) : null}
        </Space>
      </div>

      <div className="learn-projects__list" aria-busy={loading ? "true" : undefined}>
        {initialLoading ? (
          <SkeletonRegion label="Loading projects">
            <ProjectCardSkeleton />
            <ProjectCardSkeleton />
            <ProjectCardSkeleton />
          </SkeletonRegion>
        ) : currentError && !scopeHasSettledData ? null : projects.length === 0 ? (
          <Empty description={search || statusFilter || attentionFilter ? "No projects match these filters." : "No projects assigned yet."} />
        ) : (
          sortedProjects.map((project) => {
            const archived = isProjectArchived(project);
            const reviewStatus = String(project?.resolvedDelivery?.reviewStatus || "").toLowerCase();
            // Archiving only ever sets project.status server-side — it never touches the
            // delivery row — so an archived project with a pending submission kept showing
            // "Needs review" right alongside "Archived". Reviewing it is also hard-blocked
            // server-side once archived (requireProjectNotArchived), so the badge was inviting
            // an action guaranteed to fail.
            const needsReview = isMentor && !archived && deliveryNeedsMentorReview(project?.resolvedDelivery);
            const stalled = isMentor && isProjectStalled(project);
            // Students previously had no list-level signal that a mentor requested changes —
            // they only found out by opening the project. Mirrors the mentor's needsReview tag.
            const changesRequested = !isMentor && !archived && reviewStatus === "changes requested";
            const draftSubmission = !isMentor && !archived && reviewStatus === "draft";
            const directTab = needsReview || changesRequested || draftSubmission ? "delivery" : project.blocker ? "board" : null;
            const nextDue = project?.nextDue;
            const dueText = !nextDue
              ? "No due date"
              : nextDue.state === "overdue"
                ? `Overdue · ${nextDue.label}`
                : nextDue.state === "dueSoon"
                  ? `Due soon · ${nextDue.label}`
                  : `Due ${nextDue.label}`;
            const openHref = `${basePath}/${encodeURIComponent(project.id)}${directTab ? `?tab=${directTab}${project.blocker ? "&lane=Blocked" : ""}` : ""}`;
            return (
            <button
              key={project.id}
              type="button"
              className="learn-projects-card"
              onClick={() => router.push(openHref)}
            >
              <div className="learn-projects-card__top">
                <div>
                  {/* Teal matches the "In progress" color used on the Overview tab's donut chart — AntD's
                      generic blue "processing" preset read as a different status color for the same meaning.
                      When a blocker exists, always show "Blocked" text, using the same "volcano" tone the
                      workspace detail view uses for "Requires attention" so the blocked state reads
                      consistently across both pages. Archived takes priority over both — archiving never
                      clears project.blocker server-side, so a project blocked before it was archived used
                      to show a permanent red "Blocked" tag instead of "Archived", implying it still needed
                      unblocking even while sorted to the bottom of the list as closed-out history. */}
                  <Tag color={archived ? "default" : project.blocker ? "volcano" : STATUS_TEAL}>
                    {archived ? "Archived" : project.blocker ? "Blocked" : project.status || "Active"}
                  </Tag>
                  {needsReview ? <Tag color="gold">Needs review</Tag> : null}
                  {changesRequested ? <Tag color="gold">Changes requested</Tag> : null}
                  {draftSubmission ? <Tag color="blue">Draft submission</Tag> : null}
                  {stalled ? <Tag color="red">Stalled</Tag> : null}
                  <h3>{project.title}</h3>
                  <p>
                    {project.course || "Project"}
                    <span className="learn-projects-card__sep">•</span>
                    {project.mentor || "Mentor"}
                  </p>
                </div>
                <RightOutlined />
              </div>

              <div className="learn-projects-card__progress">
                <div className="learn-projects-card__progress-label">
                  <span>{project.phase || "In progress"}</span>
                  <span>{dueText}</span>
                </div>
                {/* project.progress is a separate, free-text/manually-set field (only ever
                    changed by an explicit admin/mentor edit) — it was never derived from task
                    completion, so this bar could show 0% for a project the Overview tab's own
                    donut reported as 96% done. readiness.completedTasks/totalTasks is the same
                    task-completion source the Overview tab already uses; fall back to the raw
                    progress field only when there's no task data to compute from at all. */}
                <div className="learn-projects-card__progress-label"><span>{project.readiness?.totalTasks > 0 ? "Task completion" : "Admin-reported progress"}</span><span>{project.readiness?.totalTasks > 0 ? `${project.readiness.completedTasks || 0}/${project.readiness.totalTasks} tasks` : "Manual estimate"}</span></div>
                <Progress
                  percent={
                    project.readiness?.totalTasks > 0
                      ? Math.round((100 * (project.readiness.completedTasks || 0)) / project.readiness.totalTasks)
                      : Number(project.progress || 0)
                  }
                  strokeColor={STATUS_TEAL}
                  showInfo={false}
                />
              </div>

              <div className="learn-projects-card__action">
                {/* nextAction is a manually-authored field that review/status actions never touch —
                    archiving in particular only ever sets project.status, so a project archived
                    mid-work kept showing its last "Submit sprint 3 deliverable"-style call to
                    action next to the "Archived" tag above, implying there was still open work on
                    a closed-out project. */}
                {needsReview ? (
                  <><strong>Review submission</strong><span className="learn-projects-card__link">Open review</span></>
                ) : changesRequested ? (
                  <><strong>Update your submission</strong><span className="learn-projects-card__link">Open submission</span></>
                ) : draftSubmission ? (
                  <><strong>Finish your draft submission</strong><span className="learn-projects-card__link">Open submission</span></>
                ) : project.blocker && !archived ? (
                  <><strong>{project.blocker}</strong><span className="learn-projects-card__link">Open blocked work</span></>
                ) : project.nextAction && project.nextAction !== "Open workspace" && !archived ? (
                  // normalizeProject (projectService.js) defaults nextAction to the literal
                  // string "Open workspace" when the backend gives none -- without this check,
                  // that fallback value read as truthy here too, rendering "Open workspace" as
                  // both the bolded headline AND the link right next to it.
                  <><strong>{project.nextAction}</strong><span className="learn-projects-card__link">Open workspace</span></>
                ) : (
                  <strong>Open workspace</strong>
                )}
              </div>
            </button>
            );
          })
        )}
      </div>
      {scopeHasSettledData && totalRecords > pageSize ? (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 24, marginBottom: 16 }}>
          <Pagination
            current={pageNumber + 1}
            pageSize={pageSize}
            total={totalRecords}
            showSizeChanger
            pageSizeOptions={[10, 25, 50]}
            showTotal={(total, range) => `${range[0]}–${range[1]} of ${total} projects`}
            onChange={(nextPage, nextSize) => {
              if (nextSize !== pageSize) {
                setPageNumber(0);
                setPageSize(nextSize);
              } else {
                setPageNumber(nextPage - 1);
              }
            }}
          />
        </div>
      ) : null}
    </ProjectsShell>
  );
}

export default ProjectsContent;
