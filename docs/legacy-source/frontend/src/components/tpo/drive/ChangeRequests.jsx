import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Card, DatePicker, Empty, Form, Input, List, Radio, Select, Space, Tag, Typography, message } from "antd";
import { formatPlacementDateTime } from "@/utils/placementDateTime";
import { dj, serverTime } from "@/components/tpo/dj";
import AsyncModal from "@/components/tpo/ui/AsyncModal";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import {
  acceptChangeRequest, answerChangeRequest, createChangeRequest, listChangeRequests, replyChangeRequest, withdrawChangeRequest,
} from "@/api/Services/TpoService";

const COLLEGE_API = {
  list: listChangeRequests, create: createChangeRequest, accept: acceptChangeRequest, answer: answerChangeRequest, reply: replyChangeRequest, withdraw: withdrawChangeRequest,
};

/** The words each side sees (N8): the college answers Company requests, the company answers Institutional requests. */
const SIDES = {
  college: {
    theirs: "COMPANY_TO_COLLEGE", theirsTitle: "Company requests", oursTitle: "Institutional requests (yours)", to: "the company", sendLabel: "Send to the company",
    empty: "No change requests. Ask the company for a change here; the drive stays where it is.",
    intro: "The company answers this in one step. The drive stays where it is; nothing is sent back.", sent: "Sent. The drive stays in review while they answer.",
  },
  company: {
    theirs: "COLLEGE_TO_COMPANY", theirsTitle: "Institutional requests", oursTitle: "Your requests", to: "the placement cell", sendLabel: "Send to the placement cell",
    empty: "No requests. Ask the placement cell for a change here.",
    intro: "The placement cell answers this in one step.", sent: "Sent to the placement cell.",
  },
};

export const CHANGE_FIELDS = [
  { value: "ROLE_TITLE", label: "Role title" }, { value: "DESCRIPTION", label: "Description" }, { value: "LOCATION", label: "Location" },
  { value: "JOB_TYPE", label: "Job type" }, { value: "MODE", label: "Mode" }, { value: "DEADLINE", label: "Application deadline" },
  { value: "CTC_LPA", label: "CTC (LPA)" }, { value: "STIPEND", label: "Monthly stipend" }, { value: "MIN_CGPA", label: "Minimum CGPA" },
  { value: "BRANCHES", label: "Branches (comma separated)" }, { value: "OTHER", label: "Something else" },
];
const MODES = [{ value: "ON_CAMPUS", label: "On campus" }, { value: "POOL", label: "Pool drive" }, { value: "OFF_CAMPUS", label: "Off campus" }];
const JOB_TYPES = ["Full-time", "Internship", "Internship + full-time", "Contract", "Apprenticeship"].map((t) => ({ value: t, label: t }));

/** A drive description is HTML; a request's is plain text. Either way, show words, cut to a readable length. */
const plain = (v, max = 160) => {
  const t = String(v).replace(/<\/(p|div|li|h\d)>|<br\s*\/?>/gi, " ").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
};

/** A value as people read it: a deadline in their own time (it is stored in UTC), a mode in words, pay with its unit. */
export function valueText(field, v) {
  if (v == null || v === "") return v;
  if (field === "DESCRIPTION") return plain(v);
  if (field === "DEADLINE") return formatPlacementDateTime(v, String(v));
  if (field === "MODE") return (MODES.find((m) => m.value === v) || {}).label || v;
  if (field === "CTC_LPA") return `${v} LPA`;
  if (field === "STIPEND") return `₹${v} a month`;
  return v;
}

/** The input for a field's value: a date and time picker for the deadline (sent as UTC, like the drive form), lists for mode and job type. */
function ValueInput({ field, value, onChange, ...rest }) {
  if (field === "DEADLINE") {
    return <DatePicker showTime={{ format: "h:mm A" }} format="D MMM YYYY, h:mm A" value={value} onChange={onChange} style={{ width: "100%" }}
      disabledDate={(d) => d && d.endOf("day").isBefore(dj())} {...rest} />;
  }
  if (field === "MODE") return <Select options={MODES} value={value} onChange={onChange} {...rest} />;
  if (field === "JOB_TYPE") return <Select options={JOB_TYPES} value={value} onChange={onChange} {...rest} />;
  if (field === "DESCRIPTION") return <Input.TextArea rows={5} maxLength={2000} showCount value={value} onChange={(e) => onChange?.(e.target.value)} {...rest} />;
  return <Input value={value} maxLength={field === "LOCATION" || field === "ROLE_TITLE" ? 255 : 2000} onChange={(e) => onChange?.(e.target.value)} {...rest} />;
}
const toServer = (field, v) => (field === "DEADLINE" ? serverTime(v) : (typeof v === "string" ? v.trim() : v));

