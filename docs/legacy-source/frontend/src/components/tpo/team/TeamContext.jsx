import Link from "next/link";
import { Button, Tag, Typography } from "antd";
import { dj } from "@/components/tpo/dj";
import { plainText } from "@/components/tpo/team/teamTokens";

const COMMUNICATION = { NOT_CONTACTED: "Not contacted", EMAILED: "Emailed", REPLIED: "Replied", MEETING_SET: "Meeting set", NOT_INTERESTED: "Not interested" };
const STATUS = { REQUEST: "In review", DRAFT: "Draft", PUBLISHED: "Published", CLOSED: "Closed", CANCELLED: "Cancelled", REJECTED: "Declined" };
const KICKER = { EVERYONE: "Whole team", TOPIC: "Topic", DRIVE: "Drive", COMPANY: "Company", STUDENT: "Student" };
// A date in another year says which year.
const when = (v, f = "D MMM, h:mm A") => (v ? dj(v).format(dj(v).isSame(dj(), "year") ? f : f.replace("D MMM", "D MMM YYYY")) : null);

/** The drive's next step in a few words, from its state. */
export function driveNextStep(c) {
  if (!c) return null;
  if (c.status === "REQUEST") return "Review the request";
  if (c.status === "DRAFT") return "Publish when ready";
  if (c.status === "PUBLISHED") {
    if (c.deadline && dj(c.deadline).isAfter(dj())) return `Applications open until ${when(c.deadline)}`;
    return "Applications closed: rounds and results";
  }
  if (c.status === "CLOSED") return "Closed";
  return null;
}

function Fact({ k, v }) {
  if (v == null || v === "") return null;
  return <div className="team-context__fact"><span>{k}</span><strong>{v}</strong></div>;
}

/**
 * The right-hand panel (design §1): what the conversation is about, with its facts and a way there; then the open asks, the
 * decisions and the people in it. For a topic it is never empty: people, asks and decisions.
 */
export default function TeamContext({ data, meId, onShowAsk, onAddPeople }) {
  const thread = data?.thread || {};
  const c = data?.context || {};
  const kind = thread.kind || c.kind;
  const asks = data?.asks || [];
  const decisions = data?.decisions || [];
  const people = data?.people || [];
  return (
    <aside className="team-context" aria-label="About this conversation" data-testid="team.context">
      <section className="team-context__card">
        <Typography.Text className="team-context__kicker">{KICKER[kind] || "Conversation"}{kind === "DRIVE" && c.status ? ` · ${STATUS[c.status] || c.status}` : ""}{thread.isPrivate ? " · Private" : ""}</Typography.Text>
        <div className="team-context__title">{kind === "COMPANY" ? c.name || thread.title : kind === "STUDENT" ? c.name || thread.title : thread.title}</div>
        {c.gone && <Typography.Text type="secondary">This {String(KICKER[kind] || "").toLowerCase()} no longer exists. The conversation stays.</Typography.Text>}
        {kind === "DRIVE" && !c.gone && (
          <>
            {c.deleted && <Tag color="red">Drive deleted</Tag>}
            <Fact k="Next step" v={driveNextStep(c)} />
            <Fact k={c.deadline && dj(c.deadline).isBefore(dj()) ? "Applications closed" : "Applications close"} v={when(c.deadline)} />
            <Fact k="Applied" v={c.applicants != null ? String(c.applicants) : null} />
            <Fact k="Offers" v={c.offers ? String(c.offers) : null} />
            <Fact k="Owner" v={c.owner || "Nobody yet"} />
          </>
        )}
        {kind === "COMPANY" && (
          <>
            <Fact k="Where you are" v={c.communication ? COMMUNICATION[c.communication] || c.communication : "Not set"} />
            <Fact k="Owner" v={(c.owners || []).join(", ") || "Nobody yet"} />
            <Fact k="Contacts" v={c.contacts != null ? String(c.contacts) : null} />
            <Fact k="Drives" v={c.drives != null ? `${c.drives}${c.liveDrives ? ` (${c.liveDrives} live)` : ""}` : null} />
            <Fact k="Next follow-up" v={when(c.nextFollowUp, "ddd D MMM")} />
          </>
        )}
        {kind === "STUDENT" && !c.gone && (
          <>
            <Fact k="Roll" v={c.roll} />
            <Fact k="Branch" v={c.branch} />
            <Fact k="Batch" v={c.batch} />
            <Fact k="CGPA" v={c.cgpa != null ? String(c.cgpa) : null} />
            <Fact k="Applications" v={c.applications != null ? String(c.applications) : null} />
            <Fact k="Offers" v={c.offers != null ? String(c.offers) : null} />
          </>
        )}
        {kind === "EVERYONE" && <Typography.Text type="secondary">Everyone in the placement team, including people who join later. You can mute it, not leave it.</Typography.Text>}
        {c.link && !c.gone && (
          <Link href={c.link} className="team-context__open">{kind === "DRIVE" ? "Open the drive" : kind === "COMPANY" ? "Open the company" : "Open the student"}</Link>
        )}
      </section>

      <section className="team-context__section">
        <Typography.Text strong>Open asks here</Typography.Text>
        {asks.length === 0
          ? <Typography.Text type="secondary" className="team-context__none">None. Use “Ask someone” to give a task a name and a date.</Typography.Text>
          : asks.map((a) => (
            <button type="button" key={a.id} className={`team-context__ask${a.overdue ? " is-overdue" : ""}`} onClick={() => onShowAsk?.(a.messageId)}>
              <span className="team-context__ask-text">{plainText(a.body)}</span>
              <span className="team-context__ask-meta">{Number(a.assigneeId) === Number(meId) ? "You" : a.assigneeName} · {a.dueAt ? `by ${when(a.dueAt, "ddd D MMM, h:mm A")}` : "no date"}{a.overdue ? " · overdue" : ""}</span>
            </button>
          ))}
      </section>

      {decisions.length > 0 && (
        <section className="team-context__section">
          <Typography.Text strong>Decisions here</Typography.Text>
          {decisions.map((d) => (
            <button type="button" key={d.id} className="team-context__decision" onClick={() => onShowAsk?.(d.id)}>
              <span>{plainText(d.body)}</span>
              <span className="team-context__ask-meta">{d.decidedBy} · {when(d.decidedAt || d.createdAt, "D MMM")}</span>
            </button>
          ))}
        </section>
      )}

      <section className="team-context__section">
        <Typography.Text strong>People</Typography.Text>
        {people.length === 0 && <Typography.Text type="secondary" className="team-context__none">Nobody has written yet.</Typography.Text>}
        {people.map((p) => (
          <div key={p.facultyId} className="team-context__person">
            <span className="team-avatar" aria-hidden="true">{String(p.name || "?").split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase()}</span>
            <span className="team-context__person-name">{p.name}{Number(p.facultyId) === Number(meId) ? " (you)" : ""}</span>
            <span className="team-context__person-note">{[p.owner && "owner", p.awayUntil && `away until ${dj(p.awayUntil).format("D MMM")}`].filter(Boolean).join(" · ")}</span>
          </div>
        ))}
        {thread.id && kind === "TOPIC" && thread.isPrivate && <Button size="small" type="link" onClick={() => onAddPeople?.()}>Add people</Button>}
      </section>
    </aside>
  );
}
