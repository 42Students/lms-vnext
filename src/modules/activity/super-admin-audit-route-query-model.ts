import { z } from "zod";
import { ACTIVITY_IMPORTANCE, ACTIVITY_MODULES } from "@/modules/activity/taxonomy";
import { parseActivityDateBoundary } from "@/modules/activity/date-boundary";

const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess(value => value === "" ? undefined : value, schema.optional());
const date = (side: "from" | "to") => optional(z.string().refine(value => {
  try { parseActivityDateBoundary(value, side); return true; } catch { return false; }
}, "Use YYYY-MM-DD or an offset-aware ISO date"));

const legacyCategories=["important","setup","people","teaching","projects"] as const;
const auditViews=[...legacyCategories,"all"] as const;

/** Audit Log query syntax and semantics are strict. An old numeric ID is not
 * silently treated as a UUID or as a name. It requires verified migration ID
 * mapping; guesses would cross tenant boundaries. */
export const superAdminAuditRouteQuerySchema = z.strictObject({
  module: optional(z.enum(ACTIVITY_MODULES)),
  importance: optional(z.enum(ACTIVITY_IMPORTANCE)),
  view: optional(z.enum(auditViews)),
  mode: optional(z.enum(["raw","grouped"])),
  range: optional(z.enum(["today","7d","30d","ALL"])),
  size: optional(z.enum(["25","50","100"])),
  collegeId: optional(z.uuid()),
  organizationId: optional(z.uuid()),
  actorUserId: optional(z.uuid()),
  eventType: optional(z.string().trim().min(1).max(120)),
  subjectType: optional(z.string().trim().min(1).max(80)),
  subjectId: optional(z.string().trim().min(1).max(500)),
  actorName: optional(z.string().trim().min(1).max(100)),
  q: optional(z.string().trim().min(1).max(100)),
  from: date("from"),
  to: date("to"),
  beforeOccurredAt: optional(z.string().datetime({ offset: true })),
  beforeId: optional(z.uuid()),
}).superRefine((value, ctx) => {
  if (Boolean(value.beforeId) !== Boolean(value.beforeOccurredAt))
    ctx.addIssue({ code: "custom", path: ["beforeId"], message: "Cursor fields must be supplied together" });
  if (value.from && value.to &&
    parseActivityDateBoundary(value.from, "from").getTime() > parseActivityDateBoundary(value.to, "to").getTime())
    ctx.addIssue({ code: "custom", path: ["to"], message: "From must be before To" });
});

/** Translate supported legacy action/category/subject names before validation.
 * Old integer actor/org/college IDs must be resolved by a trusted migration,
 * never translated by coercion or unscoped text matching. */
export function validateSuperAdminAuditRouteQuery(raw:Record<string,string|string[]|undefined>) {
  const mapped:Record<string,string|string[]|undefined>={...raw};
  const legacyCategory=mapped.category;
  if(legacyCategory!==undefined){
    if(typeof legacyCategory!=="string"||!legacyCategories.some(x=>x===legacyCategory))
      return null;
    if(mapped.view!==undefined&&mapped.view!==legacyCategory)return null;
    mapped.view=legacyCategory;
    delete mapped.category;
  }
  for(const [alias,target] of [
    ["actionKey","eventType"],["entityType","subjectType"],["entityId","subjectId"],
  ] as const){
    if(mapped[alias]===undefined)continue;
    if(typeof mapped[alias]!=="string")return null;
    if(mapped[target]!==undefined&&mapped[target]!==mapped[alias])return null;
    mapped[target]=mapped[alias];
    delete mapped[alias];
  }
  // The ActivityPage server read currently scopes to the selected header
  // organization, not arbitrary query organization IDs. Reject explicit org
  // selectors until that route passes them into requirePermission and SQL.
  if(mapped.organizationId!==undefined)return null;
  const result=superAdminAuditRouteQuerySchema.safeParse(mapped);
  return result.success?result.data:null;
}
