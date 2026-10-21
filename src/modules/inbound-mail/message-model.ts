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
export const inboundMailListQuerySchema = z.strictObject({
 status: z.enum(["ALL", "NEW", "TRIAGED", "RESOLVED"]).default("ALL"),
 kind:z.enum(["REPLY","OTHER"]).optional(),
 routingStatus:z.enum(inboundMailRoutingStatuses).optional(),
 q: z.string().trim().max(120).default(""),
 recipient: z.string().trim().toLowerCase().pipe(z.email().max(320)).optional(),
 page: z.coerce.number().int().max(10000).transform(value=>Math.max(1,value)).default(1),
});
export const inboundMailMetadataSchema = z.strictObject({
 id: z.uuid(), receivedAt: z.iso.datetime({ offset: true }),
 fromAddress: z.email().max(320), subject: z.string().max(512),
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
