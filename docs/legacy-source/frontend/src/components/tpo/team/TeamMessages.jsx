import { Fragment } from "react";
import Link from "next/link";
import { Button, Dropdown, Typography } from "antd";
import { CheckOutlined, EllipsisOutlined, PushpinFilled } from "@ant-design/icons";
import { dj } from "@/components/tpo/dj";
import { parseBody } from "@/components/tpo/team/teamTokens";

const dayLabel = (d) => (d.isSame(dj(), "day") ? "Today" : d.isSame(dj().subtract(1, "day"), "day") ? "Yesterday" : d.format(d.isSame(dj(), "year") ? "dddd, D MMM" : "D MMM YYYY"));

/** A message body with its people and things as chips. */
export function TeamBody({ body, meId }) {
  return parseBody(body).map((p, i) => {
    if (p.type === "mention") return <span key={i} className={`team-chip team-chip--person${Number(p.id) === Number(meId) ? " is-me" : ""}`}>{p.text}</span>;
    if (p.type === "team") return <span key={i} className="team-chip team-chip--person">@team</span>;
    if (p.type === "chip") return <Link key={i} href={p.href} className={`team-chip team-chip--thing team-chip--${p.kind}`}>{p.text}</Link>;
    return <Fragment key={i}>{p.text}</Fragment>;
  });
}

/** An ask's state in a few words, from the reader's side. */
export function askState(ask) {
  if (!ask) return null;
  if (ask.doneAt) return { label: "Done", tone: "done" };
  if (ask.cancelledAt) return { label: "Cancelled", tone: "cancelled" };
  if (ask.dueAt && dj(ask.dueAt).isBefore(dj())) return { label: "Overdue", tone: "overdue" };
  return { label: "Open", tone: "open" };
}

const dueText = (dueAt) => {
  if (!dueAt) return "no date";
  const d = dj(dueAt);
  if (d.isSame(dj(), "day")) return `today, ${d.format("h:mm A")}`;
  if (d.isSame(dj().add(1, "day"), "day")) return `tomorrow, ${d.format("h:mm A")}`;
  return d.format(d.isSame(dj(), "year") ? "ddd D MMM, h:mm A" : "ddd D MMM YYYY, h:mm A");
};

/**
 * The conversation's messages (Team module V1): day separators, centred system lines, your own on the right, chips for people and
 * things, a green mark on decisions and an ask card (who, by when, its state, Mark done / Cancel) on asks.
 */
export default function TeamMessages({ messages = [], meId, highlightId, onAskDone, onAskCancel, onDecision, onEdit, onDelete }) {
  let lastDay = null;
  return (
    <div className="team-messages" role="log" aria-live="polite" aria-label="Messages">
      {messages.length === 0 && (
        <div className="team-messages__empty">
          <Typography.Text strong>Nothing here yet</Typography.Text>
          <Typography.Text type="secondary">Write the first message. @ someone to bring them in, or Ask someone to give a task a name and a date.</Typography.Text>
        </div>
      )}
      {messages.map((m) => {
        const d = dj(m.createdAt);
        const day = d.isValid() ? d.format("YYYY-MM-DD") : null;
        const sep = day && day !== lastDay ? <div className="team-messages__day" role="separator"><span>{dayLabel(d)}</span></div> : null;
        lastDay = day || lastDay;
        if (m.kind === "SYSTEM") {
          return <Fragment key={m.id}>{sep}<div className="team-messages__system">{m.body}<span className="team-messages__system-time">{d.format("h:mm A")}</span></div></Fragment>;
        }
        const mine = Boolean(m.mine);
        const state = askState(m.ask);
        const menu = [
          !m.deleted && { key: "decision", label: m.isDecision ? "Take the decision mark off" : "Mark as decision", onClick: () => onDecision?.(m, !m.isDecision) },
          m.canEdit && { key: "edit", label: "Edit", onClick: () => onEdit?.(m) },
          mine && !m.deleted && { key: "delete", danger: true, label: "Delete", onClick: () => onDelete?.(m) },
        ].filter(Boolean);
        return (
          <Fragment key={m.id}>
            {sep}
            <div id={`team-message-${m.id}`} className={`team-messages__row${mine ? " is-mine" : ""}${Number(highlightId) === Number(m.id) ? " is-highlight" : ""}`}>
              <div className="team-messages__meta">
                <strong>{mine ? "You" : m.authorName || "Someone"}</strong>
                <span>{d.format("h:mm A")}</span>
                {m.editedAt && !m.deleted && <span>· edited</span>}
                {m.isDecision && <span className="team-messages__decision-tag"><PushpinFilled aria-hidden="true" /> Decision</span>}
                {menu.length > 0 && (
                  <Dropdown menu={{ items: menu }} trigger={["click"]}>
                    <Button type="text" size="small" className="team-messages__more" icon={<EllipsisOutlined />} aria-label="Message actions" />
                  </Dropdown>
                )}
              </div>
              <div className={`team-messages__bubble${m.isDecision ? " is-decision" : ""}${mine ? " is-mine" : ""}${m.deleted ? " is-deleted" : ""}`}>
                {m.deleted ? <Typography.Text type="secondary" italic>Message removed</Typography.Text> : <span className="team-messages__text"><TeamBody body={m.body} meId={meId} /></span>}
                {m.ask && !m.deleted && (
                  <div className={`team-ask team-ask--${state.tone}`} data-testid="team.ask">
                    <CheckOutlined aria-hidden="true" />
                    <span className="team-ask__what"><strong>Ask</strong> · {Number(m.ask.assigneeId) === Number(meId) ? "you" : m.ask.assigneeName} · by {dueText(m.ask.dueAt)}</span>
                    <span className="team-ask__state">{state.label}</span>
                    {state.tone !== "done" && state.tone !== "cancelled" && Number(m.ask.assigneeId) === Number(meId) && (
                      <Button size="small" onClick={() => onAskDone?.(m.ask)}>Mark done</Button>
                    )}
                    {state.tone !== "done" && state.tone !== "cancelled" && Number(m.ask.askedById) === Number(meId) && Number(m.ask.assigneeId) !== Number(meId) && (
                      <Button size="small" type="text" onClick={() => onAskCancel?.(m.ask)}>Cancel ask</Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}
