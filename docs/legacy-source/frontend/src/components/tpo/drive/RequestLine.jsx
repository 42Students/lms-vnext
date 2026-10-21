import { Button, Tag, Typography } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { valueText, STATUS } from "@/components/tpo/drive/ChangeRequests";

/**
 * A change request inside a drive's Discussion (requests + discussion link, 12 Oct 2026): the line each step of a request leaves
 * in the company thread, and the quote a "Discuss" message carries. Both sides use these, so they read the same. The values come
 * from the request row, so a deadline shows in the reader's own time.
 */

/** What was asked, in a few words: "Deadline: 20 Oct, 5:00 PM", "Asked for the location", the note for Something else. */
export function requestSummary(r) {
  if (!r) return "";
  if (r.field === "OTHER") return r.note || "Something else";
  if (r.kind === "ASK") return `Asked for the ${String(r.fieldLabel || "").toLowerCase()}`;
  return `${r.fieldLabel}: ${valueText(r.field, r.proposedValue) ?? ""}`;
}

/** What the event added: the answer given, or the reason for declining. */
function outcomeText(event, r) {
  if (!r) return null;
  if (event === "ANSWERED" && r.answerValue) return valueText(r.field, r.answerValue);
  if (event === "DECLINED" && r.replyText) return `“${r.replyText}”`;
  return null;
}

/** The quote shown on a message that talks about a request, and above the composer before it is sent. */
export function RequestQuote({ request, onRemove, onSeeRequest }) {
  if (!request) return null;
  const [label, color] = STATUS[request.status] || [null, null];
  return (
    <div className="drive-request-quote" data-testid="drive.request-quote">
      <div className="drive-request-quote__body">
        <Typography.Text type="secondary" className="drive-request-quote__kicker">Change request</Typography.Text>
        <Typography.Text strong className="drive-request-quote__summary">{requestSummary(request)}</Typography.Text>
        {request.field !== "OTHER" && request.note && <Typography.Text type="secondary" className="drive-request-quote__note">“{request.note}”</Typography.Text>}
      </div>
      <div className="drive-request-quote__side">
        {label && <Tag color={color}>{label}</Tag>}
        {onSeeRequest && <Button type="link" size="small" onClick={() => onSeeRequest(request.id)}>See the request</Button>}
        {onRemove && <Button type="text" size="small" icon={<CloseOutlined />} aria-label="Remove the quoted request" onClick={onRemove} />}
      </div>
    </div>
  );
}

/** One line in the timeline for a step of a request: "Anitha · Asked to change Deadline · 20 Oct → 25 Oct". */
export function RequestEventLine({ message: m, who, when, onSeeRequest }) {
  const r = m.request;
  const extra = m.event === "CREATED" ? (r ? requestSummary(r) : null) : outcomeText(m.event, r);
  return (
    <div className="drive-request-event" role="note" data-testid="drive.request-event">
      <Typography.Text type="secondary" className="drive-request-event__text">
        <strong>{who}</strong> · {m.body}{extra && m.event !== "CREATED" ? `: ${extra}` : ""}
      </Typography.Text>
      {m.event === "CREATED" && extra && <Typography.Text className="drive-request-event__detail">{extra}</Typography.Text>}
      <span className="drive-request-event__meta">
        <Typography.Text type="secondary">{when}</Typography.Text>
        {onSeeRequest && r && <Button type="link" size="small" onClick={() => onSeeRequest(r.id)}>See the request</Button>}
      </span>
    </div>
  );
}

/** Scroll a request into view and flash it: the TPO's list sits above the tabs, the recruiter's is its own tab. */
export function showRequest(id) {
  if (typeof document === "undefined") return;
  const el = document.getElementById(`change-request-${id}`);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.classList.add("drive-change-request--flash");
  setTimeout(() => el.classList.remove("drive-change-request--flash"), 1600);
}
