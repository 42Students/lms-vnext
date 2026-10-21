import TpoDataTable from "@/components/tpo/TpoDataTable";
import { useEffect, useRef, useState } from "react";
import {
  Alert, Button, Card, DatePicker, Descriptions, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Switch, Table, Tag, Typography, message,
} from "antd";
import { ArrowDownOutlined, ArrowUpOutlined, HolderOutlined } from "@ant-design/icons";
import { dj, serverTime } from "@/components/tpo/dj";
import ImportPreviewModal from "../ImportPreviewModal";
import ResultsEntryModal from "./ResultsEntryModal";
import { plural } from "../ui/labels";
import ScheduleModal from "./ScheduleModal";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { applyRoundResults, pendingResults } from "@/api/Services/TpoService";
import { blockedCheck, commitResultsImport, createRound, deleteRound, previewResultsImport, reorderRounds, setAutoApply, updateRound } from "@/api/Services/TpoHubService";
import { fullName } from "../tpoFiles";
import Router from "next/router";

const errorText = (res, fallback) => res?.data?.message || res?.data?.error || res?.message || fallback;
const KIND = { TALK: "Talk", TEST: "Test", VENDOR_TEST: "Vendor test", GD: "Group discussion", INTERVIEW: "Interview" };
const PRESETS = [
  { label: "Talk, Test, Interview", rounds: [["TALK", "Company talk"], ["TEST", "Online test"], ["INTERVIEW", "Interview"]] },
  { label: "Test, Technical, HR", rounds: [["TEST", "Aptitude test"], ["INTERVIEW", "Technical interview"], ["INTERVIEW", "HR interview"]] },
  { label: "Test, Group discussion, Interview", rounds: [["TEST", "Written test"], ["GD", "Group discussion"], ["INTERVIEW", "Interview"]] },
];
const OUTCOMES = [{ value: "PASS", label: "Pass" }, { value: "FAIL", label: "Not cleared" }, { value: "HOLD", label: "Waitlist" }, { value: "ABSENT", label: "Absent" }];
const when = (v) => (v ? dj(v).format("D MMM YYYY, h:mm A") : "To be decided");

/**
 * Rounds tab (TPO V1 - Locked.docx §5): one card per round, add/edit/delete, slots and room assignment (with a preview
 * before anyone is told), reschedule requests, results staging with Excel import, and apply in one action with a preview.
 */
const SOURCE = { EXCEL: "Sheet or pasted list", TPO: "Placement cell", RECRUITER: "Recruiter", COMPANY: "Company", AUTO: "Applied automatically" };
const ROUND_STATUS = { PENDING: "Not run yet", SCHEDULED: "Scheduled", IN_PROGRESS: "Running", COMPLETED: "Done", CANCELLED: "Cancelled" };

