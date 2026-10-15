import {z} from "zod";
export const auditFindingsQuerySchema=z.strictObject({
 severity:z.enum(["ALL","CRITICAL","HIGH","MEDIUM","LOW"]).default("ALL"),
 status:z.enum(["ALL","OPEN","IN_PROGRESS","RESOLVED"]).default("ALL"),
 q:z.string().trim().max(120).default(""),
 page:z.coerce.number().int().min(1).max(10000).default(1),
});
export function auditFindingPriority(severity:"CRITICAL"|"HIGH"|"MEDIUM"|"LOW") {
 return ({CRITICAL:0,HIGH:1,MEDIUM:2,LOW:3} as const)[severity];
}
