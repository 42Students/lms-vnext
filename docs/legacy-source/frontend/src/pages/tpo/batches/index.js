import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { dj } from "@/components/tpo/dj";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import Link from "next/link";
import { Alert, Badge, Button, Input, Typography, message } from "antd";
import { FilterOutlined, UndoOutlined } from "@ant-design/icons";
import PageShell from "@/components/Common/PageShell";
import { PanelEmpty, PanelError, StatusBadge } from "@/components/Common/PanelStates";
import { DashboardSkeleton, RefreshStatus } from "@/components/Common/Skeletons";
import ListingPageHeader from "@/components/Global/ListingPageHeader/ListingPageHeader";
import PageStrip from "@/components/tpo/ui/PageStrip";
import FilterPanel, { FilterChips } from "@/components/tpo/filters/FilterPanel";
import useUrlFilters from "@/components/tpo/filters/useUrlFilters";
import { activeCount, applyFilters } from "@/components/tpo/filters/filterModel";
import { STATE, batchFilterDefs, batchYears, isWorkingBatch, journey, nextStep, visibleBatches } from "@/components/tpo/batches/batchRules";
import { appAction } from "@/redux/store";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { getBatches, undoEligibility } from "@/api/Services/BatchesService";
import { withReturnTo } from "@/utils/navigationContext";
import { parsePlacementUtcDateTime } from "@/utils/placementDateTime";

const errorText = (res, fallback) => res?.data?.error || res?.data?.message || res?.message || fallback;
const pct = (part, whole) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

function DecisionBar({ b }) {
  const total = Number(b.students) || 0;
  if (total === 0) return <div className="tpo-batch-card__bar is-empty" aria-hidden="true" />;
  return (
    <div className="tpo-batch-card__bar" role="img"
      aria-label={`${b.eligible} eligible, ${b.ineligible} ineligible, ${b.notDecided} not decided`}>
      <span className="is-eligible" style={{ width: `${pct(b.eligible, total)}%` }} />
      <span className="is-ineligible" style={{ width: `${pct(b.ineligible, total)}%` }} />
    </div>
  );
}

function BatchCard({ b, onOpen, returnTo }) {
  const step = nextStep(b);
  const state = STATE[b.state] || STATE.NOT_STARTED;
  const contextualHref = (href) =>
    String(href || "").startsWith("/tpo/batches/")
      ? withReturnTo(href, returnTo)
      : href;
  const go = () => {
    const href = step.href || `/tpo/batches/${b.batchId}${step.tab ? `?tab=${step.tab}` : ""}`;
    onOpen(contextualHref(href));
  };
  return (
    <article className={`tpo-batch-card is-${String(b.state).toLowerCase()}`} data-testid={`batch-card-${b.batchId}`}>
      <header className="tpo-batch-card__head">
        <div className="tpo-batch-card__title">
          <Link href={contextualHref(`/tpo/batches/${b.batchId}`)}>{b.name}</Link>
          <Typography.Text type="secondary" className="tpo-batch-card__sub">
            {/* A department and program with the same name ("MERN · MERN") are shown once; the years never split over two lines. */}
            {[...new Set([b.department, b.program].filter(Boolean))].join(" · ")}
            {batchYears(b) ? <>{b.department || b.program ? " · " : ""}<span style={{ whiteSpace: "nowrap" }}>{batchYears(b)}</span></> : null}
          </Typography.Text>
        </div>
        <StatusBadge status={state.status} label={state.label} tone={state.tone} />
      </header>
      <div className="tpo-batch-card__decisions">
        <span><strong>{Number(b.students).toLocaleString()}</strong> {Number(b.students) === 1 ? "student" : "students"}</span>
        <span className="is-eligible"><strong>{Number(b.eligible).toLocaleString()}</strong> eligible</span>
        <span className="is-ineligible"><strong>{Number(b.ineligible).toLocaleString()}</strong> ineligible</span>
        <span><strong>{Number(b.notDecided).toLocaleString()}</strong> not decided</span>
      </div>
      <DecisionBar b={b} />
      {/* The line above already says how many are eligible; the journey starts after that. A batch with no students has no journey. */}
      {Number(b.students) > 0 && (
        <ol className="tpo-batch-card__journey" aria-label="Journey">
          {journey(b).filter((s) => s.key !== "eligible").map((s) => (
            <li key={s.key}><strong>{s.value.toLocaleString()}</strong><span>{s.label}</span></li>
          ))}
        </ol>
      )}
      <footer className="tpo-batch-card__foot">
        <Button type={step.key === "view" ? "default" : "primary"} disabled={step.disabled} onClick={go} data-testid={`batch-next-${b.batchId}`}>
          {step.label}
        </Button>
        {b.registrationDeadline && b.state !== "FINISHED" && (
          <Typography.Text type="secondary" className="tpo-batch-card__deadline">
            {/* The deadline comes as the server's date array: new Date() read it as "Invalid Date" (night audit 13 Oct 2026). */}
            Register by {dj(b.registrationDeadline).format("D MMM")}
          </Typography.Text>
        )}
      </footer>
    </article>
  );
}

