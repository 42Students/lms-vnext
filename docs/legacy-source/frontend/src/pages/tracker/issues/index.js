import Head from "next/head";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { Alert, Button, Checkbox, Dropdown, Empty, Input, Modal, Pagination, Select, Skeleton, message } from "antd";
import { CloseOutlined, StarOutlined } from "@ant-design/icons";
import TrackerShell from "@/components/tracker/TrackerShell";
import { SeverityPill, StatusPill } from "@/components/tracker/TrackerPill";
import { listBugReports, updateBugStatus } from "@/api/Services/BugTrackerService";
import { runBulkStatus } from "@/utils/trackerBulk";
import { deleteFilterPreset, hasAnyFilter, loadSavedFilters, saveFilterPreset } from "@/utils/trackerSavedFilters";
import { REPORTER_OPTIONS, ENVIRONMENT_OPTIONS, STATUS_OPTIONS, environmentLabel } from "@/data/bugTrackerData";
import { formatTrackerDate, isTrackerManagerClientHint, trackerLocationText } from "@/utils/bugTrackerUtils";

const SORT_OPTIONS = [
  { value: "DESC", label: "Newest first" },
  { value: "ASC", label: "Oldest first" },
];

function queryParamToString(value) {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw == null ? "" : String(raw);
}