// REPLIED is how a decline is stored (the old one-shot reply was a refusal too).
export const STATUS = { OPEN: ["Waiting", "gold"], ACCEPTED: ["Accepted", "green"], ANSWERED: ["Answered", "green"], REPLIED: ["Declined", "red"], WITHDRAWN: ["Withdrawn", "default"] };
// The server says why in data.message (recruiter API) or data.error (TPO API); the bare HTTP text is never shown.
const errorText = (r, f) => r?.data?.message || r?.data?.error || f;

/**
 * Change requests on a drive (recruiter phase 1, N14): nothing is sent back. The placement cell asks the company to change a
 * named field (suggesting a value or asking for it), the company answers in place; the company's own requests are answered
 * here with Accept, an answer, or Decline (with a reason). "Discuss" opens the drive's Discussion with the request quoted, and each
 * step leaves a line there (RequestLine.jsx), so talking it over never loses the context.
 */
// On a live drive the server tells the students who applied when one of these changes (LiveDriveChangeService, 19 Oct 2026).
export const TERMS = ["LOCATION", "JOB_TYPE", "MODE", "DEADLINE", "CTC_LPA", "STIPEND", "MIN_CGPA", "BRANCHES"];
export const appliedText = (field, live) => (live && TERMS.includes(field) ? "Applied. Students who applied were told." : "Accepted and applied");

