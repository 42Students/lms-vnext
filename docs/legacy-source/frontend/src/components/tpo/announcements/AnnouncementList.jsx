import { Fragment, useEffect } from "react";
import Link from "next/link";
import { Button, Empty, Popconfirm, Progress, Skeleton, Tag, Typography } from "antd";
import { LinkOutlined, PushpinFilled } from "@ant-design/icons";
import { dj } from "@/components/tpo/dj";

/** A date the way the app says them: "12 Oct, 2:05 PM", with the year when it isn't this year. */
export const when = (v) => {
  if (!v) return "";
  const d = dj(v);
  return d.format(d.isSame(dj(), "year") ? "D MMM, h:mm A" : "D MMM YYYY, h:mm A");
};

const URL = /(https:\/\/[^\s<>"')\]]+)/g;
/** The text with its https links clickable (opened in a new tab). */
export function Linkified({ text }) {
  const parts = String(text || "").split(URL);
  return parts.map((p, i) => (i % 2 === 1
    ? <a key={i} href={p} target="_blank" rel="noopener noreferrer">{p}</a>
    : <Fragment key={i}>{p}</Fragment>));
}

/** What the cell sees about an announcement's state. */
export function stateOf(a) {
  if (a.state === "SCHEDULED") return { label: `Scheduled for ${when(a.sendAt)}`, color: "gold" };
  if (a.state === "ENDED") return { label: "Ended", color: "default" };
  return null;
}

/** "84 of 120 read" (students) or "3 of 12 placement cells read" (42). */
export function readsLine(a, unit = "read") {
  const of = Number(a.recipientCount);
  const read = Number(a.readCount) || 0;
  if (!of) return `${read} ${unit}`;
  return `${read} of ${of} ${unit}`;
}

/**
 * One list of announcements (N12, V2), the same design for the placement cell, students, From 42 and super admin: pinned first,
 * who it went to, its state (scheduled, ended, updated, new), reads against how many it reached, the text with clickable links, its
 * button, and the actions the reader has.
 */
export default function AnnouncementList({ items, loading, emptyText, mode = "student", onEdit, onDelete, onUnreadBy, onRemind, highlightId }) {
  useEffect(() => {
    if (!highlightId || !items?.length || typeof document === "undefined") return;
    const el = document.getElementById(`announcement-${highlightId}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightId, items]);

  if (loading) return <Skeleton active paragraph={{ rows: 4 }} />;
  if (!items || items.length === 0) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} />;
  return (
    <div className="announcement-list">
      {items.map((a) => {
        const state = mode === "cell" ? stateOf(a) : null;
        // Booleans only: the API sends unread / updated as 0 or 1, and a bare 0 printed "0" after every title.
        const isNew = (mode === "student" || mode === "from42") && Boolean(a.unread);
        const audience = mode === "cell" || mode === "superadmin" ? a.audienceLabel : mode === "student" ? a.forYou : null;
        const showReads = (mode === "cell" && a.state !== "SCHEDULED") || mode === "superadmin";
        const pct = Number(a.recipientCount) ? Math.round((100 * (Number(a.readCount) || 0)) / Number(a.recipientCount)) : null;
        return (
          <article key={a.id} id={`announcement-${a.id}`} data-testid={`announcement-${a.id}`}
            className={`announcement-card${a.pinned ? " is-pinned" : ""}${String(highlightId) === String(a.id) ? " is-highlight" : ""}${a.state === "ENDED" ? " is-ended" : ""}`}>
            <header className="announcement-card__head">
              <div className="announcement-card__title-row">
                {a.pinned ? <PushpinFilled className="announcement-card__pin" aria-label="Pinned" /> : null}
                <h3 className="announcement-card__title">{a.title}</h3>
                {isNew && <Tag color="blue">New</Tag>}
                {state && <Tag color={state.color}>{state.label}</Tag>}
                {Boolean(a.updated || (mode !== "cell" && a.updatedAt)) && <Tag>Updated</Tag>}
              </div>
              <Typography.Text type="secondary" className="announcement-card__meta">
                {[a.authorName, when(a.sentAt || a.createdAt), mode === "cell" && a.email ? "also emailed" : null,
                  a.showUntil && a.state !== "ENDED" ? `shows until ${when(a.showUntil)}` : null].filter(Boolean).join(" · ")}
              </Typography.Text>
              {audience && <span className="announcement-card__audience">{mode === "student" ? `For ${audience}` : audience}</span>}
            </header>
            <p className="announcement-card__body"><Linkified text={a.body} /></p>
            {(a.linkUrl || (mode === "student" && a.jobId)) && (
              <div className="announcement-card__buttons">
                {a.linkUrl && <a className="ant-btn ant-btn-default announcement-card__button" href={a.linkUrl} target="_blank" rel="noopener noreferrer"><LinkOutlined /> {a.linkLabel || "Open"}</a>}
                {mode === "student" && a.jobId && <Link className="ant-btn ant-btn-default announcement-card__button" href={`/learn/my-placements/jobs/${a.jobId}`}>Open the drive</Link>}
              </div>
            )}
            {(showReads || onEdit || onDelete) && (
              <footer className="announcement-card__foot">
                {showReads && (
                  <div className="announcement-card__reads">
                    {pct != null && <Progress percent={pct} showInfo={false} size="small" strokeColor="#0a7c88" aria-hidden="true" />}
                    <Typography.Text type="secondary">{readsLine(a, mode === "superadmin" ? "placement cells read" : "read")}</Typography.Text>
                  </div>
                )}
                <div className="announcement-card__actions">
                  {onUnreadBy && a.state === "SENT" && Number(a.readCount) < Number(a.recipientCount) && <Button size="small" onClick={() => onUnreadBy(a)}>Who hasn&apos;t read</Button>}
                  {onRemind && a.state === "SENT" && Number(a.readCount) < Number(a.recipientCount) && <Button size="small" onClick={() => onRemind(a)}>Remind them</Button>}
                  {onEdit && <Button size="small" onClick={() => onEdit(a)}>Edit</Button>}
                  {onDelete && (
                    <Popconfirm title="Delete this announcement?" description={mode === "cell" ? "Students stop seeing it, and its notices are taken back." : "Placement cells stop seeing it."}
                      okText="Delete" okButtonProps={{ danger: true }} onConfirm={() => onDelete(a)}>
                      <Button size="small" danger>Delete</Button>
                    </Popconfirm>
                  )}
                </div>
              </footer>
            )}
          </article>
        );
      })}
    </div>
  );
}
