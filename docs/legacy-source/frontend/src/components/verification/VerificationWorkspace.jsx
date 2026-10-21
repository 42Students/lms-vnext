import TpoDataTable from "@/components/tpo/TpoDataTable";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, Card, Drawer, Empty, Form, Input, Modal, Segmented, Skeleton, Space, Switch, Table, Tag, Timeline, Typography, message } from "antd";
import { CheckOutlined, FileSearchOutlined, RightOutlined, RollbackOutlined, ThunderboltOutlined } from "@ant-design/icons";
import ActionsWindow from "@/components/tpo/ui/ActionsWindow";
import useBulkAction from "@/components/tpo/bulk/BulkAction";
import { bulkNudge } from "@/api/Services/TpoHubService";
import dayjs from "dayjs";
import { dj } from "@/components/tpo/dj";
import relativeTime from "dayjs/plugin/relativeTime";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { PanelError } from "@/components/Common/PanelStates";
import {
  getDocumentUrl, getVerificationAccess, getVerificationQueue, getVerificationSettings, getVerificationStudent, saveVerificationSettings,
  sendBackSection, verifyMany, verifySection,
} from "@/api/Services/VerificationService";

dayjs.extend(relativeTime);

const SECTION_LABEL = { EDUCATION: "Education", IDENTITY: "Identity" };
const STATUS = { SUBMITTED: ["New", "gold"], UPDATE_PENDING: ["Update", "blue"], SENT_BACK: ["Sent back", "orange"], VERIFIED: ["Verified", "green"] };
const VIEWS = [
  { value: "WAITING", label: "Waiting" },
  { value: "SENT_BACK", label: "Sent back" },
  { value: "VERIFIED", label: "Verified" },
];
/** Ready reasons per section: a marksheet reason never goes to an Identity check. */
const SEND_BACK_BY = {
  EDUCATION: ["The marksheet is unclear or cropped", "The marks do not match the marksheet", "A marksheet is missing"],
  IDENTITY: ["The document does not match the number", "Wrong document uploaded", "The document is unclear or cropped"],
};
const reasonsFor = (sections) => [...new Set((sections || []).flatMap((x) => SEND_BACK_BY[x] || []))];
const err = (r, fallback) => r?.data?.message || r?.data?.error || r?.message || fallback;
const name = (s) => [s?.firstName, s?.lastName].filter(Boolean).join(" ") || "Student";
// The server returns at most this many rows per view (ProfileVerificationService.queue).
export const QUEUE_LIMIT = 1000;

/** Which values changed between what was verified and what was sent now (an update). Keyed by entry id and field. */
export function changedFields(verified, submitted) {
  const out = new Set();
  if (!verified || !submitted) return out;
  const vEntries = Object.fromEntries((verified.entries || []).map((e) => [e.id, e]));
  (submitted.entries || []).forEach((e) => {
    const v = vEntries[e.id];
    if (!v) { out.add(`${e.id}:*`); return; }
    ["educationType", "institutionName", "endYear", "gradingType", "grade", "maxGrade", "marksheet"].forEach((k) => { if (String(v[k] ?? "") !== String(e[k] ?? "")) out.add(`${e.id}:${k}`); });
  });
  ["aadhaarNumber", "aadhaarDocument", "panNumber", "panDocument", "resumeUrl"].forEach((k) => { if (String(verified[k] ?? "") !== String(submitted[k] ?? "")) out.add(k); });
  return out;
}

function DocButton({ url, learnerId, children }) {
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  if (!url) return <Typography.Text type="danger">Not uploaded</Typography.Text>;
  const open = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    const r = await fetchWithErrorHandling(getDocumentUrl(url, learnerId));
    busyRef.current = false;
    setBusy(false);
    if (!r.success || !r.data) { message.error(err(r, "You cannot open this document")); return; }
    window.open(String(r.data), "_blank", "noopener");
  };
  return <Button size="small" icon={<FileSearchOutlined />} loading={busy} disabled={busy} onClick={open}>{children}</Button>;
}

