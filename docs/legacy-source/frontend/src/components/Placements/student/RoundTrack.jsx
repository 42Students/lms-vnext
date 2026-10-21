import React from "react";
import { ROUND_STATE, dayTime, kindNote } from "./words";

/**
 * A drive's selection process with where the student is in it: each round in order, its date and place when known, and the
 * student's state (cleared, booked, up next...). `compact` draws one line of steps for a list card.
 */
export default function RoundTrack({ rounds = [], compact = false, showPlace = true }) {
  if (!rounds.length) {
    return <p className="sp-muted sp-small">The company has not shared its selection rounds yet.</p>;
  }
  if (compact) {
    return (
      <ol className="sp-steps" aria-label="Selection rounds">
        {rounds.map((r) => {
          const st = ROUND_STATE[r.state] || {};
          return (
            <li key={r.roundId} className={`sp-steps__item sp-tone--${st.tone || "later"}`} title={`${r.name}: ${st.label || ""}`}>
              <span className="sp-steps__dot" aria-hidden="true" />
              <span className="sp-steps__name">{r.name}</span>
              <span className="sp-sr">{st.label}</span>
            </li>
          );
        })}
      </ol>
    );
  }
  return (
    <ol className="sp-track" aria-label="Selection rounds">
      {rounds.map((r, i) => {
        const st = r.state ? ROUND_STATE[r.state] || {} : null;
        const when = r.startsAt || r.scheduledAt;
        return (
          <li key={r.roundId || i} className={`sp-track__item ${st ? `sp-tone--${st.tone}` : "sp-tone--later"}`}>
            <span className="sp-track__dot" aria-hidden="true">{st?.tone === "good" ? "✓" : st?.tone === "bad" ? "✕" : i + 1}</span>
            <div className="sp-track__body">
              <div className="sp-track__head">
                <span className="sp-track__name">{r.name}</span>
                {st && r.state !== "TALK" && <span className={`sp-chip sp-chip--${st.tone}`}>{st.label}</span>}
              </div>
              <div className="sp-track__meta">
                {kindNote(r.name, r.kind) && <span>{kindNote(r.name, r.kind)}</span>}
                {r.mode && <span>{r.mode === "VIRTUAL" ? "Online" : "On campus"}</span>}
                {when ? <span>{dayTime(when)}</span> : !["CLEARED", "NOT_CLEARED", "ABSENT", "WAITLISTED", "DONE", "NOT_REACHED"].includes(r.state) ? <span>Date to be announced</span> : null}
                {showPlace && r.room && r.mode !== "VIRTUAL" && <span>{r.room}</span>}
                {r.durationMinutes ? <span>{r.durationMinutes} min</span> : null}
              </div>
              {r.moveAsk?.status === "PENDING" && <div className="sp-track__note">You asked to reschedule. The placement cell will reply.</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
