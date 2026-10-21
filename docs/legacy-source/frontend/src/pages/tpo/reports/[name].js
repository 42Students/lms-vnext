import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { deleteFilters, listSavedFilters, saveFilters } from "@/components/tpo/ui/reportFilters";
import { useDebouncedValue } from "@/components/tpo/ui/useDebouncedValue";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import { Alert, AutoComplete, Button, Card, Empty, Input, Modal, Select, Space, Table, Typography, message } from "antd";
import PageShell from "@/components/Common/PageShell";
import { PanelError } from "@/components/Common/PanelStates";
import { DashboardSkeleton, RefreshStatus } from "@/components/Common/Skeletons";
import ListingPageHeader from "@/components/Global/ListingPageHeader/ListingPageHeader";
import { downloadCsv } from "@/components/tpo/tpoFiles";
import { buildAccreditationPreflight } from "@/components/tpo/accreditationPreflight";
import { REPORTS } from "@/components/tpo/reportsMeta";
import { REPORT_VIEWS, chartBars, tableColumns } from "@/components/tpo/reportViews";
import useChoices from "@/hooks/useChoices";
import { appAction } from "@/redux/store";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import TpoDataTable from "@/components/tpo/TpoDataTable";
import { getBatches } from "@/api/Services/BatchesService";
import { getReport } from "@/api/Services/TpoHubService";
import { CompressOutlined, ExpandOutlined } from "@ant-design/icons";

const TITLES = { outcomeName: "After college", outcomeLabel: "Your label", outcomeDetail: "Detail", batchName: "Batch" };
const pretty = (k) => TITLES[k] || k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
/** Internal ids (learnerId, jobId...) mean nothing to a reader; they stay in the data, not on screen or in the export. */
const isInternalKey = (k) => k === "id" || /Id$/.test(k);