function SectionReview({ section, learnerId, onVerify, onSendBack, busy }) {
  const values = section.submitted || section.current || {};
  const changed = section.state === "UPDATE_PENDING" ? changedFields(section.verified, section.submitted) : new Set();
  const mark = (key) => (changed.has(key) ? "verification-review__changed" : undefined);
  const waiting = ["SUBMITTED", "UPDATE_PENDING"].includes(section.state);
  return (
    <Card size="small" className="verification-review__section" title={(
      <Space>{SECTION_LABEL[section.section]}<Tag color={(STATUS[section.state] || [])[1]}>{(STATUS[section.state] || [section.state === "READY" ? "Not sent yet" : "Not sent"])[0]}</Tag></Space>
    )}>
      {section.state === "UPDATE_PENDING" && <Alert type="info" showIcon style={{ marginBottom: 8 }} message="An update to verified details" description="Changed values are highlighted. Until you verify, the earlier verified values stay in use." />}
      {section.section === "EDUCATION" ? (
        <>
          <Table size="small" pagination={false} rowKey="id" dataSource={values.entries || []} scroll={{ x: "max-content" }}
            columns={[
              { title: "Level", dataIndex: "educationType", render: (v, e) => <span className={mark(`${e.id}:educationType`) || mark(`${e.id}:*`)}>{v}{e.program ? ` · ${e.program}` : ""}{e.specialization ? ` · ${e.specialization}` : ""}</span> },
              { title: "Institution", dataIndex: "institutionName", render: (v, e) => <span className={mark(`${e.id}:institutionName`)}>{v || "-"}</span> },
              { title: "Year", dataIndex: "endYear", render: (v, e) => <span className={mark(`${e.id}:endYear`)}>{v || "-"}</span> },
              { title: "Marks", key: "m", render: (_, e) => <b className={mark(`${e.id}:grade`) || mark(`${e.id}:maxGrade`)}>{e.grade ?? "-"}{e.maxGrade ? ` / ${e.maxGrade}` : ""} {e.gradingType ? <Typography.Text type="secondary">{e.gradingType}</Typography.Text> : null}</b> },
              { title: "Marksheet", key: "d", render: (_, e) => <span className={mark(`${e.id}:marksheet`)}><DocButton url={e.marksheet} learnerId={learnerId}>Open</DocButton></span> },
            ]} />
          <div className="verification-review__line"><Typography.Text type="secondary">Resume:</Typography.Text> <DocButton url={values.resumeUrl} learnerId={learnerId}>Open resume</DocButton></div>
        </>
      ) : (
        <div className="verification-review__identity">
          <div className={mark("aadhaarNumber")}><Typography.Text type="secondary">Aadhaar</Typography.Text> <b>{values.aadhaarNumber || "Not given"}</b> <DocButton url={values.aadhaarDocument} learnerId={learnerId}>Open document</DocButton></div>
          <div className={mark("panNumber")}><Typography.Text type="secondary">PAN</Typography.Text> <b>{values.panNumber || "Not given"}</b> <DocButton url={values.panDocument} learnerId={learnerId}>Open document</DocButton></div>
          <Typography.Text type="secondary">Numbers show only the last four digits; compare them with the document.</Typography.Text>
        </div>
      )}
      {section.verifiedAt && <Typography.Paragraph type="secondary" style={{ margin: "8px 0 0" }}>Verified by {section.verifiedByName || "the college"} on {dj(section.verifiedAt).format("D MMM YYYY")}</Typography.Paragraph>}
      {waiting && (
        <Space style={{ marginTop: 10 }}>
          <Button type="primary" icon={<CheckOutlined />} loading={busy === `v:${section.section}`} disabled={Boolean(busy)} onClick={() => onVerify(section.section)}>Verify {SECTION_LABEL[section.section].toLowerCase()}</Button>
          <Button danger icon={<RollbackOutlined />} disabled={Boolean(busy)} onClick={() => onSendBack(section.section)}>Send back</Button>
        </Space>
      )}
    </Card>
  );
}

/**
 * The verifier's page, shared by college admin, super admin and the placement cell: who is waiting, each student's values next to their
 * documents, Verify / Send back with a reason, and Verify selected. College admin and super admin also set whether the placement
 * cell may verify. `collegeId` is passed by the super admin page (others work on their own college).
 */
const WAITING_SINCE = [["TODAY", "Sent today"], ["WEEK", "This week"], ["OLDER", "Over a week ago"]];
/** Education's marksheets: all uploaded, some missing (the usual reason to send back), or not an Education check. */
/** Why a waiting check cannot be verified without opening it: the server's own answer (a marksheet or ID document missing). */
const blindProblemOf = (r) => (r.blindProblem !== undefined ? r.blindProblem
  : r.section === "EDUCATION" && r.entries != null && Number(r.missingMarksheets) > 0 ? "A marksheet is missing: open it and send it back" : null);
