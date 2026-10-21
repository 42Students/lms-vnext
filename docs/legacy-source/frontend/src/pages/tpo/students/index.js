import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { choiceEditor } from "@/components/tpo/grid/ChoiceEditor";
import HeaderFilter from "@/components/tpo/grid/HeaderFilter";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import { Alert, Button, Empty, Input, Skeleton, Tag, Tooltip, Typography, message } from "antd";
import { ThunderboltOutlined } from "@ant-design/icons";
import StudentActions from "@/components/tpo/students/StudentActions";
import StudentsTop from "@/components/tpo/students/StudentsTop";
import { activeCount } from "@/components/tpo/filters/filterModel";
import PageShell from "@/components/Common/PageShell";
import { PanelError } from "@/components/Common/PanelStates";
import ListingPageHeader from "@/components/Global/ListingPageHeader/ListingPageHeader";
import useBulkAction from "@/components/tpo/bulk/BulkAction";
import ImportPreviewModal from "@/components/tpo/ImportPreviewModal";
import StudentPanel from "@/components/tpo/StudentPanel";
import AddToDriveModal from "@/components/tpo/AddToDriveModal";
import GridWorkspace from "@/components/tpo/grid/GridWorkspace";
import useUrlFilters from "@/components/tpo/filters/useUrlFilters";
import { bestText, outcomeColor } from "@/components/tpo/ui/journeyRules";
import {
  PROFILE, STAGE, finishedTag, studentFilterDefs, workingSet,
} from "@/components/tpo/students/studentGridRules";
import { fullName } from "@/components/tpo/tpoFiles";
import { academicColumns, sortOnly } from "@/components/tpo/students/academics";
import useChoices from "@/hooks/useChoices";
import { OUTCOME_DETAIL_HINT } from "@/config/choices";
import { ASKS_DETAIL, OutcomePill, REGISTRATION, outcomeNote, registrationOptions as buildRegistrationOptions, registrationValue } from "@/components/tpo/students/outcomes";
import { appAction } from "@/redux/store";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { commitAcademicImport, getStudentsTable, previewAcademicImport, registerStudent } from "@/api/Services/TpoHubService";
import AsyncModal from "@/components/tpo/ui/AsyncModal";

const errorText = (res, fallback) => res?.data?.message || res?.data?.error || res?.message || fallback;

function NameCell({ data, context }) {
  if (!data) return null;
  return (
    <button type="button" className="tpo-students__student-link" onClick={() => context.open(data.learnerId)}>
      <span className="tpo-students__student-name">{fullName(data) || `#${data.learnerId}`}</span>
    </button>
  );
}
function BatchCell({ data }) {
  if (!data) return null;
  const tag = finishedTag(data);
  return <span>{data.programName ? `${data.programName} · ` : ""}{data.batchName || "-"}{tag && <Tag color="purple" bordered={false} style={{ marginInlineStart: 6 }}>{tag}</Tag>}</span>;
}
const tagCell = (map) => function TagCell({ value }) {
  const v = map[value];
  if (!v) return value || "-";
  const [label, color] = Array.isArray(v) ? v : [v.label, v.color];
  return <Tag color={color} bordered={false} className="tpo-students__status-pill">{label}</Tag>;
};
/** The final outcome (NAAC/NIRF list): the college's own label when there is one, the detail on hover. */
function OutcomeCell({ data }) {
  return <OutcomePill row={data} className="tpo-students__status-pill" />;
}
function BestCell({ data }) {
  if (!data) return null;
  if (!data.best) return <Typography.Text type="secondary">Not applied yet</Typography.Text>;
  return (
    <Tooltip title={(data.journey || []).map((e) => `${e.company}: ${e.label}`).join(" · ")}>
      <span className="tpo-students__journey">
        <Tag color={outcomeColor(data.best.outcome)} bordered={false}>{data.best.label}</Tag>
        <span className="tpo-students__journey-company">{data.best.company}{(data.journey || []).length > 1 ? ` +${data.journey.length - 1}` : ""}</span>
      </span>
    </Tooltip>
  );
}

/**
 * Students: the placement cell's working set - only students made Eligible on the Batches page. At the top, who you are looking at
 * (Batch by program, Department) and their journey with the work between each step; the sheet with selectors in the list-type
 * headings (marks are filtered in the panel and only exported); an always-visible bar to act on the view or the selection, and one
 * Actions window (docs/tpo-ux/STUDENTS-ACTIONS-PLAN-2026-10-05.md).
 */
