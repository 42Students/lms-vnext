"use client";
import {RECRUITER_STAGE_LEGACY_LABELS,type TpoRecruiterLeadStage} from "@/modules/placements/tpo-recruiter-lead-policy";
import {tpoRecruiterFollowupSignal} from "@/modules/placements/tpo-recruiter-attention-model";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { ButtonLink } from "@/components/ui/button-link";
import { TextLink } from "@/components/ui/text-link";
import { createDateFormatter } from "@/lib/format-date";

import { DEFAULT_TIME_ZONE } from "@/config/locale";
export type TpoRecruiterInspectorLead={
 id:string;name:string;designation:string|null;companyName:string|null;
 stage:TpoRecruiterLeadStage;source:string|null;ownerName:string|null;
 phoneNorm:string|null;emailNorm:string|null;unsubscribedAt:string|null;
 nextFollowupAt:string|null;lastActivityAt:string|null;lastActivityType?:string|null;
 inviteStatus:string;drivesRan:number|null;studentsPlaced:number|null;
};

function when(value:string|null){
 if(!value)return "Not recorded";
 const date=new Date(value);
 if(!Number.isFinite(date.getTime()))return "Unavailable";
 return createDateFormatter("en-IN", {timeZone:DEFAULT_TIME_ZONE,
  day:"numeric",month:"short",year:"numeric",hour:"numeric",minute:"2-digit",
 }).format(date)+" IST";
}
function validContactPhone(value:string|null):string|null{
 if(!value)return null;
 const digits=value.replace(/[\s()-]/g,"");
 return /^\+?[1-9]\d{7,14}$/.test(digits)?digits:null;
}
export function TpoRecruiterPrototypeInspector({
 lead,onDismiss
}:{lead:TpoRecruiterInspectorLead;onDismiss:()=>void}){
 const href="/tpo/recruiters/"+encodeURIComponent(lead.id);
 const contactAllowed=!lead.unsubscribedAt;
 const phone=contactAllowed?validContactPhone(lead.phoneNorm):null;
 const email=contactAllowed&&lead.emailNorm&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.emailNorm)?
  "mailto:"+lead.emailNorm:null;
 const initials=lead.name.trim().split(/\s+/).slice(0,2).map(word=>word[0]?.toUpperCase()??"").join("")||"R";
 const nextSignal=tpoRecruiterFollowupSignal(lead.nextFollowupAt,new Date());
 return <aside className="min-w-0 self-start rounded-xl border border-border bg-surface p-4 md:p-5"
  aria-label={"Selected recruiter: "+lead.name} data-testid="tpo.recruiter.inspector">
  <div className="flex items-start gap-3">
   <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-subtle font-semibold text-primary-text">{initials}</span>
   <div className="min-w-0 flex-1">
    <Heading level={2} size="lg" className="break-words text-foreground">{lead.name}</Heading>
    <p className="mt-1 text-xs text-body">{[lead.designation,lead.companyName].filter(Boolean).join(" · ")||"Recruiter contact"}</p>
   </div>
   <Button variant="bare" type="button" onClick={onDismiss} aria-label="Close recruiter details"
    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border text-body md:min-h-9 md:min-w-9">×</Button>
  </div>
  <section aria-label="Next recruiter step" className={"mt-4 rounded-lg p-3 "+(nextSignal.lateDays>0?"bg-[color:var(--lms-error-surface)]":"bg-primary-subtle")}>
   <Heading level={3} className={"text-xs font-bold uppercase tracking-wide "+(nextSignal.lateDays>0?"text-[color:var(--lms-error-text)]":"text-primary-text")}>Next step</Heading>
   <p className="mt-1 font-semibold text-foreground">{nextSignal.label}</p>
   {lead.nextFollowupAt?<p className="mt-1 text-xs text-body">{when(lead.nextFollowupAt)}</p>:null}
  </section>
  <div className="mt-3 flex flex-wrap gap-2">
   <ButtonLink variant="primary" href={href+"#tpo-recruiter-log-interaction"}>Log activity</ButtonLink>
   {phone?<ButtonLink variant="secondary" href={"tel:"+phone}>Call</ButtonLink>:null}
   {email?<ButtonLink variant="secondary" href={email}>Email</ButtonLink>:null}
  </div>
  {lead.unsubscribedAt?<p role="status" className="mt-2 text-xs text-warning-text">This recruiter has opted out of outreach. Contact actions are unavailable.</p>:null}
  <dl className="mt-4 divide-y divide-border border-t border-border text-sm">
   <div className="py-3"><dt className="text-xs font-bold uppercase text-muted-foreground">Where you are</dt>
    <dd className="mt-1 font-semibold text-foreground">{RECRUITER_STAGE_LEGACY_LABELS[lead.stage]}</dd></div>
   <div className="py-3"><dt className="text-xs font-bold uppercase text-muted-foreground">How they joined</dt>
    <dd className="mt-1 text-foreground">Invite: {lead.inviteStatus.replaceAll("_"," ").toLowerCase()}</dd>
    {lead.source?<p className="mt-1 text-xs text-body">Source: {lead.source.replaceAll("_"," ").toLowerCase()}</p>:null}</div>
   <div className="py-3"><dt className="text-xs font-bold uppercase text-muted-foreground">Last recorded activity</dt>
    <dd className="mt-1 text-foreground">{when(lead.lastActivityAt)}</dd>
    {lead.lastActivityType?<p className="mt-1 text-xs text-body">{lead.lastActivityType.replaceAll("_"," ").toLowerCase()}</p>:null}</div>
   <div className="py-3"><dt className="text-xs font-bold uppercase text-muted-foreground">Company</dt>
    <dd className="mt-1 text-foreground">{lead.companyName?
     <TextLink href={"/tpo/companies?name="+encodeURIComponent(lead.companyName)}>{lead.companyName}</TextLink>:"Not recorded"}</dd>
    <p className="mt-1 text-xs text-body">
     {lead.drivesRan===null?"Drive count unavailable":lead.drivesRan+" drives run"}
     {" · "}{lead.studentsPlaced===null?"Placed count unavailable":lead.studentsPlaced+" students placed"}
    </p></div>
   <div className="py-3"><dt className="text-xs font-bold uppercase text-muted-foreground">Handled by</dt>
    <dd className="mt-1 text-foreground">{lead.ownerName??"Nobody yet"}</dd></div>
  </dl>
  <TextLink href={href} className="mt-2 inline-flex min-h-11 items-center text-sm md:min-h-9">Open full page</TextLink>
 </aside>;
}
