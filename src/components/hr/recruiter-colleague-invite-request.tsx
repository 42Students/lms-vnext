"use client";
import {useState} from "react";
import {Input} from "@/components/ui/input";
import {recruiterColleagueInviteRequestMessage,recruiterColleagueWorkEmail} from "@/modules/placements/recruiter-team-invite-request-model";
import styles from "./recruiter-company-prototype.module.css";

export function RecruiterColleagueInviteRequest({
 collegeId,companyName,collegeName,allowedDomains,
}:{
 collegeId:string;companyName:string;collegeName:string;allowedDomains:readonly string[];
}){
 const [email,setEmail]=useState("");
 const [touched,setTouched]=useState(false);
 const normalized=recruiterColleagueWorkEmail(email,allowedDomains);
 const available=allowedDomains.length>0;
 if(!available)return <p className={styles.muted} role="status">
  The placement cell must verify your company email domain before you can request a colleague invitation.
 </p>;
 return <form method="post" action="/api/placements/recruiter/conversations/open"
  className={styles.inviteForm} aria-label="Request colleague invitation">
  <input type="hidden" name="collegeId" value={collegeId}/>
  <input type="hidden" name="message" value={normalized
   ?recruiterColleagueInviteRequestMessage(normalized,companyName,collegeName):""}/>
  <label className={styles.inviteField}>
   <span className="sr-only">Colleague work email</span>
   <Input type="email" autoComplete="email" value={email} maxLength={254} required
    placeholder={"colleague@"+allowedDomains[0]?.replace(/^@/,"")}
    aria-invalid={touched&&email.length>0&&!normalized}
    onBlur={()=>setTouched(true)} onChange={event=>setEmail(event.target.value)}
    aria-describedby="recruiter-colleague-invite-help"/>
  </label>
  <button type="submit" disabled={!normalized} className={styles.inviteAction}>Request invite</button>
  <p id="recruiter-colleague-invite-help" className={styles.muted}>
   Use a verified company email ({allowedDomains.map(domain=>"@"+domain.replace(/^@/,"")).join(", ")}).
   The placement cell will review the request before access is granted.
  </p>
 </form>;
}
