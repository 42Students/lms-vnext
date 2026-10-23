"use client";

import Link from "next/link";
import {useEffect, useState} from "react";
import type {MentorProjectAttention} from "@/modules/projects/mentor-attention";

type FocusItem = MentorProjectAttention;
const MAX_SNOOZED = 100;

function attentionLabel(kind:FocusItem["kind"]):string {
  switch(kind) {
    case "REVIEW": return "Submission to review";
    case "STALLED": return "Project gone quiet";
    case "REQUESTED": return "Meeting request";
    case "MEETING_SOON": return "Meeting coming up";
  }
}
function attentionAction(kind:FocusItem["kind"]):string {
  switch(kind) {
    case "REVIEW": return "Review it";
    case "STALLED": return "Plan a check-in";
    case "REQUESTED": return "Answer";
    case "MEETING_SOON": return "See meeting";
  }
}
function activityTime(value:string) {
  const parsed=new Date(value);
  if(!Number.isFinite(parsed.getTime()))return "Recorded update";
  return new Intl.DateTimeFormat("en-IN",{
    day:"numeric",month:"short",year:"numeric",timeZone:"Asia/Kolkata",
  }).format(parsed);
}
function storageKey(scope:string) {
  return "42lms:mentor:prototype:later:v1:" + scope;
}
function readLater(key:string):string[] {
  try {
    const value=JSON.parse(localStorage.getItem(key)||"[]") as unknown;
    return Array.isArray(value) ? value.filter((x):x is string=>typeof x==="string").slice(-MAX_SNOOZED) : [];
  } catch {return [];}
}

/** Prototype screen #45: focus queue and right-side panels backed by real
 * membership-scoped attention. "Later" is per-account/per-event local state;
 * the item reappears automatically when the event timestamp changes.
 */
export function MentorPrototypeHome({
  scope, attention, teamCount, membershipCount,
}:{
  scope:string;
  attention:readonly FocusItem[];
  teamCount:number;
  membershipCount:number;
}) {
  const [snoozed,setSnoozed]=useState<readonly string[]>([]);
  const [hydrated,setHydrated]=useState(false);
  useEffect(()=>{
    // Defer storage hydration until the first animation frame so the initial
    // server/client trees agree and React's effect-set-state rule is respected.
    const frame=window.requestAnimationFrame(()=>{
      setSnoozed(readLater(storageKey(scope)));
      setHydrated(true);
    });
    return ()=>window.cancelAnimationFrame(frame);
  },[scope]);
  const active=hydrated
    ? attention.filter(item=>!snoozed.includes(item.key+"@"+item.occurredAt))
    : attention;
  const focus=active.slice(0,5);
  const meetings=attention.filter(item=>item.kind==="MEETING_SOON").slice(0,4);
  const watch=attention.filter(item=>item.kind==="STALLED").slice(0,3);
  const later=(item:FocusItem)=>{
    const eventKey=item.key+"@"+item.occurredAt;
    const next=[...new Set([...snoozed,eventKey])].slice(-MAX_SNOOZED);
    setSnoozed(next);
    try{localStorage.setItem(storageKey(scope),JSON.stringify(next));}catch{/* session still hides the item */}
  };

  return <div className="prototype-mentor-home">
    <div className="prototype-mentor-home-heading">
      <div>
        <p>{teamCount} {teamCount===1?"team":"teams"} · {membershipCount} team {membershipCount===1?"membership":"memberships"} · project workspace</p>
        <h1>{active.length
          ? active.length+" "+(active.length===1?"thing needs":"things need")+" you."
          : "You’re all caught up."}</h1>
      </div>
    </div>
    <div className="prototype-mentor-home-columns">
      <section className="prototype-mentor-focus" aria-label="Needs you, oldest first">
        <div className="prototype-mentor-box-heading">
          <strong>Needs you · attention first</strong>
          <span>Later hides it until this event changes</span>
        </div>
        {focus.length ? focus.map(item=><article className="prototype-mentor-focus-item" key={item.key}>
          <div>
            <span className="prototype-mentor-focus-kind">{attentionLabel(item.kind)} · {activityTime(item.occurredAt)}</span>
            <strong>{item.title}</strong>
            <p>{item.description}</p>
          </div>
          <div className="prototype-mentor-focus-actions">
            <Link href={item.href}>{attentionAction(item.kind)}</Link>
            <button type="button" onClick={()=>later(item)} aria-label={"Later: "+item.title}>Later</button>
          </div>
        </article>):<p className="prototype-mentor-empty">No urgent reviews, meeting requests or stalled teams in your current projects.</p>}
        {active.length>5?<p className="prototype-mentor-focus-footer">{active.length-5} more items need attention. <Link href="/mentor/notifications">See notifications</Link></p>:null}
      </section>
      <aside className="prototype-mentor-home-right" aria-label="Team overview">
        <section className="prototype-mentor-small-card">
          <div className="prototype-mentor-small-title">
            <strong>This week · meetings</strong>
            <Link href="/mentor/calendar">All meetings ›</Link>
          </div>
          {meetings.length?meetings.map(item=><Link href={item.href} className="prototype-mentor-small-row" key={item.key}>
            <span>{activityTime(item.occurredAt)}</span><strong>{item.title}</strong>
          </Link>):<p className="prototype-mentor-small-empty">No meetings in the next 48 hours. <Link href="/mentor/calendar">Open calendar</Link></p>}
        </section>
        <section className="prototype-mentor-small-card">
          <div className="prototype-mentor-small-title"><strong>Projects to watch</strong></div>
          {watch.length?watch.map(item=><Link href={item.href} className="prototype-mentor-small-row" key={item.key}>
            <span>Needs a check-in</span><strong>{item.title}</strong>
          </Link>):<p className="prototype-mentor-small-empty">No stalled projects in the current portfolio.</p>}
          <p className="prototype-mentor-watch-note">Student-level risk signals are not yet available in this summary; open each project’s Performance tab for individual work.</p>
        </section>
      </aside>
    </div>
  </div>;
}
