import Head from "next/head";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Button, Collapse, Empty, Input, message, Segmented, Select, Space, Table, Tag, Typography } from "antd";
import { SyncOutlined } from "@ant-design/icons";
import TrackerShell from "@/components/tracker/TrackerShell";
import TrackerLogsAccessGate from "@/components/tracker/TrackerLogsAccessGate";
import AuditFindingDrawer from "@/components/tracker/auditFindings/AuditFindingDrawer";
import { AREAS, KINDS, SEVERITY, SEVERITY_ORDER, STATUS, STATUS_ORDER, istTime } from "@/components/tracker/auditFindings/auditFindingsModel";
import { getAuditFindingsSync, listAuditFindings, syncAuditFindings } from "@/api/Services/AuditFindingsService";
import { isTrackerManagerClientHint } from "@/utils/bugTrackerUtils";
import { clearAllTokens, getAccessToken, refreshAccessToken } from "@/utils/authUtils";

const { Text } = Typography;
const FILTERS_KEY = "42tracker_audit_findings_filters_v1";

const VIEWS = [
  { value: "open", label: "Open" },
  { value: "release", label: "Release blockers" },
  { value: "all", label: "All" },
];

function loadFilters() {
  try { return JSON.parse(window.localStorage.getItem(FILTERS_KEY) || "null"); } catch { return null; }
}
function saveFilters(f) {
  try { window.localStorage.setItem(FILTERS_KEY, JSON.stringify(f)); } catch { /* not remembered: fine */ }
}

