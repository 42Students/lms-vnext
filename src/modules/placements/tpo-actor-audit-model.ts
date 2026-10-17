import { z } from "zod";
import { placementReportCsv } from "./report-model";

export const tpoActorAuditQuerySchema = z.object({
  actorId: z.string().uuid().optional(),
  entityType: z.string().trim().regex(/^[a-zA-Z][a-zA-Z0-9_]{0,79}$/).optional(),
  entityId: z.string().trim().min(1).max(128).optional(),
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
}).strict().superRefine((data, ctx) => {
  if (data.from && data.to && data.from > data.to) {
    ctx.addIssue({ code: "custom", path: ["to"], message: "End date precedes start date" });
  }
});

export type TpoActorAuditQuery = z.infer<typeof tpoActorAuditQuerySchema>;
export type TpoActorAuditRow = {
  id: string;
  occurredAt: string;
  actorId: string | null;
  actorName?:string|null;
  eventType: string;
  entityType: string;
  entityId: string;
};

export function tpoActorAuditCsv(rows: readonly TpoActorAuditRow[]): string {
  return placementReportCsv(
    ["Time (UTC)", "Actor user ID", "Action", "Entity type", "Entity ID", "Record ID"],
    rows.map((row) => [
      row.occurredAt, row.actorId, row.eventType, row.entityType, row.entityId, row.id,
    ]),
  );
}
