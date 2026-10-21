import { useMemo, useRef, useState } from "react";
import { choiceEditor } from "@/components/tpo/grid/ChoiceEditor";
import { Button, Typography } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import GridWorkspace from "@/components/tpo/grid/GridWorkspace";
import HeaderFilter from "@/components/tpo/grid/HeaderFilter";
import IneligibleModal from "./IneligibleModal";
import { academicColumns, sortOnly } from "@/components/tpo/students/academics";
import { BATCH_STAGE, DECISION, batchStage, levelText, learnerChanges } from "./batchRules";
import { StatusBadge } from "@/components/Common/PanelStates";

const OWN = { FOLLOW: "Follows class", ELIGIBLE: "Eligible", INELIGIBLE: "Ineligible" };
const head = (filterKey) => ({ headerComponent: HeaderFilter, headerComponentParams: { filterKey } });

function StageCell({ data }) {
  if (!data) return null;
  const st = BATCH_STAGE[batchStage(data)];
  return <StatusBadge status={st.status} label={st.label} tone={st.tone} />;
}

/**
 * The decision, where it comes from, and the way to change it, in one cell (Decision and "Student's own" used to repeat each
 * other). A dot, not a tag: tags on this sheet belong to Stage, so green means one thing.
 */
function DecisionCell({ data }) {
  if (!data) return null;
  const d = DECISION[data.eligibility] || DECISION.NOT_DECIDED;
  const source = data.ownDecision ? "own decision" : levelText(data.eligibilityLevel);
  return (
    <span className={`tpo-decision is-${String(data.eligibility || "NOT_DECIDED").toLowerCase()}`} title="Click to change this student's own decision">
      <span className="tpo-decision__dot" aria-hidden="true" />
      <span className="tpo-decision__label">{d.label}</span>
      {source && <Typography.Text type="secondary" className="tpo-decision__source">{source}</Typography.Text>}
      <span className="tpo-grid__caret" aria-hidden="true">▾</span>
    </span>
  );
}

const COLUMNS = sortOnly([
  { field: "name", headerName: "Name", pinned: "left", minWidth: 180, flex: 1.4, filter: "agTextColumnFilter", lockVisible: true },
  { field: "rollNumber", headerName: "Roll no.", width: 130, sortable: true, filter: "agTextColumnFilter" },
  { field: "className", headerName: "Class", width: 120, ...head("class") },
  { field: "ownChoice", colId: "decision", headerName: "Decision", width: 230, editable: true, cellRenderer: DecisionCell, filter: false, ...head("decision"),
    ...choiceEditor(Object.entries(OWN).map(([value, label]) => ({ value, label }))),
    headerTooltip: "In placements or not, and where it comes from. Click a cell to give that student their own decision, or to let them follow their class.",
    tooltipValueGetter: (p) => (p.data?.eligibilityReason ? `Reason: ${p.data.eligibilityReason}` : undefined),
    context: { exportValue: (r) => [DECISION[r.eligibility]?.label || "Not decided", r.ownDecision ? "own decision" : levelText(r.eligibilityLevel)].filter(Boolean).join(", ") } },
  { colId: "stage", headerName: "Stage", width: 150, cellRenderer: StageCell, filter: false, ...head("stage"), valueGetter: (p) => batchStage(p.data || {}),
    context: { exportValue: (r) => BATCH_STAGE[batchStage(r)]?.label } },
  { field: "eligibilityReason", headerName: "Reason", minWidth: 160, flex: 1, filter: "agTextColumnFilter" },
  { field: "branch", headerName: "Branch", width: 120 },
  { field: "gender", headerName: "Gender", width: 110, hide: true, ...head("gender") },
  ...academicColumns({ exportOnly: true }), // marks are filtered in the panel and exported, not shown (as on Students)
  { field: "applications", headerName: "Applications", width: 120, type: "numericColumn", hide: true },
  { field: "offers", headerName: "Offers", width: 95, type: "numericColumn", hide: true },
  { field: "eligibilityBy", headerName: "Decided by", width: 140, hide: true },
  { field: "email", headerName: "Email", width: 200, hide: true },
  { field: "phone", headerName: "Phone", width: 130, hide: true },
]);

/**
 * The eligibility grid of a batch: decide in the cell, or act on the view or the selection through the page's Actions window.
 * Props: students, filters/setFilters (URL state), defs, storageKey, exportName, decide(changes, what) -> Promise<boolean>, onImport(),
 *        top (the page's strip above the sheet), act(shown, selected, clear) (the always-visible act bar).
 */
export default function EligibilityGrid({ students, filters, setFilters, defs, storageKey, exportName, decide, onImport, top, act, readOnly = false }) {
  const handle = useRef(null);
  const [ineligible, setIneligible] = useState(null); // { rows, what, revert? }
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => (students || []).map((s) => ({ ...s, ownChoice: s.ownDecision || "FOLLOW" })), [students]);
  // The Reason column only appears once someone has a reason (it is empty for a batch that is simply in placements).
  const anyReason = rows.some((r) => r.eligibilityReason);
  const columns = useMemo(() => COLUMNS.map((column) => {
    const next = column.field === "eligibilityReason" ? { ...column, hide: !anyReason } : { ...column };
    if (column.field === "ownChoice") next.editable = !readOnly;
    return next;
  }), [anyReason, readOnly]);

  const apply = async (changes, what, revert) => {
    if (readOnly || typeof decide !== "function") {
      revert?.();
      return false;
    }
    setBusy(true);
    const ok = await decide(changes, what);
    setBusy(false);
    if (!ok && revert) revert();
    if (ok) handle.current?.clearSelection();
    return ok;
  };

  const onCellChange = (e) => {
    if (readOnly) return;
    if (e.colDef.field !== "ownChoice" || e.newValue === e.oldValue) return;
    const revert = () => e.node.setDataValue("ownChoice", e.oldValue);
    if (e.newValue === "INELIGIBLE") { setIneligible({ rows: [e.data], what: e.data.name || "this student", revert }); return; }
    apply(learnerChanges([e.data], e.newValue === "FOLLOW" ? null : e.newValue), e.data.name, revert);
  };

  return (
    <GridWorkspace
      testid="eligibility-grid" handle={handle} rows={rows} columns={columns} rowId={(r) => r.learnerId} defs={defs}
      filters={filters} setFilters={setFilters} storageKey={storageKey} exportName={exportName}
      searchPlaceholder="Search name, roll no., anything" filterTitle="Filter students" top={top} viewScope="BATCH_STUDENTS"
      tools={onImport && !readOnly ? <Button icon={<UploadOutlined />} onClick={onImport}>Import sheet</Button> : null}
      counts={() => null} act={readOnly ? undefined : act} onCellChange={onCellChange}
      rowClassRules={{ "is-ineligible-row": (p) => p.data?.eligibility === "INELIGIBLE" }}
    >
      <IneligibleModal
        open={Boolean(ineligible)} what={ineligible?.what || ""} busy={busy}
        onCancel={() => { ineligible?.revert?.(); setIneligible(null); }}
        onConfirm={async (reason) => {
          const target = ineligible;
          const ok = await apply(learnerChanges(target.rows, "INELIGIBLE", reason), target.what, target.revert);
          if (ok) setIneligible(null);
        }}
      />
    </GridWorkspace>
  );
}