function AuditFindingsContent() {
  const [filters, setFilters] = useState({ view: "open", status: [], severity: [], area: [], kind: [], q: "" });
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [syncInfo, setSyncInfo] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [openId, setOpenId] = useState(null);
  const loaded = useRef(false);

  useEffect(() => {
    const saved = loadFilters();
    if (saved) { setFilters((f) => ({ ...f, ...saved })); setQuery(saved.q || ""); }
    loaded.current = true;
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = {
      view: filters.view === "all" ? undefined : filters.view,
      status: filters.status.join(",") || undefined,
      severity: filters.severity.join(",") || undefined,
      area: filters.area.join(",") || undefined,
      kind: filters.kind.join(",") || undefined,
      q: filters.q || undefined,
      page,
      size: 50,
    };
    listAuditFindings(params)
      .then(setData)
      .catch((e) => setError(e?.response?.data?.message || "Couldn't load findings."))
      .finally(() => setLoading(false));
  }, [filters, page]);

  useEffect(() => { if (loaded.current) { saveFilters(filters); load(); } }, [filters, page, load]);
  useEffect(() => { getAuditFindingsSync().then(setSyncInfo).catch(() => {}); }, []);

  const runSync = async () => {
    setSyncing(true);
    try {
      const r = await syncAuditFindings();
      setSyncInfo(r);
      if (r.ran) message.success(r.message || "Synced");
      else message.warning(r.message || "Sync didn't run");
      load();
    } catch (e) {
      message.error(e?.response?.data?.message || "Sync failed.");
    } finally {
      setSyncing(false);
    }
  };

  const set = (patch) => { setPage(0); setFilters((f) => ({ ...f, ...patch })); };
  const counts = data?.counts;

  const columns = [
    { title: "Severity", dataIndex: "severity", width: 100, render: (s) => <Tag color={SEVERITY[s]?.color}>{SEVERITY[s]?.label || s}</Tag> },
    {
      title: "Finding",
      dataIndex: "title",
      render: (t, r) => (
        <div>
          <Text strong>{String(t)}</Text>
          <div><Text type="secondary" style={{ fontSize: 12 }}>{r.id} · {r.area} · {r.kind} · {r.environment}</Text></div>
        </div>
      ),
    },
    { title: "Status", dataIndex: "status", width: 150, render: (s) => <Tag color={STATUS[s]?.color}>{STATUS[s]?.label || s}</Tag> },
    { title: "Assigned", dataIndex: "assignee", width: 130, render: (a) => (a ? String(a) : <Text type="secondary">Nobody</Text>) },
    { title: "Reported", dataIndex: "foundAt", width: 170, render: (d, r) => <div><div>{istTime(d)}</div><Text type="secondary" style={{ fontSize: 12 }}>{String(r.foundBy)}</Text></div> },
  ];

  const problemFiles = syncInfo?.problemFiles || [];

  return (
    <div id="tracker-main-content" style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22 }}>Audit findings</h1>
          <Text type="secondary">
            From {syncInfo?.repo || "42Students/lms-findings"}
            {syncInfo?.lastRunAt ? ` · last synced ${istTime(syncInfo.lastRunAt)}` : ""}
            {syncInfo?.lastResult ? ` · ${syncInfo.lastResult}` : ""}
          </Text>
        </div>
        <Button icon={<SyncOutlined spin={syncing} />} loading={syncing} onClick={runSync}>Sync now</Button>
      </div>

      {syncInfo && syncInfo.configured === false && (
        <Alert type="warning" showIcon message="Sync isn't set up on this server" description="The findings repo's GitHub credentials are missing. Findings already imported still work." />
      )}
      {syncInfo?.lastError && <Alert type="error" showIcon message="The last sync failed" description={String(syncInfo.lastError)} />}

      {counts && (
        <Space wrap size={[8, 8]}>
          {SEVERITY_ORDER.map((s) => (
            <Tag key={s} color={SEVERITY[s].color} style={{ cursor: "pointer", padding: "4px 10px" }} onClick={() => set({ severity: [s], view: "open" })}>
              {SEVERITY[s].label} open: {counts.openBySeverity?.[s] ?? 0}
            </Tag>
          ))}
          <Text type="secondary">·</Text>
          {STATUS_ORDER.filter((s) => (counts.byStatus?.[s] ?? 0) > 0).map((s) => (
            <Tag key={s} style={{ cursor: "pointer" }} onClick={() => set({ status: [s], view: "all" })}>{STATUS[s].label}: {counts.byStatus[s]}</Tag>
          ))}
        </Space>
      )}

      <Space wrap>
        <Segmented options={VIEWS} value={filters.view} onChange={(view) => set({ view })} />
        <Select mode="multiple" allowClear style={{ minWidth: 160 }} placeholder="Status" value={filters.status} onChange={(status) => set({ status })}
          options={STATUS_ORDER.map((s) => ({ value: s, label: STATUS[s].label }))} />
        <Select mode="multiple" allowClear style={{ minWidth: 140 }} placeholder="Severity" value={filters.severity} onChange={(severity) => set({ severity })}
          options={SEVERITY_ORDER.map((s) => ({ value: s, label: SEVERITY[s].label }))} />
        <Select mode="multiple" allowClear style={{ minWidth: 160 }} placeholder="Area" value={filters.area} onChange={(area) => set({ area })}
          options={AREAS.map((a) => ({ value: a, label: a }))} />
        <Select mode="multiple" allowClear style={{ minWidth: 130 }} placeholder="Kind" value={filters.kind} onChange={(kind) => set({ kind })}
          options={KINDS.map((k) => ({ value: k, label: k }))} />
        <Input.Search allowClear style={{ width: 240 }} placeholder="Search title, summary, id, file" value={query}
          onChange={(e) => setQuery(e.target.value)} onSearch={(q) => set({ q: q.trim() })} />
      </Space>

      {error && <Alert type="error" showIcon message={error} />}

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={data?.items || []}
        locale={{ emptyText: <Empty description={filters.view === "release" ? "No open critical or high findings" : "No findings match"} /> }}
        onRow={(r) => ({ onClick: () => setOpenId(r.id), style: { cursor: "pointer" } })}
        pagination={{ current: page + 1, pageSize: 50, total: data?.total || 0, showSizeChanger: false, onChange: (p) => setPage(p - 1),
          showTotal: (t) => `${t} finding${t === 1 ? "" : "s"}` }}
      />

      {problemFiles.length > 0 && (
        <Collapse
          items={[{
            key: "files",
            label: `Files the importer refused or flagged (${problemFiles.length})`,
            children: (
              <Table
                size="small"
                rowKey="path"
                pagination={false}
                dataSource={problemFiles}
                columns={[
                  { title: "File", dataIndex: "path", render: (p) => <Text code>{String(p)}</Text> },
                  { title: "Result", dataIndex: "result", width: 110, render: (r) => <Tag color={r === "REJECTED" ? "orange" : "red"}>{r}</Tag> },
                  { title: "Why", dataIndex: "errors", render: (e) => <Text style={{ whiteSpace: "pre-wrap" }}>{String(e || "")}</Text> },
                  { title: "Checked", dataIndex: "checkedAt", width: 170, render: istTime },
                ]}
              />
            ),
          }]}
        />
      )}

      <AuditFindingDrawer id={openId} open={!!openId} onClose={() => setOpenId(null)} onChanged={load} />
    </div>
  );
}

export default function AuditFindingsPage() {
  // The same access as the logs page: super admins (or the tracker's logs password), checked again by every API call.
  const [authorized, setAuthorized] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => { setAuthorized(isTrackerManagerClientHint()); }, []);

  useEffect(() => {
    if (!authorized) return;
    if (getAccessToken()) { setSessionReady(true); return; }
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

  return (
    <>
      <Head><title>Audit findings · 42 Tracker</title></Head>
      <TrackerShell active="findings">
        {authorized && sessionReady ? <AuditFindingsContent /> : authorized === null || authorized ? null : <TrackerLogsAccessGate />}
      </TrackerShell>
    </>
  );
}