// What usually comes next for a gap or a link at the top: offered in the act bar ("Suggested: ... Do it"), never forced.
const SUGGESTED = {
  GAP_NOT_REGISTERED: { action: "message", message: "register", text: "message them to register" },
  GAP_NOT_VERIFIED: { action: "verify", text: "verify what they submitted" },
  GAP_NOT_APPLYING: { action: "add", text: "add them to a drive" },
  GAP_UNPLACED: { action: "add", text: "add them to another drive" },
  NO_RESUME: { action: "message", message: "resume", text: "ask them to upload a resume" },
  OFFER_WAITING: { action: "message", message: "offer", text: "remind them to answer the offer" },
  DEBARRED: { action: "lift", text: "lift the debarment" },
};
// A link at the top is a plain filter underneath; these say which, so the strip shows it picked and a second click clears it.
const LINK_FILTER = { NO_RESUME: ["resume", "no"], OFFER_WAITING: ["offerWaiting", "yes"], DEBARRED: ["outcome", ["DEBARRED"]] };
const STRIP_KEYS = ["journey", "resume", "offerWaiting"];
/** The step, gap or link picked at the top, read from the filters (so a saved view or a shared link shows it too). */
const stripPicked = (f) => {
  if ((f.journey || []).length === 1) return f.journey[0];
  return Object.keys(LINK_FILTER).find((k) => JSON.stringify(f[LINK_FILTER[k][0]]) === JSON.stringify(LINK_FILTER[k][1])) || null;
};
export default function TpoStudents() {
  const dispatch = useDispatch();
  const router = useRouter();
  const handle = useRef(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [addTo, setAddTo] = useState(null); // { selected, clear }
  const [panel, setPanel] = useState(null); // learnerId
  const [importing, setImporting] = useState(false);
  const [acting, setActing] = useState(null); // { audience, selected, initial, clear }
  const registrationBusyRef = useRef(false);
  const [registrationBusy, setRegistrationBusy] = useState(false);

  useEffect(() => { dispatch(appAction.setActiveMenuItem("students")); }, [dispatch]);
  const load = useCallback(async () => {
    const res = await fetchWithErrorHandling(getStudentsTable());
    if (!res.success) { setError(errorText(res, "Could not load students")); return; }
    setError(null);
    setData(res.data || { students: [], counts: {} });
  }, []);
  useEffect(() => { load(); }, [load]);

  const all = useMemo(() => data?.students || [], [data]);
  const defs = useMemo(() => studentFilterDefs(all), [all]);
  const [filters, setFilters] = useUrlFilters(defs);
  const working = useMemo(() => workingSet(all, {}), [all]);
  const scoped = useMemo(() => workingSet(all, filters), [all, filters]);

  // A student picked in the command palette arrives as ?student=<id>: open their panel once the list is in.
  useEffect(() => {
    const wanted = typeof router.query.student === "string" ? Number(router.query.student) : null;
    if (wanted && all.some((s) => Number(s.learnerId) === wanted)) setPanel(wanted);
  }, [router.query.student, all]);

  const picked = stripPicked(filters);
  // Other filters that narrow the list below the strip (the strip follows Batch and Department only).
  const narrowedBy = activeCount(defs.filter((d) => !["batch", "program", "branch", "class", "journey"].includes(d.key)
    && !(picked && LINK_FILTER[picked] && LINK_FILTER[picked][0] === d.key)), filters);

  // The journey strip shows how many have not registered. What it cannot show: registration opens per batch, so students whose
  // batch was never invited cannot register however often they are messaged. Only that is said here.
  const notInvited = useMemo(() => working.filter((s) => s.status === "NOT_REGISTERED" && s.stage === "ELIGIBLE").length, [working]);

  // Registration choices plus the college's own labels under them (Settings > After college).
  const { outcomeLabels } = useChoices();
  const registrationOptions = useMemo(() => buildRegistrationOptions(outcomeLabels), [outcomeLabels]);
  const columns = useMemo(() => sortOnly([
    { field: "name", colId: "name", headerName: "Student", pinned: "left", minWidth: 180, flex: 1.3, lockVisible: true, cellRenderer: NameCell,
      valueGetter: (p) => fullName(p.data), filter: "agTextColumnFilter" },
    { field: "rollNumber", headerName: "Roll no.", width: 130, sortable: true, filter: "agTextColumnFilter" },
    // Batch and Branch say which batch a row is when several are shown; with one picked at the top they would repeat it, so they
    // hide. An export always keeps them.
    { field: "batchName", headerName: "Batch", minWidth: 170, flex: 1, cellRenderer: BatchCell, hide: (filters.batch || []).length === 1,
      context: { exportAlways: true, exportValue: (r) => [r.programName, r.batchName].filter(Boolean).join(" · ") } },
    { field: "className", headerName: "Class", width: 120, hide: true, headerComponent: HeaderFilter, headerComponentParams: { filterKey: "class" } },
    { field: "branch", headerName: "Branch", width: 115, hide: (filters.branch || []).length === 1, context: { exportAlways: true } },
    { field: "stage", headerName: "Stage", width: 130, cellRenderer: tagCell(STAGE), filter: false, context: { exportValue: (r) => STAGE[r.stage]?.label || r.stage },
      headerComponent: HeaderFilter, headerComponentParams: { filterKey: "stage" } },
    {
      // One column for where a student ends up (it used to be Registration and Outcome side by side, saying the same thing).
      // Edited right in the cell, as the placement cell does on a call: Placements, Higher studies, Entrepreneurship,
      // Competitive exams, Not interested, and the college's own labels. Placed and debarred are worked out, not edited.
      colId: "outcome", headerName: "After college", width: 185, filter: false, cellRenderer: OutcomeCell,
      headerComponent: HeaderFilter, headerComponentParams: { filterKey: "outcome" },
      editable: (p) => Boolean(p.data) && !["PLACED", "DEBARRED"].includes(p.data.status),
      valueGetter: (p) => registrationValue(p.data) || "",
      // The college's own labels sit under their outcome ("Family business" under Entrepreneurship): value "OUTCOME|label".
      ...choiceEditor(registrationOptions),
      valueSetter: (p) => { if (p.newValue && p.newValue !== p.oldValue) p.context?.register?.(p.data, p.newValue); return false; },
      cellClass: (p) => (p.data && !["PLACED", "DEBARRED"].includes(p.data.status) ? "is-editable" : ""),
      headerTooltip: "The final outcome NAAC and NIRF count. Click to change it; placed and debarred are worked out.",
      context: { exportValue: (r) => [r.outcomeName, outcomeNote(r)].filter(Boolean).join(": ") },
    },
    { field: "profileStatus", headerName: "Profile", width: 140, cellRenderer: tagCell(PROFILE), filter: false,
      headerComponent: HeaderFilter, headerComponentParams: { filterKey: "profile" }, context: { exportValue: (r) => PROFILE[r.profileStatus]?.[0] || r.profileStatus } },
    ...academicColumns({ exportOnly: true }),
    { colId: "best", headerName: "Best so far", minWidth: 190, flex: 1, cellRenderer: BestCell, valueGetter: (p) => bestText(p.data), filter: false },
    { field: "applications", headerName: "Applications", width: 120, type: "numericColumn", filter: "agNumberColumnFilter" },
    { field: "offers", headerName: "Offers", width: 95, type: "numericColumn", filter: "agNumberColumnFilter" },
    { field: "gender", headerName: "Gender", width: 110, hide: true, headerComponent: HeaderFilter, headerComponentParams: { filterKey: "gender" } },
    { field: "email", headerName: "Email", width: 200, hide: true },
    { field: "phone", headerName: "Phone", width: 130, hide: true },
  ]), [registrationOptions, filters.batch, filters.branch]);

  const saveRegistration = useCallback(async (row, choice, label, detail) => {
    if (registrationBusyRef.current) return false;
    registrationBusyRef.current = true;
    setRegistrationBusy(true);
    try {
      const res = await fetchWithErrorHandling(registerStudent(row.learnerId, choice, label, detail));
      if (!res.success) { message.error(errorText(res, "Could not change the registration")); return false; }
      message.success(`${fullName(row)}: ${label || REGISTRATION[choice]}`);
      void load();
      return true;
    } finally {
      registrationBusyRef.current = false;
      setRegistrationBusy(false);
    }
  }, [load]);
  // Entrepreneurship and Competitive exams ask what exactly first (optional); the rest save straight away.
  const register = useCallback((row, value) => {
    const [choice, label = null] = String(value).split("|");
    if (ASKS_DETAIL.includes(choice)) { setOutcomeAsk({ row, choice, label, detail: row.registration === choice ? row.outcomeDetail || "" : "" }); return; }
    saveRegistration(row, choice, label, null);
  }, [saveRegistration]);
  const gridContext = useMemo(() => ({ open: setPanel, register }), [register]);
  const shownIds = () => (handle.current?.shownRows?.() || all).map((r) => r.learnerId);
  const [startBulk, bulkElement] = useBulkAction();
  const [outcomeAsk, setOutcomeAsk] = useState(null); // { row, choice, label, detail }

  // A step, gap or link at the top: one click filters to it (the strip's earlier pick is replaced), a second click clears it.
  // It never opens a window: the act bar offers what usually comes next.
  const pickStrip = (key) => {
    const next = { ...filters };
    STRIP_KEYS.forEach((k) => delete next[k]);
    if (picked === "DEBARRED") delete next.outcome;
    if (key !== "ALL" && key !== picked) {
      if (LINK_FILTER[key]) next[LINK_FILTER[key][0]] = LINK_FILTER[key][1];
      else next.journey = [key];
    }
    setFilters(next);
  };

  // Always there: act on all the view shows, or on the ones ticked; after a gap or a link, the usual next step is offered.
  const act = (shown, selected, clear) => {
    const audience = selected.length ? selected : shown;
    const tip = !selected.length && picked && SUGGESTED[picked];
    return (
      <>
        <span className="tpo-elig__act-text">
          {selected.length ? <><strong>{selected.length.toLocaleString()}</strong> selected of {shown.length.toLocaleString()}</> : <><strong>{shown.length.toLocaleString()}</strong> {shown.length === 1 ? "student" : "students"} in this view</>}
        </span>
        <Button type={selected.length ? "primary" : "default"} icon={<ThunderboltOutlined />} style={audience.length === 0 ? { display: "none" } : undefined} disabled={audience.length === 0} data-testid="students.act"
          onClick={() => setActing({ audience, selected: selected.length > 0, initial: null, clear })}>
          {selected.length ? `Act on ${selected.length.toLocaleString()} selected` : `Act on all ${shown.length.toLocaleString()}`}
        </Button>
        {tip && shown.length > 0 && (
          <span className="tpo-elig__suggest" data-testid="students.suggest">
            Suggested: {tip.text}
            <Button size="small" onClick={() => setActing({ audience: shown, selected: false, initial: tip, clear })} data-testid="students.suggest-do">Do it</Button>
          </span>
        )}
      </>
    );
  };

  const ids = panel != null ? shownIds() : [];
  const at = ids.indexOf(panel);

  return (
    <div className="scroll-container tpo-students" data-testid="tpo.students">
      <PageShell>
        <ListingPageHeader
          className="tpo-students__header"
          title="Students"
          subtitle={<Typography.Text type="secondary">Everyone in placements, from the batches you made eligible.</Typography.Text>}
          rightContent={<Button className="tpo-students__import" onClick={() => setImporting(true)}>Import academic details</Button>}
        />
        {error && !data ? <PanelError title={error} onRetry={load} /> : !data ? <Skeleton active paragraph={{ rows: 8 }} /> : all.length === 0 ? (
          <Empty className="tpo-students__empty" data-testid="students.empty"
            description={<span><strong>Nobody is in placements yet.</strong><br />Decide who is in on Placement eligibility; they show up here.</span>}>
            <Button type="primary" onClick={() => router.push("/tpo/batches")}>Open Placement eligibility</Button>
          </Empty>
        ) : (
        <>
          {error && <Alert className="tpo-students__stale-alert" type="error" showIcon closable message="This refresh failed. Students below are from the last successful load." description={error} action={<Button size="small" onClick={load}>Retry</Button>} />}
          {notInvited > 0 && (
            <Alert className="tpo-students__registration" type="warning" showIcon banner data-testid="students.nobody-registered"
              message={`Registration is not open for ${notInvited.toLocaleString()} ${notInvited === 1 ? "student" : "students"}: their batch has not been invited, so they cannot register.`}
              action={<Button size="small" onClick={() => router.push("/tpo/batches")}>Open Placement eligibility</Button>} />
          )}
          <GridWorkspace
            testid="students.grid" handle={handle} rows={all} columns={columns} rowId={(r) => r.learnerId} defs={defs}
            filters={filters} setFilters={setFilters} storageKey="students-v2" exportName="students" searchPlaceholder="Search name, roll no., email"
            filterTitle="Filter students"
            top={<StudentsTop rows={scoped} all={all} filters={filters} setFilters={setFilters} picked={picked} onPick={pickStrip} narrowedBy={narrowedBy} />}
            counts={() => null} act={act} scope={workingSet} viewScope="STUDENTS" context={gridContext}
          />
        </>
        )}
      </PageShell>

      {panel != null && (
        <StudentPanel learnerId={panel} onClose={() => setPanel(null)} onChanged={load}
          onPrev={at > 0 ? () => setPanel(ids[at - 1]) : null} onNext={at >= 0 && at < ids.length - 1 ? () => setPanel(ids[at + 1]) : null} />
      )}

      {bulkElement}
      <AsyncModal open={Boolean(outcomeAsk)} title={outcomeAsk ? `${fullName(outcomeAsk.row)}: ${outcomeAsk.label || REGISTRATION[outcomeAsk.choice]}` : ""}
        okText="Save" confirmLoading={registrationBusy} onCancel={() => { if (!registrationBusyRef.current) setOutcomeAsk(null); }}
        onOk={async () => { const a = outcomeAsk; if (await saveRegistration(a.row, a.choice, a.label, a.detail.trim() || null)) setOutcomeAsk(null); }}>
        <Typography.Paragraph type="secondary">Optional, but it is what NAAC and NIRF ask for. It shows on the student&apos;s record and in the Outcomes report.</Typography.Paragraph>
        <Input aria-label="Outcome detail" maxLength={200} value={outcomeAsk?.detail || ""} placeholder={OUTCOME_DETAIL_HINT[outcomeAsk?.choice] || ""}
          onChange={(e) => setOutcomeAsk({ ...outcomeAsk, detail: e.target.value })} />
      </AsyncModal>
      <AddToDriveModal open={Boolean(addTo)} selected={addTo?.selected || []} onClose={() => setAddTo(null)} onDone={() => { addTo?.clear?.(); load(); }} />

      <StudentActions open={Boolean(acting)} onClose={() => setActing(null)} audience={acting?.audience || []} selected={Boolean(acting?.selected)}
        initial={acting?.initial} registrationOptions={registrationOptions} startBulk={startBulk}
        onAddToDrive={(rows) => setAddTo({ selected: rows, clear: acting?.clear || (() => {}) })}
        onChanged={() => { acting?.clear?.(); load(); }} />

      <ImportPreviewModal open={importing} title="Import academic details" onClose={() => setImporting(false)}
        allowed={["roll", "cgpa", "tenthPct", "twelfthPct", "diplomaPct", "ugPct", "gapYears", "passingYear", "gender", "batch"]}
        help="One row per student, matched by roll number. Use it every semester, and once for 10th / 12th / Diploma from admission data. Only the columns you include are changed."
        template={{ name: "academic-details-template", headings: ["roll", "cgpa", "tenthPct", "twelfthPct", "ugPct", "gapYears", "passingYear", "batch"], example: ["21CS001", "8.4", "91", "89", "", "0", "2027", "2027"] }}
        groups={[{ key: "matched", label: "Will update", tone: "green" }, { key: "unmatched", label: "Can't match", tone: "red" }]}
        preview={(rows) => previewAcademicImport(rows)} commit={(rows) => commitAcademicImport(rows)}
        matchedColumns={[{ title: "Roll", dataIndex: "roll" }, { title: "Name", dataIndex: "name" },
          { title: "Changes", dataIndex: "changes", render: (c, r) => (r.unchanged ? <Typography.Text type="secondary">No change</Typography.Text> : Object.entries(c).map(([k, v]) => <div key={k}>{k}: {v.from || "empty"} to {v.to}</div>)) }]}
        onDone={() => { setImporting(false); load(); }} />
    </div>
  );
}