export default function RoundsTab({ job, rounds, applicants, reload, autoApply, readOnly, onShowRound }) {
  const [editing, setEditing] = useState(null); // null | "new" | round
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const busyRef = useRef(false);
  const autoApplyRef = useRef(false);
  const applyLoadRef = useRef(false);
  const blockedCheckSeqRef = useRef(0);
  const [roundDirty, setRoundDirty] = useState(false);
  const [blockedWarn, setBlockedWarn] = useState(null);
  const [blockedError, setBlockedError] = useState(null);
  const [importRound, setImportRound] = useState(null);
  const [resultsRound, setResultsRound] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [overId, setOverId] = useState(null);
  const [scheduleRound, setScheduleRound] = useState(null);
  const [applyRound, setApplyRound] = useState(null);
  const [pending, setPending] = useState([]);
  const [busy, setBusy] = useState(false);
  const [autoApplyBusy, setAutoApplyBusy] = useState(false);
  const [loadingApplyRoundId, setLoadingApplyRoundId] = useState(null);

  const terminalRound = (r) => ["COMPLETED", "CANCELLED"].includes(r?.status);
  const roundReadOnly = (r) => readOnly || terminalRound(r);
  const deleteBlocked = (r) => roundReadOnly(r) || Number(r?.inRound) > 0 || Number(r?.stagedResults) > 0;

  useEffect(() => {
    if (!editing || !roundDirty || savingRef.current || typeof window === "undefined") return undefined;
    const beforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const beforeRouteChange = () => {
      if (window.confirm("Discard your unsaved round changes?")) return;
      const addressBar = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (addressBar !== Router.asPath) window.history.pushState(null, "", Router.asPath);
      // eslint-disable-next-line no-throw-literal
      throw "Route change aborted to preserve unsaved round changes.";
    };
    window.addEventListener("beforeunload", beforeUnload);
    Router.events.on("routeChangeStart", beforeRouteChange);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      Router.events.off("routeChangeStart", beforeRouteChange);
    };
  }, [editing, roundDirty]);

  const requestCloseEdit = () => {
    if (savingRef.current) return;
    if (!roundDirty) { setEditing(null); return; }
    Modal.confirm({
      title: "Discard round changes?",
      content: "Your unsaved scheduling and round details will be lost.",
      okText: "Discard",
      okButtonProps: { danger: true },
      cancelText: "Keep editing",
      onOk: () => { setRoundDirty(false); setEditing(null); },
    });
  };

  const openEdit = (target) => {
    if ((target === "new" && readOnly) || (target && target !== "new" && roundReadOnly(target))) {
      message.warning(target === "new" ? "This drive is read-only." : "Completed or cancelled rounds cannot be edited.");
      return;
    }
    setEditing(target);
    setRoundDirty(false);
    setBlockedWarn(null);
    setBlockedError(null);
    form.resetFields();
    if (target && target !== "new") {
      form.setFieldsValue({ ...target, scheduledDate: target.scheduledDate ? dj(target.scheduledDate) : null, resultsDue: target.resultsDue ? dj(target.resultsDue) : null });
    } else form.setFieldsValue({ kind: "TEST", mode: "ON_CAMPUS" });
  };

  const checkBlocked = async (d) => {
    const requestId = ++blockedCheckSeqRef.current;
    if (!d) { setBlockedWarn(null); setBlockedError(null); return; }
    const res = await fetchWithErrorHandling(blockedCheck(d.format("YYYY-MM-DD")));
    if (requestId !== blockedCheckSeqRef.current) return;
    if (!res.success) {
      setBlockedWarn(null);
      setBlockedError(errorText(res, "Could not verify the blocked-date calendar."));
      return;
    }
    setBlockedError(null);
    setBlockedWarn(res.data?.blocked ? res.data.label : null);
  };

  const save = async () => {
    if (savingRef.current) return;
    if (readOnly || (editing && editing !== "new" && terminalRound(editing))) {
      message.warning("This round is read-only.");
      return;
    }
    savingRef.current = true;
    setSaving(true);
    try {
      const v = await form.validateFields();
      const body = { ...v, scheduledDate: v.scheduledDate ? serverTime(v.scheduledDate) : null, resultsDue: v.resultsDue ? serverTime(v.resultsDue) : null };
      const call = editing === "new" ? createRound(job.id, body) : updateRound(job.id, editing.id, body);
      const res = await fetchWithErrorHandling(call);
      if (!res.success) { message.error(errorText(res, "Could not save the round")); return; }
      setRoundDirty(false);
      setEditing(null);
      reload();
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const addPreset = async (preset) => {
    if (readOnly || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    const failed = [];
    for (const [kind, name] of preset.rounds) {
      // Sequential on purpose: each new round takes the next order number.
      // eslint-disable-next-line no-await-in-loop
      const res = await fetchWithErrorHandling(createRound(job.id, { kind, name, mode: "ON_CAMPUS" }));
      if (!res.success) failed.push({ name, reason: errorText(res, "Could not add this round") });
    }
    busyRef.current = false;
    setBusy(false);
    reload();
    if (failed.length) {
      Modal.warning({
        title: `${preset.rounds.length - failed.length} of ${preset.rounds.length} rounds added`,
        content: <ul>{failed.map((item) => <li key={item.name}><b>{item.name}</b>: {item.reason}</li>)}</ul>,
      });
    } else {
      message.success("Round preset added");
    }
  };

  const remove = async (r) => {
    if (deleteBlocked(r)) {
      message.warning(roundReadOnly(r) ? "This round is read-only." : "A round with students or staged results cannot be deleted.");
      return;
    }
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    const res = await fetchWithErrorHandling(deleteRound(job.id, r.id));
    busyRef.current = false;
    setBusy(false);
    if (!res.success) { message.error(errorText(res, "Could not delete the round")); return; }
    reload();
  };

  // Rounds can be reordered until a result is entered or a student is in a round: after that "round 2" means something to people.
  const orderLocked = rounds.some((r) => r.stagedResults > 0 || r.inRound > 0 || r.status === "COMPLETED");
  const move = async (fromId, toId) => {
    if (readOnly || orderLocked || busyRef.current) return;
    if (fromId == null || toId == null || fromId === toId) return;
    const ids = rounds.map((r) => r.id);
    const from = ids.indexOf(fromId); const to = ids.indexOf(toId);
    if (from < 0 || to < 0) return;
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    busyRef.current = true;
    setBusy(true);
    const res = await fetchWithErrorHandling(reorderRounds(job.id, ids));
    busyRef.current = false;
    setBusy(false);
    if (!res.success) { message.error(errorText(res, "Could not change the order")); return; }
    reload();
  };
  const step = (r, delta) => {
    const i = rounds.findIndex((x) => x.id === r.id);
    const target = rounds[i + delta];
    if (target) move(r.id, target.id);
  };

  const openApply = async (r) => {
    if (roundReadOnly(r)) { message.warning("Completed or cancelled rounds are read-only."); return; }
    if (applyLoadRef.current) return;
    applyLoadRef.current = true;
    setLoadingApplyRoundId(r.id);
    const res = await fetchWithErrorHandling(pendingResults(r.id));
    applyLoadRef.current = false;
    setLoadingApplyRoundId(null);
    if (!res.success || !Array.isArray(res.data)) {
      // Failed/unknown pending-result state must never become an empty apply preview.
      message.error(errorText(res, "Could not load the pending results. Retry before applying them."));
      return;
    }
    setPending(res.data);
    setApplyRound(r);
  };

  const confirmApply = async () => {
    if (!applyRound || roundReadOnly(applyRound) || busyRef.current) {
      if (applyRound && roundReadOnly(applyRound)) message.warning("This round is read-only.");
      return;
    }
    busyRef.current = true;
    setBusy(true);
    const res = await fetchWithErrorHandling(applyRoundResults(applyRound.id, true));
    busyRef.current = false;
    setBusy(false);
    if (!res.success) { message.error(errorText(res, "Could not apply the results")); return; }
    // A result that could not be applied (the student withdrew meanwhile...) stays waiting on the round and is said here.
    const skipped = Array.isArray(res.data?.skipped) ? res.data.skipped : [];
    if (skipped.length) {
      Modal.warning({ title: `${plural(Number(res.data?.applied) || 0, "result")} applied, ${plural(skipped.length, "result")} not`,
        content: <ul>{skipped.map((sk) => <li key={sk.applicationId}><b>{nameOf(sk.applicationId)}</b>: {String(sk.reason || "").replace(/^Cannot move from (\w+) to (\w+)$/, (m, a, b) => `they are at ${a.toLowerCase()}, not where ${b.toLowerCase()} can follow`)}</li>)}</ul> });
    } else message.success("Results applied and students notified");
    // Students already past the rounds (offered, placed, out): their result is kept, their stage is not touched.
    const unchanged = Array.isArray(res.data?.unchanged) ? res.data.unchanged : [];
    if (unchanged.length) message.info(`${plural(unchanged.length, "student")} kept their stage: ${unchanged.map((u) => `${nameOf(u.applicationId)} (${String(u.reason || "").replace(/; stage not changed$/, "")})`).join(", ")}`, 8);
    setApplyRound(null);
    reload();
  };

  const toggleAutoApply = async (v) => {
    if (readOnly || autoApplyRef.current) return;
    autoApplyRef.current = true;
    setAutoApplyBusy(true);
    const r = await fetchWithErrorHandling(setAutoApply(job.id, v));
    autoApplyRef.current = false;
    setAutoApplyBusy(false);
    if (!r.success) { message.error(errorText(r, "Could not change this")); return; }
    reload();
  };

  const nameOf = (applicationId) => fullName(applicants.find((a) => a.applicationId === applicationId) || {}) || `#${applicationId}`;
  const pass = pending.filter((p) => p.outcome === "PASS").length;
  // Where a pass takes a student: the next round by name, or the offer stage after the last one.
  const nextRound = applyRound ? rounds.filter((r) => r.seq > applyRound.seq).sort((a, b) => a.seq - b.seq)[0] : null;
  const stageWord = applyRound ? (nextRound ? nextRound.name : "the offer stage") : "";
  // Consequence preview (HOME/Batch-4 pattern): "a lightweight confirmation for a high-impact
  // bulk transition" becomes a real before -> after breakdown by outcome, not just a pass count.
  const byOutcome = OUTCOMES.map((o) => ({ ...o, count: pending.filter((p) => p.outcome === o.value).length })).filter((o) => o.count > 0);

  return (
    <Space className="tpo-drive-rounds" direction="vertical" style={{ width: "100%" }} size="middle">
      <Space className="tpo-drive-rounds__toolbar" wrap>
        <Button type="primary" disabled={readOnly} onClick={() => openEdit("new")}>Add round</Button>
        <Space><Switch checked={Boolean(autoApply)} loading={autoApplyBusy} disabled={readOnly || busy || autoApplyBusy} onChange={toggleAutoApply} /><span>Apply this company&apos;s results automatically (pass lists only; it never marks missing rows)</span></Space>
        {rounds.length === 0 && PRESETS.map((p) => <Button key={p.label} loading={busy} disabled={readOnly} onClick={() => addPreset(p)}>Start with: {p.label}</Button>)}
      </Space>
      {rounds.length === 0 && <Card className="tpo-drive-rounds__empty"><Typography.Text type="secondary">No rounds yet. Add one, or start from a preset.</Typography.Text></Card>}

      {rounds.length > 1 && !readOnly && (
        <Typography.Text type="secondary" className="tpo-drive-rounds__order-hint">
          {orderLocked ? "The order is locked now that results or students are in a round." : "Drag a round by its handle, or use the arrows, to change the order."}
        </Typography.Text>
      )}
      {rounds.map((r, idx) => (
        <div
          key={r.id}
          className={`tpo-drive-rounds__item${overId === r.id && dragId !== r.id ? " is-drop" : ""}${dragId === r.id ? " is-dragging" : ""}`}
          draggable={!orderLocked && !readOnly && rounds.length > 1}
          onDragStart={(e) => { setDragId(r.id); e.dataTransfer.effectAllowed = "move"; }}
          onDragOver={(e) => { if (dragId != null) { e.preventDefault(); setOverId(r.id); } }}
          onDragLeave={() => setOverId(null)}
          onDrop={(e) => { e.preventDefault(); const from = dragId; setDragId(null); setOverId(null); move(from, r.id); }}
          onDragEnd={() => { setDragId(null); setOverId(null); }}
        >
        <Card className="tpo-drive-rounds__card" title={<Space>{!orderLocked && !readOnly && rounds.length > 1 && <HolderOutlined className="tpo-drive-rounds__handle" aria-hidden="true" />}{`${r.seq}. ${r.name}`}</Space>} extra={<Space>{!orderLocked && !readOnly && rounds.length > 1 && <><Button size="small" type="text" icon={<ArrowUpOutlined />} disabled={idx === 0} onClick={() => step(r, -1)} aria-label={`Move ${r.name} up`} /><Button size="small" type="text" icon={<ArrowDownOutlined />} disabled={idx === rounds.length - 1} onClick={() => step(r, 1)} aria-label={`Move ${r.name} down`} /></>}<Tag>{KIND[r.kind] || r.kind}</Tag><Tag color={r.status === "COMPLETED" ? "green" : "default"}>{ROUND_STATUS[r.status] || r.status}</Tag></Space>}
          actions={[
            <Button key="e" type="link" size="small" disabled={roundReadOnly(r)} onClick={() => openEdit(r)}>Edit</Button>,
            <Button key="s" type="link" size="small" onClick={() => setScheduleRound(r)}>{roundReadOnly(r) ? "View slots and rooms" : "Slots and rooms"}</Button>,
            <Button key="i" type="link" size="small" disabled={roundReadOnly(r)} onClick={() => setImportRound(r)}>Import results</Button>,
            <Button key="m" type="link" size="small" disabled={roundReadOnly(r)} onClick={() => setResultsRound(r)}>Enter results</Button>,
            <Popconfirm key="d" title="Delete this round?" disabled={deleteBlocked(r)} onConfirm={() => remove(r)}>
              <Button type="link" size="small" danger disabled={deleteBlocked(r)} title={deleteBlocked(r) && !roundReadOnly(r) ? "Remove students/results before deleting this round" : undefined}>Delete</Button>
            </Popconfirm>,
          ]}>
          <Descriptions size="small" column={{ xs: 1, md: 2 }}>
            <Descriptions.Item label="Mode">{r.mode === "VIRTUAL" ? "Virtual" : r.mode === "ON_CAMPUS" ? "On campus" : "-"}</Descriptions.Item>
            <Descriptions.Item label="When">{when(r.scheduledDate)}</Descriptions.Item>
            <Descriptions.Item label={r.mode === "VIRTUAL" ? "Meeting link" : "Venue"}>{(r.mode === "VIRTUAL" ? r.meetingUrl : r.venue) || "-"}</Descriptions.Item>
            <Descriptions.Item label="Students in this round">{r.inRound > 0 && onShowRound ? <Button type="link" size="small" style={{ padding: 0, height: "auto" }} onClick={() => onShowRound(r.name)}>{r.inRound} · see who</Button> : r.inRound}</Descriptions.Item>
            <Descriptions.Item label="Results expected by">{r.resultsDue ? when(r.resultsDue) : "-"}</Descriptions.Item>
            <Descriptions.Item label="Results">{r.stagedResults > 0 ? <Tag color="gold">{r.stagedResults} waiting to apply</Tag> : r.status === "COMPLETED" ? <Tag color="green">Applied</Tag> : "None yet"}</Descriptions.Item>
            {r.kind === "TEST" && <Descriptions.Item label="Test">{[r.platform, r.durationMinutes && `${r.durationMinutes} min`, r.testLink].filter(Boolean).join(" · ") || <Typography.Text type="secondary">No platform or link yet (Edit)</Typography.Text>}</Descriptions.Item>}
            {r.whatToBring && <Descriptions.Item label="What to bring">{r.whatToBring}</Descriptions.Item>}
          </Descriptions>
          {(r.recruiterProposals > 0 || r.rescheduleRequests > 0) && (
            <Alert style={{ marginTop: 8 }} type="warning" showIcon
              message={[r.recruiterProposals > 0 && `${r.recruiterProposals} slot proposal(s) from the recruiter`, r.rescheduleRequests > 0 && `${r.rescheduleRequests} reschedule request(s)`].filter(Boolean).join(" · ")}
              action={<Button size="small" onClick={() => setScheduleRound(r)}>{roundReadOnly(r) ? "View" : "Review"}</Button>} />
          )}
          {r.stagedResults > 0 && <Button type="primary" style={{ marginTop: 12 }} disabled={roundReadOnly(r)} loading={loadingApplyRoundId === r.id} onClick={() => openApply(r)}>Review and apply {plural(r.stagedResults, "result")}</Button>}
        </Card>
        </div>
      ))}

      <Modal open={Boolean(editing)} title={editing === "new" ? "Add round" : "Edit round"} onCancel={requestCloseEdit} onOk={save} confirmLoading={saving} okButtonProps={{ disabled: readOnly || (editing && editing !== "new" && terminalRound(editing)) }} destroyOnClose width={620}>
        <Form form={form} layout="vertical" className="tpo-form-grid" onValuesChange={() => setRoundDirty(true)}>
          <div className="tpo-form-row">
            <Form.Item name="kind" label="Type" rules={[{ required: true }]}><Select options={Object.entries(KIND).map(([value, label]) => ({ value, label }))} /></Form.Item>
            <Form.Item name="name" label="Name" rules={[{ required: true, message: "Name the round" }]}><Input placeholder="e.g. Technical interview" /></Form.Item>
          </div>
          <Form.Item name="mode" label="Mode"><Select options={[{ value: "ON_CAMPUS", label: "On campus" }, { value: "VIRTUAL", label: "Virtual" }]} /></Form.Item>
          <Form.Item name="scheduledDate" label="Date and time (leave empty for to be decided)">
            <DatePicker showTime style={{ width: "100%" }} onChange={checkBlocked} />
          </Form.Item>
          {blockedError && <Alert type="warning" showIcon style={{ marginBottom: 12 }} message="Blocked-date check is unavailable" description={blockedError} />}
          {blockedWarn && <Alert type="warning" showIcon style={{ marginBottom: 12 }} message={`That date is blocked: ${blockedWarn}. You can still save it.`} />}
          <Form.Item noStyle shouldUpdate={(a, b) => a.mode !== b.mode || a.kind !== b.kind}>
            {({ getFieldValue }) => (
              <>
                {getFieldValue("mode") === "VIRTUAL"
                  ? <Form.Item name="meetingUrl" label="Meeting link"><Input /></Form.Item>
                  : <Form.Item name="venue" label="Venue"><Input /></Form.Item>}
                {["TEST", "VENDOR_TEST"].includes(getFieldValue("kind")) && (
                  <div className="tpo-form-row">
                    <Form.Item name="platform" label="Test platform"><Input placeholder="e.g. Mettl" /></Form.Item>
                    <Form.Item name="durationMinutes" label="Duration (minutes)"><InputNumber min={1} /></Form.Item>
                    <Form.Item name="testLink" label="Test link" className="tpo-form-row__wide"><Input /></Form.Item>
                  </div>
                )}
                {getFieldValue("kind") === "VENDOR_TEST" && (
                  <Alert type="info" showIcon style={{ marginBottom: 12 }} message="For a vendor test the company emails each student a link, so applicant emails (never phone numbers) are released to the company for this round. Students are told when they apply." />
                )}
              </>
            )}
          </Form.Item>
          <Form.Item name="resultsDue" label="Results expected by"><DatePicker showTime style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="whatToBring" label="What to bring"><Input placeholder="e.g. College ID, resume copies" /></Form.Item>
        </Form>
      </Modal>

      <ResultsEntryModal open={Boolean(resultsRound)} round={resultsRound} onClose={() => setResultsRound(null)} onDone={() => { setResultsRound(null); reload(); }} />

      <ImportPreviewModal open={Boolean(importRound)} title={`Import results: ${importRound?.name || ""}`} onClose={() => setImportRound(null)}
        allowed={["applicantId", "companyId", "email", "roll", "phone", "outcome", "reasonCategory", "waitlistRank", "score", "comment"]}
        help="Columns: any of 42LMS applicant ID, company ID, email or roll number to identify the student (matched in that order), and a result column with PASS, FAIL, HOLD or ABSENT."
        template={{ name: "results-template", headings: ["roll", "email", "outcome", "reasonCategory", "waitlistRank"], example: ["21CS001", "", "PASS", "", ""] }}
        notInFileOptions
        preview={(rows) => previewResultsImport(importRound.id, rows)}
        commit={(rows, o) => commitResultsImport(importRound.id, rows, o.notInFileAction)}
        matchedColumns={[{ title: "Name", dataIndex: "name" }, { title: "Stage now", dataIndex: "stage" }, { title: "Result", dataIndex: "outcome" }]}
        onDone={() => { setImportRound(null); reload(); }} />

      <Modal open={Boolean(applyRound)} title={`Apply ${applyRound?.name || ""} results`} onCancel={() => setApplyRound(null)} okText="Apply and notify" onOk={confirmApply} confirmLoading={busy}>
        <Typography.Paragraph>
          <b>{plural(pass, "student")} cleared {applyRound?.name}</b> and go on to {stageWord}. {pending.length - pass > 0 ? `${plural(pending.length - pass, "student")} will be told they were not cleared or waitlisted. ` : ""}All {pending.length} are told when you apply.
        </Typography.Paragraph>
        <Space wrap style={{ marginBottom: 12 }}>
          {byOutcome.map((o) => <Tag key={o.value} color={o.value === "PASS" ? "green" : o.value === "HOLD" ? "gold" : "default"}>{o.count} {o.label} → {o.value === "PASS" ? (nextRound ? nextRound.name : "Offer") : o.value === "HOLD" ? "Waitlist" : "Not selected"}</Tag>)}
        </Space>
        <TpoDataTable compact selectable={false} searchInUrl={false} testid="apply-results-preview" data={pending} rowKey="id" exportName={`${applyRound?.name || "round"}-results`}
          height={360} searchOf={(p) => `${nameOf(p.applicationId)} ${p.outcome || ""}`}
          columns={[{ title: "Student", key: "student", exportValue: (p) => nameOf(p.applicationId), render: (_, p) => nameOf(p.applicationId) },
            { title: "Roll", key: "roll", exportValue: (p) => applicants.find((a) => a.applicationId === p.applicationId)?.rollNumber || "" },
            { title: "Result", dataIndex: "outcome", exportValue: (p) => OUTCOMES.find((o) => o.value === p.outcome)?.label || p.outcome, render: (v) => OUTCOMES.find((o) => o.value === v)?.label || v },
            { title: "Entered by", dataIndex: "source", render: (v) => SOURCE[v] || v || "-", exportValue: (p) => SOURCE[p.source] || p.source }, { title: "Reason", dataIndex: "reasonCategory", render: (v) => v || "-" }]} />
        <Typography.Text type="secondary">This is not an undo: once applied, students are told.</Typography.Text>
      </Modal>

      <ScheduleModal round={scheduleRound} job={job} readOnly={scheduleRound ? roundReadOnly(scheduleRound) : readOnly} onClose={() => { setScheduleRound(null); reload(); }} />
    </Space>
  );
}
