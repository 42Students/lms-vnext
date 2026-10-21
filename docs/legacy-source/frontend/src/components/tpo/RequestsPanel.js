import { safeHref } from "@/utils/safeHref";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, Form, Input, Modal, Segmented, Space, Tag, Tooltip, Typography, message } from "antd";
import { ThunderboltOutlined } from "@ant-design/icons";
import ReasonPicker, { reasonIsValid } from "./ui/ReasonPicker";
import ActionsWindow from "./ui/ActionsWindow";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { dj } from "@/components/tpo/dj";
import AsyncModal from "@/components/tpo/ui/AsyncModal";

dayjs.extend(relativeTime);
import { PanelError } from "@/components/Common/PanelStates";
import TpoDataTable from "./TpoDataTable";
import useBulkAction from "./bulk/BulkAction";
import useUrlFilters from "./filters/useUrlFilters";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { decideRequest } from "@/api/Services/TpoService";
import { bulkNudge, getRequestsQueue } from "@/api/Services/TpoHubService";
import { fullName } from "./tpoFiles";

export const REQUEST_TYPES = {
  WITHDRAWAL: "Withdrawal", OFFER_EXTENSION: "Offer extension", REGISTRATION_CHANGE: "Registration change",
  ABSENCE_DISPUTE: "Absence dispute", CORRECTION: "Correction with proof", EXTERNAL_OFFER: "Off-campus offer", PAP: "Placement after placement",
};

/** One tap for the routine rejections; "Other" opens a text box. */
export const REJECT_REASONS = ["Not eligible", "Proof missing or unclear", "Deadline has passed", "Policy does not allow it", "Duplicate request"];
const APPROVE_NOTE = "Approved by the placement cell";
const CHOICE = { PLACEMENTS: "Looking for a job", HIGHER_STUDIES: "Higher studies", ENTREPRENEURSHIP: "Entrepreneurship", COMPETITIVE_EXAMS: "Competitive exams", NOT_INTERESTED: "Not interested" };

/** What the student sent with the request (offer company and CTC, the field to correct, proof links), which the queue never showed. */
export function requestPayload(r) {
  if (!r?.payload) return {};
  if (typeof r.payload === "object") return r.payload;
  try { return JSON.parse(r.payload) || {}; } catch (_) { return {}; }
}

export function RequestDetails({ request }) {
  const p = requestPayload(request);
  const bits = [];
  if (p.choice) bits.push(<span key="c">Wants: <b>{CHOICE[p.choice] || p.choice}</b></span>);
  if (p.companyName) bits.push(<span key="co"><b>{p.companyName}</b>{p.ctcLpa != null ? ` · ${p.ctcLpa} LPA` : ""}</span>);
  if (p.field) bits.push(<span key="f">Correct: <b>{p.field}</b></span>);
  // The student typed this link: only a web address becomes a link (a javascript: value would run in the placement cell's session).
  const raw = p.letterUrl || p.proofUrl;
  const link = safeHref(raw);
  if (link) bits.push(<a key="l" href={link} target="_blank" rel="noopener noreferrer">{p.letterUrl ? "Offer letter" : "Proof"}</a>);
  else if (raw) bits.push(<span key="l">{p.letterUrl ? "Offer letter" : "Proof"}: not a web link</span>);
  return (
    <div className="tpo-student-requests__details">
      {bits.length > 0 && <div className="tpo-student-requests__payload">{bits.reduce((acc, b, i) => (i ? [...acc, " · ", b] : [b]), [])}</div>}
      <Typography.Text type={request.reason ? undefined : "secondary"}>{request.reason || "No reason given"}</Typography.Text>
      {request.type === "CORRECTION" && !link && <Typography.Text type="warning" className="tpo-student-requests__noproof">No proof attached</Typography.Text>}
    </div>
  );
}

/** Approving these changes a student's record; the rest are routine and stay one tap. */
export function approveConsequence(r) {
  const p = requestPayload(r);
  switch (r.type) {
    case "WITHDRAWAL": return `${fullName(r)} leaves ${r.drive || "this drive"}. Their application is withdrawn.`;
    case "EXTERNAL_OFFER": return `${fullName(r)} is recorded as placed off campus${p.companyName ? ` at ${p.companyName}` : ""}${p.letterUrl ? "" : ". No offer letter is attached"}.`;
    case "REGISTRATION_CHANGE": return `${fullName(r)}'s registration changes${p.choice ? ` to ${CHOICE[p.choice] || p.choice}` : ""}.`;
    case "PAP": return `${fullName(r)} can apply to drives again after being placed.`;
    default: return null;
  }
}