/** One report (TPO V1 - Locked.docx §8): filters, a table and one chart, unique students placed and total offers side by side, Excel export. */
export default function TpoReport() {
  const dispatch = useDispatch();
  const router = useRouter();
  const name = router.query.name;
  const meta = REPORTS[name];
  const view = REPORT_VIEWS[name];
  const shared = useChoices();
  const [f, setF] = useState({ batchId: null, branch: "", company: "", mode: null, category: null });
  const [batches, setBatches] = useState([]); // Academic Setup batches: reports per batch
  const [batchesError, setBatchesError] = useState(null);
  const [batchesLoading, setBatchesLoading] = useState(true);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [presentation, setPresentation] = useState(false);
  const [saved, setSaved] = useState([]);
  const [saveName, setSaveName] = useState("");
  const [saving, setSaving] = useState(false);
  // BE-0038: each load is numbered and only the newest one's answer is shown. A single-flight guard used to drop the
  // load for new filters while an older one was running, and the older answer then stood under the new filters.
  const loadSeqRef = useRef(0);
  // Branch and company were free-text boxes: a typo silently gave an empty report. They now suggest the names
  // this college actually has (collected from every report row seen), and still accept typing.
  const [known, setKnown] = useState({ branch: new Set(), company: new Set() });
  // Typing in a filter box used to fire one request per character.
  const debouncedF = useDebouncedValue(f, 350);

  useEffect(() => { dispatch(appAction.setActiveMenuItem("reports")); }, [dispatch]);
  useEffect(() => { if (name) setSaved(listSavedFilters(name)); }, [name]);
  const loadBatches = useCallback(async () => {
    setBatchesLoading(true);
    const r = await fetchWithErrorHandling(getBatches());
    setBatchesLoading(false);
    if (!r.success || !Array.isArray(r.data?.batches)) {
      setBatchesError(r?.data?.message || r?.data?.error || "Could not load batches");
      return;
    }
    setBatchesError(null);
    setBatches(r.data.batches);
  }, []);
  useEffect(() => { loadBatches(); }, [loadBatches]);

  // Presentation view fills the screen for a review room; Esc (which also leaves browser fullscreen) brings the page back.
  const togglePresentation = () => {
    const next = !presentation;
    setPresentation(next);
    try {
      if (next) document.documentElement.requestFullscreen?.();
      else if (document.fullscreenElement) document.exitFullscreen?.();
    } catch (_) { /* fullscreen is a nicety, never required */ }
  };
  useEffect(() => {
    const onChange = () => { if (!document.fullscreenElement) setPresentation(false); };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  const load = useCallback(async () => {
    if (!name || !meta) return;
    const seq = ++loadSeqRef.current;
    setLoading(true);
    try {
      const params = { ...Object.fromEntries(Object.entries(debouncedF).filter(([, v]) => v)) };
      const res = await fetchWithErrorHandling(getReport(name, params));
      if (seq !== loadSeqRef.current) return;
      if (!res.success) {
        const text = res.userMessage || "Could not load the report";
        setError(text);
        return;
      }
      setError(null);
      const nextData = res.data && typeof res.data === "object" ? res.data : {};
      setData(nextData);
      const rs = Array.isArray(nextData?.rows)
        ? nextData.rows.filter((row) => row && typeof row === "object")
        : [];
      setKnown((k) => {
        const branch = new Set(k.branch); const company = new Set(k.company);
        rs.forEach((r) => Object.entries(r).forEach(([key, v]) => {
          if (typeof v !== "string" || !v.trim()) return;
          if (/^(branch|department)$/i.test(key)) branch.add(v.trim());
          if (/^company(Name)?$/i.test(key)) company.add(v.trim());
        }));
        return { branch, company };
      });
    } finally {
      if (seq === loadSeqRef.current) setLoading(false);
    }
  }, [name, meta, debouncedF]);
  useEffect(() => { load(); }, [load]);

  const rows = useMemo(() => {
    const safeRows = Array.isArray(data?.rows) ? data.rows.filter((row) => row && typeof row === "object") : [];
    return view?.order ? view.order(safeRows) : safeRows;
  }, [data, view]);
  const reportRows = useMemo(() => rows.map((r, i) => ({ ...r, _k: i })), [rows]);
  // Each report's own columns, in words (reportViews); a report without one falls back to its data's keys.
  const columns = useMemo(() => (view ? tableColumns(view)
    : rows[0] ? Object.keys(rows[0]).filter((k) => !isInternalKey(k)).map((k) => ({ title: pretty(k), dataIndex: k, key: k, align: typeof rows[0][k] === "number" ? "right" : undefined, render: (v) => (v == null || v === "" ? "-" : String(v)) })) : []), [rows, view]);
  const bars = useMemo(() => chartBars(view, data), [view, data]);
  const barMax = Math.max(1, ...bars.map((b) => b.value));
  const has = (filter) => (view ? view.filters.includes(filter) : true);
  // Branches: the college's own list (one source), plus any seen in the report rows.
  const branchOptions = useMemo(() => [...new Set([...(shared.branches || []).map((o) => String(o.value)), ...known.branch])].sort(), [shared.branches, known.branch]);
  const s = data?.stats || {};

  // The header's export writes every row, in the report's own columns and words (the table's own export writes what is shown).
  const doExport = () => downloadCsv(name, columns.map((c) => ({ title: c.title, value: (r) => (c.exportValue ? c.exportValue(r) : r[c.dataIndex]) })), rows);
  // Compliance Preflight: for the accreditation export specifically, check completeness against
  // what NAAC/NIRF actually need before the file goes out - the rest of the reports have no such
  // external compliance stakes, so they keep their plain one-click export.
  const exportAccreditation = () => {
    const preflight = buildAccreditationPreflight(rows);
    if (preflight.incompleteCount === 0) { doExport(); return; }
    Modal.confirm({
      title: `${preflight.incompleteCount} of ${preflight.total} students are missing data NAAC/NIRF ask for`,
      content: (
        <Space direction="vertical" size={4}>
          {preflight.missingByField.map((m) => <Typography.Text key={m.label}>{m.label}: missing for {m.count}</Typography.Text>)}
          <Typography.Text type="secondary">You can still export - missing values export as blank cells.</Typography.Text>
        </Space>
      ),
      okText: "Export anyway",
      onOk: doExport,
    });
  };

  if (!meta) return <div className="scroll-container tpo-report-detail"><PageShell><div className="tpo-report-detail__unknown"><Empty description="Unknown report" /></div></PageShell></div>;
  if (error && !data) return <div className="scroll-container tpo-report-detail"><PageShell><PanelError title={error} onRetry={load} /></PageShell></div>;
  if (loading && !data) return <div className="scroll-container tpo-report-detail"><PageShell><Card className="tpo-report-detail__loading"><DashboardSkeleton metrics={4} label="Loading placement report" /></Card></PageShell></div>;
  return (
    <div className={`scroll-container tpo-report-detail ${presentation ? "tpo-report-detail--presentation" : ""}`} data-testid="tpo.report">
      <PageShell>
        <ListingPageHeader className="tpo-report-detail__header" title={meta.title} subtitle={<Typography.Text type="secondary">{meta.help}</Typography.Text>}
          rightContent={<Space wrap className="tpo-report-detail__header-actions"><Button icon={presentation ? <CompressOutlined /> : <ExpandOutlined />} onClick={togglePresentation}>{presentation ? "Exit presentation" : "Presentation view"}</Button><Button onClick={() => router.push("/tpo/reports")}>All reports</Button>
            {/* This downloads a genuine .csv (see tpoFiles.downloadCsv) - it was previously
                labelled "Export to Excel" / "Export for NAAC / NIRF", which overclaims both the
                format and (for accreditation) a validated official template that doesn't exist. */}
            {/* One export: the table's (Excel or CSV). Accreditation keeps its own, with the completeness check NAAC/NIRF need. */}
            {name === "accreditation" && <Button type="primary" disabled={rows.length === 0} onClick={exportAccreditation}>Export CSV for NAAC / NIRF</Button>}
            {name === "unplaced" && <Button type="primary" data-testid="report.act-on-students"
              onClick={() => router.push(`/tpo/students?f_journey=GAP_NOT_APPLYING,GAP_UNPLACED${f.batchId ? `&f_batch=${f.batchId}` : ""}${f.branch ? `&f_branch=${encodeURIComponent(f.branch)}` : ""}`)}>Act on them on Students</Button>}</Space>} />
        {loading && data ? <RefreshStatus label="Refreshing report…" /> : null}
        {error && <Alert className="tpo-report-detail__stale-alert" type="error" showIcon closable message="This refresh failed. Showing the last successful report." description={error} action={<Button size="small" onClick={load}>Retry</Button>} />}
        {/* The college's numbers, once and quietly (students placed and offers side by side, as the locked spec asks), not four boxes on every report. */}
        <Typography.Paragraph type="secondary" className="tpo-report-detail__context" data-testid="report.context">
          For the filters below: <b>{s.placedUnique ?? "-"}</b> students placed · <b>{s.offers ?? "-"}</b> offers ·{" "}
          {Number(s.registered) === 0 ? "no placement rate yet (nobody has registered)" : <><b>{s.placedPct != null ? `${s.placedPct}%` : "-"}</b> placement rate</>} · <b>{s.acceptedUnique ?? "-"}</b> accepted
        </Typography.Paragraph>
        {batchesError && has("batch") && (
          <Alert className="tpo-report-detail__info" type="warning" showIcon
            message="Batch filter unavailable"
            description="The report itself is loaded, but batch choices could not be verified. Batch filtering is disabled until you retry."
            action={<Button size="small" onClick={loadBatches}>Retry batches</Button>} />
        )}
        {(view ? view.filters.length > 0 : true) && (
          <Card className="tpo-report-detail__filters is-one-row" size="small">
          <div className="tpo-report-detail__saved" role="group" aria-label="Saved filters">
            <Select allowClear placeholder="Saved filters" style={{ width: 220 }} value={null} options={saved.map((s) => ({ value: s.name, label: s.name }))}
              onChange={(n) => { const hit = saved.find((s) => s.name === n); if (hit) setF({ batchId: null, branch: "", company: "", mode: null, category: null, ...hit.filters }); }}
              dropdownRender={(menu) => (
                <>
                  {menu}
                  {saved.length > 0 && <div className="tpo-report-detail__saved-manage">{saved.map((s) => (<Button key={s.name} size="small" type="link" danger onClick={() => setSaved(deleteFilters(name, s.name))}>Delete {s.name}</Button>))}</div>}
                </>
              )} />
            {saving ? (
              <Space.Compact>
                <Input autoFocus placeholder="Name, e.g. CSE 2027" value={saveName} onChange={(e) => setSaveName(e.target.value)} onPressEnter={() => { setSaved(saveFilters(name, saveName, f)); setSaving(false); setSaveName(""); }} style={{ width: 200 }} />
                <Button type="primary" disabled={!saveName.trim()} onClick={() => { setSaved(saveFilters(name, saveName, f)); setSaving(false); setSaveName(""); }}>Save</Button>
              </Space.Compact>
            ) : (
              <Button disabled={!Object.values(f).some(Boolean)} onClick={() => setSaving(true)}>Save these filters</Button>
            )}
          </div>
          <div className="tpo-report-detail__filter-grid">
            {has("batch") && <Select allowClear showSearch optionFilterProp="label"
              placeholder={batchesError ? "Batches unavailable" : "Batch"}
              loading={batchesLoading}
              disabled={Boolean(batchesError)}
              value={f.batchId}
              onChange={(v) => setF({ ...f, batchId: v ?? null })}
              options={batches.map((b) => ({ value: b.batchId, label: b.state === "FINISHED" ? `${b.name} (finished)` : b.name }))} aria-label="Batch" />}
            {has("branch") && <Select allowClear showSearch placeholder="Branch" value={f.branch || undefined} onChange={(v) => setF({ ...f, branch: v || "" })}
              options={branchOptions.map((v) => ({ value: v, label: v }))} aria-label="Branch" />}
            {/* Student-level reports (Unplaced, After college) have no company, mode or pay category. */}
            {has("company") && <AutoComplete allowClear placeholder="Company" value={f.company} onChange={(v) => setF({ ...f, company: v || "" })}
              options={[...known.company].sort().map((v) => ({ value: v }))} filterOption={(input, o) => o.value.toLowerCase().includes(input.toLowerCase())} />}
            {has("mode") && <Select allowClear placeholder="Mode" value={f.mode} onChange={(v) => setF({ ...f, mode: v })} options={[{ value: "ON_CAMPUS", label: "On campus" }, { value: "POOL", label: "Pool" }, { value: "OFF_CAMPUS", label: "Off campus" }]} />}
            {has("category") && <Select allowClear placeholder="Pay category" value={f.category} onChange={(v) => setF({ ...f, category: v })} options={[{ value: "REGULAR", label: "Regular" }, { value: "DREAM", label: "Dream" }, { value: "SUPER_DREAM", label: "Super-dream" }]} />}
          </div></Card>
        )}
        {name === "outcomes" && Array.isArray(data?.summary) && (
          <Card className="tpo-report-detail__chart" size="small" title="Students by what they do after college" data-testid="report.outcomes-summary">
            {(() => {
              const summary = data.summary.filter((item) => item && typeof item === "object");
              if (summary.length === 0) {
                return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No outcome data for these filters yet." />;
              }
              const top = Math.max(1, ...summary.map((o) => Number(o.students) || 0));
              const total = summary.reduce((n, o) => n + (Number(o.students) || 0), 0);
              return summary.map((o, index) => (
                <div className="tpo-report-detail__bar-row" key={o.outcome ?? o.outcomeName ?? index} role="group" aria-label={`${o.outcomeName || "Outcome"}: ${Number(o.students) || 0} students`}>
                  <div className="tpo-report-detail__bar-label" title={o.outcomeName || ""}>{o.outcomeName || "Unknown outcome"}</div>
                  <div className="tpo-report-detail__bar-track" aria-hidden="true"><div className="tpo-report-detail__bar-fill" style={{ width: `${((Number(o.students) || 0) / top) * 100}%` }} /></div>
                  <div className="tpo-report-detail__bar-value tpo-report-detail__bar-value--wide">{Number(o.students) || 0}{total ? ` (${Math.round(((Number(o.students) || 0) * 1000) / total) / 10}%)` : ""}</div>
                </div>
              ));
            })()}
          </Card>
        )}
        {view?.needsBatch && !f.batchId && <Alert className="tpo-report-detail__info" type="warning" showIcon message={view.needsBatch} />}
        {/* The one chart that answers this report's question (reportViews). A single
            valid bar is still meaningful; zero bars gets an explicit no-data state. */}
        {view?.chart && (
          <Card className="tpo-report-detail__chart" size="small" title={view.chart.title}>
            {bars.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No chart data for these filters yet." />
            ) : bars.map((b, index) => (
              <div className="tpo-report-detail__bar-row" key={`${b.label}-${index}`} role="group" aria-label={`${String(b.label)}: ${b.value}${view.chart.suffix || ""}`}>
                <div className="tpo-report-detail__bar-label" title={String(b.label)}>{String(b.label)}</div>
                <div className="tpo-report-detail__bar-track" aria-hidden="true"><div className="tpo-report-detail__bar-fill" style={{ width: `${(b.value / barMax) * 100}%` }} /></div>
                <div className="tpo-report-detail__bar-value">{b.value}{view.chart.suffix || ""}</div>
              </div>
            ))}
          </Card>
        )}
        <Card className="tpo-report-detail__table-card"><TpoDataTable testid="report-rows" data={reportRows} rowKey="_k" columns={columns} loading={loading} exportName={`report-${name}`}
          searchOf={(r) => Object.values(r).join(" ")} emptyTitle="No data for these filters" emptySubtitle="Try a wider filter, or a different report." height="70vh" /></Card>
        {view?.note && <Alert className="tpo-report-detail__info" type="info" showIcon message={view.note} />}
      </PageShell>
    </div>
  );
}
