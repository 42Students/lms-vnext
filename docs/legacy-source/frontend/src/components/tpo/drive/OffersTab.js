import ReasonPicker, { reasonIsValid } from "../ui/ReasonPicker";
import { useMemo, useRef, useState } from "react";
import { Alert, Button, Dropdown, Form, Input, InputNumber, Modal, Select, Space, Tag, Tooltip, Typography, Upload, message } from "antd";
import { ThunderboltOutlined, UploadOutlined } from "@ant-design/icons";
import ActionsWindow from "../ui/ActionsWindow";
import OfferLettersModal from "./OfferLettersModal";
import { uploadFileViaPresign } from "@/utils/uploadToR2";
import { safeHref } from "@/utils/safeHref";
import { dj } from "@/components/tpo/dj";
import TpoDataTable from "../TpoDataTable";
import JourneyStrip from "../ui/JourneyStrip";
import useBulkAction from "../bulk/BulkAction";
import ImportPreviewModal from "../ImportPreviewModal";
import { fullName } from "../tpoFiles";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import {
  attachOfferLetter, bulkVerifyOffers, externalAcceptance, recordSelection, reverseAcceptance, setJoiningStatus, verifyAndReleaseOffer, withdrawOffer,
} from "@/api/Services/TpoService";
import { bulkNote, bulkNudge, commitSelectionsImport, offerToNextWaitlisted, previewOfferToNext, previewSelectionsImport } from "@/api/Services/TpoHubService";
import { plural } from "@/components/tpo/ui/labels";
import AsyncModal from "@/components/tpo/ui/AsyncModal";

const errorText = (res, fallback) => res?.data?.message || res?.data?.error || res?.message || fallback;
const STATUS = {
  SELECTED: ["Selected", "default"], PENDING_VERIFICATION: ["Verifying", "gold"], RELEASED: ["Released", "blue"], ACCEPTED: ["Accepted", "green"],
  DECLINED: ["Declined", "red"], EXPIRED: ["Expired", "default"], WITHDRAWN: ["Withdrawn by company", "orange"], REVOKED: ["Reversed", "default"],
};
const JOINING = { JOINED: "Joined", DEFERRED: "Deferred", NOT_JOINED: "Did not join" };
/** The same check Verify and release runs (the college's held-offer limit, uplift %, Dream drives); worked out on the server. */
const RULES = {
  HOLDS_THIS: ["Holds this offer", "green"], CLEAR: ["Clear to release", "green"], ALLOWED: ["Holds another, allowed", "gold"],
  BLOCKED: ["Blocked by your rules", "red"], NOT_COUNTED: ["Does not count as placed", "default"],
};
/** When the student has to answer, as the placement cell watches it. */
const respondWindow = (o) => {
  if (o.status !== "RELEASED" || !o.respondBy) return "NONE";
  const at = dj(o.respondBy);
  if (at.isBefore(dj())) return "OVERDUE";
  return at.isBefore(dj().add(48, "hour")) ? "SOON" : "LATER";
};
const RESPOND = [["SOON", "Within 48 hours"], ["LATER", "Later"], ["OVERDUE", "Time is up"], ["NONE", "Not waiting on the student"]];
/** The Offers filter side panel, in sections like the other tables. */
// The offers' journey: steps that nest, the work between them, and links beside.
const RELEASED_OR_LATER = ["RELEASED", "ACCEPTED", "DECLINED", "EXPIRED"];
export const OFFER_JOURNEY = [
  { key: "O_RELEASED", label: "Released", step: true, test: (o) => RELEASED_OR_LATER.includes(o.status) },
  { key: "O_ACCEPTED", label: "Accepted", step: true, test: (o) => o.status === "ACCEPTED" },
  { key: "O_JOINED", label: "Joined", step: true, test: (o) => o.status === "ACCEPTED" && o.joiningStatus === "JOINED" },
  { key: "O_GAP_VERIFY", label: "To verify and release", after: "O_ALL", test: (o) => ["SELECTED", "PENDING_VERIFICATION"].includes(o.status) },
  { key: "O_GAP_WAITING", label: "Waiting for the student", after: "O_RELEASED", test: (o) => o.status === "RELEASED" },
  { key: "O_GAP_JOINING", label: "Joining not recorded", after: "O_ACCEPTED", test: (o) => o.status === "ACCEPTED" && !o.joiningStatus },
  { key: "O_OVERDUE", label: "Time is up", extra: true, test: (o) => respondWindow(o) === "OVERDUE" },
  { key: "O_NO_LETTER", label: "Letter missing", extra: true, test: (o) => !o.letterUrl && !["WITHDRAWN", "REVOKED"].includes(o.status) },
  { key: "O_ENDED", label: "Declined, expired or withdrawn", extra: true, test: (o) => ["DECLINED", "EXPIRED", "WITHDRAWN", "REVOKED"].includes(o.status) },
];

