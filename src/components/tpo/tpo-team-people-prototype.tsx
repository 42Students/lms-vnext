"use client";
import {useState} from "react";
import Link from "next/link";
import {
 type TpoPrototypeTeamPerson,summarizeTpoPrototypePerson,
} from "@/modules/placements/tpo-team-people-prototype-model";
import styles from "./tpo-team-people-prototype.module.css";

export function TpoTeamPeoplePrototype({people,workloadReady,selfMembershipId}:{
 people:readonly TpoPrototypeTeamPerson[];
 workloadReady:boolean;selfMembershipId:string;
}){
 const [selectedId,setSelectedId]=useState<string|null>(null);
 const selected=people.find(row=>row.membershipId===selectedId)??people[0];
 return <section aria-label="Placement team People" className={styles.root} data-testid="tpo.team.people">
   <header className={styles.head}>
    <p><strong>{people.length} {people.length===1?"person":"people"}</strong> in your recorded placement team</p>
    <a href="#tpo-team-management" className={styles.action}>+ Add a team member</a>
   </header>
   <div className={styles.columns}>
    <div className={styles.list}>
     <div className={styles.rowHead}>
      <span>PERSON</span><span>HANDLES</span><span>LATE</span>
      <span>WAITING ON THEM</span><span>LAST ACTIVE</span>
     </div>
     {people.map(row=>{
      const values=summarizeTpoPrototypePerson(row,workloadReady);
      const active=row.membershipId===(selected?.membershipId??null);
      return <button key={row.membershipId} type="button" className={styles.row}
       data-selected={active?"true":undefined} aria-pressed={active}
       onClick={()=>setSelectedId(row.membershipId)}>
       <span className={styles.person}>
        <span className={styles.avatar} aria-hidden="true">{row.displayName.trim().slice(0,2).toUpperCase()}</span>
        <span><strong>{row.displayName}</strong><small>{values.role}{row.membershipId===selfMembershipId?" · you":""}</small></span>
       </span>
       <span>{values.handles}</span>
       <span className={row.overdueAsks>0?styles.late:""}>{values.late}</span>
       <span>{values.waiting}</span>
       <span>Not recorded</span>
      </button>;
     })}
     {!people.length?<div className={styles.empty}>No verified active team assignments were found.</div>:null}
    </div>
    {selected?<aside className={styles.detail} aria-label={"Team member "+selected.displayName}>
      <div className={styles.detailPerson}>
       <span className={styles.avatar}>{selected.displayName.trim().slice(0,2).toUpperCase()}</span>
       <span><strong>{selected.displayName}</strong>
        <small>{summarizeTpoPrototypePerson(selected,workloadReady).role}</small>
       </span>
      </div>
      <h3 className={styles.eyebrow}>THEIR RECORDED WORK</h3>
      <dl className={styles.facts}>
       <div><dt>Drive Day duties</dt><dd>{selected.studentDutyCount}</dd></div>
       <div><dt>Open asks</dt><dd>{workloadReady?selected.openAsks:"Unavailable"}</dd></div>
       <div><dt>Late asks</dt><dd>{workloadReady?selected.overdueAsks:"Unavailable"}</dd></div>
       <div><dt>Last active</dt><dd>Not recorded</dd></div>
      </dl>
      <h3 className={styles.eyebrow}>AWAY</h3>
      <p>{selected.awayUntil?
        "Away until "+new Intl.DateTimeFormat("en-IN",{
         timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short",
        }).format(new Date(selected.awayUntil))+" IST":
        "No currently recorded away interval"}</p>
      <div className={styles.actions}>
       {selected.membershipId===selfMembershipId?
         <a href="#tpo-team-availability" className={styles.action}>Set away…</a>:null}
       <Link href="/tpo/messages?tab=team" className={styles.action}>Message</Link>
      </div>
      <div className={styles.management}>
       <strong>Manage team access</strong>
       <p>Review the member’s real permissions and handover options below. Team messages remain separate from drive ownership.</p>
       <a href="#tpo-team-management" className={styles.action}>Manage membership and handover ›</a>
      </div>
    </aside>:null}
   </div>
  </section>;
}