// The student's After college choice, in the same words as the Students page.
const REG_LABEL = { PLACEMENTS: "Looking for a job", HIGHER_STUDIES: "Higher studies", ENTREPRENEURSHIP: "Entrepreneurship", COMPETITIVE_EXAMS: "Competitive exams", NOT_INTERESTED: "Not interested", NOT_REGISTERED: "Not decided yet" };
const STATUS_LABEL = { APPROVED: ["Approved", "green"], AUTO_APPROVED: ["Approved (drive closed)", "green"], REJECTED: ["Rejected", "red"] };
const truthy = (v) => v === true || v === 1 || v === "1";

/**
 * Urgent: escalated already, or the drive's next round is within 24 hours (a withdrawal before tomorrow's interview).
 * Pure so the order is testable.
 */
const STATUS_FILTER = { PENDING: "Waiting", APPROVED: "Approved", AUTO_APPROVED: "Approved (drive closed)", REJECTED: "Rejected" };
const NO_DEFS = [];

const WAITING = [["TODAY", "Asked today"], ["DAYS", "1-2 days"], ["LONG", "More than 2 days"]];
const waitingSince = (r) => {
  const at = dj(r.createdAt);
  return at.isAfter(dj().startOf("day")) ? "TODAY" : at.isAfter(dj().subtract(2, "day")) ? "DAYS" : "LONG";
};
/** Proof the decision can rest on: an offer letter or a proof link, where the request type takes one. */
const proofOf = (r) => {
  if (!["CORRECTION", "EXTERNAL_OFFER"].includes(r.type)) return "NOT_NEEDED";
  const p = requestPayload(r);
  return p.letterUrl || p.proofUrl ? "ATTACHED" : "MISSING";
};

/** The Requests filter side panel (filters/filterModel), in sections: the request, and the student. */
export function requestFilterDefs() {
  const R = "Request"; const S = "Student";
  return [
    { group: R, key: "type", label: "Request", type: "checklist", get: (r) => r.type, options: Object.entries(REQUEST_TYPES).map(([value, label]) => ({ value, label })) },
    { group: R, key: "urgent", label: "Urgent (a round within 24 hours)", type: "yesno", get: (r) => isUrgent(r) },
    { group: R, key: "status", label: "Status", type: "checklist", get: (r) => r.status, options: Object.entries(STATUS_FILTER).map(([value, label]) => ({ value, label })) },
    { group: R, key: "waiting", label: "Waiting since", type: "checklist", get: waitingSince, options: WAITING.map(([value, label]) => ({ value, label })) },
    { group: R, key: "proof", label: "Proof", type: "checklist", get: proofOf,
      options: [{ value: "ATTACHED", label: "Attached" }, { value: "MISSING", label: "Missing" }, { value: "NOT_NEEDED", label: "Not needed for this request" }] },
    { group: R, key: "drive", label: "Drive", type: "checklist", get: (r) => r.drive || "Not about a drive" },
    { group: S, key: "branch", label: "Branch", type: "checklist", get: (r) => r.branch || "Not set" },
    { group: S, key: "registration", label: "After college", type: "checklist", get: (r) => r.registration || "NOT_REGISTERED",
      options: Object.entries(REG_LABEL).map(([value, label]) => ({ value, label })) },
  ];
}

// What needs doing in the queue, as links (docs/tpo-ux/BEST-VERSION-PROGRAMME-2026-10-05.md): each is a filter of the side panel,
// highlighted only when picked; a second click clears it. The queue is not a funnel, so there is no strip of steps.
const TYPE_HELP = {
  WITHDRAWAL: "Each student leaves the drive; their application is withdrawn.", EXTERNAL_OFFER: "Each student is recorded as placed off campus.",
  REGISTRATION_CHANGE: "Each student's After college choice changes to what they asked.", PAP: "Each student can apply to drives again after being placed.",
  OFFER_EXTENSION: "Each student gets the extra time they asked for on their offer.", ABSENCE_DISPUTE: "The absence is struck off each student's record.",
  CORRECTION: "The correction each student asked for is made.",
};
const WORK = [
  { key: "urgent", label: "Urgent: a round within 24 hours", filter: { urgent: "yes" }, n: (rows) => rows.filter((r) => isUrgent(r)).length },
  { key: "long", label: "Waiting more than 2 days", filter: { waiting: ["LONG"] }, n: (rows) => rows.filter((r) => r.status === "PENDING" && waitingSince(r) === "LONG").length },
  { key: "proof", label: "Proof missing", filter: { proof: ["MISSING"] }, n: (rows) => rows.filter((r) => r.status === "PENDING" && proofOf(r) === "MISSING").length },
];

