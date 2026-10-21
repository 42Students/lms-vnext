import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import { Alert, Button, Card, DatePicker, Space, Tag, Typography } from "antd";
import { dj } from "@/components/tpo/dj";
import { actionText, label } from "@/components/tpo/ui/labels";
import PageShell from "@/components/Common/PageShell";
import { PanelError } from "@/components/Common/PanelStates";
import ListingPageHeader from "@/components/Global/ListingPageHeader/ListingPageHeader";
import TpoDataTable from "@/components/tpo/TpoDataTable";
import useUrlFilters from "@/components/tpo/filters/useUrlFilters";
import { appAction } from "@/redux/store";
import { getAuditLog } from "@/api/Services/TpoHubService";

/** Where an audited thing lives, for the ones that have a page. */
const LINKS = { DRIVE: (id) => `/tpo/drives/${id}`, RECRUITER_LEAD: (id) => `/tpo/recruiters/${id}`, STUDENT: (id) => `/tpo/students?student=${id}` };
const ENTITIES = [["DRIVE", "Drives"], ["RECRUITER_LEAD", "Recruiters"], ["STUDENT", "Students"], ["OFFER", "Offers"], ["ROUND", "Rounds"], ["SHARE", "Shares and downloads"], ["SETTINGS", "Settings"], ["BULK", "Bulk actions"], ["GENERAL", "General"]];
const WHEN = [["TODAY", "Today"], ["WEEK", "Last 7 days"], ["MONTH", "Last 30 days"], ["OLDER", "Older"]];
const whenOf = (r) => { const d = dj(r.createdAt); if (d.isAfter(dj().startOf("day"))) return "TODAY"; if (d.isAfter(dj().subtract(7, "day"))) return "WEEK"; if (d.isAfter(dj().subtract(30, "day"))) return "MONTH"; return "OLDER"; };
/** The audit filter side panel: what it was about, what happened, who did it, and when. */
const AUDIT_DEFS = [
  { key: "about", label: "About", type: "checklist", get: (r) => r.entityType || "GENERAL", options: ENTITIES.map(([value, label]) => ({ value, label })) },
  { key: "event", label: "What happened", type: "checklist", get: (r) => actionText(r.action) },
  { key: "who", label: "Who", type: "checklist", get: (r) => r.actorName || label("actor", r.actorType) },
  { key: "when", label: "When", type: "checklist", get: whenOf, options: WHEN.map(([value, l]) => ({ value, label: l })) },
];

