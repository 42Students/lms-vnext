import { z } from "zod";
import { placementReportCsv } from "./report-model";

const uuid = z.string().uuid();
export const tpoFollowupQueueQuerySchema=z.object({scope:z.enum(["TEAM","MINE"]).default("TEAM"),window:z.enum(["DUE","NEXT_7_DAYS"]).default("DUE"),q:z.string().trim().max(100).default(""),page:z.coerce.number().int().min(1).max(10000).default(1)}).strict();
export const confirmedTpoFollowupCreateSchema = z.object({
  confirmed: z.literal(true),
  leadId: uuid,
  dueAt: z.iso.datetime({ offset: true }),
  note: z.string().trim().max(500).nullable().optional(),
}).strict();

export const confirmedTpoFollowupDoneSchema = z.object({
  confirmed: z.literal(true),
  expectedDueAt: z.iso.datetime({ offset: true }),
  outcome: z.enum(["CONTACTED", "NO_RESPONSE", "DECLINED", "OTHER"]),
  note: z.string().trim().min(1).max(500),
}).strict();

export const tpoFollowupIdSchema = uuid;

export type TpoDueFollowupFact = {
  id: string;
  leadId: string;
  leadName: string;
  companyName: string | null;
  dueAt: Date;
  note: string | null;
  phoneNorm?: string | null;
  unsubscribedAt?: Date | null;
  recruiterUserId?: string | null;
};

export function projectTpoFollowupQueue(
  facts: readonly TpoDueFollowupFact[],
  now: Date,
) {
  const rows = facts.map((fact) => ({
    id: fact.id,
    leadId: fact.leadId,
    leadName: fact.leadName,
    companyName: fact.companyName,
    dueAt: fact.dueAt.toISOString(),
    note: fact.note,
    phoneNorm:fact.phoneNorm??null,
    canContact:fact.unsubscribedAt==null&&fact.recruiterUserId==null,
    overdue: fact.dueAt.getTime() < now.getTime(),
  }));
  return { rows, dueCount: rows.filter((row) => row.overdue).length };
}

export function tpoFollowupCreatedAudit(dueAt: Date): string {
  return "Follow-up scheduled for " + dueAt.toISOString();
}

export function tpoFollowupDoneAudit(
  outcome: "CONTACTED" | "NO_RESPONSE" | "DECLINED" | "OTHER",
  note: string,
): string {
  return "Follow-up completed (" + outcome + "): " + note;
}

export function tpoFollowupQueueHref(input:{scope:"MINE"|"TEAM";window:"DUE"|"NEXT_7_DAYS";q?:string;page?:number}){
 const params=new URLSearchParams({scope:input.scope,window:input.window});
 if(input.q)params.set("q",input.q);
 if(input.page&&input.page>1)params.set("page",String(input.page));
 return "/tpo/follow-ups?"+params.toString();
}

/** Opening a native dialer or WhatsApp does not claim that a call or message was sent. */
export function tpoFollowupContactLinks(phoneNorm:string|null,canContact:boolean){
 if(!canContact||!phoneNorm)return {call:null,whatsapp:null};
 const phone=phoneNorm.trim();
 if(!/^\+?[1-9]\d{7,14}$/.test(phone))return {call:null,whatsapp:null};
 return {call:"tel:"+(phone.startsWith("+")?phone:"+"+phone),
  whatsapp:"https://wa.me/"+phone.replace(/^\+/,"")};
}

export const TPO_FOLLOWUP_EXPORT_LIMIT=500;
export function tpoFollowupCsv(facts:readonly TpoDueFollowupFact[],input:{
 scope:"TEAM"|"MINE";window:"DUE"|"NEXT_7_DAYS";q:string;
}){
 const truncated=facts.length>TPO_FOLLOWUP_EXPORT_LIMIT;
 const displayed=facts.slice(0,TPO_FOLLOWUP_EXPORT_LIMIT);
 const rows:(string|null)[][]=displayed.map(f=>[
  f.id,f.leadName,f.companyName??"",f.dueAt.toISOString(),
  f.note??"",
 ]);
 rows.push(["Methodology",input.scope+" ownership, "+input.window+" window, literal search: "+input.q,
   "Open follow-ups only. No call or message delivery implied.","",""]);
 if(truncated)rows.push(["TRUNCATED","First "+TPO_FOLLOWUP_EXPORT_LIMIT+
  " matching rows exported; more matching tasks exist.",null,null,null]);
 return {csv:placementReportCsv(["Follow-up ID","Recruiter","Company","Due ISO","Preparation note"],rows),
   truncated,visible:displayed.length};
}
export function tpoFollowupQueueExportHref(input:{scope:"TEAM"|"MINE";window:"DUE"|"NEXT_7_DAYS";q?:string}){
 const p=new URLSearchParams({scope:input.scope,window:input.window});
 if(input.q)p.set("q",input.q);
 return "/api/placements/tpo/follow-up-queue/export?"+p;
}

/** Companies > Today Tomorrow: move, never duplicate, an open follow-up. */
export const confirmedTpoFollowupRescheduleSchema=z.object({
 confirmed:z.literal(true),expectedDueAt:z.iso.datetime({offset:true}),
 dueAt:z.iso.datetime({offset:true}),
}).strict().refine(input=>
 new Date(input.dueAt).getTime()!==new Date(input.expectedDueAt).getTime(),
 {message:"A moved follow-up must have a different due time"});