export default function ChangeRequests({ jobId, openAsk, onAskClosed, onChanged, readOnly, side = "college", api = COLLEGE_API, onDiscuss, live = false }) {
  const words = SIDES[side] || SIDES.college;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [asking, setAsking] = useState(false);
  const [replying, setReplying] = useState(null); // { item, mode: "answer" | "decline" }
  const [text, setText] = useState("");
  const [answerValue, setAnswerValue] = useState(null); // a picked deadline, mode or job type when answering an ask
  const [form] = Form.useForm();
  const field = Form.useWatch("field", form);
  const kind = Form.useWatch("kind", form);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetchWithErrorHandling(api.list(jobId));
    setLoading(false);
    if (!r.success) { setError(errorText(r, "Couldn't load the change requests")); return; }
    setError(null);
    setItems(Array.isArray(r.data) ? r.data : []);
  }, [jobId, api]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (openAsk) { form.resetFields(); setAsking(true); } }, [openAsk, form]);

  const run = async (call, ok) => {
    const r = await fetchWithErrorHandling(call);
    if (!r.success) { message.error(errorText(r, "That didn't work")); return false; }
    message.success(ok);
    await load();
    onChanged?.();
    return true;
  };

  // Answering a deadline, mode or job type picks a value instead of typing one.
  const picked = replying?.mode === "answer" && ["DEADLINE", "MODE", "JOB_TYPE"].includes(replying.item.field);
  const theirs = items.filter((i) => i.direction === words.theirs);
  const ours = items.filter((i) => i.direction !== words.theirs);

  const row = (i, mine) => {
    const [label, color] = STATUS[i.status] || [i.status, "default"];
    const open = i.status === "OPEN" && !readOnly;
    const discuss = onDiscuss ? [<Button key="d" size="small" type="link" onClick={() => onDiscuss(i)}>Discuss</Button>] : [];
    const actions = !open ? discuss : mine
      ? [<Button key="w" size="small" onClick={() => run(api.withdraw(i.id), "Withdrawn")}>Withdraw</Button>, ...discuss]
      : [
        i.kind === "PROPOSE" && i.field !== "OTHER"
          ? <Button key="a" size="small" type="primary" onClick={() => run(api.accept(i.id), appliedText(i.field, live))}>Accept</Button>
          : <Button key="n" size="small" type="primary" onClick={() => { setText(""); setAnswerValue(null); setReplying({ item: i, mode: "answer" }); }}>Answer</Button>,
        <Button key="r" size="small" onClick={() => { setText(""); setReplying({ item: i, mode: "decline" }); }}>Decline</Button>,
        ...discuss,
      ];
    return (
      <List.Item key={i.id} id={`change-request-${i.id}`} className="drive-change-request" actions={actions}>
        <List.Item.Meta
          title={<Space wrap size={6}><Typography.Text strong>{i.fieldLabel}</Typography.Text><Tag color={color}>{label}</Tag></Space>}
          description={(
            <Space direction="vertical" size={2}>
              {i.kind === "PROPOSE" && i.field !== "OTHER" && (
                <Typography.Text>
                  {i.currentValue ? <><Typography.Text type="secondary">was </Typography.Text><Typography.Text delete type="secondary">{valueText(i.field, i.currentValue)}</Typography.Text> → </> : null}
                  <strong>{valueText(i.field, i.proposedValue)}</strong>
                </Typography.Text>
              )}
              {i.kind === "ASK" && i.field !== "OTHER" && <Typography.Text>Asked for the {String(i.fieldLabel).toLowerCase()}</Typography.Text>}
              {i.note && <Typography.Text type="secondary">&ldquo;{i.note}&rdquo;</Typography.Text>}
              {i.answerValue && <Typography.Text>Answer: {valueText(i.field, i.answerValue)}</Typography.Text>}
              {i.replyText && <Typography.Text>Why not: &ldquo;{i.replyText}&rdquo;</Typography.Text>}
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {i.createdByName ? `${i.createdByName} · ` : ""}{dj(i.createdAt).format("D MMM YYYY, h:mm A")}
              </Typography.Text>
            </Space>
          )} />
      </List.Item>
    );
  };

  return (
    <Card size="small" title="Change requests" loading={loading} data-testid="drive.change-requests"
      extra={!readOnly && <Button size="small" onClick={() => { form.resetFields(); setAsking(true); }}>Request a change</Button>}>
      {error && <Alert type="error" showIcon message={error} action={<Button size="small" onClick={load}>Retry</Button>} style={{ marginBottom: 12 }} />}
      {items.length === 0 && !error && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={words.empty} />}
      {theirs.length > 0 && (<><Typography.Text type="secondary">{words.theirsTitle}</Typography.Text><List dataSource={theirs} renderItem={(i) => row(i, false)} /></>)}
      {ours.length > 0 && (<><Typography.Text type="secondary">{words.oursTitle}</Typography.Text><List dataSource={ours} renderItem={(i) => row(i, true)} /></>)}

      <AsyncModal open={asking} title="Request a change" okText={words.sendLabel} destroyOnClose
        onCancel={() => { setAsking(false); onAskClosed?.(); }}
        onOk={async () => {
          const v = await form.validateFields();
          const ok = await run(api.create(jobId, { field: v.field, kind: v.field === "OTHER" ? "ASK" : v.kind, proposedValue: v.proposedValue ? toServer(v.field, v.proposedValue) : null, note: v.note || null }), words.sent);
          if (ok) { setAsking(false); onAskClosed?.(); }
        }}>
        <Typography.Paragraph type="secondary">{words.intro}</Typography.Paragraph>
        <Form form={form} layout="vertical" initialValues={{ kind: "PROPOSE" }}>
          <Form.Item name="field" label="What should change" rules={[{ required: true, message: "Pick what should change" }]}>
            <Select options={CHANGE_FIELDS} placeholder="Pick a field" />
          </Form.Item>
          {field && field !== "OTHER" && (
            <Form.Item name="kind" label="How">
              <Radio.Group options={[{ value: "PROPOSE", label: "Suggest the new value" }, { value: "ASK", label: "Ask them for it" }]} />
            </Form.Item>
          )}
          {field && field !== "OTHER" && kind !== "ASK" && (
            <Form.Item name="proposedValue" label="New value" rules={[{ required: true, message: "Give the new value, or ask them for it" }]}>
              <ValueInput field={field} />
            </Form.Item>
          )}
          <Form.Item name="note" label={field === "OTHER" ? "What should change" : "A note for them (optional)"} rules={field === "OTHER" ? [{ required: true, message: "Say what should change" }] : []}>
            <Input.TextArea rows={2} maxLength={1000} showCount />
          </Form.Item>
        </Form>
      </AsyncModal>

      <AsyncModal open={Boolean(replying)} title={replying?.mode === "answer" ? "Answer" : "Decline"} okText={replying?.mode === "answer" ? "Send" : "Decline"}
        okButtonProps={{ danger: replying?.mode === "decline", disabled: picked ? !answerValue : !text.trim() }}
        destroyOnClose onCancel={() => setReplying(null)}
        onOk={async () => {
          const call = replying.mode === "answer"
            ? api.answer(replying.item.id, picked ? toServer(replying.item.field, answerValue) : text.trim())
            : api.reply(replying.item.id, text.trim());
          const told = live && TERMS.includes(replying.item.field) ? ". Students who applied were told." : "";
          if (await run(call, replying.mode === "answer" ? `Answered${told}` : "Declined")) setReplying(null);
        }}>
        {replying && <Typography.Paragraph type="secondary">{replying.item.fieldLabel}{replying.item.note ? `: “${replying.item.note}”` : ""}</Typography.Paragraph>}
        {replying?.mode === "decline" && (
          <Typography.Paragraph type="secondary">This settles the request. To talk it over first, use Discuss instead; it stays open.</Typography.Paragraph>
        )}
        {picked
          ? <ValueInput field={replying.item.field} value={answerValue} onChange={setAnswerValue} aria-label="Your answer" />
          : <Input.TextArea rows={3} value={text} maxLength={replying?.mode === "answer" ? 2000 : 1000} showCount onChange={(e) => setText(e.target.value)}
            aria-label={replying?.mode === "answer" ? "Your answer" : "Why not (they see this)"} />}
      </AsyncModal>
    </Card>
  );
}
