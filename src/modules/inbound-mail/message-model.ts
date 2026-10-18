import { z } from "zod";
export const inboundMailListQuerySchema = z.strictObject({
 status: z.enum(["ALL", "NEW", "TRIAGED", "RESOLVED"]).default("ALL"),
 q: z.string().trim().max(120).default(""),
 recipient: z.string().trim().toLowerCase().pipe(z.email().max(320)).optional(),
 page: z.coerce.number().int().min(1).max(10000).default(1),
});
export const inboundMailMetadataSchema = z.strictObject({
 id: z.uuid(), receivedAt: z.iso.datetime({ offset: true }),
 fromAddress: z.email().max(320), subject: z.string().max(512),
 status: z.enum(["NEW","TRIAGED","RESOLVED"]),
});
export function safeInboundPreview(value: string, length=180) {
 const limit=Number.isFinite(length)?Math.max(0,Math.min(1000,Math.trunc(length))):180;
 const cleaned=value.replace(/[\u0000-\u001f\u007f]/g," ").replace(/\s+/g," ").trim();
 const clipped=cleaned.slice(0,limit);
 return /[\uD800-\uDBFF]$/.test(clipped)?clipped.slice(0,-1):clipped;
}