const marksheetsOf = (r) => (r.section !== "EDUCATION" || r.entries == null ? "NA" : Number(r.missingMarksheets) > 0 ? "MISSING" : "ALL");
const MARKSHEETS = { ALL: "All uploaded", MISSING: "Some missing", NA: "Not an Education check" };
/** The queue's filter side panel (TPO page audit 2026-10-04), in sections: what to check, and whose. */
const QUEUE_DEFS = [
  { group: "What to check", key: "section", label: "Section", type: "checklist", get: (r) => r.section, options: [{ value: "EDUCATION", label: "Education" }, { value: "IDENTITY", label: "Identity" }] },
  { group: "What to check", key: "kind", label: "Kind", type: "checklist", get: (r) => (r.status === "UPDATE_PENDING" ? "UPDATE" : "FIRST"),
    options: [{ value: "FIRST", label: "First check" }, { value: "UPDATE", label: "Update to verified details" }] },
  { group: "What to check", key: "marksheets", label: "Marksheets", type: "checklist", get: marksheetsOf, options: Object.entries(MARKSHEETS).map(([value, label]) => ({ value, label })) },
  { group: "Whose", key: "batch", label: "Batch", type: "checklist", get: (r) => r.batchName || "No batch" },
  { group: "Whose", key: "branch", label: "Branch", type: "checklist", get: (r) => r.branch || "Not set" },
  { group: "What to check", key: "since", label: "Waiting since", type: "checklist", options: WAITING_SINCE.map(([value, label]) => ({ value, label })),
    get: (r) => { if (!r.submittedAt) return "OLDER"; const d = dj(r.submittedAt); return d.isAfter(dayjs().startOf("day")) ? "TODAY" : d.isAfter(dayjs().subtract(7, "day")) ? "WEEK" : "OLDER"; } },
];

