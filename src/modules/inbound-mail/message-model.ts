import { z } from "zod";
/** Delivery outcome is independent of staff triage state. */
export const inboundMailRoutingStatuses=[
 "POSTED","STORED","NO_THREAD","WRONG_SENDER","NOT_VERIFIED","EMPTY","ACCESS_ENDED","FAILED",
] as const;
export type InboundMailRoutingStatus=typeof inboundMailRoutingStatuses[number];
export const inboundMailRoutingStatusLabels:Record<InboundMailRoutingStatus,string>={
 POSTED:"Posted to the conversation",STORED:"Received",NO_THREAD:"Conversation not found",
 WRONG_SENDER:"Not from that recruiter",NOT_VERIFIED:"Sender not verified",
 EMPTY:"Empty reply",ACCESS_ENDED:"Recruiter's access ended",FAILED:"Could not post",
};
/** Display-only mailbox header normalization. RFC From can be a label plus
 * angle-bracket address; malformed inbound email must remain inspectable by
 * admins without being mistaken for a verified reply sender. */
export function normalizeInboundMailSender(raw:string){
 const cleaned=raw.replace(/[\u0000-\u001f\u007f\r\n]/g," ").trim().slice(0,320);
 const angle=/<([^<>\s]+@[^<>\s]+)>/.exec(cleaned);
 const email=(angle?.[1]??cleaned).toLowerCase().trim();
 return {display:cleaned,address:/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)?email:null};
}
export const inboundMailListQuerySchema = z.strictObject({
 // Historical OPEN maps to NEW; unknown legacy query values open the
 // default inbox rather than producing a blank/error page.
 status: z.string().optional().transform(value=>{
  if(value==="OPEN")return "NEW" as const;
  if(value==="NEW"||value==="TRIAGED"||value==="RESOLVED"||value==="ALL")return value;
  return "ALL" as const;
 }),
 kind:z.enum(["REPLY","OTHER"]).optional(),
 routingStatus:z.enum(inboundMailRoutingStatuses).optional(),
 q: z.string().trim().max(120,{message:"Search must contain at most 120 characters"}).default(""),
 recipient: z.string().trim().toLowerCase().pipe(z.email().max(320)).optional(),
 page: z.coerce.number().int().catch(1).transform(value=>Math.max(1,Math.min(10000,value))).default(1),
});
export const inboundMailMetadataSchema = z.strictObject({
 id: z.uuid(), receivedAt: z.iso.datetime({ offset: true }),
 fromAddress: z.string().trim().max(320), subject: z.string().max(512),
 status: z.enum(["NEW","TRIAGED","RESOLVED"]),
 kind:z.enum(["REPLY","OTHER"]).default("OTHER"),
 routingStatus:z.enum(inboundMailRoutingStatuses).default("STORED"),
});
export function safeInboundPreview(value: string, length=180) {
 const limit=Number.isFinite(length)?Math.max(0,Math.min(1000,Math.trunc(length))):180;
 const cleaned=value.replace(/[\u0000-\u001f\u007f\u200e-\u200f\u202a-\u202e\u2066-\u2069]/g," ")
  .replace(/\s+/g," ").trim();
 const clipped=cleaned.slice(0,limit);
 return /[\uD800-\uDBFF]$/.test(clipped)?clipped.slice(0,-1):clipped;
}