/** Audit log: everything logs itself (TPO V1 - Locked.docx §1 and §11). Who did what, and when, across drives, recruiter leads, students, shares and settings. */
export default function TpoAudit() {
  const dispatch = useDispatch();
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useUrlFilters(AUDIT_DEFS);
  const setEntity = (e) => setFilters({ about: [e] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // A date range loads everything in it (up to 5000 events): an audit of "September" is complete, not the latest 500.
  const [range, setRange] = useState(null);
  useEffect(() => { dispatch(appAction.setActiveMenuItem("audit")); }, [dispatch]);
  // Previously had no error handling at all - a failure just silently showed "Nothing logged yet".
  const [rangeTotal, setRangeTotal] = useState(null);
  const load = useCallback(() => {
    setLoading(true);
    const params = range?.[0] && range?.[1] ? { limit: 5000, from: range[0].format("YYYY-MM-DD"), to: range[1].format("YYYY-MM-DD") } : { limit: 500 };
    // BE-0034: read the response itself (headers included): X-Total-Count says how many events the range really has.
    getAuditLog(params).then((res) => {
      setLoading(false);
      const body = res?.data?.data ?? res?.data;
      setError(null);
      setRows(Array.isArray(body) ? body : []);
      const total = Number(res?.headers?.["x-total-count"]);
      setRangeTotal(Number.isFinite(total) ? total : null);
    }).catch((e) => {
      setLoading(false);
      setError(e?.response?.data?.message || e?.response?.data?.error || "Could not load the audit log");
    });
  }, [range]);
  useEffect(() => { load(); }, [load]);

  const summary = useMemo(() => {
    const entityCounts = rows.reduce((acc, r) => {
      const key = r.entityType || "GENERAL";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const entityMix = Object.entries(entityCounts).sort((a, b) => b[1] - a[1]).slice(0, 7);
    return {
      total: rows.length,
      actors: new Set(rows.map((r) => `${r.actorType || ""}:${r.actorId || ""}`)).size,
      latest: rows.length ? rows.reduce((latest, r) => !latest || dj(r.createdAt).isAfter(dj(latest)) ? r.createdAt : latest, null) : null,
      shares: entityCounts.SHARE || 0,
      settings: entityCounts.SETTINGS || 0,
      entityMix,
      maxEntity: Math.max(...entityMix.map(([, count]) => count), 1),
    };
  }, [rows]);

  return (
    <div className="scroll-container tpo-audit" data-testid="tpo.audit">
      <PageShell>
        <ListingPageHeader
          className="tpo-audit__header"
          title="Audit log"
          subtitle={<Typography.Text type="secondary">A traceable history of placement decisions, changes, sharing and access across the workspace.</Typography.Text>}
        />

        {error && rows.length === 0 ? <PanelError title={error} onRetry={load} /> : (
          <>
            {/* Quick looks, as links like the other pages: each is the About filter, highlighted while it is the only one; a second click clears it.
                (The "latest" box repeated the first row.) */}
            <div className="tpo-journey__extras tpo-drives__work" role="group" aria-label="Quick looks" data-testid="audit.quick">
              <span className="tpo-drives__work-label">{summary.total} recent events. Look at:</span>
              {summary.entityMix.map(([key, n]) => {
                const on = Object.keys(filters).length === 1 && (filters.about || []).length === 1 && filters.about[0] === key;
                return (
                  <button type="button" key={key} className={`tpo-journey__extra${on ? " is-on" : ""}`} aria-pressed={on}
                    onClick={() => (on ? setFilters({}) : setEntity(key))} data-testid={`audit.quick.${key}`}>
                    {(ENTITIES.find(([k]) => k === key) || [null, key])[1]} · <strong>{n}</strong>
                  </button>
                );
              })}
            </div>

            <Card className="tpo-audit__workspace">
              <div className="tpo-audit__workspace-head">
                <Space wrap>
                  <DatePicker.RangePicker value={range} onChange={setRange} format="D MMM YYYY" allowClear placeholder={["From", "To"]} aria-label="Dates" />
                  <Typography.Text type="secondary">
                    {range?.[0] && range?.[1]
                      ? (rangeTotal != null && rangeTotal > rows.length
                        ? `Showing the newest ${rows.length} of ${rangeTotal} events from ${range[0].format("D MMM YYYY")} to ${range[1].format("D MMM YYYY")}. Pick fewer days to see (and export) them all.`
                        : `Everything from ${range[0].format("D MMM YYYY")} to ${range[1].format("D MMM YYYY")}${rows.length >= 5000 && rangeTotal == null ? " (the first 5000: pick fewer days)" : ""}.`)
                      : `The latest ${rows.length >= 500 ? "500 " : ""}events. Pick dates to see everything in a period.`}
                  </Typography.Text>
                </Space>

              </div>

              {error && <Alert className="tpo-audit__stale-alert" type="error" showIcon closable message="This refresh failed. Showing the last successful load." description={error} action={<Button size="small" onClick={load}>Retry</Button>} />}

              <div className="tpo-audit__table">
                <TpoDataTable
                  data={rows}
                  rowKey="id"
                  loading={loading}
                  exportName="audit-log"
                  filterDefs={AUDIT_DEFS} filterState={filters} onFilterChange={setFilters} filterTitle="Filter the audit log"
                  searchOf={(r) => `${r.action} ${r.detail} ${r.entityType} ${r.actorName || ""} ${r.actorType}`}
                  emptyTitle="Nothing logged yet"
                  emptySubtitle="Every drive, decision and setting change your team makes shows up here."
                  columns={[
                    {
                      title: "Event",
                      key: "event",
                      exportValue: (r) => actionText(r.action),
                      render: (_, r) => (
                        <div className="tpo-audit__event">
                          <span>{actionText(r.action)}</span>
                          {/* What it was about, on every screen (Detail used to be a column hidden on phones), and a way to open it. */}
                          {r.detail && <Typography.Text type="secondary" className="tpo-audit__detail">{r.detail}</Typography.Text>}
                          {r.entityType && LINKS[r.entityType] && r.entityId
                            ? <a className="tpo-audit__open" onClick={() => router.push(LINKS[r.entityType](r.entityId))}>Open {String(r.entityType).replace(/_/g, " ").toLowerCase()}</a>
                            : r.entityType ? <Tag>{String(r.entityType).replace(/_/g, " ").toLowerCase()}</Tag> : <Typography.Text type="secondary">General</Typography.Text>}
                        </div>
                      ),
                    },
                    // In an export: what it was about and the detail, each in its own column (it was one cell of codes).
                    { title: "About", key: "about", defaultHidden: true, exportAlways: true, exportValue: (r) => (ENTITIES.find(([k]) => k === (r.entityType || "GENERAL")) || [null, r.entityType])[1] },
                    { title: "Detail", dataIndex: "detail", key: "detail", defaultHidden: true, exportAlways: true },
                    {
                      title: "Actor",
                      key: "who",
                      responsive: ["sm"],
                      render: (_, r) => <span className="tpo-audit__actor">{r.actorName || label("actor", r.actorType || "SYSTEM")}</span>,
                      exportValue: (r) => r.actorName || label("actor", r.actorType || "SYSTEM"),
                    },
                    {
                      title: "When",
                      dataIndex: "createdAt",
                      sortable: true,
                      key: "createdAt",
                      render: (v) => <div className="tpo-audit__when"><strong>{dj(v).format("D MMM YYYY")}</strong><span>{dj(v).format("h:mm A")}</span></div>,
                      exportValue: (r) => r.createdAt,
                    },
                  ]}
                />
              </div>
            </Card>
          </>
        )}
      </PageShell>
    </div>
  );
}
