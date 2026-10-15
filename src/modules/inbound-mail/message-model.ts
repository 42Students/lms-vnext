import { z } from "zod";
export const inboundMailListQuerySchema = z.strictObject({
 status: z.enum(["ALL", "NEW", "TRIAGED", "RESOLVED"]).default("ALL"),
 q: z.string().trim().max(120).default(""),
 page: z.coerce.number().int().min(1).max(10000).default(1),
});
export const inboundMailMetadataSchema = z.strictObject({
 id: z.uuid(), receivedAt: z.iso.datetime({ offset: true }),
 fromAddress: z.email().max(320), subject: z.string().max(512),
 status: z.enum(["NEW","TRIAGED","RESOLVED"]),
});
export function safeInboundPreview(value: string, length=180) {
 return value.replace(/[\u0000-\u001f\u007f]/g," ").replace(/\s+/g," ").trim().slice(0,length);
}
