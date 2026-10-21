import React, { useRef, useState } from "react";
import Link from "next/link";
import { Button, Input, Modal, message } from "antd";
import { confirmMyRound, requestRoundReschedule } from "@/api/Services/TpoHubService";
import { at, dayTime, errorText, hasTime, isOver, kindNote, relativeDay } from "./words";

/**
 * One test, talk or interview on the student's schedule, with what they can do about it right there: confirm, ask to reschedule,
 * join or open the test link. `onChanged` reloads the page's data after an action.
 */
export default function ScheduleCard({ item, onChanged, compact = false }) {
  const [busy, setBusy] = useState(false);
  const [asking, setAsking] = useState(false);
  const [reason, setReason] = useState("");
  const [times, setTimes] = useState("");
  const guard = useRef(false);
  const m = at(item.startsAt);
  const past = isOver(item);
  const talk = item.kind === "TALK";
  const canAct = item.booked && item.live && !past && !talk;
  const pendingAsk = item.moveAsk?.status === "PENDING";
  const answeredAsk = item.moveAsk && item.moveAsk.status !== "PENDING" ? item.moveAsk : null;
  const online = item.mode === "VIRTUAL";

  const run = async (fn, ok, fail) => {
    if (guard.current) return false;
    guard.current = true;
    setBusy(true);
    try {
      await fn();
      message.success(ok);
      onChanged?.();
      return true;
    } catch (e) {
      message.error(errorText(e, fail));
      return false;
    } finally {
      guard.current = false;
      setBusy(false);
    }
  };

  const sendAsk = async () => {
    const text = reason.trim();
    if (text.length < 3) return;
    const ok = await run(() => requestRoundReschedule(item.roundId, text, times.trim() || null), "Sent. The placement cell will reply.", "Could not send");
    if (ok) { setAsking(false); setReason(""); setTimes(""); }
  };

  const outcome = item.state === "CLEARED" ? "Cleared" : item.state === "NOT_CLEARED" ? "Not cleared" : item.state === "ABSENT" ? "Marked absent"
    : item.state === "WAITLISTED" ? "Waitlisted" : null;

  return (
    <article className={`sp-event ${past ? "sp-event--past" : ""} ${compact ? "sp-event--compact" : ""}`} data-testid="sp.event">
      <div className="sp-event__date" aria-hidden="true">
        <span className="sp-event__month">{m ? m.format("MMM") : ""}</span>
        <span className="sp-event__day">{m ? m.format("D") : "?"}</span>
        <span className="sp-event__wd">{m ? m.format("ddd") : ""}</span>
      </div>
      <div className="sp-event__body">
        <div className="sp-event__top">
          <span className="sp-event__when">
            {item.due
              ? (m ? `Take it by ${dayTime(item.startsAt)}` : "Take it when you can")
              : <>{relativeDay(item.startsAt)}{hasTime(item.startsAt) ? ` · ${m.format("h:mm A")}` : " · time to be told"}{item.endsAt ? `–${at(item.endsAt).format("h:mm A")}` : ""}</>}
          </span>
          {outcome && <span className={`sp-chip sp-chip--${item.state === "CLEARED" ? "good" : item.state === "WAITLISTED" ? "wait" : "bad"}`}>{outcome}</span>}
          {!outcome && !past && item.expected && <span className="sp-chip sp-chip--later">Expected</span>}
          {!outcome && !past && item.booked && !talk && (item.confirmedAt
            ? <span className="sp-chip sp-chip--good">Confirmed</span>
            : <span className="sp-chip sp-chip--now">Please confirm</span>)}
          {pendingAsk && <span className="sp-chip sp-chip--wait">Reschedule asked</span>}
        </div>
        <h3 className="sp-event__title">{item.name}{item.company ? <span className="sp-muted"> · {item.company}</span> : null}</h3>
        <div className="sp-event__meta">
          {kindNote(item.name, item.kind) && <span>{kindNote(item.name, item.kind)}</span>}
          {item.role && <span>{item.jobId ? <Link href={`/learn/my-placements/jobs/${item.jobId}`}>{item.role}</Link> : item.role}</span>}
          {online ? <span>Online</span> : item.room ? <span>{item.room}</span> : <span>Venue to be told</span>}
          {item.platform && <span>{item.platform}</span>}
          {item.durationMinutes ? <span>{item.durationMinutes} min</span> : null}
        </div>
        {!compact && !past && item.whatToBring && <p className="sp-event__bring"><b>Bring:</b> {item.whatToBring}</p>}
        {!compact && item.expected && !past && (
          <p className="sp-small sp-muted">This is the round's planned date. The placement cell will book your slot and tell you.</p>
        )}
        {answeredAsk && !past && (
          <p className="sp-small">Your reschedule request: {answeredAsk.status === "MOVED" ? "moved to the time shown" : "kept as it was"}{answeredAsk.reply ? ` · "${answeredAsk.reply}"` : ""}</p>
        )}
        {!past && (canAct || (online && item.meetingUrl) || item.testLink) && (
          <div className="sp-event__actions">
            {canAct && !item.confirmedAt && (
              <Button type="primary" size="small" loading={busy} onClick={() => run(() => confirmMyRound(item.roundId), "Confirmed. See you there.", "Could not confirm")}>
                Confirm I'll attend
              </Button>
            )}
            {online && item.meetingUrl && (
              <Button size="small" href={item.meetingUrl} target="_blank" rel="noopener noreferrer">Join link</Button>
            )}
            {item.testLink && (
              <Button size="small" href={item.testLink} target="_blank" rel="noopener noreferrer">Open test</Button>
            )}
            {canAct && !pendingAsk && (
              <Button size="small" type="text" disabled={busy} onClick={() => setAsking(true)}>Can't make it?</Button>
            )}
          </div>
        )}
      </div>

      <Modal open={asking} title="Ask to reschedule" okText="Send to the placement cell" confirmLoading={busy}
        okButtonProps={{ disabled: busy || reason.trim().length < 3 }} closable={!busy} maskClosable={!busy}
        onCancel={() => { if (!busy) setAsking(false); }} onOk={sendAsk} destroyOnClose>
        <p className="sp-muted">{item.name} · {item.company} · {dayTime(item.startsAt)}</p>
        <label className="sp-label" htmlFor={`sp-why-${item.roundId}`}>Why can't you make it?</label>
        <Input.TextArea id={`sp-why-${item.roundId}`} rows={3} maxLength={900} value={reason} onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. I have my semester exam at that time" />
        <label className="sp-label" htmlFor={`sp-times-${item.roundId}`}>Times that work for you (optional)</label>
        <Input id={`sp-times-${item.roundId}`} maxLength={200} value={times} onChange={(e) => setTimes(e.target.value)} placeholder="e.g. Any time after 2 PM on 16 Oct" />
        <p className="sp-small sp-muted" style={{ marginTop: 8 }}>Until they reply, your current slot stays as it is.</p>
      </Modal>
    </article>
  );
}