export const offerFilterDefs = () => [
  { group: "Offer", key: "ojourney", label: "Journey", type: "checklist", panel: false, get: (o) => OFFER_JOURNEY.filter((j) => j.test(o)).map((j) => j.key),
    options: OFFER_JOURNEY.map((j) => ({ value: j.key, label: j.label })) },
  { group: "Offer", key: "status", label: "Status", type: "checklist", get: (o) => o.status, options: Object.entries(STATUS).map(([value, [label]]) => ({ value, label })) },
  { group: "Offer", key: "rules", label: "Rules check", type: "checklist", get: (o) => o.rulesCheck || "NONE",
    options: [...Object.entries(RULES).map(([value, [label]]) => ({ value, label })), { value: "NONE", label: "Closed" }] },
  { group: "Offer", key: "respond", label: "Student answers by", type: "checklist", get: respondWindow, options: RESPOND.map(([value, label]) => ({ value, label })) },
  { group: "Offer", key: "kind", label: "Type", type: "checklist", get: (o) => (o.kind === "LOI" ? "LOI" : "OFFER"), options: [{ value: "OFFER", label: "Offer" }, { value: "LOI", label: "Letter of intent" }] },
  { group: "Offer", key: "roleOption", label: "Package", type: "checklist", get: (o) => o.roleOption || "Not set" },
  { group: "Offer", key: "letter", label: "Letter", type: "yesno", get: (o) => Boolean(o.letterUrl), yes: "Attached", no: "Missing" },
  { group: "Offer", key: "joining", label: "Joining", type: "checklist", get: (o) => o.joiningStatus || "NONE",
    options: [...Object.entries(JOINING).map(([value, label]) => ({ value, label })), { value: "NONE", label: "Not recorded" }] },
  { group: "Student", key: "batch", label: "Batch", type: "checklist", get: (o) => o.batchName || "No batch" },
  { group: "Student", key: "branch", label: "Branch", type: "checklist", get: (o) => o.branch || "Not set" },
];
const fmtDate = (v) => (v ? dj(v).format("D MMM YYYY") : "To be announced");

/**
 * Offers tab (TPO V1 - Locked.docx §5): every offer with its type, role option and CTC, joining date, respond-by, letter,
 * status and placement-rules check; record selections one by one or by importing the company's list; verify and release;
 * company-reported acceptances; withdrawal, joining status, reversal within 48 hours, and offer to next waitlisted.
 */
const WITHDRAW_REASONS = ["Company withdrew the offer", "Company hiring freeze", "Role cancelled"];
const REVERSE_REASONS = ["Student asked to reverse", "Accepted by mistake", "Recorded against the wrong offer"];