export default function TrackerIssuesPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [pageInfo, setPageInfo] = useState({ number: 0, totalElements: 0, size: 20 });
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState("");
  const [environment, setEnvironment] = useState("");
  const [reporter, setReporter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("DESC");
  const [refreshKey, setRefreshKey] = useState(0);
  // Gates the URL-sync effect below until the one-time hydration-from-URL below has actually run --
  // without this, that effect would fire on the very first render with the empty default filters
  // and immediately strip whatever query params a shared/reloaded link arrived with.
  const [filtersReady, setFiltersReady] = useState(false);

  // Hydrate from the URL once, so a refreshed page or a link shared between testers reproduces
  // exactly what was being looked at -- this list previously had no way to remember or share a
  // specific filtered view at all.
  useEffect(() => {
    if (!router.isReady || filtersReady) return;
    const q = router.query;
    const urlStatus = queryParamToString(q.status);
    const urlEnvironment = queryParamToString(q.environment);
    const urlReporter = queryParamToString(q.reporter);
    const urlSearch = queryParamToString(q.search);
    const urlPage = Math.max(0, (Number(queryParamToString(q.page)) || 1) - 1);
    const urlSort = queryParamToString(q.sort).toUpperCase();
    if (urlStatus) setStatus(urlStatus);
    if (urlEnvironment) setEnvironment(urlEnvironment);
    if (urlReporter) setReporter(urlReporter);
    if (urlSearch) {
      setSearchInput(urlSearch);
      setSearch(urlSearch);
    }
    if (urlPage) setPage(urlPage);
    if (urlSort === "ASC") setSort("ASC");
    setFiltersReady(true);
  }, [router.isReady, filtersReady, router.query]);

  // Keeps the address bar in sync with the current filters after hydration, so the current view can
  // always be reloaded or shared. shallow + replace: this never needs a full page transition, and a
  // filter tweak shouldn't pile up back-button history entries the way push would.
  useEffect(() => {
    if (!filtersReady) return;
    const query = {};
    if (status) query.status = status;
    if (environment) query.environment = environment;
    if (reporter) query.reporter = reporter;
    if (search) query.search = search;
    if (page > 0) query.page = String(page + 1);
    if (sort === "ASC") query.sort = sort;
    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true });
    // router is intentionally excluded below: it's not stable across every render, and including it
    // would fight this effect's own replace() call.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersReady, status, environment, reporter, search, page, sort]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchInput.trim();
      // Hydrating searchInput from the URL (above) lands here too, since this effect just depends
      // on searchInput changing -- without this check, it would reset a hydrated page number (or
      // any other filter) straight back to page 0 a moment after the page loaded with it intact.
      if (trimmed === search) return;
      setPage(0);
      setSearch(trimmed);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, search]);

  useEffect(() => {
    if (!filtersReady) return undefined;
    const controller = new AbortController();
    setFetching(true);
    setError("");
    listBugReports({ page, size: 20, status, environment, reporter, search, sort }, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setItems(Array.isArray(result?.content) ? result.content : []);
        setPageInfo({
          number: result?.number || 0,
          totalElements: result?.totalElements || 0,
          size: result?.size || 20,
        });
      })
      .catch((err) => {
        if (err?.name !== "AbortError") setError(err?.message || "Issues could not be loaded.");
      })
      .finally(() => {
        // BE-0065: an aborted older request must not clear the spinner of the newer one.
        if (!controller.signal.aborted) setFetching(false);
      });
    return () => controller.abort();
  }, [filtersReady, page, status, environment, reporter, search, sort, refreshKey]);

  const [isManager, setIsManager] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState([]);
  const [bulkStatus, setBulkStatus] = useState(undefined);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [savedFilters, setSavedFilters] = useState([]);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState("");

  useEffect(() => {
    setIsManager(isTrackerManagerClientHint());
    setSavedFilters(loadSavedFilters());
  }, []);

  const currentFilters = { status, environment, reporter, search, sort };

  function applyPreset(preset) {
    const f = preset.filters || {};
    setStatus(f.status || "");
    setEnvironment(f.environment || "");
    setReporter(f.reporter || "");
    setSearchInput(f.search || "");
    setSearch(f.search || "");
    setSort(f.sort === "ASC" ? "ASC" : "DESC");
    setPage(0);
  }

  function handleSavePreset() {
    const name = saveName.trim();
    if (!name) return;
    setSavedFilters(saveFilterPreset(name, currentFilters));
    setSaveModalOpen(false);
    setSaveName("");
    message.success(`Saved view "${name}".`);
  }

  const savedMenuItems = [
    ...savedFilters.map((preset) => ({
      key: `preset:${preset.name}`,
      label: (
        <span className="tracker-saved-item">
          <span>{preset.name}</span>
          <button
            type="button"
            className="tracker-saved-item__delete"
            aria-label={`Delete saved view ${preset.name}`}
            onClick={(event) => {
              event.stopPropagation();
              setSavedFilters(deleteFilterPreset(preset.name));
            }}
          >
            <CloseOutlined />
          </button>
        </span>
      ),
      onClick: () => applyPreset(preset),
    })),
    ...(savedFilters.length ? [{ type: "divider", key: "divider" }] : []),
    {
      key: "save-current",
      label: "Save current filters…",
      disabled: !hasAnyFilter(currentFilters),
      onClick: () => setSaveModalOpen(true),
    },
  ];

  const toggleSelected = useCallback((publicId) => {
    setSelected((prev) => (prev.includes(publicId) ? prev.filter((id) => id !== publicId) : [...prev, publicId]));
  }, []);

  function exitSelectMode() {
    setSelectMode(false);
    setSelected([]);
    setBulkStatus(undefined);
  }

  async function applyBulkStatus() {
    if (!bulkStatus || !selected.length || bulkBusy) return;
    setBulkBusy(true);
    try {
      const { succeeded, failed } = await runBulkStatus(selected, bulkStatus, updateBugStatus);
      if (succeeded.length) {
        message.success(`Updated ${succeeded.length} ${succeeded.length === 1 ? "issue" : "issues"}.`);
      }
      if (failed.length) {
        message.error(`${failed.length} could not be updated (${failed.map((f) => f.id).join(", ")}): ${failed[0].message}`, 8);
      }
      setSelected(failed.map((f) => f.id));
      setRefreshKey((key) => key + 1);
      if (!failed.length) exitSelectMode();
    } finally {
      setBulkBusy(false);
    }
  }

  const totalLabel = useMemo(() => {
    const count = Number(pageInfo.totalElements || 0);
    return `${count} ${count === 1 ? "issue" : "issues"}`;
  }, [pageInfo.totalElements]);

  return (
    <>
      <Head><title>Issues · 42 Tracker</title></Head>
      <TrackerShell active="issues">
        <div className="tracker-issues-wrap">
          <header className="tracker-page-heading tracker-page-heading--row">
            <div>
              <p className="tracker-eyebrow">42 Tracker</p>
              <h1>Issues</h1>
              <p>{totalLabel}. Search what has already been reported before adding another.</p>
            </div>
            <Link href="/tracker" className="tracker-button tracker-button--primary">Report issue</Link>
          </header>

          <section className="tracker-filter-bar" aria-label="Issue filters">
            <Input
              allowClear
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search ID, description or page"
              className="tracker-filter-search"
            />
            <Select
              allowClear
              value={status || undefined}
              onChange={(value) => { setStatus(value || ""); setPage(0); }}
              placeholder="Status"
              options={STATUS_OPTIONS}
              className="tracker-filter-select"
            />
            <Select
              allowClear
              value={environment || undefined}
              onChange={(value) => { setEnvironment(value || ""); setPage(0); }}
              placeholder="Environment"
              options={ENVIRONMENT_OPTIONS}
              className="tracker-filter-select"
            />
            <Select
              allowClear
              value={reporter || undefined}
              onChange={(value) => { setReporter(value || ""); setPage(0); }}
              placeholder="Reporter"
              options={REPORTER_OPTIONS}
              className="tracker-filter-select"
            />
            <Select
              value={sort}
              onChange={(value) => { setSort(value); setPage(0); }}
              options={SORT_OPTIONS}
              className="tracker-filter-select"
              aria-label="Sort order"
            />
          </section>

          <div className="tracker-list-toolbar">
            <Dropdown menu={{ items: savedMenuItems }} trigger={["click"]} overlayClassName="tracker-popover-scope">
              <Button icon={<StarOutlined />}>Saved views{savedFilters.length ? ` (${savedFilters.length})` : ""}</Button>
            </Dropdown>
            {isManager && (
              <Button
                type={selectMode ? "default" : "text"}
                onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
              >
                {selectMode ? "Cancel selection" : "Select issues"}
              </Button>
            )}
          </div>

          {error && <Alert type="error" showIcon message={error} className="tracker-alert" />}

          <section className="tracker-issue-list" aria-live="polite">
            {fetching && !items.length ? (
              <>
                <div className="tracker-issue-card"><Skeleton active paragraph={{ rows: 2 }} /></div>
                <div className="tracker-issue-card"><Skeleton active paragraph={{ rows: 2 }} /></div>
                <div className="tracker-issue-card"><Skeleton active paragraph={{ rows: 2 }} /></div>
              </>
            ) : items.length ? items.map((issue) => (
              <Link
                key={issue.publicId}
                href={`/tracker/issues/${issue.publicId}`}
                className={`tracker-issue-card${selectMode ? " tracker-issue-card--selectable" : ""}${selected.includes(issue.publicId) ? " tracker-issue-card--selected" : ""}`}
                onClick={(event) => {
                  if (!selectMode) return;
                  event.preventDefault();
                  toggleSelected(issue.publicId);
                }}
              >
                <div className="tracker-issue-card__top">
                  {selectMode && (
                    <Checkbox
                      checked={selected.includes(issue.publicId)}
                      aria-label={`Select ${issue.publicId}`}
                      className="tracker-issue-card__check"
                      tabIndex={-1}
                    />
                  )}
                  <div className="tracker-issue-card__identity">
                    <strong>{issue.publicId}</strong>
                    <span>{trackerLocationText(issue)}</span>
                  </div>
                  <div className="tracker-issue-card__pills">
                    <SeverityPill value={issue.severity} />
                    <StatusPill value={issue.status} />
                  </div>
                </div>
                <p className="tracker-issue-card__description">{issue.description}</p>
                <div className="tracker-issue-card__meta">
                  <span>{issue.reporterName}</span>
                  <span>{environmentLabel(issue.environment)}</span>
                  <span>{formatTrackerDate(issue.createdAt)}</span>
                </div>
              </Link>
            )) : (
              <div className="tracker-empty"><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No matching issues." /></div>
            )}
          </section>

          {selectMode && (
            <div className="tracker-bulk-bar" role="region" aria-label="Bulk actions">
              <Checkbox
                checked={items.length > 0 && items.every((issue) => selected.includes(issue.publicId))}
                indeterminate={selected.length > 0 && !items.every((issue) => selected.includes(issue.publicId))}
                onChange={(event) => setSelected(event.target.checked ? items.map((issue) => issue.publicId) : [])}
              >
                All on this page
              </Checkbox>
              <span className="tracker-bulk-bar__count">{selected.length} selected</span>
              <Select
                value={bulkStatus}
                onChange={setBulkStatus}
                placeholder="Set status to…"
                options={STATUS_OPTIONS}
                className="tracker-bulk-bar__select"
                aria-label="New status for selected issues"
              />
              <Button type="primary" disabled={!bulkStatus || !selected.length} loading={bulkBusy} onClick={applyBulkStatus}>
                Apply
              </Button>
            </div>
          )}

          <Modal
            open={saveModalOpen}
            title="Save this view"
            okText="Save"
            onOk={handleSavePreset}
            okButtonProps={{ disabled: !saveName.trim() }}
            onCancel={() => setSaveModalOpen(false)}
            destroyOnClose
            wrapClassName="tracker-popover-scope"
          >
            <Input
              autoFocus
              maxLength={40}
              value={saveName}
              onChange={(event) => setSaveName(event.target.value)}
              onPressEnter={handleSavePreset}
              placeholder="e.g. Open production bugs"
            />
          </Modal>

          {pageInfo.totalElements > pageInfo.size && (
            <div className="tracker-pagination">
              <Pagination
                current={page + 1}
                pageSize={pageInfo.size}
                total={pageInfo.totalElements}
                showSizeChanger={false}
                onChange={(next) => setPage(next - 1)}
              />
            </div>
          )}
        </div>
      </TrackerShell>
    </>
  );
}

TrackerIssuesPage.nolayout = true;
