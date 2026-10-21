import { useEffect, useMemo, useRef, useState } from "react";
import { choiceEditor } from "@/components/tpo/grid/ChoiceEditor";
import { Alert, Button, Input, Modal, Select, Space, Switch, Tag, Typography, message } from "antd";
import GridWorkspace from "@/components/tpo/grid/GridWorkspace";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { commitResultsImport, getCandidates } from "@/api/Services/TpoHubService";
import { PanelError } from "@/components/Common/PanelStates";
import { fullName } from "../tpoFiles";
import { buildResultRows, matchRolls, parseRolls } from "../ui/rollParser";

const OUTCOMES = [
  { value: "PASS", label: "Pass" },
  { value: "FAIL", label: "Not cleared" },
  { value: "HOLD", label: "Waitlist" },
  { value: "ABSENT", label: "Absent" },
];
const label = (v) => OUTCOMES.find((o) => o.value === v)?.label || v;

/**
 * Enter a whole round's results in one place: everyone in the round is a row with an inline outcome picker, a pasted list of
 * roll numbers ("these passed") fills the picker for all of them at once, and "everyone I did not mark is Not cleared" finishes the
 * rest. Nothing is applied here: results are staged, and the round card still asks you to review and apply them.
 */
export default function ResultsEntryModal({ open, round, onClose, onDone }) {
  const [rows, setRows] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [decisions, setDecisions] = useState({});
  const [paste, setPaste] = useState("");
  const [pasteOutcome, setPasteOutcome] = useState("PASS");
  const [pasteReport, setPasteReport] = useState(null);
  const [restNotCleared, setRestNotCleared] = useState(true);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  // Narrow a big round: who is not marked yet, one result, one branch.
  const [filters, setFilters] = useState({});
  const defs = useMemo(() => [
    { key: "result", label: "Result", type: "checklist", get: (a) => decisions[a.applicationId] || "NONE",
      options: [...OUTCOMES.map((o) => ({ value: o.value, label: o.label })), { value: "NONE", label: "Not marked yet" }] },
    { key: "branch", label: "Branch", type: "checklist", get: (a) => a.branch || "Not set" },
  ], [decisions]);

  const load = async () => {
    if (!round) return;
    setLoading(true);
    const res = await fetchWithErrorHandling(getCandidates(round.id));
    setLoading(false);
    if (!res.success) { setLoadError(res?.data?.message || res?.data?.error || "Could not load the students in this round"); return; }
    setLoadError(null);
    setRows(Array.isArray(res.data) ? res.data : []);
  };
  useEffect(() => {
    if (!open) return;
    setDecisions({}); setPaste(""); setPasteReport(null); setPasteOutcome("PASS"); setRestNotCleared(true); setFilters({});
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, round?.id]);

  const marked = Object.values(decisions).filter(Boolean).length;
  const counts = useMemo(() => {
    const c = {};
    Object.values(decisions).forEach((o) => { if (o) c[o] = (c[o] || 0) + 1; });
    return c;
  }, [decisions]);
  const unmarked = rows.length - marked;

  const applyPaste = () => {
    const rolls = parseRolls(paste);
    const { matched, unmatched } = matchRolls(rolls, rows);
    setDecisions((d) => { const next = { ...d }; matched.forEach((a) => { next[a.applicationId] = pasteOutcome; }); return next; });
    setPasteReport({ matched: matched.length, unmatched });
    if (matched.length) setPaste("");
  };

  const requestClose = () => {
    if (saving) {
      message.info("Wait for the results save to finish.");
      return;
    }
    const hasDraft = Object.keys(decisions).length > 0 || Boolean(paste.trim()) || restNotCleared !== true;
    if (!hasDraft) {
      onClose?.();
      return;
    }
    Modal.confirm({
      title: "Discard entered results?",
      content: "The result choices and pasted roll numbers in this review have not been saved yet.",
      okText: "Discard results",
      okButtonProps: { danger: true },
      cancelText: "Keep editing",
      onOk: () => onClose?.(),
    });
  };

  const save = async () => {
    if (savingRef.current) return;
    const built = buildResultRows(decisions, rows);
    if (built.length === 0 && !restNotCleared) return;
    // Waitlist ranks follow the order they were marked in.
    let rank = 0;
    const payload = built.map((r) => (r.outcome === "HOLD" ? { ...r, waitlistRank: ++rank } : r));
    savingRef.current = true;
    setSaving(true);
    try {
      const res = await fetchWithErrorHandling(commitResultsImport(round.id, payload, restNotCleared ? "NOT_CLEARED" : "LEAVE_PENDING"));
      if (!res.success) { message.error(res?.data?.message || res?.data?.error || "Could not save the results"); return; }
      // The same total the round card shows: the ones marked here and everyone left as Not cleared.
      const total = payload.length + (restNotCleared ? unmarked : 0);
      message.success(`${total} result${total === 1 ? "" : "s"} saved. Students are told only when you review and apply them on the round.`);
      onDone?.();
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  // The round as a spreadsheet: type or pick a result in the Result cell (Enter moves down), or select rows and mark them in one go.
  const handle = useRef(null);
  // Waitlist ranks follow the order students were marked Waitlist in (shown, so the order is never a surprise).
  const holdRank = useMemo(() => Object.fromEntries(Object.entries(decisions).filter(([, o]) => o === "HOLD").map(([id], i) => [id, i + 1])), [decisions]);
  const gridRows = useMemo(() => rows.map((a) => ({ ...a, result: decisions[a.applicationId] || "", waitlistRank: holdRank[a.applicationId] || null })), [rows, decisions, holdRank]);
  const setResult = (ids, outcome) => setDecisions((d) => {
    const next = { ...d };
    ids.forEach((id) => { if (outcome) next[id] = outcome; else delete next[id]; });
    return next;
  });
  const columns = useMemo(() => [
    { colId: "name", headerName: "Student", pinned: "left", lockVisible: true, minWidth: 180, flex: 1.4, valueGetter: (p) => (p.data ? fullName(p.data) : ""), filter: "agTextColumnFilter" },
    { field: "rollNumber", headerName: "Roll no.", width: 130, sortable: true, filter: "agTextColumnFilter" },
    { field: "branch", headerName: "Branch", width: 110 },
    {
      field: "result", headerName: "Result", width: 170, editable: true, singleClickEdit: true,
      ...choiceEditor([...OUTCOMES, { value: "", label: "Not marked" }]),
      refData: { "": "Not marked", ...Object.fromEntries(OUTCOMES.map((o) => [o.value, o.label])) },
      cellClassRules: { "is-pass": (p) => p.value === "PASS", "is-fail": (p) => p.value === "FAIL", "is-hold": (p) => p.value === "HOLD", "is-absent": (p) => p.value === "ABSENT", "is-empty": (p) => !p.value },
      headerTooltip: "Click or press Enter to pick a result",
    },
    { field: "waitlistRank", headerName: "Waitlist rank", width: 120, sortable: true, headerTooltip: "The order students were marked Waitlist in: the first one gets the first freed seat",
      valueFormatter: (p) => (p.value ? `#${p.value}` : "") },
  ], []);
  const onCellChange = (e) => { if (e.colDef.field === "result") setResult([e.data.applicationId], e.newValue || null); };
  const bulk = (selected, clear) => (
    <Space wrap>
      <span>Mark as</span>
      {OUTCOMES.map((o) => (
        <Button key={o.value} size="small" type={o.value === "PASS" ? "primary" : "default"} onClick={() => { setResult(selected.map((a) => a.applicationId), o.value); clear(); }}>{o.label}</Button>
      ))}
      <Button size="small" onClick={() => { setResult(selected.map((a) => a.applicationId), null); clear(); }}>Clear</Button>
    </Space>
  );

  return (
    <Modal open={open} onCancel={requestClose} width={900} destroyOnClose title={`Enter results: ${round?.name || ""}`}
      maskClosable={false} closable={!saving} keyboard={!saving}
      cancelButtonProps={{ disabled: saving }}
      okText={`Save ${marked + (restNotCleared ? unmarked : 0)} result${marked + (restNotCleared ? unmarked : 0) === 1 ? "" : "s"}`}
      okButtonProps={{ disabled: saving || (marked === 0 && !(restNotCleared && rows.length > 0)), loading: saving }} onOk={save}>
      {loadError ? <PanelError title={loadError} onRetry={load} /> : (
        <>
          <div className="tpo-results__paste">
            <Typography.Text strong>Paste a list of roll numbers</Typography.Text>
            <Typography.Text type="secondary"> from an email or Excel. Separate them with spaces, commas or lines.</Typography.Text>
            <Input.TextArea rows={3} value={paste} onChange={(e) => setPaste(e.target.value)} placeholder="21CS001, 21CS014, 21EC007 ..." style={{ marginTop: 8 }} />
            <Space style={{ marginTop: 8 }} wrap>
              <span>They are</span>
              <Select style={{ width: 150 }} value={pasteOutcome} onChange={setPasteOutcome} options={OUTCOMES} />
              <Button type="primary" disabled={!parseRolls(paste).length} onClick={applyPaste}>Mark these {parseRolls(paste).length || ""}</Button>
            </Space>
            {pasteReport && (
              <Alert style={{ marginTop: 8 }} type={pasteReport.unmatched.length ? "warning" : "success"} showIcon
                message={`${pasteReport.matched} marked${pasteReport.unmatched.length ? `, ${pasteReport.unmatched.length} not found in this round` : ""}`}
                description={pasteReport.unmatched.length ? `Not found: ${pasteReport.unmatched.slice(0, 12).join(", ")}${pasteReport.unmatched.length > 12 ? " and more" : ""}. Check the roll numbers, or the student may not be in this round.` : undefined} />
            )}
          </div>

          <div className="tpo-results__summary">
            {OUTCOMES.map((o) => counts[o.value] ? <Tag key={o.value} color={o.value === "PASS" ? "green" : o.value === "HOLD" ? "gold" : "default"}>{counts[o.value]} {label(o.value)}</Tag> : null)}
            <Tag>{unmarked} not marked</Tag>
            <label className="tpo-results__rest">
              <Switch checked={restNotCleared} onChange={setRestNotCleared} aria-label="Everyone I did not mark is Not cleared" />
              <span>Everyone I did not mark is <b>Not cleared</b></span>
            </label>
          </div>

          <GridWorkspace testid="results-grid" handle={handle} rows={gridRows} columns={columns} rowId={(a) => a.applicationId} searchInUrl={false} compact pasteRolls={false}
            searchPlaceholder="Search name or roll no." searchOf={(a) => `${fullName(a)} ${a.rollNumber || ""} ${a.branch || ""}`}
            defs={defs} filters={filters} setFilters={setFilters} filterTitle="Show"
            exportName={`results-${round?.name || "round"}`} loading={loading} height={420} bulk={bulk} onCellChange={onCellChange}
            empty={<Typography.Paragraph type="secondary">No students are in this round yet.</Typography.Paragraph>} />
          <Typography.Text type="secondary">Nothing is applied yet. After this, review and apply the results from the round, and the students are told.</Typography.Text>
        </>
      )}
    </Modal>
  );
}