export default function OffersTab({ job, offers, applicants, reload, onOpenStudent, readOnly }) {
  const [recording, setRecording] = useState(false);
  const [pickedCount, setPickedCount] = useState(0);
  // The drive's own role options (and their CTC) prefill the selection.
  const roleOptions = useMemo(() => (Array.isArray(job.roleOptionsJson) ? job.roleOptionsJson.filter((o) => o && o.name) : []), [job.roleOptionsJson]);
  // Students still in the drive with no offer yet: the likely selections, listed first.
  const offered = useMemo(() => new Set((offers || []).map((o) => o.applicationId)), [offers]);
  const finalists = useMemo(() => applicants.filter((a) => !["REJECTED", "WITHDRAWN", "WAITLISTED", "APPLIED"].includes(a.stage) && !offered.has(a.applicationId)), [applicants, offered]);
  const selectionOptions = useMemo(() => {
    const rest = applicants.filter((a) => !["REJECTED", "WITHDRAWN"].includes(a.stage) && !offered.has(a.applicationId) && !finalists.includes(a));
    return [...finalists.map((a) => ({ value: a.applicationId, label: `${fullName(a)} · ${a.rollNumber || ""} · still in the drive` })),
      ...rest.map((a) => ({ value: a.applicationId, label: `${fullName(a)} · ${a.rollNumber || ""}` }))];
  }, [applicants, offered, finalists]);
  const openRecording = (ids) => {
    if (readOnly) return;
    form.resetFields();
    const first = roleOptions[0];
    form.setFieldsValue({ kind: "OFFER", applicationIds: Array.isArray(ids) ? ids : [], roleOptionName: first?.name, ctcLpa: first?.ctcLpa != null ? Number(first.ctcLpa) : undefined });
    setPickedCount(Array.isArray(ids) ? ids.length : 0);
    setRecording(true);
  };
  const [importing, setImporting] = useState(false);
  const [letterFor, setLetterFor] = useState(null);
  const [letterUrl, setLetterUrl] = useState("");
  const [lettersOpen, setLettersOpen] = useState(false);
  const [uploadingLetter, setUploadingLetter] = useState(false);
  const [reasonFor, setReasonFor] = useState(null); // { kind: "withdraw" | "reverse", offer }
  const [reason, setReason] = useState("");
  const [form] = Form.useForm();
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const recordingRef = useRef(false);
  const uploadingLetterRef = useRef(false);
  const [busyId, setBusyId] = useState(null); // the one row whose action is running (every row used to spin together)
  const [filters, setFilters] = useState({});
  const [acting, setActing] = useState(null); // the Actions window: { audience, selected, clear }
  const filterDefs = useMemo(() => offerFilterDefs(), []);

  const act = async (label, call, offerId) => {
    if (readOnly || busyRef.current) return null;
    busyRef.current = true;
    setBusy(true); setBusyId(offerId ?? null);
    try {
      const res = await fetchWithErrorHandling(call);
      if (!res.success) { message.error(errorText(res, `${label} failed`)); return null; }
      message.success(label);
      reload();
      return res.data;
    } finally {
      busyRef.current = false;
      setBusy(false);
      setBusyId(null);
    }
  };

  const toVerify = offers.filter((o) => ["SELECTED", "PENDING_VERIFICATION"].includes(o.status));
  // The Actions window (docs/tpo-ux/BEST-VERSION-PROGRAMME-2026-10-05.md): every action over the offers shown or the ones ticked.
  const done = () => { acting?.clear?.(); reload(); };
  const students = (list) => [...new Map(list.map((o) => [o.learnerId, o])).values()];
  const textField = (placeholder) => <Form.Item name="text" rules={[{ required: true, whitespace: true, message: "Write the message" }]}><Input.TextArea rows={4} maxLength={1000} placeholder={placeholder} /></Form.Item>;
  const offerActions = [
    { group: "Offers", key: "release", title: "Verify and release", help: "Each is checked against your Placement rules on its own; a blocked one is named and the rest go out. Students see their offer and have at least 48 hours to answer.",
      skip: (o) => (["SELECTED", "PENDING_VERIFICATION"].includes(o.status) ? null : "Already released or closed"),
      run: (list) => startBulk({ title: "Verify and release", noun: ["offer", "offers"], items: list, nameOf: fullName,
        ack: "I have checked these offers. Students see them straight away and are asked to answer.",
        consequence: "Each student sees their offer and has at least 48 hours to respond.", undoNote: "A released offer can be withdrawn one by one, with a reason the student sees.",
        run: (items) => fetchWithErrorHandling(bulkVerifyOffers(items.map((o) => o.offerId))),
        partial: (res, items) => (res.data?.failed || []).map((f) => ({ item: items.find((o) => o.offerId === f.offerId), reason: f.reason })).filter((f) => f.item),
        onDone: done }) },
    { group: "Offers", key: "letters", title: "Attach offer letters", whole: true, help: `Match the letters ${job.companyName} sent to the students, in one go. ${offers.filter((o) => !o.letterUrl).length} offers have no letter yet.`,
      button: () => "Open the letters window…", run: () => setLettersOpen(true) },
    { group: "Talk to them", key: "remind", title: "Remind them to answer", help: "Students whose offer is released and waiting for their answer get a reminder in the app.",
      skip: (o) => (o.status === "RELEASED" ? null : "Not waiting for the student"),
      fields: textField(""), initialValues: { text: `Please accept or decline your ${job.companyName} offer before it expires.` },
      run: (list, v) => startBulk({ title: "Remind to answer", noun: ["student", "students"], items: students(list), nameOf: fullName, consequence: `They see: "${v.text.trim()}"`,
        undoNote: "A sent message cannot be taken back.", run: (items) => fetchWithErrorHandling(bulkNudge(items.map((o) => o.learnerId), v.text.trim())), onDone: done }) },
    { group: "Talk to them", key: "message", title: "Send a message", help: "One message per student, even with two offers. They see it in the app.",
      fields: textField(`About your ${job.companyName} offer…`),
      run: (list, v) => startBulk({ title: "Send message", noun: ["student", "students"], items: students(list), nameOf: fullName, consequence: `They see: "${v.text.trim()}"`,
        undoNote: "A sent message cannot be taken back.", run: (items) => fetchWithErrorHandling(bulkNudge(items.map((o) => o.learnerId), v.text.trim())), onDone: done }) },
    { group: "Notes", key: "note", title: "Add a note", help: "The same note on each student's record, for the placement team only.",
      fields: <Form.Item name="note" rules={[{ required: true, whitespace: true, message: "Write the note" }]}><Input.TextArea rows={3} maxLength={1000} placeholder={`e.g. ${job.companyName} confirmed joining dates by mail`} /></Form.Item>,
      run: (list, v) => startBulk({ title: "Add note", noun: ["student", "students"], items: students(list), nameOf: fullName, consequence: `"${v.note.trim()}" is added to each student's record.`,
        undoNote: "Notes stay on the record.", run: (items) => fetchWithErrorHandling(bulkNote(items.map((o) => o.learnerId), v.note.trim())), onDone: done }) },
  ];
  // One call: each selection is checked against the placement rules on its own, so one that is blocked does not stop the rest.
  const [startBulk, bulkElement] = useBulkAction();
  const verifyMany = async (list) => {
    if (readOnly || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const res = await fetchWithErrorHandling(bulkVerifyOffers(list.map((o) => o.offerId)));
      if (!res.success) { message.error(errorText(res, "Could not verify the selections")); return; }
      const released = res.data?.released || [];
      const failed = res.data?.failed || [];
      const nameOf = (id) => fullName(offers.find((o) => o.offerId === id) || {}) || `Offer ${id}`;
      if (failed.length) {
        Modal.warning({ title: `${released.length} released, ${failed.length} not released`, content: (
          <Space direction="vertical" size={4}>{failed.map((f) => <Typography.Text key={f.offerId}><b>{nameOf(f.offerId)}</b>: {f.reason}</Typography.Text>)}</Space>
        ) });
      } else message.success(`${released.length} offer${released.length === 1 ? "" : "s"} released`);
      reload();
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };
  const verifyAll = () => Modal.confirm({
    title: `Verify and release ${plural(toVerify.length, "offer")}?`,
    content: "Each is checked against the placement rules first. Students are told when their offer is released. This is not an undo.",
    okText: "Verify and release",
    onOk: () => verifyMany(toVerify),
  });

  const rulesCheck = (o) => {
    const r = RULES[o.rulesCheck];
    if (!r) return <Typography.Text type="secondary">-</Typography.Text>;
    const held = (o.heldWith || []).length ? `Holds an offer from ${o.heldWith.join(", ")}.` : "";
    const why = { ALLOWED: `${held} Your rules allow it (held-offer limit, uplift or a Dream drive).`, BLOCKED: `${held} Release is refused: your held-offer limit and uplift % (Settings > Placement rules).`,
      NOT_COUNTED: "This drive's job type does not count as placed, so the held-offer rules do not apply.", CLEAR: "Holds no other offer." }[o.rulesCheck];
    return <Tooltip title={why}><Tag color={r[1]}>{r[0]}</Tag></Tooltip>;
  };

  const menuFor = (o) => {
    if (readOnly) return { items: [] };
    const items = [];
    if (["SELECTED", "PENDING_VERIFICATION"].includes(o.status)) items.push({ key: "v", label: "Verify and release", onClick: () => act("Offer released", verifyAndReleaseOffer(o.offerId), o.offerId) });
    if (!o.letterUrl) items.push({ key: "l", label: "Attach letter", onClick: () => { setLetterUrl(""); setLetterFor(o); } });
    if (o.status === "RELEASED") items.push({ key: "x", label: "Company says accepted", onClick: () => act("Recorded as accepted (reported). It takes effect after the student's 48 hour dispute window.", externalAcceptance(o.offerId), o.offerId) });
    if (["RELEASED", "ACCEPTED"].includes(o.status)) items.push({ key: "w", label: "Company withdrew this offer", onClick: () => { setReason(""); setReasonFor({ kind: "withdraw", offer: o }); } });
    if (o.status === "ACCEPTED") {
      items.push({ key: "r", label: "Reverse acceptance (within 48 h)", onClick: () => { setReason(""); setReasonFor({ kind: "reverse", offer: o }); } });
      Object.entries(JOINING).forEach(([k, label]) => items.push({ key: `j${k}`, label: `Joining: ${label}`, onClick: () => act(`Joining status: ${label}`, setJoiningStatus(o.offerId, k), o.offerId) }));
    }
    if (["DECLINED", "EXPIRED", "WITHDRAWN", "REVOKED"].includes(o.status)) {
      // Waitlist Promotion Preview (Placements UX pass): this used to just fire and explain itself
      // afterward. Now it shows exactly who is next - and who ahead of them is skipped and why -
      // before the TPO commits to freeing the seat, using the same ranking/skip logic the real
      // action runs (previewOfferToNext and offerToNext share one backend method).
      items.push({ key: "n", label: "Offer to next waitlisted", onClick: async () => {
        const res = await fetchWithErrorHandling(previewOfferToNext(o.offerId));
        if (!res.success) { message.error(errorText(res, "Could not check the waitlist")); return; }
        const preview = res.data || { candidates: [] };
        const candidates = preview.candidates || [];
        Modal.confirm({
          title: candidates.length === 0 ? "The waitlist is empty" : preview.nextEligible?.applicationId ? `Offer to ${preview.nextEligible.name}?` : "Everyone on the waitlist is blocked",
          content: candidates.length === 0 ? "No one is waitlisted on this drive." : (
            <Space direction="vertical" size={4} style={{ width: "100%" }}>
              {candidates.map((c) => (
                <Typography.Text key={c.applicationId}>
                  Rank #{c.rank} · {c.name}{c.eligible ? <Tag color="green" style={{ marginLeft: 8 }}>Next eligible</Tag> : <Tag color="red" style={{ marginLeft: 8 }}>Skipped: {c.reason}</Tag>}
                </Typography.Text>
              ))}
            </Space>
          ),
          okText: "Offer to next waitlisted",
          okButtonProps: { disabled: !preview.nextEligible?.applicationId },
          onOk: async () => {
            const data = await act("Checked the waitlist", offerToNextWaitlisted(o.offerId));
            if (data) {
              const skipped = (data.skipped || []).length ? ` ${data.skipped.length} skipped: ${data.skipped.map((s) => `${s.name} (${s.reason})`).join(", ")}.` : "";
              Modal.info({ title: data.offered ? `Offered to ${data.name}` : "No one to offer to", content: (data.offered ? "A new selected offer was created. Verify and release it when you are ready." : "The waitlist is empty or everyone is blocked by the rules.") + skipped });
            }
          },
        });
      } });
    }
    return { items };
  };

  const columns = [
    { title: "Student", key: "student", render: (_, o) => <Button type="link" size="small" style={{ padding: 0, height: "auto" }} onClick={() => onOpenStudent(o.learnerId)}>{fullName(o)}</Button>, exportValue: fullName },
    { title: "Roll", dataIndex: "rollNumber", sortable: true, key: "roll" },
    { title: "Batch", dataIndex: "batchName", key: "batch", defaultHidden: new Set(offers.map((o) => o.batchName)).size <= 1 },
    { title: "Branch", dataIndex: "branch", key: "branch" },
    { title: "Type", dataIndex: "kind", key: "kind", defaultHidden: !offers.some((o) => o.kind === "LOI"), render: (v) => (v === "LOI" ? "Letter of intent" : "Offer") },
    { title: "Package", dataIndex: "roleOption", key: "roleOption", defaultHidden: new Set(offers.map((o) => o.roleOption)).size <= 1, render: (v) => v || "-" },
    { title: "CTC (LPA)", dataIndex: "ctcLpa", sortable: true, key: "ctc", align: "right", render: (v) => (v == null ? "-" : v) },
    { title: "Fixed (LPA)", dataIndex: "fixedLpa", sortable: true, key: "fixed", align: "right", defaultHidden: true, render: (v) => (v == null ? "-" : v) },
    { title: "Variable (LPA)", dataIndex: "variableLpa", sortable: true, key: "variable", align: "right", defaultHidden: true, render: (v) => (v == null ? "-" : v) },
    { title: "Joining", dataIndex: "joiningDate", sortable: true, key: "joining", render: fmtDate, exportValue: (o) => fmtDate(o.joiningDate) },
    {
      title: "Respond by", dataIndex: "respondBy", key: "respondBy",
      sorter: (a, b) => (a.respondBy ? dj(a.respondBy).valueOf() : Infinity) - (b.respondBy ? dj(b.respondBy).valueOf() : Infinity),
      render: (v, o) => {
        if (!v) return "-";
        const w = respondWindow(o);
        // While the student still has to answer: how long is left, in red once the time is up.
        return (
          <span>
            {dj(v).format("D MMM, h:mm A")}
            {w === "OVERDUE" && <Typography.Text type="danger"> · time is up</Typography.Text>}
            {w === "SOON" && <Typography.Text type="warning"> · {Math.max(1, Math.round(dj(v).diff(dj(), "hour", true)))} h left</Typography.Text>}
          </span>
        );
      },
    },
    { title: "Released", dataIndex: "releasedAt", sortable: true, key: "releasedAt", defaultHidden: true, render: (v) => (v ? dj(v).format("D MMM, h:mm A") : "-") },
    { title: "Answered", dataIndex: "respondedAt", sortable: true, key: "respondedAt", defaultHidden: true, render: (v) => (v ? dj(v).format("D MMM, h:mm A") : "-") },
    { title: "Email", dataIndex: "email", key: "email", defaultHidden: true },
    { title: "Phone", dataIndex: "phone", key: "phone", defaultHidden: true },
    { title: "Letter", dataIndex: "letterUrl", key: "letter", render: (v) => (safeHref(v) ? <a href={safeHref(v)} target="_blank" rel="noreferrer">Open</a> : v ? <Typography.Text type="danger">Invalid link</Typography.Text> : <Typography.Text type="secondary">Pending</Typography.Text>), exportValue: (o) => (o.letterUrl ? "Yes" : "Pending") },
    {
      title: "Status", key: "status", exportValue: (o) => (STATUS[o.status] || [o.status])[0],
      render: (_, o) => (
        <Space direction="vertical" size={0}>
          <Tag color={(STATUS[o.status] || [])[1]}>{o.status === "ACCEPTED" && o.acceptanceChannel === "EXTERNAL_IMPORT" && o.disputableUntil && dj(o.disputableUntil).isAfter(dj()) ? "Accepted (reported)" : (STATUS[o.status] || [o.status])[0]}</Tag>
          {o.joiningStatus && <Typography.Text type="secondary">{JOINING[o.joiningStatus]}</Typography.Text>}
        </Space>
      ),
    },
    { title: "Rules check", key: "rules", width: 220, headerFilterKey: "rules", render: (_, o) => rulesCheck(o), exportValue: (o) => (RULES[o.rulesCheck] || ["-"])[0] },
    { title: "", key: "actions", render: (_, o) => <Dropdown disabled={readOnly} menu={menuFor(o)} trigger={["click"]}><Button size="small" disabled={readOnly} loading={busyId === o.offerId}>Actions</Button></Dropdown> },
  ];

  return (
    <div className="tpo-drive-offers">
      <Space className="tpo-drive-offers__toolbar" wrap style={{ marginBottom: 12 }}>
        <Button type="primary" disabled={readOnly} onClick={openRecording}>Record a selection</Button>
        <Button disabled={readOnly} onClick={() => setImporting(true)}>Import the company&apos;s selection list</Button>
        <Tooltip title={toVerify.length === 0 ? "Nothing is waiting to be verified" : ""}>
          <Button disabled={toVerify.length === 0 || readOnly} onClick={verifyAll}>Verify and release {toVerify.length || ""}</Button>
        </Tooltip>
        <Button icon={<UploadOutlined />} disabled={readOnly || offers.filter((o) => !o.letterUrl).length === 0} onClick={() => setLettersOpen(true)}>Attach letters ({offers.filter((o) => !o.letterUrl).length} missing)</Button>
      </Space>
      <Typography.Paragraph type="secondary" className="tpo-drive-offers__info">Students see an offer only when you release it. The respond-by time is at least 48 hours and never ends on a Sunday or holiday.</Typography.Paragraph>
      <TpoDataTable data={offers} rowKey="offerId" columns={columns} exportName={`offers-${job.companyName}`} searchOf={(o) => `${fullName(o)} ${o.rollNumber} ${o.roleOption || ""} ${o.branch || ""} ${o.email || ""}`}
        filterDefs={filterDefs} filterState={filters} onFilterChange={setFilters} filterTitle="Filter offers" viewScope="OFFERS"
        top={offers.length > 0 && (() => {
          const n = (j) => offers.filter((o) => j.test(o)).length;
          const picked = (filters.ojourney || []).length === 1 ? filters.ojourney[0] : null;
          const pick = (key) => setFilters((f) => { const next = { ...f }; delete next.ojourney; if (key !== "O_ALL" && key !== picked) next.ojourney = [key]; return next; });
          return (
            <JourneyStrip testid="ojourney" caption={`The ${plural(offers.length, "offer")} of this drive`} picked={picked} onPick={pick}
              steps={[{ key: "O_ALL", label: "Selected", n: offers.length, all: true }, ...OFFER_JOURNEY.filter((j) => j.step).map((j) => ({ key: j.key, label: j.label, n: n(j) }))]}
              gaps={Object.fromEntries(OFFER_JOURNEY.filter((j) => j.after).map((j) => [j.after, { key: j.key, label: j.label, n: n(j) }]))}
              extras={OFFER_JOURNEY.filter((j) => j.extra).map((j) => ({ key: j.key, label: j.label, n: n(j) }))} />
          );
        })()}
        emptyTitle={finalists.length ? `${finalists.length} still in the drive` : "No offers yet"}
        emptySubtitle={finalists.length ? `${finalists.slice(0, 3).map(fullName).join(", ")}${finalists.length > 3 ? " and others" : ""} cleared the rounds so far. Record who the company selected.` : "Record a selection once results are in to create one."}
        emptyCtaLabel={finalists.length && !readOnly ? `Record selection for ${finalists.length}` : undefined}
        onEmptyCta={finalists.length && !readOnly ? () => openRecording(finalists.map((a) => a.applicationId)) : undefined}
        act={readOnly ? undefined : (shown, selected, clear) => {
          const audience = selected.length ? selected : shown;
          return (
            <>
              <span className="tpo-elig__act-text">
                {selected.length ? <><strong>{selected.length}</strong> selected of {shown.length}</> : <><strong>{shown.length}</strong> {shown.length === 1 ? "offer" : "offers"} in this view</>}
              </span>
              <Button type={selected.length ? "primary" : "default"} icon={<ThunderboltOutlined />} style={audience.length === 0 ? { display: "none" } : undefined} disabled={audience.length === 0} data-testid="offers.act"
                onClick={() => setActing({ audience, selected: selected.length > 0, clear })}>
                {selected.length ? `Act on ${selected.length} selected` : `Act on all ${shown.length}`}
              </Button>
            </>
          );
        }} />

      {bulkElement}
      <ActionsWindow testid="offer-actions" open={Boolean(acting)} onClose={() => setActing(null)} audience={acting?.audience || []} selected={Boolean(acting?.selected)}
        noun={["offer", "offers"]} nameOf={fullName} actions={offerActions} />
      <Modal open={recording} title="Record a selection" onCancel={() => { if (!recordingRef.current) setRecording(false); }} destroyOnClose confirmLoading={busy}
        okText={`Record ${pickedCount > 1 ? `${pickedCount} selections` : "selection"}`}
        onOk={async () => {
          try {
            const v = await form.validateFields();
            const ids = Array.isArray(v.applicationIds) ? v.applicationIds : [v.applicationIds];
            if (recordingRef.current || busyRef.current) return;
            recordingRef.current = true;
            busyRef.current = true;
            setBusy(true);
            const failed = [];
            try {
              for (const id of ids) {
                // eslint-disable-next-line no-await-in-loop
                const res = await fetchWithErrorHandling(recordSelection({ applicationId: id, roleOptionName: v.roleOptionName || "Default", ctcLpa: v.ctcLpa, kind: v.kind }));
                if (!res.success) failed.push({ id, reason: errorText(res, "could not be recorded") });
              }
            } finally {
              recordingRef.current = false;
              busyRef.current = false;
              setBusy(false);
            }
            reload();
            if (failed.length) {
              const failedIds = failed.map((item) => item.id);
              form.setFieldsValue({ applicationIds: failedIds });
              setPickedCount(failedIds.length);
              Modal.warning({
                title: `${ids.length - failed.length} of ${ids.length} recorded`,
                content: (
                  <ul>{failed.map((item) => <li key={item.id}>{fullName(applicants.find((a) => a.applicationId === item.id) || {})}: {item.reason}</li>)}</ul>
                ),
              });
              return;
            }
            message.success(ids.length > 1 ? `${ids.length} selections recorded` : "Selection recorded");
            setRecording(false);
          } catch (_) { /* validation */ }
        }}>
        <Form form={form} layout="vertical" initialValues={{ kind: "OFFER" }} onValuesChange={(_, all) => setPickedCount((all.applicationIds || []).length)}>
          <Form.Item name="applicationIds" label="Students" rules={[{ required: true, message: "Pick at least one student" }]}
            extra={finalists.length ? "Students still in the drive come first." : undefined}>
            <Select mode="multiple" showSearch optionFilterProp="label" placeholder="Pick the selected students" options={selectionOptions} />
          </Form.Item>
          <Form.Item name="kind" label="Type"><Select options={[{ value: "OFFER", label: "Offer" }, { value: "LOI", label: "Letter of intent" }]} /></Form.Item>
          {roleOptions.length > 0 ? (
            <Form.Item name="roleOptionName" label="Package">
              <Select options={roleOptions.map((o) => ({ value: o.name, label: o.ctcLpa != null ? `${o.name} · ${o.ctcLpa} LPA` : o.name }))}
                onChange={(name) => { const o = roleOptions.find((x) => x.name === name); if (o?.ctcLpa != null) form.setFieldsValue({ ctcLpa: Number(o.ctcLpa) }); }} />
            </Form.Item>
          ) : <Form.Item name="roleOptionName" label="Package"><Input placeholder="e.g. Digital" /></Form.Item>}
          <Form.Item name="ctcLpa" label="CTC (LPA)"><InputNumber min={0} step={0.5} style={{ width: "100%" }} /></Form.Item>
        </Form>
      </Modal>

      <ImportPreviewModal open={importing} title="Import the company's selection list" onClose={() => setImporting(false)}
        allowed={["applicantId", "companyId", "email", "roll", "phone", "roleOption", "ctcLpa", "kind"]}
        help="Each row becomes a Selected offer. Identify each student by 42LMS applicant ID, company ID, email or roll number. Optional columns: package (roleOption), CTC, and type (OFFER or LOI). Letters can be attached later."
        template={{ name: "selections-template", headings: ["roll", "email", "roleOption", "ctcLpa", "kind"], example: ["21CS001", "", "Digital", "7.5", "OFFER"] }}
        preview={(rows) => previewSelectionsImport(job.id, rows)} commit={(rows) => commitSelectionsImport(job.id, rows)}
        groups={[{ key: "matched", label: "Matched", tone: "green" }, { key: "unmatched", label: "Unmatched", tone: "red" }]}
        matchedColumns={[{ title: "Name", dataIndex: "name" }, { title: "Stage now", dataIndex: "stage" }]}
        onDone={() => { setImporting(false); reload(); }} />

      <OfferLettersModal open={lettersOpen} offers={offers.filter((o) => !o.letterUrl)} onClose={() => setLettersOpen(false)}
        onDone={(n, partial) => { message[partial ? "warning" : "success"](`${n} letter${n === 1 ? "" : "s"} attached`); reload(); if (!partial) setLettersOpen(false); }} />

      <AsyncModal open={Boolean(letterFor)} title="Attach the offer letter" onCancel={() => { if (!uploadingLetterRef.current && !busyRef.current) setLetterFor(null); }} okButtonProps={{ disabled: !/^https?:\/\//.test(letterUrl) }}
        onOk={async () => { if (await act("Letter attached", attachOfferLetter(letterFor.offerId, letterUrl)) !== null) setLetterFor(null); }}>
        <Typography.Paragraph type="secondary">Upload the letter (PDF, PNG or JPG), or paste a link. Verifying does not need it: a letter can be attached later.</Typography.Paragraph>
        <Upload accept=".pdf,.png,.jpg,.jpeg" maxCount={1} showUploadList={false} disabled={uploadingLetter}
          beforeUpload={async (file) => {
            if (uploadingLetterRef.current) return false;
            uploadingLetterRef.current = true;
            setUploadingLetter(true);
            try {
              const up = await uploadFileViaPresign(file, { folder: "offer-letters", type: "generic" });
              if (await act("Letter attached", attachOfferLetter(letterFor.offerId, up.publicUrl)) !== null) setLetterFor(null);
            } catch (e) { message.error(e?.message || "Could not upload the letter"); } finally { uploadingLetterRef.current = false; setUploadingLetter(false); }
            return false;
          }}>
<Button icon={<UploadOutlined />} loading={uploadingLetter} disabled={uploadingLetter}>Upload the letter</Button>
        </Upload>
        <Typography.Paragraph type="secondary" style={{ margin: "12px 0 4px" }}>or paste a link</Typography.Paragraph>
        <Input placeholder="https://" value={letterUrl} onChange={(e) => setLetterUrl(e.target.value)} />
      </AsyncModal>

      <AsyncModal open={Boolean(reasonFor)} onCancel={() => { if (!busyRef.current) setReasonFor(null); }} okButtonProps={{ danger: true, disabled: !reasonIsValid(reason, reasonFor?.kind === "withdraw" ? WITHDRAW_REASONS : REVERSE_REASONS) }}
        title={reasonFor?.kind === "withdraw" ? "The company withdrew this offer" : "Reverse this acceptance"} okText="Confirm"
        onOk={async () => {
          const { kind, offer } = reasonFor;
          // Withdrawing/reversing used to close this before the server confirmed, so a failure
          // silently discarded the typed reason with no way to retry it in context.
          const ok = await act(kind === "withdraw" ? "Offer withdrawn. The student is un-placed and unblocked." : "Acceptance reversed. Withdrawn applications are restored.",
            kind === "withdraw" ? withdrawOffer(offer.offerId, reason.trim()) : reverseAcceptance(offer.offerId, reason.trim()));
          if (ok !== null) setReasonFor(null);
        }}>
        <Typography.Paragraph type="secondary">{reasonFor?.kind === "withdraw" ? "The student is un-placed and any applications we withdrew are restored." : "This works within 48 hours of the acceptance. It is logged."}</Typography.Paragraph>
        <ReasonPicker reasons={reasonFor?.kind === "withdraw" ? WITHDRAW_REASONS : REVERSE_REASONS} value={reason} onChange={setReason} />
      </AsyncModal>
    </div>
  );
}