export function isUrgent(r, now = dj()) {
  if (r.status !== "PENDING") return false;
  if (r.escalateAt) return true;
  return Boolean(r.nextRoundAt) && dj(r.nextRoundAt).isBefore(now.add(24, "hour"));
}

/** Pending first; among pending, urgent first, then the soonest round, then the oldest ask. Decided: newest decision first. */
export function sortRequests(rows, now = dj()) {
  const key = (r) => {
    if (r.status !== "PENDING") return [2, -dj(r.decidedAt || r.createdAt).valueOf()];
    const round = r.nextRoundAt ? dj(r.nextRoundAt).valueOf() : Number.MAX_SAFE_INTEGER;
    return [isUrgent(r, now) ? 0 : 1, round, dj(r.createdAt).valueOf()];
  };
  return [...(rows || [])].sort((a, b) => {
    const ka = key(a); const kb = key(b);
    for (let i = 0; i < Math.max(ka.length, kb.length); i += 1) if ((ka[i] ?? 0) !== (kb[i] ?? 0)) return (ka[i] ?? 0) - (kb[i] ?? 0);
    return 0;
  });
}

/** "Interview tomorrow 10:00 AM": when the drive's next round is, in the words a TPO scans for. */
function roundWhen(r) {
  if (!r.nextRoundAt) return null;
  const at = dj(r.nextRoundAt);
  const day = at.isSame(dj(), "day") ? "today" : at.isSame(dj().add(1, "day"), "day") ? "tomorrow" : at.format("ddd D MMM");
  return `${r.nextRoundName || "Next round"} ${day} ${at.format("h:mm A")}`;
}

/**
 * The Requests page (TPO V1 - Locked.docx §6): withdrawals, offer extensions, registration changes, absence disputes, corrections
 * with proof, off-campus offers and PAP. Every decision tells the student, with the reason. A request not decided 24 hours before a
 * round escalates to every TPO admin; while it is pending the student is excused, never a no-show. Closing a drive approves open ones.
 *
 * With `learnerId` it is the compact list inside one student's panel: that student's requests, pending and decided.
 */