/** Batches: every batch from Academic Setup, where it is on the journey, and the one thing to do next. */
const batchRank = (b) => (b.state === "FINISHED" ? 3 : b.state === "IN_PLACEMENTS" ? 0 : Number(b.students) > 0 ? 1 : 2);

export default function TpoBatches() {
  const dispatch = useDispatch();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useUrlFilters(batchFilterDefs);
  const [undoing, setUndoing] = useState(false);
  const undoingRef = useRef(false);

  const rawSearch = Array.isArray(router.query?.q) ? router.query.q[0] : router.query?.q;
  const search = typeof rawSearch === "string" ? rawSearch : "";
  const setSearch = useCallback((value) => {
    const next = { ...(router.query || {}) };
    const text = String(value || "");
    if (text) next.q = text;
    else delete next.q;
    router.replace(
      { pathname: router.pathname, query: next },
      undefined,
      { shallow: true, scroll: false }
    );
  }, [router]);

  useEffect(() => { dispatch(appAction.setActiveMenuItem("batches")); }, [dispatch]);
  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetchWithErrorHandling(getBatches());
    setLoading(false);
    if (!res.success) { setError(errorText(res, "Could not load batches")); return; }
    setError(null);
    setData(res.data || { batches: [] });
  }, []);
  useEffect(() => { load(); }, [load]);

  const batches = useMemo(() => data?.batches || [], [data]);
  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return applyFilters(visibleBatches(batches, filters), batchFilterDefs, filters)
      .filter((b) => !q || [b.name, b.department, b.program].some((x) => String(x || "").toLowerCase().includes(q)))
      // What needs the placement cell first: batches in placements, then ones with students still to decide, empty ones, finished last.
      .slice().sort((x, y) => batchRank(x) - batchRank(y) || String(y.endDate || y.name || "").localeCompare(String(x.endDate || x.name || "")));
  }, [batches, filters, search]);
  const working = batches.filter(isWorkingBatch);
  const sum = (k) => working.reduce((t, b) => t + (Number(b[k]) || 0), 0);
  const openCount = working.filter((b) => b.state === "IN_PLACEMENTS").length;
  // The last change's time is a server (UTC) time: "2 hours ago" in the reader's own time.
  const lastActionWhen = data?.lastAction?.at ? parsePlacementUtcDateTime(data.lastAction.at)?.fromNow() || "" : "";
  const finishedCount = batches.length - working.length;
  const outside = Number(data?.outsideBatches?.students) || 0;

  const undo = async () => {
    const actionId = data?.lastAction?.actionId;
    if (!actionId || undoingRef.current) return;
    undoingRef.current = true;
    setUndoing(true);
    try {
      const res = await fetchWithErrorHandling(undoEligibility(actionId));
      if (!res.success) { message.error(errorText(res, "Could not undo")); return; }
      message.success("Undone");
      void load();
    } finally {
      undoingRef.current = false;
      setUndoing(false);
    }
  };

  return (
    <div className="scroll-container tpo-batches" data-testid="tpo.batches">
      <PageShell>
        <ListingPageHeader
          title="Placement eligibility"
          subtitle={<Typography.Text type="secondary">Decide who is in placements, one passing-out batch at a time. New students follow their class.</Typography.Text>}
        />
        {error && !data ? <PanelError title={error} onRetry={load} /> : !data ? <DashboardSkeleton metrics={4} label="Loading placement batches" /> : (
          <>
            {loading && <RefreshStatus label="Refreshing batches…" />}
            {error && (
              <Alert type="warning" showIcon message="Couldn't refresh batches"
                description={error} action={<Button size="small" onClick={load}>Retry</Button>}
                style={{ marginBottom: 12 }} />
            )}
            <PageStrip ariaLabel="Batch numbers" items={[
              { key: "in", label: openCount === 1 ? "batch open for placements" : "batches open for placements", value: openCount, tone: "good" },
              { key: "eligible", label: sum("eligible") === 1 ? "student eligible" : "students eligible", value: sum("eligible") },
              { key: "undecided", label: "not decided yet", value: sum("notDecided"), tone: sum("notDecided") > 0 ? "attention" : undefined },
              { key: "placed", label: "placed", value: sum("placed") },
            ]} />
            {data.lastAction?.actionId && (
              <Alert className="tpo-batches__undo" type="info" showIcon
                message={`Last change${lastActionWhen ? ` ${lastActionWhen}` : ""}: ${data.lastAction.changes} decision${Number(data.lastAction.changes) === 1 ? "" : "s"} by ${data.lastAction.actorName || "someone"}`}
                action={<Button size="small" icon={<UndoOutlined />} loading={undoing} onClick={undo}>Undo</Button>} />
            )}
            {outside > 0 && (
              <Alert className="tpo-batches__outside" type="warning" showIcon
                message={`${outside.toLocaleString()} student${outside === 1 ? " is" : "s are"} not in any class`}
                description="They can't be part of placements until Academic Setup puts them in a class of a batch." />
            )}
            <div className="tpo-batches__toolbar">
              <Input.Search allowClear placeholder="Search batches" value={search} onChange={(e) => setSearch(e.target.value)} className="tpo-batches__search" aria-label="Search batches" />
              <Badge count={activeCount(batchFilterDefs, filters)} size="small">
                <Button icon={<FilterOutlined />} onClick={() => setFiltersOpen(true)}>Filters</Button>
              </Badge>
            </div>
            <FilterChips defs={batchFilterDefs} rows={batches} value={filters} onChange={setFilters} />
            {shown.length === 0 ? (
              <PanelEmpty
                compact
                title={batches.length === 0 ? "No batches yet" : "No batches match this view"}
                description={
                  batches.length === 0
                    ? "Batches come from Academic Setup. Create the academic batch there first."
                    : "Try another search or clear the active batch filters."
                }
                ctaLabel={batches.length === 0 ? undefined : "Clear search and filters"}
                onCta={
                  batches.length === 0
                    ? undefined
                    : () => {
                        setSearch("");
                        setFilters({});
                      }
                }
              />
            ) : (
              <div className="tpo-batches__grid">
                {shown.map((b) => (
                  <BatchCard
                    key={b.batchId}
                    b={b}
                    returnTo={router.asPath}
                    onOpen={(href) => router.push(href)}
                  />
                ))}
              </div>
            )}
            {/* Finished batches, and ones that passed out without ever going into placements, are hidden until asked for. */}
            {finishedCount > 0 && !(filters.state || []).length && (
              <button type="button" className="tpo-batches__finished" onClick={() => setFilters({ ...filters, state: ["IN_PLACEMENTS", "NOT_STARTED", "FINISHED"] })}>
                {finishedCount} older batch{finishedCount === 1 ? " is" : "es are"} hidden · Show them
              </button>
            )}
          </>
        )}
      </PageShell>
      <FilterPanel open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filter batches" defs={batchFilterDefs}
        rows={batches} value={filters} onApply={setFilters} scope={visibleBatches} />
    </div>
  );
}