export default function VerificationWorkspace({ collegeId = null, canChangeSetting = false }) {
  const [access, setAccess] = useState(null);
  const [accessError, setAccessError] = useState(null);
  const [view, setView] = useState("WAITING");
  const [panel, setPanel] = useState({});
  const section = null; // sections are a filter in the panel now (the whole queue is loaded, up to 1000)
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState([]);
  const [open, setOpen] = useState(null); // learnerId
  const [detail, setDetail] = useState(null);
  const [busy, setBusy] = useState(null);
  const decisionRef = useRef(false);
  const settingRef = useRef(false);
  const studentRequestSeq = useRef(0);
  const [sendingBack, setSendingBack] = useState(null); // section
  const [reason, setReason] = useState("");
  const [tpoCanVerify, setTpoCanVerify] = useState(null);
  const [settingError, setSettingError] = useState(null);
  const [settingSaving, setSettingSaving] = useState(false);
  const [reviewList, setReviewList] = useState(null); // learnerIds to review one by one, in order
  const [acting, setActing] = useState(null);
  const [startBulk, bulkElement] = useBulkAction();

  const loadAccess = useCallback(async () => {
    setAccessError(null);
    const r = await fetchWithErrorHandling(getVerificationAccess(collegeId));
    if (!r.success) {
      setAccess(null);
      setAccessError(err(r, "Could not check your verification access"));
      return;
    }
    setAccess(r.data);
  }, [collegeId]);
  // BE-0073/BE-0194: only the newest queue request (the view on screen now) may fill the table.
  const queueSeq = useRef(0);
  const load = useCallback(async () => {
    const seq = ++queueSeq.current;
    setError(null);
    const r = await fetchWithErrorHandling(getVerificationQueue(collegeId, { status: view === "WAITING" ? null : view, section }));
    if (seq !== queueSeq.current) return;
    if (!r.success || !Array.isArray(r.data)) {
      setRows(null);
      setError(err(r, "Could not load the queue"));
      return;
    }
    setRows(r.data);
    setSelected([]);
  }, [collegeId, view, section]);
  useEffect(() => { setAccess(null); setRows(null); loadAccess(); }, [loadAccess]);
  useEffect(() => { if (access?.canVerify) load(); }, [access, load]);
  const loadVerificationSetting = useCallback(async () => {
    if (!canChangeSetting) return;
    setSettingError(null);
    const r = await fetchWithErrorHandling(getVerificationSettings(collegeId));
    if (!r.success || typeof r.data?.tpoCanVerify !== "boolean") {
      setTpoCanVerify(null);
      setSettingError(err(r, "Could not load the placement-cell verification setting"));
      return;
    }
    setTpoCanVerify(r.data.tpoCanVerify);
  }, [canChangeSetting, collegeId]);

  useEffect(() => { loadVerificationSetting(); }, [loadVerificationSetting]);

  const openStudent = async (learnerId) => {
    const request = ++studentRequestSeq.current;
    setOpen(learnerId); setDetail(null);
    const r = await fetchWithErrorHandling(getVerificationStudent(collegeId, learnerId));
    if (request !== studentRequestSeq.current) return;
    if (!r.success || !r.data || typeof r.data !== "object") {
      message.error(err(r, "Could not open this student"));
      setOpen(null);
      return;
    }
    setDetail(r.data);
  };
  const refreshAll = () => { load(); loadAccess(); if (open) openStudent(open); };
  // Reviewing one by one: after Verify or Send back, the next student opens by itself; the drawer says "3 of 12".
  const reviewAt = reviewList ? reviewList.indexOf(open) : -1;
  const nextInReview = () => {
    if (!reviewList || reviewAt < 0 || reviewAt >= reviewList.length - 1) { setReviewList(null); setOpen(null); load(); loadAccess(); return false; }
    openStudent(reviewList[reviewAt + 1]);
    return true;
  };

  const doVerify = async (sec) => {
    if (decisionRef.current) return;
    decisionRef.current = true;
    setBusy(`v:${sec}`);
    const seen = (detail?.sections || []).find((x) => x.section === sec)?.submittedAt;
    const r = await fetchWithErrorHandling(verifySection(collegeId, open, sec, seen));
    decisionRef.current = false;
    setBusy(null);
    if (!r.success) { message.error(err(r, "Could not verify")); return; }
    message.success(`${SECTION_LABEL[sec]} verified. The student has been told.`);
    const stillWaiting = (detail?.sections || []).some((x) => x.section !== sec && ["SUBMITTED", "UPDATE_PENDING"].includes(x.state));
    if (reviewList && !stillWaiting) { load(); loadAccess(); nextInReview(); return; }
    refreshAll();
  };
  const doSendBack = async () => {
    const sec = sendingBack;
    if (!sec || decisionRef.current) return;
    decisionRef.current = true;
    setBusy(`sb:${sec}`);
    const r = await fetchWithErrorHandling(sendBackSection(collegeId, open, sec, reason.trim()));
    decisionRef.current = false;
    setBusy(null);
    if (!r.success) { message.error(err(r, "Could not send it back")); return; }
    message.success("Sent back. The student sees your reason.");
    setSendingBack(null); setReason("");
    const stillWaiting = (detail?.sections || []).some((x) => x.section !== sec && ["SUBMITTED", "UPDATE_PENDING"].includes(x.state));
    if (reviewList && !stillWaiting) { load(); loadAccess(); nextInReview(); return; }
    refreshAll();
  };
  const doVerifySelected = (picked, clear) => {
    // Verifying without opening never covers a check with a document missing (a marksheet, an ID document): left out, by name.
    const skipped = (picked || []).filter((r) => blindProblemOf(r));
    const items = (picked || []).filter((r) => !blindProblemOf(r)).map((r) => ({ learnerId: r.learnerId, section: r.section }));
    if (items.length === 0) { message.warning("Every one picked has a document missing. Open them to send back with a reason."); return; }
    Modal.confirm({
      title: `Verify ${items.length} without opening each?`,
      content: (
        <>
          <Typography.Paragraph>Only do this when you have checked these students&apos; documents another way (for example against the college&apos;s own records). Each one is recorded with your name.</Typography.Paragraph>
          {skipped.length > 0 && <Typography.Paragraph type="warning">{skipped.length} left out: a document is missing ({skipped.slice(0, 5).map(name).join(", ")}{skipped.length > 5 ? " and others" : ""}).</Typography.Paragraph>}
        </>
      ),
      okText: `Verify ${items.length}`,
      onOk: async () => {
        if (decisionRef.current) return;
        decisionRef.current = true;
        const r = await fetchWithErrorHandling(verifyMany(collegeId, items));
        decisionRef.current = false;
        if (!r.success) { message.error(err(r, "Could not verify")); return; }
        const failed = r.data?.failed || [];
        if (failed.length) message.warning(`${r.data.verified} verified. ${failed.length} could not be: ${failed[0].reason}`);
        else message.success(`${r.data.verified} verified. The students have been told.`);
        clear?.();
        refreshAll();
      },
    });
  };
  const changeSetting = async (v) => {
    if (settingRef.current) return;
    settingRef.current = true;
    const before = tpoCanVerify;
    setTpoCanVerify(v);
    setSettingSaving(true);
    const r = await fetchWithErrorHandling(saveVerificationSettings(collegeId, v));
    settingRef.current = false;
    setSettingSaving(false);
    if (!r.success) { message.error(err(r, "Could not save")); setTpoCanVerify(before); return; }
    message.success(v ? "The placement cell can now verify profiles" : "Only college admins verify profiles now");
  };

  // What needs doing in the queue (Waiting): each a filter, highlighted only when picked; a second click clears it.
  const WORK = [
    { key: "missing", label: "A marksheet missing", filter: { marksheets: ["MISSING"] } },
    { key: "update", label: "Updates to verified details", filter: { kind: ["UPDATE"] } },
    { key: "old", label: "Waiting over a week", filter: { since: ["OLDER"] } },
  ];
  const workN = (w) => (rows || []).filter((r) => Object.entries(w.filter).every(([k, v]) => v.includes(String(QUEUE_DEFS.find((d) => d.key === k).get(r))))).length;
  const pickedWork = WORK.find((w) => Object.keys(panel).length === 1 && JSON.stringify(panel[Object.keys(w.filter)[0]]) === JSON.stringify(Object.values(w.filter)[0]))?.key;
  const pickWork = (w) => setPanel(pickedWork === w.key ? {} : w.filter);

  const CHECK = ["check", "checks"];
  const sectionsHere = [...new Set((acting?.audience || []).filter((r) => ["SUBMITTED", "UPDATE_PENDING"].includes(r.status)).map((r) => r.section))];
  const waitingSkip = (r) => (["SUBMITTED", "UPDATE_PENDING"].includes(r.status) ? null : "Not waiting");
  const actions = [
    { group: "Check", key: "review", title: "Review one by one", help: "Each student's values next to their documents, with Verify and Send back. The next one opens by itself.",
      skip: waitingSkip, button: (n) => `Start with the first of ${n}`,
      run: (list) => { const ids = [...new Set(list.map((r) => r.learnerId))]; setReviewList(ids); openStudent(ids[0]); } },
    { group: "Check", key: "verify", title: "Verify without opening", help: "Only when you have checked their documents another way (for example the college's own records). Each one is recorded with your name.",
      skip: (r) => waitingSkip(r) || blindProblemOf(r),
      note: (rows) => {
        const n = rows.filter((r) => r.status === "UPDATE_PENDING").length;
        return n ? `${n} of them ${n === 1 ? "is an update" : "are updates"} to details already verified: the new values replace the verified ones.` : null;
      },
      run: (list) => startBulk({ title: "Verify", noun: CHECK, items: list, nameOf: (r) => `${name(r)} · ${SECTION_LABEL[r.section]}`,
        ack: "I have checked their documents another way (for example the college's own records).",
        consequence: (() => {
          const updates = list.filter((r) => r.status === "UPDATE_PENDING");
          return `Their values become the verified ones that eligibility uses. Each student is told.${updates.length ? ` ${updates.length} ${updates.length === 1 ? "is an update" : "are updates"} to verified details (${updates.slice(0, 3).map(name).join(", ")}${updates.length > 3 ? " and others" : ""}): the new values replace the old ones.` : ""}`;
        })(), undoNote: "To change a verified profile, the student sends an update.",
        run: (items) => fetchWithErrorHandling(verifyMany(collegeId, items.map((r) => ({ learnerId: r.learnerId, section: r.section })))),
        partial: (res, items) => (res?.data?.failed || []).map((f) => ({ item: items.find((r) => r.learnerId === f.learnerId && r.section === f.section), reason: f.reason })).filter((f) => f.item),
        onDone: () => { acting?.clear?.(); refreshAll(); } }) },
    { group: "Check", key: "sendback", title: "Send back", help: "Each student sees your reason and fixes it on their profile.", skip: waitingSkip,
      fields: (
        <>
          {sectionsHere.length > 1 && <Typography.Paragraph type="secondary">These are Education and Identity checks: one reason goes to all of them. For a section&apos;s own reasons, pick the section in the filter first.</Typography.Paragraph>}
          <Space wrap style={{ marginBottom: 8 }}>{reasonsFor(sectionsHere.length === 1 ? sectionsHere : []).map((x) => <Form.Item key={x} noStyle shouldUpdate>{({ setFieldsValue }) => <Button size="small" onClick={() => setFieldsValue({ reason: x })}>{x}</Button>}</Form.Item>)}</Space>
          <Form.Item name="reason" rules={[{ required: true, min: 3, message: "Say what needs to change" }]}><Input.TextArea rows={3} maxLength={500} placeholder="What needs to change" /></Form.Item>
        </>
      ),
      run: (list, v) => startBulk({ title: "Send back", noun: CHECK, items: list, nameOf: (r) => `${name(r)} · ${SECTION_LABEL[r.section]}`,
        consequence: `Each student sees: "${v.reason.trim()}"`, undoNote: "They resubmit; nothing to undo.",
        runEach: (r) => fetchWithErrorHandling(sendBackSection(collegeId, r.learnerId, r.section, v.reason.trim())), onDone: () => { acting?.clear?.(); refreshAll(); } }) },
    // Messaging uses the placement cell's endpoint: only on the TPO page (college and super admin use this workspace too).
    ...(collegeId == null && !canChangeSetting ? [{ group: "Talk to them", key: "message", title: "Send a message", help: "For example: upload the missing marksheet. They see it in the app.",
      fields: <Form.Item name="text" rules={[{ required: true, whitespace: true, message: "Write the message" }]}><Input.TextArea rows={4} maxLength={1000} placeholder="e.g. Please upload your 12th marksheet so we can verify your profile." /></Form.Item>,
      run: (list, v) => startBulk({ title: "Send message", noun: ["student", "students"], items: [...new Map(list.map((r) => [r.learnerId, r])).values()], nameOf: name,
        consequence: `They see: "${v.text.trim()}"`, undoNote: "A sent message cannot be taken back.",
        run: (items) => fetchWithErrorHandling(bulkNudge(items.map((r) => r.learnerId), v.text.trim())), onDone: () => acting?.clear?.() }) }] : []),
  ];
  const act = (shown, picked, clear) => {
    const audience = picked.length ? picked : shown;
    return (
      <>
        <span className="tpo-elig__act-text">
          {picked.length ? <><strong>{picked.length}</strong> selected of {shown.length}</> : <><strong>{shown.length}</strong> {shown.length === 1 ? "check" : "checks"} in this view</>}
        </span>
        <Button type={picked.length ? "primary" : "default"} icon={<ThunderboltOutlined />} style={audience.length === 0 ? { display: "none" } : undefined} disabled={audience.length === 0} data-testid="verification.act"
          onClick={() => setActing({ audience, selected: picked.length > 0, clear })}>
          {picked.length ? `Act on ${picked.length} selected` : `Act on all ${shown.length}`}
        </Button>
      </>
    );
  };

  const counts = access?.counts || {};
  const waitingCount = (Number(counts.SUBMITTED) || 0) + (Number(counts.UPDATE_PENDING) || 0);
  const rowKey = (r) => `${r.learnerId}:${r.section}`;
  const columns = useMemo(() => [
    { title: "Student", key: "s", exportValue: (r) => name(r), render: (_, r) => <b>{name(r)}</b> },
    { title: "Roll", dataIndex: "rollNumber", key: "roll", sortable: true },
    { title: "Batch", dataIndex: "batchName", key: "batch", headerFilterKey: "batch", render: (v) => v || "-" },
    { title: "Branch", dataIndex: "branch", key: "branch", headerFilterKey: "branch", defaultHidden: true },
    { title: "Section", dataIndex: "section", key: "section", headerFilterKey: "section", exportValue: (r) => SECTION_LABEL[r.section] || r.section, render: (v) => SECTION_LABEL[v] || v },
    { title: "Status", dataIndex: "status", key: "status", headerFilterKey: view === "WAITING" ? "kind" : undefined, exportValue: (r) => (STATUS[r.status] || [r.status])[0], render: (v) => <Tag color={(STATUS[v] || [])[1]}>{(STATUS[v] || [v])[0]}</Tag> },
    { title: "Marksheets", key: "marksheets", headerFilterKey: "marksheets", exportValue: (r) => (marksheetsOf(r) === "NA" ? "" : marksheetsOf(r) === "MISSING" ? `${r.missingMarksheets} of ${r.entries} missing` : `All ${r.entries} uploaded`),
      render: (_, r) => (marksheetsOf(r) === "NA" ? <Typography.Text type="secondary">-</Typography.Text>
        : marksheetsOf(r) === "MISSING" ? <Tag color="orange">{r.missingMarksheets} of {r.entries} missing</Tag> : <Tag color="green">All {r.entries} uploaded</Tag>) },
    { title: view === "VERIFIED" ? "Verified" : view === "SENT_BACK" ? "Sent back" : "Sent", key: "when",
      sorter: (a, b) => String((view === "WAITING" ? a.submittedAt : a.decidedAt) || "").localeCompare(String((view === "WAITING" ? b.submittedAt : b.decidedAt) || "")),
      exportValue: (r) => { const at = view === "WAITING" ? r.submittedAt : r.decidedAt; return at ? dj(at).format("D MMM YYYY, h:mm A") : ""; },
      render: (_, r) => {
        const at = view === "WAITING" ? r.submittedAt : r.decidedAt;
        return at ? <span title={dj(at).format("D MMM YYYY, h:mm A")}>{dj(at).fromNow()}</span> : "-";
      } },
    view !== "WAITING" && { title: "By", dataIndex: "decidedByName", key: "by", render: (v) => (v || "").trim() || "-" },
    view === "SENT_BACK" && { title: "Reason sent back", dataIndex: "note", key: "note", render: (v) => v || "-" },
    { title: "", key: "a", width: 110, render: (_, r) => <Button size="small" type={view === "WAITING" ? "primary" : "default"} onClick={() => openStudent(r.learnerId)}>{view === "WAITING" ? "Review" : "Open"}</Button> },
  ].filter(Boolean), [view]); // eslint-disable-line react-hooks/exhaustive-deps

  if (accessError) return <PanelError title={accessError} onRetry={loadAccess} />;
  if (!access) return <Card><Skeleton active paragraph={{ rows: 4 }} /></Card>;
  if (!access.canVerify) return <Alert type="info" showIcon message="You cannot verify profiles here" description={access.reason} />;

  return (
    <div className="verification-workspace" data-testid="verification.workspace">
      {canChangeSetting && settingError && (
        <Alert type="warning" showIcon style={{ marginBottom: 16 }} message="Verification setting unavailable"
          description={settingError} action={<Button size="small" onClick={loadVerificationSetting}>Retry setting</Button>} />
      )}
      {canChangeSetting && tpoCanVerify != null && (
        <Card size="small" className="verification-workspace__setting" style={{ marginBottom: 16 }}>
          <div className="verification-workspace__setting-row">
            <div>
              <Typography.Text strong>The placement cell can verify profiles</Typography.Text>
              <Typography.Paragraph type="secondary" style={{ margin: 0 }}>Placement cell admins get this same page. Every decision is recorded with the name of who made it.</Typography.Paragraph>
            </div>
            <Switch checked={tpoCanVerify} loading={settingSaving} disabled={settingSaving} onChange={changeSetting} aria-label="The placement cell can verify profiles" />
          </div>
        </Card>
      )}

      <Card>
        <div className="verification-workspace__toolbar">
          <Segmented value={view} onChange={(v) => { setView(v); setPanel({}); setRows(null); setSelected([]); }} options={VIEWS.map((v) => ({ ...v,
            label: `${v.label} (${v.value === "WAITING" ? waitingCount : Number(counts[v.value]) || 0})` }))} />

        </div>
        {view === "WAITING" && rows && rows.length > 0 && (
          <div className="tpo-journey__extras tpo-drives__work" role="group" aria-label="Needs doing" data-testid="verification.work">
            <span className="tpo-drives__work-label">Needs a closer look:</span>
            {WORK.map((w) => ({ ...w, n: workN(w) })).filter((w) => w.n > 0 || pickedWork === w.key).map((w) => (
              <button type="button" key={w.key} className={`tpo-journey__extra${pickedWork === w.key ? " is-on" : ""}`} aria-pressed={pickedWork === w.key}
                onClick={() => pickWork(w)} data-testid={`verification.work.${w.key}`}>{w.label} · <strong>{w.n}</strong></button>
            ))}
            {WORK.every((w) => workN(w) === 0) && <Typography.Text type="secondary">Nothing unusual: no missing marksheets, updates or old ones.</Typography.Text>}
          </div>
        )}
        {/* College admin audit CA-H03: until the queue is paged on the server, never let the cap pass silently. */}
        {!error && Array.isArray(rows) && rows.length >= QUEUE_LIMIT && (
          <Alert type="warning" showIcon style={{ marginBottom: 12 }} data-testid="verification.capped"
            message={`Showing the first ${QUEUE_LIMIT.toLocaleString()} students in this view`}
            description="Search, filters and counts below cover only these. Verify these first and the next students appear; older submissions are listed first." />
        )}
        {error ? <Alert type="error" showIcon message={error} action={<Button size="small" onClick={load}>Retry</Button>} /> : (
          <TpoDataTable searchInUrl={false} testid="verification-queue" data={rows || []} rowKey={rowKey} loading={rows === null} columns={columns}
            exportName={`verification-${view.toLowerCase()}`} viewScope="VERIFICATION" height="calc(100vh - 380px)"
            filterDefs={QUEUE_DEFS.filter((d) => view === "WAITING" || d.key !== "since")} filterState={panel} onFilterChange={setPanel} filterTitle="Filter the queue"
            searchOf={(r) => `${name(r)} ${r.rollNumber || ""} ${r.branch || ""}`}
            onRow={(r) => ({ onClick: () => openStudent(r.learnerId) })}
            act={view === "WAITING" ? act : undefined} counts={view === "WAITING" ? () => null : undefined}
            emptyTitle={view === "WAITING" ? "Nobody is waiting" : "Nothing here yet"}
            emptySubtitle={view === "WAITING" ? "Students appear here when they send their education or identity." : undefined} />
        )}
      </Card>

      <Drawer open={open != null} onClose={() => {
        // Stopping a review run part way: say where it stopped, so the rest is not mistaken for done.
        if (reviewList && reviewAt >= 0 && reviewAt < reviewList.length - 1) message.info(`Stopped at ${reviewAt + 1} of ${reviewList.length}. The other ${reviewList.length - reviewAt - 1} are still in the queue.`);
        setOpen(null); setReviewList(null);
      }} width={760} destroyOnClose
        title={detail ? `${name(detail.student)} · ${detail.student?.rollNumber || ""}` : "Student"}
        extra={reviewList && reviewAt >= 0 ? (
          <Space>
            <Typography.Text type="secondary" data-testid="verification.review-pos">{reviewAt + 1} of {reviewList.length}</Typography.Text>
            <Button size="small" icon={<RightOutlined />} onClick={nextInReview}>{reviewAt < reviewList.length - 1 ? "Next" : "Finish"}</Button>
          </Space>
        ) : null}>
        {!detail ? <Skeleton active paragraph={{ rows: 6 }} /> : (
          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            {(detail.sections || []).map((s) => <SectionReview key={s.section} section={s} learnerId={open} busy={busy} onVerify={doVerify} onSendBack={(sec) => { setReason(""); setSendingBack(sec); }} />)}
            {(detail.history || []).length > 0 && (
              <Card size="small" title="History">
                <Timeline items={detail.history.map((h) => ({
                  children: <span><b>{SECTION_LABEL[h.section]}</b> · {{ SUBMITTED: "sent by the student", UPDATE_SUBMITTED: "update sent by the student", VERIFIED: `verified by ${h.actorName || "the college"}`, SENT_BACK: `sent back by ${h.actorName || "the college"}` }[h.action] || h.action}{h.note ? `: ${h.note}` : ""} <Typography.Text type="secondary">{dj(h.createdAt).format("D MMM, h:mm A")}</Typography.Text></span>,
                }))} />
              </Card>
            )}
          </Space>
        )}
      </Drawer>

      <ActionsWindow testid="verification-actions" open={Boolean(acting)} onClose={() => setActing(null)} audience={acting?.audience || []} selected={Boolean(acting?.selected)}
        noun={CHECK} actions={actions} />
      {bulkElement}
      <Modal open={Boolean(sendingBack)} title={`Send ${SECTION_LABEL[sendingBack] || ""} back`} okText="Send back"
        confirmLoading={Boolean(sendingBack) && busy === `sb:${sendingBack}`}
        okButtonProps={{ danger: true, disabled: reason.trim().length < 3 || Boolean(busy) }}
        onCancel={() => { if (!busy) setSendingBack(null); }} onOk={doSendBack} destroyOnClose>
        <Typography.Paragraph type="secondary">The student sees your reason and fixes it on their profile.</Typography.Paragraph>
        <Space wrap style={{ marginBottom: 8 }}>{reasonsFor([sendingBack]).map((r) => <Button key={r} size="small" type={reason === r ? "primary" : "default"} onClick={() => setReason(r)}>{r}</Button>)}</Space>
        <Input.TextArea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Or write what needs to change" />
      </Modal>
    </div>
  );
}