export default function RequestsPanel({ onChanged, learnerId = null }) {
  const compact = learnerId != null;
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState(compact ? "ALL_TIME" : "PENDING"); // PENDING | RECENT (30 days) | ALL_TIME
  // The side panel lives in the URL on the Requests page; inside a student's panel the host page owns the URL, so no panel there.
  // On "Waiting" every request is waiting: the Status filter only means something with the decided ones in view.
  const filterDefs = useMemo(() => (compact ? NO_DEFS : requestFilterDefs().filter((d) => filter !== "PENDING" || d.key !== "status")), [compact, filter]);
  const [panel, setPanel] = useUrlFilters(filterDefs);
  const [deciding, setDeciding] = useState(null); // { request }
  const [reason, setReason] = useState("");
  const [decisionBusyId, setDecisionBusyId] = useState(null);
  const [decisionError, setDecisionError] = useState(null);
  const decisionRef = useRef(null);

  // A load failure used to silently degrade into "No requests here" - indistinguishable from a
  // queue that's genuinely empty, for a surface whose whole job is "what needs a decision".
  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetchWithErrorHandling(filter === "PENDING" ? getRequestsQueue(false) : getRequestsQueue(true, filter === "ALL_TIME" ? 0 : 30));
    setLoading(false);
    if (!res.success) { setError(res?.data?.message || res?.data?.error || "Could not load requests"); return; }
    setError(null);
    const all = Array.isArray(res.data) ? res.data : [];
    setRows(compact ? all.filter((r) => Number(r.learnerId) === Number(learnerId)) : all);
  }, [filter, compact, learnerId]);
  useEffect(() => { load(); }, [load]);

  // Approving is routine: one tap, no typing. Rejecting asks for a reason (chips), because the student reads it.
  const send = async (request, approve, why) => {
    if (!request?.id || decisionRef.current != null) return false;
    decisionRef.current = request.id;
    setDecisionBusyId(request.id);
    setDecisionError(null);
    try {
      const res = await fetchWithErrorHandling(decideRequest(request.id, approve, (why || "").trim()));
      if (!res.success) {
        const errorMessage = res?.data?.message || res?.data?.error || res?.error || "Could not save the decision";
        setDecisionError({ request, approve, why, message: errorMessage });
        message.error(errorMessage);
        return false;
      }
      return true;
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || "Could not save the decision";
      setDecisionError({ request, approve, why, message: errorMessage });
      message.error(errorMessage);
      return false;
    } finally {
      decisionRef.current = null;
      setDecisionBusyId(null);
    }
  };
  const approveNow = async (request) => {
    const ok = await send(request, true, APPROVE_NOTE);
    if (ok) {
      setDecisionError(null);
      message.success("Approved. The student has been told.");
      load();
      onChanged?.();
    }
    return ok;
  };
  const approveOne = (request) => {
    if (decisionRef.current != null) return;
    setDecisionError(null);
    const consequence = approveConsequence(request);
    if (!consequence) { approveNow(request); return; }
    Modal.confirm({
      title: `Approve this ${(REQUEST_TYPES[request.type] || "request").toLowerCase()}?`,
      content: `${consequence} The student is told.`,
      okText: "Approve",
      onOk: async () => {
        const ok = await approveNow(request);
        if (!ok) throw new Error("Decision failed");
      },
    });
  };
  const decide = async () => {
    const { request } = deciding || {};
    if (!request || decisionRef.current != null) return;
    if (await send(request, false, reason)) {
      setDecisionError(null);
      message.success("Rejected. The student has been told, with your reason.");
      setDeciding(null);
      setReason("");
      load();
      onChanged?.();
    }
  };
  const retryDecision = () => {
    if (!decisionError || decisionRef.current != null) return;
    if (decisionError.approve) approveNow(decisionError.request);
    else {
      setReason(decisionError.why || "");
      setDeciding({ request: decisionError.request });
    }
  };
  const [startBulk, bulkElement] = useBulkAction();
  // Approving together goes through the bulk engine: who, who is skipped (already decided), then one decision per request.
  // Approving without opening never covers a request whose proof is missing (an off-campus offer with no letter, a correction with no
  // proof): those are named and skipped, to open and decide one by one.
  const approveSkip = (r) => (r.status !== "PENDING" ? "Already decided" : proofOf(r) === "MISSING" ? "No proof attached: open it to decide" : null);
  const approveMany = (selected, type, clear) => {
    const going = selected.filter((r) => !approveSkip(r));
    // One student: their own sentence. Several: what happens to each, never one student's name for all of them.
    const one = going.length === 1 ? approveConsequence(going[0]) : null;
    const urgent = going.filter((r) => isUrgent(r)).length;
    return startBulk({
      title: `Approve ${(REQUEST_TYPES[type] || "request").toLowerCase()}`, noun: ["request", "requests"], items: selected, nameOf: (r) => fullName(r),
      skip: approveSkip,
      consequence: `${one || TYPE_HELP[type] || "Approved as they asked."} Each student is told.${urgent ? ` ${urgent} of them ${urgent === 1 ? "is" : "are"} urgent (a round within 24 hours).` : ""}`,
      undoNote: "Students are told straight away, so an approval cannot be taken back here.",
      runEach: (r) => fetchWithErrorHandling(decideRequest(r.id, true, APPROVE_NOTE)),
      onDone: () => { clear(); load(); onChanged?.(); },
    });
  };

  const pending = useMemo(() => rows.filter((r) => r.status === "PENDING"), [rows]);
  const shown = useMemo(() => sortRequests(rows), [rows]);
  const pickedWork = WORK.find((w) => Object.keys(panel).length === Object.keys(w.filter).length && Object.entries(w.filter).every(([k, v]) => JSON.stringify(panel[k]) === JSON.stringify(v)))?.key;
  const pickWork = (w) => { if (filter !== "PENDING") setFilter("PENDING"); setPanel(pickedWork === w.key ? {} : w.filter); };

  // The Actions window: approve one kind at a time (each kind changes the student's record differently), reject with a reason, message.
  const [acting, setActing] = useState(null);
  const REQUEST = ["request", "requests"];
  const notPending = (r) => (r.status !== "PENDING" ? "Already decided" : null);
  const typesHere = [...new Set((acting?.audience || []).filter((r) => r.status === "PENDING").map((r) => r.type))];
  const actions = [
    ...typesHere.map((t) => ({
      group: "Approve", key: `approve:${t}`, title: `Approve ${(REQUEST_TYPES[t] || t).toLowerCase()}`,
      help: `${TYPE_HELP[t] || "Approved as they asked."} Each student is told.`,
      skip: (r) => (r.type !== t ? `Not ${/^[aeiou]/i.test(REQUEST_TYPES[t] || t) ? "an" : "a"} ${(REQUEST_TYPES[t] || t).toLowerCase()}` : null) || approveSkip(r),
      note: (rows) => {
        const urgent = rows.filter((r) => isUrgent(r));
        return urgent.length ? `Urgent: ${urgent.length} with a round within 24 hours (${urgent.slice(0, 3).map(fullName).join(", ")}${urgent.length > 3 ? " and others" : ""}).` : null;
      },
      button: (n) => `Review ${n} to approve…`, run: (list) => approveMany(list, t, acting?.clear || (() => {})),
    })),
    { group: "Reject", key: "reject", title: "Reject", danger: true, help: "Each student is told, with your reason.", skip: notPending,
      fields: <Form.Item name="reason" label="Reason (the student sees it)" rules={[{ validator: (_, v) => (reasonIsValid(v || "", REJECT_REASONS) ? Promise.resolve() : Promise.reject(new Error("Pick or write the reason"))) }]}>
        <ReasonPicker reasons={REJECT_REASONS} /></Form.Item>,
      run: (list, v) => startBulk({ title: "Reject", noun: REQUEST, items: list, nameOf: fullName, danger: true, consequence: `Each student is told: "${v.reason.trim()}"`,
        undoNote: "Students are told straight away, so a rejection cannot be taken back here.",
        runEach: (r) => fetchWithErrorHandling(decideRequest(r.id, false, v.reason.trim())), onDone: () => { acting?.clear?.(); load(); onChanged?.(); } }) },
    { group: "Talk to them", key: "message", title: "Send a message", help: "Ask for the missing proof, or tell them when you will decide. They see it in the app.",
      fields: <Form.Item name="text" rules={[{ required: true, whitespace: true, message: "Write the message" }]}><Input.TextArea rows={4} maxLength={1000} placeholder="e.g. Please attach your offer letter so we can approve it." /></Form.Item>,
      run: (list, v) => startBulk({ title: "Send message", noun: ["student", "students"], items: [...new Map(list.map((r) => [r.learnerId, r])).values()], nameOf: fullName,
        consequence: `They see: "${v.text.trim()}"`, undoNote: "A sent message cannot be taken back.",
        run: (items) => fetchWithErrorHandling(bulkNudge(items.map((r) => r.learnerId), v.text.trim())), onDone: () => acting?.clear?.() }) },
  ];
  const act = (list, selected, clear) => {
    const audience = selected.length ? selected : list;
    return (
      <>
        <span className="tpo-elig__act-text">
          {selected.length ? <><strong>{selected.length}</strong> selected of {list.length}</> : <><strong>{list.length}</strong> {list.length === 1 ? "request" : "requests"} in this view</>}
        </span>
        <Button type={selected.length ? "primary" : "default"} icon={<ThunderboltOutlined />} style={audience.length === 0 ? { display: "none" } : undefined} disabled={audience.length === 0} data-testid="requests.act"
          onClick={() => setActing({ audience, selected: selected.length > 0, clear })}>
          {selected.length ? `Act on ${selected.length} selected` : `Act on all ${list.length}`}
        </Button>
      </>
    );
  };

  const columns = [
    {
      title: "Request", dataIndex: "type", key: "type", headerFilterKey: compact ? undefined : "type", exportValue: (r) => REQUEST_TYPES[r.type] || r.type,
      render: (v, r) => (
        <Space direction="vertical" size={2}>
          <Tag>{REQUEST_TYPES[v] || v}</Tag>
          {isUrgent(r) && <Tag color="red" className="tpo-student-requests__urgent">Urgent</Tag>}
        </Space>
      ),
    },
    ...(compact ? [] : [{
      title: "Student", key: "student", exportValue: fullName,
      render: (_, r) => (
        <div className="tpo-student-requests__student">
          <Typography.Text strong>{fullName(r)}</Typography.Text>
          <Typography.Text type="secondary" className="tpo-student-requests__context">
            {[r.rollNumber, r.branch, REG_LABEL[r.registration] || null].filter(Boolean).join(" · ")}
          </Typography.Text>
          {truthy(r.placed) && <Tag color="green" className="tpo-student-requests__placed">Already placed</Tag>}
        </div>
      ),
    }]),
    {
      title: "Drive", key: "drive", headerFilterKey: compact ? undefined : "drive", exportValue: (r) => r.drive || "",
      render: (_, r) => (r.drive ? (
        <div className="tpo-student-requests__drive">
          <span>{r.drive}</span>
          {r.status === "PENDING" && roundWhen(r) && <Typography.Text type={isUrgent(r) ? "danger" : "secondary"}>{roundWhen(r)}</Typography.Text>}
        </div>
      ) : <Typography.Text type="secondary">Not about a drive</Typography.Text>),
    },
    { title: "What they asked", key: "reason", render: (_, r) => <RequestDetails request={r} />,
      exportValue: (r) => { const p = requestPayload(r); return [r.reason, p.choice, p.companyName, p.ctcLpa != null ? `${p.ctcLpa} LPA` : null, p.field, p.letterUrl || p.proofUrl].filter(Boolean).join(" · "); } },
    { title: "Asked", dataIndex: "createdAt", sortable: true, key: "createdAt", responsive: ["md"], render: (v) => <Tooltip title={dj(v).format("D MMM YYYY, h:mm A")}>{dj(v).fromNow()}</Tooltip>, exportValue: (r) => r.createdAt },
    // Who decided, when and why: shown when decided requests are in view (the queue of waiting ones has none).
    { title: "Decided by", dataIndex: "decidedByName", key: "decidedBy", defaultHidden: filter === "PENDING", render: (v) => (v || "").trim() || "-" },
    { title: "Decided on", dataIndex: "decidedAt", sortable: true, key: "decidedAt", defaultHidden: filter === "PENDING", render: (v) => (v ? dj(v).format("D MMM, h:mm A") : "-") },
    { title: "Why", dataIndex: "decisionReason", key: "decisionReason", defaultHidden: filter === "PENDING", render: (v) => v || "-" },
    {
      title: "", exportTitle: "Status", key: "act", exportValue: (r) => (r.status === "PENDING" ? "Pending" : (STATUS_LABEL[r.status] || [r.status])[0]),
      render: (_, r) => {
        const rowBusy = decisionBusyId === r.id;
        return r.status === "PENDING"
          ? (
            <Space>
              <Button size="small" type="primary" loading={rowBusy} disabled={decisionBusyId != null}
                onClick={() => approveOne(r)}>Approve</Button>
              <Button size="small" danger disabled={decisionBusyId != null}
                onClick={() => { setDecisionError(null); setReason(""); setDeciding({ request: r }); }}>Reject</Button>
            </Space>
          )
          : (
          <div className="tpo-student-requests__decided">
            <Tag color={(STATUS_LABEL[r.status] || [])[1]}>{(STATUS_LABEL[r.status] || [r.status])[0]}</Tag>
            <Typography.Text type="secondary">{[r.decidedByName ? `by ${r.decidedByName}` : null, r.decidedAt ? dj(r.decidedAt).format("D MMM") : null].filter(Boolean).join(", ")}</Typography.Text>
            {r.decisionReason && r.decisionReason !== APPROVE_NOTE && <Typography.Text type="secondary">“{r.decisionReason}”</Typography.Text>}
          </div>
        );
      },
    },
  ];


  return (
    <div className={`tpo-student-requests ${compact ? "tpo-student-requests--compact" : ""}`}>
      {error && rows.length === 0 ? <PanelError title={error} onRetry={load} /> : (
        <>
          {error && <Alert className="tpo-student-requests__alert" type="error" showIcon closable message="This refresh failed. Showing the last successful load." description={error} action={<Button size="small" onClick={load}>Retry</Button>} />}
          {decisionError && !deciding ? (
            <Alert
              className="tpo-student-requests__alert"
              type="error"
              showIcon
              closable
              message="The request decision was not saved"
              description={decisionError.message}
              action={<Button size="small" onClick={retryDecision} disabled={decisionBusyId != null}>Retry</Button>}
              onClose={() => setDecisionError(null)}
            />
          ) : null}
          {/* Inside a student's panel every request of theirs is listed (waiting first): no period to pick. */}
          {!compact && <div className="tpo-student-requests__toolbar">
            <Segmented className="tpo-student-requests__filter" value={filter} onChange={(v) => { setFilter(v); }}
              options={[
                { value: "PENDING", label: `Waiting${filter === "PENDING" ? ` (${pending.length})` : ""}` },
                { value: "RECENT", label: "Last 30 days" },
                { value: "ALL_TIME", label: "All history" },
              ]} />
          </div>}

          {!compact && (
            <div className="tpo-journey__extras tpo-drives__work" role="group" aria-label="Needs doing" data-testid="requests.work">
              <span className="tpo-drives__work-label">{pending.length ? `${pending.length} waiting for you. Needs doing first:` : "Nothing is waiting for you."}</span>
              {WORK.map((w) => ({ ...w, count: w.n(rows) })).filter((w) => w.count > 0 || pickedWork === w.key).map((w) => (
                <button type="button" key={w.key} className={`tpo-journey__extra${pickedWork === w.key ? " is-on" : ""}`} aria-pressed={pickedWork === w.key}
                  onClick={() => pickWork(w)} data-testid={`requests.work.${w.key}`}>
                  {w.label} · <strong>{w.count}</strong>
                </button>
              ))}
            </div>
          )}

          {/* The host page owns the address bar: its ?q= search must not filter (or be overwritten by) this one student's list. */}
          <TpoDataTable data={shown} rowKey="id" columns={columns} loading={loading} exportName="requests" compact={compact} searchInUrl={!compact} exportable={!compact}
            filterDefs={compact ? undefined : filterDefs} filterState={panel} onFilterChange={setPanel} filterTitle="Filter requests"
            searchOf={(r) => `${fullName(r)} ${r.rollNumber} ${r.drive} ${r.type}`}
            act={compact ? undefined : act} counts={() => null}
            emptyTitle={compact ? (filter === "PENDING" ? "Nothing waiting from this student" : "No requests from this student") : filter === "PENDING" ? "Nothing is waiting for you" : "No requests in this period"}
            emptySubtitle={compact ? "Their withdrawals, off-campus offers and registration changes show up here." : "Withdrawals, off-campus offers, registration changes and disputes from students show up here."}
            />
        </>
      )}
      {bulkElement}
      {!compact && <ActionsWindow testid="request-actions" open={Boolean(acting)} onClose={() => setActing(null)} audience={acting?.audience || []} selected={Boolean(acting?.selected)}
        noun={REQUEST} actions={actions} />}
      <Modal
        open={Boolean(deciding)}
        title="Reject this request"
        onCancel={() => {
          if (decisionBusyId != null) return;
          setDeciding(null);
          setDecisionError(null);
        }}
        okText={decisionBusyId != null ? "Rejecting…" : "Reject"}
        confirmLoading={Boolean(deciding?.request?.id && decisionBusyId === deciding.request.id)}
        okButtonProps={{ danger: true, disabled: decisionBusyId != null || !reasonIsValid(reason, REJECT_REASONS) }}
        cancelButtonProps={{ disabled: decisionBusyId != null }}
        closable={decisionBusyId == null}
        maskClosable={decisionBusyId == null}
        keyboard={decisionBusyId == null}
        onOk={decide}
        destroyOnClose
      >
        <Typography.Paragraph type="secondary">The student sees your reason. Pick one, or choose Other to write your own.</Typography.Paragraph>
        {decisionError && deciding?.request?.id === decisionError.request?.id ? (
          <Alert type="error" showIcon message="Rejection was not saved" description={decisionError.message} style={{ marginBottom: 12 }} />
        ) : null}
        <ReasonPicker reasons={REJECT_REASONS} value={reason} onChange={setReason} />
      </Modal>
    </div>
  );
}
