import Head from "next/head";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Alert, Button, Dropdown, Empty, Input, message, Segmented, Select, Skeleton, Switch, Tag } from "antd";
import { FileTextOutlined, MoreOutlined } from "@ant-design/icons";
import TrackerShell from "@/components/tracker/TrackerShell";
import TrackerLogDetailsDrawer from "@/components/tracker/TrackerLogDetailsDrawer";
import KnownErrorsDrawer from "@/components/tracker/KnownErrorsDrawer";
import LogsDownloadControl from "@/components/tracker/LogsDownloadControl";
import ClaudeReportModal from "@/components/tracker/ClaudeReportModal";
import LogHealthStrip from "@/components/tracker/LogHealthStrip";
import LogDigestDrawer from "@/components/tracker/LogDigestDrawer";
import TriageMenu from "@/components/tracker/TriageMenu";
import useLogInsights from "@/components/tracker/useLogInsights";
import TrackerLogsAccessGate from "@/components/tracker/TrackerLogsAccessGate";
import { isTrackerManagerClientHint } from "@/utils/bugTrackerUtils";
import { clearAllTokens, getAccessToken, refreshAccessToken } from "@/utils/authUtils";
import {
  getCloudLogDetail,
  getLogAlertStatus,
  markLogsViewed,
  muteLogSignature,
  queryCloudLogs,
  sendTestAlert,
} from "@/api/Services/SuperAdminLogsService";
import { mergeLogEntries } from "@/utils/trackerLogsUtils";
import { groupLogEntries } from "@/utils/logGrouping";
import { interleaveDeploys, statusChip } from "@/utils/logListModel";
import { normalizeSignature, sha256Hex } from "@/utils/logSignature";
import { shortCommit } from "@/utils/logReport";
import { instantIso } from "@/utils/instant";

const FILTERS_STORAGE_KEY = "42tracker_logs_filters_v1";

function loadSavedFilters() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(FILTERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveFilters(filters) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
  } catch {
    // Storage full/disabled -- filters just won't be remembered next visit, not worth surfacing.
  }
}

const ENVIRONMENTS = [
  { value: "PRODUCTION", label: "Production" },
  { value: "DEVELOPMENT", label: "Development" },
  { value: "UAT", label: "UAT" },
];
const WINDOWS = [
  { value: "15M", label: "Last 15 min" },
  { value: "1H", label: "Last 1 hour" },
  { value: "6H", label: "Last 6 hours" },
  { value: "24H", label: "Last 24 hours" },
  { value: "7D", label: "Last 7 days" },
];
const LEVELS = [
  { value: "WARNING", label: "Warnings + Errors" },
  { value: "ERROR", label: "Errors only" },
  { value: "INFO", label: "Info + above" },
  { value: "ALL", label: "All levels" },
];
const WINDOW_MS = { "15M": 15 * 60_000, "1H": 3_600_000, "6H": 6 * 3_600_000, "24H": 24 * 3_600_000, "7D": 7 * 86_400_000 };

function formatTimestamp(value) {
  if (!value) return "Unknown time";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatFreshness(value) {
  if (!value) return "";
  const elapsed = Math.max(0, Math.floor((Date.now() - value) / 1000));
  if (elapsed < 5) return "just now";
  if (elapsed < 60) return elapsed + "s ago";
  return Math.floor(elapsed / 60) + "m ago";
}

// formatFreshness is built for "since my last refresh" (seconds to a few minutes) and always
// renders in minutes past that -- fine there, but a backend uptime can run for days, and
// "4320m ago" is unreadable. This scales up through hours/days for that longer range.
function formatUptime(value) {
  if (!value) return "";
  const elapsed = Math.max(0, Math.floor((Date.now() - value) / 1000));
  if (elapsed < 60) return "just now";
  if (elapsed < 3600) return Math.floor(elapsed / 60) + "m ago";
  if (elapsed < 86400) return Math.floor(elapsed / 3600) + "h ago";
  return Math.floor(elapsed / 86400) + "d ago";
}

function errorMessage(error) {
  const status = error?.response?.status;
  if (status === 401) return "A Super Admin session is required to view system logs.";
  if (status === 403) return "System logs are available only to Super Admin.";
  if (status === 429) return "Log queries are being rate limited. Auto-refresh has been paused; retry shortly.";
  if (status === 503) return "Cloud Logging is not available to the LMS backend identity.";
  if (status === 502) return "Google Cloud Logging could not be reached. Try again.";
  return error?.response?.data?.message || "Logs could not be loaded.";
}

function TrackerLogsPageContent() {
  const router = useRouter();
  // Loaded once, synchronously, so the very first render already reflects how this admin last
  // left the page instead of resetting to defaults and then flashing to the saved values.
  const initialFilters = useMemo(() => loadSavedFilters(), []);
  const [environment, setEnvironment] = useState(initialFilters?.environment || "PRODUCTION");
  const [windowRange, setWindowRange] = useState(initialFilters?.windowRange || "1H");
  const [level, setLevel] = useState(initialFilters?.level || "WARNING");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [grouped, setGrouped] = useState(true);

  const [items, setItems] = useState([]);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [namespace, setNamespace] = useState("");
  const [queriedAt, setQueriedAt] = useState("");
  const [lastSuccessAt, setLastSuccessAt] = useState(null);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [error, setError] = useState("");
  const [stale, setStale] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // "What's new since I last looked" -- lastViewedAt is persisted server-side (LogAlertState),
  // so it survives a refresh or opening the page from a different device, not just this tab.
  const [lastViewedAt, setLastViewedAt] = useState(null);
  const [newSinceLastVisit, setNewSinceLastVisit] = useState(0);
  const [backendStartedAt, setBackendStartedAt] = useState(null);
  const [sendingTestAlert, setSendingTestAlert] = useState(false);
  const handleSendTestAlertRef = useRef(null);
  const [knownErrorsOpen, setKnownErrorsOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [digestOpen, setDigestOpen] = useState(false);
  const insights = useLogInsights(environment);
  const permalinkAppliedRef = useRef(false);
  // Set just before the permalink effect changes `environment` -- without this, the environment
  // change gives `loadInitial` a new identity, re-firing the "filters changed" effect below, whose
  // closeDetail() call immediately clears the drawer the permalink just opened and strips the
  // insertId/logName/env query params right back off the URL it was trying to land on.
  const skipNextCloseDetailRef = useRef(false);
  const hasComputedNewSinceRef = useRef(false);
  const [statusReady, setStatusReady] = useState(false);

  useEffect(() => {
    saveFilters({ environment, windowRange, level });
  }, [environment, windowRange, level]);

  useEffect(() => {
    getLogAlertStatus()
      .then((status) => {
        setLastViewedAt(instantIso(status?.lastViewedAt));
        setBackendStartedAt(instantIso(status?.backendStartedAt));
      })
      .catch(() => {})
      .finally(() => setStatusReady(true));
  }, []);

  // Runs exactly once, after both the status fetch and the first log query have settled --
  // whichever finishes last triggers it. Comparing against lastViewedAt (captured at mount, before
  // markLogsViewed below resets it server-side) is what makes this "new since your last visit"
  // rather than "new since this render", which would be true of almost nothing.
  useEffect(() => {
    // BE-0061: only after a query has actually succeeded; a failed first load doesn't use up "new since your last visit".
    if (hasComputedNewSinceRef.current || !statusReady || loading || !lastSuccessAt) return;
    hasComputedNewSinceRef.current = true;
    if (lastViewedAt && items.length) {
      const cutoff = new Date(lastViewedAt).getTime();
      const freshCount = items.filter((item) => {
        const t = new Date(item.timestamp).getTime();
        return Number.isFinite(t) && t > cutoff;
      }).length;
      setNewSinceLastVisit(freshCount);
    }
    markLogsViewed().catch(() => {});
  }, [statusReady, loading, items, lastViewedAt, lastSuccessAt]);

  const [selectedSummary, setSelectedSummary] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const mainRequestRef = useRef(null);
  const refreshRequestRef = useRef(null);
  const olderRequestRef = useRef(null);
  const detailRequestRef = useRef(null);
  const paginationAnchorRef = useRef(null);
  const loadedOlderRef = useRef(false);
  const generationRef = useRef(0);

  const payload = useCallback((extra = {}) => ({
    environment,
    window: windowRange,
    level,
    search: search || null,
    size: 50,
    ...extra,
  }), [environment, windowRange, level, search]);

  const stopAutoRefreshOnRateLimit = (err) => {
    if (err?.response?.status === 429) setAutoRefresh(false);
  };

  const abortQueryRequests = () => {
    mainRequestRef.current?.abort();
    refreshRequestRef.current?.abort();
    olderRequestRef.current?.abort();
  };

  const loadInitial = useCallback(async () => {
    const generation = ++generationRef.current;
    abortQueryRequests();
    const controller = new AbortController();
    mainRequestRef.current = controller;

    setItems([]);
    setNextPageToken(null);
    paginationAnchorRef.current = null;
    loadedOlderRef.current = false;
    setNamespace("");
    setQueriedAt("");
    setError("");
    setStale(false);
    setLoading(true);

    try {
      const result = await queryCloudLogs(payload(), controller.signal);
      if (generation !== generationRef.current) return;

      setItems(Array.isArray(result?.items) ? result.items : []);
      setNextPageToken(result?.nextPageToken || null);
      setNamespace(result?.namespace || "");
      const anchor = result?.queriedAt || "";
      setQueriedAt(anchor);
      paginationAnchorRef.current = anchor || null;
      setLastSuccessAt(Date.now());
    } catch (err) {
      if (err?.name !== "CanceledError" && err?.code !== "ERR_CANCELED" && generation === generationRef.current) {
        stopAutoRefreshOnRateLimit(err);
        setError(errorMessage(err));
      }
    } finally {
      if (mainRequestRef.current === controller) mainRequestRef.current = null;
      if (generation === generationRef.current) setLoading(false);
    }
  }, [payload]);

  const refreshNewer = useCallback(async ({ manual = false } = {}) => {
    if (typeof document !== "undefined" && document.hidden) return;
    if (selectedSummary) return;
    if (!items.length) {
      await loadInitial();
      return;
    }

    const generation = generationRef.current;
    refreshRequestRef.current?.abort();
    const controller = new AbortController();
    refreshRequestRef.current = controller;
    if (manual) setRefreshing(true);

    try {
      const result = await queryCloudLogs(payload(), controller.signal);
      if (generation !== generationRef.current) return;
      const incoming = Array.isArray(result?.items) ? result.items : [];

      if (loadedOlderRef.current) {
        setItems((current) => mergeLogEntries(incoming, current));
      } else {
        setItems(incoming);
        setNextPageToken(result?.nextPageToken || null);
        const anchor = result?.queriedAt || "";
        paginationAnchorRef.current = anchor || null;
      }

      setNamespace(result?.namespace || namespace);
      setQueriedAt(result?.queriedAt || queriedAt);
      setLastSuccessAt(Date.now());
      setError("");
      setStale(false);
    } catch (err) {
      if (err?.name !== "CanceledError" && err?.code !== "ERR_CANCELED" && generation === generationRef.current) {
        stopAutoRefreshOnRateLimit(err);
        setError(errorMessage(err));
        setStale(true);
      }
    } finally {
      if (refreshRequestRef.current === controller) refreshRequestRef.current = null;
      if (manual) setRefreshing(false);
    }
  }, [items.length, loadInitial, namespace, payload, queriedAt, selectedSummary]);

  const loadOlder = useCallback(async () => {
    if (!nextPageToken || !paginationAnchorRef.current || loadingOlder) return;
    const generation = generationRef.current;
    olderRequestRef.current?.abort();
    const controller = new AbortController();
    olderRequestRef.current = controller;
    setLoadingOlder(true);

    try {
      const result = await queryCloudLogs(payload({
        pageToken: nextPageToken,
        anchor: paginationAnchorRef.current,
      }), controller.signal);
      if (generation !== generationRef.current) return;
      const incoming = Array.isArray(result?.items) ? result.items : [];
      setItems((current) => mergeLogEntries(current, incoming));
      setNextPageToken(result?.nextPageToken || null);
      loadedOlderRef.current = true;
      setLastSuccessAt(Date.now());
      setError("");
      setStale(false);
    } catch (err) {
      if (err?.name !== "CanceledError" && err?.code !== "ERR_CANCELED" && generation === generationRef.current) {
        stopAutoRefreshOnRateLimit(err);
        setError(errorMessage(err));
        setStale(true);
      }
    } finally {
      if (olderRequestRef.current === controller) olderRequestRef.current = null;
      setLoadingOlder(false);
    }
  }, [loadingOlder, nextPageToken, payload]);

  const openDetail = async (summary, { updateUrl = true, environmentOverride } = {}) => {
    const effectiveEnvironment = environmentOverride || environment;
    detailRequestRef.current?.abort();
    setSelectedSummary(summary);
    setSelectedDetail(null);
    setDetailError("");

    if (updateUrl && summary?.insertId && summary?.logName) {
      router.replace({
        pathname: router.pathname,
        query: { insertId: summary.insertId, logName: summary.logName, env: effectiveEnvironment },
      }, undefined, { shallow: true });
    }

    if (!summary?.insertId || !summary?.logName) {
      setDetailError("Full detail is unavailable for this Cloud Logging entry.");
      return;
    }

    const controller = new AbortController();
    detailRequestRef.current = controller;
    setDetailLoading(true);
    try {
      const detail = await getCloudLogDetail({
        environment: effectiveEnvironment,
        insertId: summary.insertId,
        logName: summary.logName,
      }, controller.signal);
      setSelectedDetail(detail);
    } catch (err) {
      if (err?.name !== "CanceledError" && err?.code !== "ERR_CANCELED") {
        stopAutoRefreshOnRateLimit(err);
        setDetailError(errorMessage(err));
      }
    } finally {
      if (detailRequestRef.current === controller) detailRequestRef.current = null;
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    detailRequestRef.current?.abort();
    detailRequestRef.current = null;
    setSelectedSummary(null);
    setSelectedDetail(null);
    setDetailError("");
    setDetailLoading(false);
    if (router.query?.insertId) {
      const { insertId, logName, env, ...rest } = router.query;
      router.replace({ pathname: router.pathname, query: rest }, undefined, { shallow: true });
    }
  };

  useEffect(() => {
    if (skipNextCloseDetailRef.current) {
      skipNextCloseDetailRef.current = false;
    } else {
      closeDetail();
    }
    loadInitial();
  }, [loadInitial]);

  // Shareable permalink: opens straight to a specific entry when ?insertId=&logName= are present
  // (e.g. pasted from Telegram or Slack), without needing it to be in the currently loaded window.
  useEffect(() => {
    if (permalinkAppliedRef.current) return;
    const { insertId, logName, env } = router.query || {};
    if (!insertId || !logName) return;
    permalinkAppliedRef.current = true;
    if (env && env !== environment) {
      skipNextCloseDetailRef.current = true;
      setEnvironment(String(env));
    }
    openDetail({ insertId: String(insertId), logName: String(logName) },
      { updateUrl: false, environmentOverride: env ? String(env) : undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  useEffect(() => {
    if (!autoRefresh) return undefined;

    const run = () => {
      if (typeof document !== "undefined" && document.hidden) return;
      if (selectedSummary) return;
      refreshNewer();
    };

    const timer = setInterval(run, 30000);
    const onVisibility = () => {
      if (typeof document !== "undefined" && !document.hidden) run();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [autoRefresh, refreshNewer, selectedSummary]);

  useEffect(() => () => {
    abortQueryRequests();
    detailRequestRef.current?.abort();
  }, []);

  const displayGroups = useMemo(
    () => (grouped ? groupLogEntries(items) : items.map((entry) => ({ entry, count: 1 }))),
    [grouped, items]
  );

  // The backend's tracked decision (fixed / expected / regression ...) is keyed by a hash of the
  // error's normalized shape; compute it for each displayed group so its status can be shown.
  const [sigByRow, setSigByRow] = useState({});
  const sigCacheRef = useRef(new Map());
  const rowKeyOf = (entry, index) => entry.insertId || `${entry.timestamp || "log"}-${index}`;
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next = {};
      for (let i = 0; i < displayGroups.length; i += 1) {
        const entry = displayGroups[i].entry;
        const cacheKey = `${entry.message ?? ""}\u0000${entry.httpPath ?? ""}`;
        if (!sigCacheRef.current.has(cacheKey)) {
          sigCacheRef.current.set(cacheKey, await sha256Hex(normalizeSignature(entry.message, entry.httpPath)));
        }
        next[rowKeyOf(entry, i)] = sigCacheRef.current.get(cacheKey);
      }
      if (!cancelled) setSigByRow(next);
    })();
    return () => { cancelled = true; };
  }, [displayGroups]);

  const listRows = useMemo(() => {
    const keyed = displayGroups.map((group, index) => ({ ...group, rowKey: rowKeyOf(group.entry, index) }));
    const times = items.map((e) => new Date(e.timestamp).getTime()).filter(Number.isFinite);
    return interleaveDeploys(keyed, insights.deploys, times.length ? Math.min(...times) : undefined);
  }, [displayGroups, insights.deploys, items]);

  const moreMenu = {
    items: [
      { key: "known", label: "Known errors", onClick: () => setKnownErrorsOpen(true) },
      { key: "digest", label: "Daily digest", onClick: () => setDigestOpen(true), disabled: environment !== "PRODUCTION" },
      { type: "divider", key: "d" },
      { key: "test", label: sendingTestAlert ? "Sending test alert…" : "Send test alert", onClick: () => handleSendTestAlertRef.current?.() },
    ],
  };

  const applySearch = (event) => {
    event?.preventDefault?.();
    const next = searchInput.trim();
    if (next === search) {
      loadInitial();
    } else {
      setSearch(next);
    }
  };

  const handleSendTestAlert = async () => {
    setSendingTestAlert(true);
    try {
      const result = await sendTestAlert();
      if (!result?.configured) {
        message.warning("Telegram isn't configured yet -- nothing was sent.");
      } else if (result?.delivered) {
        message.success("Test alert sent -- check Telegram.");
      } else {
        message.error("Telegram rejected the test send. Check the backend logs for details.");
      }
    } catch (e) {
      message.error(e?.response?.status === 403
        ? "Super Admin access required."
        : "Could not send the test alert.");
    } finally {
      setSendingTestAlert(false);
    }
  };

  handleSendTestAlertRef.current = handleSendTestAlert;

  // Log -> Issue handoff (Phase 3): pre-fills the tedious parts of a bug report (description,
  // evidence link, environment) from a log entry so filing one doesn't mean retyping what's
  // already right there on screen. issueType/location/severity are left for a human judgment call.
  const handleReportThis = (logEntry) => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (logEntry?.insertId && logEntry?.logName) {
      url.searchParams.set("insertId", logEntry.insertId);
      url.searchParams.set("logName", logEntry.logName);
      url.searchParams.set("env", environment);
    }
    const descriptionLines = [
      "Backend error observed in Logs:",
      logEntry?.message || "",
      logEntry?.httpPath ? `Path: ${logEntry.httpPath}` : null,
      logEntry?.timestamp ? `Time: ${formatTimestamp(logEntry.timestamp)}` : null,
    ].filter(Boolean);
    try {
      window.localStorage.setItem("42tracker_report_draft_v1", JSON.stringify({
        description: descriptionLines.join("\n"),
        evidenceLink: url.toString(),
        environment,
      }));
    } catch {
      // If localStorage is unavailable the report form just opens blank -- not worth blocking on.
    }
    router.push("/tracker");
  };

  return (
    <>
      <Head><title>Logs · 42 Tracker</title></Head>
      <TrackerShell active="logs">
        <div className="tracker-logs-wrap">
          <header className="tracker-page-heading tracker-page-heading--row">
            <div>
              <p className="tracker-eyebrow">42 Logs</p>
              <h1>Logs</h1>
              <p>What the backend is telling us, and what to do about it.</p>
            </div>
            <div className="tracker-logs-live">
              <Button type="primary" icon={<FileTextOutlined />} onClick={() => setReportOpen(true)}>
                Report for Claude
              </Button>
              <LogsDownloadControl
                environment={environment}
                level={level}
                search={search}
                defaultSince={Date.now() - (WINDOW_MS[windowRange] || WINDOW_MS["1H"])}
                defaultUntil={Date.now()}
              />
              <Dropdown menu={moreMenu} trigger={["click"]} overlayClassName="tracker-popover-scope">
                <Button icon={<MoreOutlined />} aria-label="More actions" />
              </Dropdown>
            </div>
          </header>

          <LogHealthStrip
            environment={environment}
            digest={insights.digest}
            deploys={insights.deploys}
            health={insights.health}
            loading={insights.loading}
            onOpenDigest={() => setDigestOpen(true)}
          />

          {newSinceLastVisit > 0 && (
            <Alert
              type="info"
              showIcon
              closable
              onClose={() => setNewSinceLastVisit(0)}
              message={`${newSinceLastVisit} new event${newSinceLastVisit === 1 ? "" : "s"} since your last visit`}
              className="tracker-alert"
            />
          )}

          <section className="tracker-log-controls" aria-label="Log filters">
            <div className="tracker-log-controls__selects">
              <Segmented value={environment} options={ENVIRONMENTS} onChange={setEnvironment} aria-label="Environment" />
              <Select value={windowRange} options={WINDOWS} onChange={setWindowRange} aria-label="Time range" />
              <Select value={level} options={LEVELS} onChange={setLevel} aria-label="Minimum severity" />
            </div>

            <form className="tracker-log-search" onSubmit={applySearch}>
              <Input
                allowClear
                value={searchInput}
                maxLength={200}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search logs, then run query…"
              />
              <Button type="primary" htmlType="submit" disabled={loading}>Run query</Button>
              <Button onClick={() => refreshNewer({ manual: true })} loading={refreshing} disabled={loading}>
                Refresh
              </Button>
            </form>

            <div className="tracker-log-toggles">
              <label><Switch checked={grouped} onChange={setGrouped} size="small" /> Group similar</label>
              <label><Switch checked={autoRefresh} onChange={setAutoRefresh} size="small" /> Auto-refresh 30s</label>
              {backendStartedAt && (
                <span
                  className="tracker-logs-deploy-chip"
                  title={new Date(backendStartedAt).toLocaleString() + " -- from whichever backend pod served this request; with 2 replicas this can differ by refresh, especially mid-rollout"}
                >
                  Pod started {formatUptime(new Date(backendStartedAt).getTime())}
                </span>
              )}
            </div>
          </section>

          <div className={"tracker-log-summary" + (stale ? " tracker-log-summary--stale" : "")}>
            <span><strong>{items.length}</strong> events shown</span>
            {nextPageToken && <span>More available</span>}
            {namespace && <span>{namespace}</span>}
            {lastSuccessAt && <span>Updated {formatFreshness(lastSuccessAt)}</span>}
            {refreshing && <span className="tracker-log-refresh-state">Refreshing…</span>}
            {stale && <Tag color="warning">Stale</Tag>}
          </div>

          {error && (
            <Alert
              type={items.length ? "warning" : "error"}
              showIcon
              message={error}
              description={items.length ? "Showing the last successful results. They may be stale." : undefined}
              className="tracker-alert"
              action={
                <Button size="small" onClick={() => items.length ? refreshNewer({ manual: true }) : loadInitial()}>
                  Retry
                </Button>
              }
            />
          )}

          <section className="tracker-log-list" aria-live="polite" aria-busy={loading}>
            {loading ? (
              <>
                <div className="tracker-log-card"><Skeleton active paragraph={{ rows: 2 }} /></div>
                <div className="tracker-log-card"><Skeleton active paragraph={{ rows: 2 }} /></div>
                <div className="tracker-log-card"><Skeleton active paragraph={{ rows: 2 }} /></div>
              </>
            ) : displayGroups.length ? listRows.map((item, listIndex) => {
              if (item.type === "deploy") {
                return (
                  <div key={"deploy-" + item.deploy.at + "-" + item.deploy.commit} className="tracker-log-deploy-divider" role="separator">
                    <span>
                      Deploy <code>{shortCommit(item.deploy.commit)}</code> · {formatTimestamp(item.deploy.at)}
                      {item.deploy.pods ? ` · ${item.deploy.pods} pod${item.deploy.pods === 1 ? "" : "s"}` : ""}
                    </span>
                  </div>
                );
              }
              const { entry, count, occurrences, rowKey } = item.row;
              const known = insights.knownByHash.get(sigByRow[rowKey]);
              const chip = statusChip(known);
              const distinctUsers = new Set((occurrences || [entry]).map((e) => e.userId).filter(Boolean)).size;
              const severityClass = String(entry.severity || "default").toLowerCase();
              return (
                <article
                  key={rowKey + "-" + listIndex}
                  className={"tracker-log-card tracker-log-card--" + severityClass + (chip?.tone === "danger" ? " tracker-log-card--regression" : "")}
                >
                  <button type="button" className="tracker-log-card__main" onClick={() => openDetail(entry)}>
                    <div className="tracker-log-card__top">
                      <span className={"tracker-log-severity tracker-log-severity--" + severityClass}>
                        {entry.severity || "DEFAULT"}
                      </span>
                      {chip && <span className={"tracker-log-status tracker-log-status--" + chip.tone} title={chip.title}>{chip.label}</span>}
                      <span className="tracker-log-time">{formatTimestamp(entry.timestamp)}</span>
                      {entry.logger && <span className="tracker-log-logger">{entry.logger}</span>}
                      {entry.hasException && <span className="tracker-log-card__stack">Stack</span>}
                      {count > 1 && <Tag color="blue">×{count}</Tag>}
                      {distinctUsers > 1 && <Tag>{distinctUsers} users</Tag>}
                    </div>

                    <div className="tracker-log-card__message">{entry.message}</div>

                    <div className="tracker-log-card__meta">
                      {entry.httpMethod && entry.httpPath && <span>{entry.httpMethod} {entry.httpPath}</span>}
                      {entry.httpStatus && <span>HTTP {entry.httpStatus}</span>}
                      {entry.durationMs && <span>{entry.durationMs} ms</span>}
                      {entry.userId && entry.userId !== "0" && <span className="tracker-log-chip" title="Who hit this">{(entry.userType || "user").toLowerCase()} #{entry.userId}</span>}
                      {entry.collegeId && <span className="tracker-log-chip" title="College">college #{entry.collegeId}</span>}
                      {entry.organizationId && <span className="tracker-log-chip" title="Organization">org #{entry.organizationId}</span>}
                      {entry.commit && entry.commit !== "unknown" && <span className="tracker-log-chip" title={"Release " + entry.commit}>{shortCommit(entry.commit)}</span>}
                      {entry.pod && <span>{entry.pod}</span>}
                      {entry.requestId && <span>req {entry.requestId}</span>}
                    </div>
                  </button>
                  {entry.severity && ["ERROR", "CRITICAL", "ALERT", "EMERGENCY", "WARNING"].includes(String(entry.severity).toUpperCase()) && (
                    <div className="tracker-log-card__actions">
                      <TriageMenu
                        group={{ entry, count, occurrences }}
                        known={known}
                        environment={environment}
                        deploys={insights.deploys}
                        onChanged={insights.reload}
                      />
                    </div>
                  )}
                </article>
              );
            }) : !error ? (
              <div className="tracker-empty">
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={
                  nextPageToken
                    ? "No match in this segment. Continue searching older entries."
                    : "No matching logs in this window."
                } />
              </div>
            ) : null}
          </section>

          {nextPageToken && !error && (
            <div className="tracker-log-load-more">
              <Button loading={loadingOlder} disabled={loading} onClick={loadOlder}>
                {items.length ? "Load older" : "Continue search"}
              </Button>
            </div>
          )}
        </div>

        <TrackerLogDetailsDrawer
          summary={selectedSummary}
          entry={selectedDetail}
          loading={detailLoading}
          error={detailError}
          open={Boolean(selectedSummary)}
          onClose={closeDetail}
          environment={environment}
          onReportThis={handleReportThis}
        />

        <KnownErrorsDrawer
          key={environment} // BE-0062: another environment's errors never show (or get changed) in this one
          open={knownErrorsOpen}
          onClose={() => { setKnownErrorsOpen(false); insights.reloadKnown(); }}
          environment={environment}
        />

        <ClaudeReportModal open={reportOpen} onClose={() => setReportOpen(false)} environment={environment} />
        <LogDigestDrawer open={digestOpen} onClose={() => setDigestOpen(false)} digest={insights.digest} />
      </TrackerShell>
    </>
  );
}

export default function TrackerLogsPage() {
  // null (not false) until the post-mount localStorage check runs -- resolving this synchronously
  // during SSR isn't possible, same reasoning as isManager elsewhere in tracker.
  const [authorized, setAuthorized] = useState(null);

  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    setAuthorized(isTrackerManagerClientHint());
  }, []);

  // The in-memory access token is empty after any reload. Without an Authorization header the
  // backend falls back to the lms_authenticated cookie, which may belong to a real user logged in
  // on the same domain -- that yields 403 (not 401), so the reactive refresh never fires. Mint a
  // token for the logs session before the page makes its first calls.
  useEffect(() => {
    if (!authorized) return;
    if (getAccessToken()) {
      setSessionReady(true);
      return;
    }
    let cancelled = false;
    refreshAccessToken()
      .then(() => { if (!cancelled) setSessionReady(true); })
      .catch(() => {
        if (cancelled) return;
        clearAllTokens();
        try { localStorage.removeItem("userData"); } catch (_) {}
        setAuthorized(false);
      });
    return () => { cancelled = true; };
  }, [authorized]);

  if (authorized && sessionReady) return <TrackerLogsPageContent />;

  return (
    <>
      <Head><title>Logs · 42 Tracker</title></Head>
      <TrackerShell active="logs">
        {authorized === null || authorized ? null : <TrackerLogsAccessGate />}
      </TrackerShell>
    </>
  );
}

TrackerLogsPage.nolayout = true;
