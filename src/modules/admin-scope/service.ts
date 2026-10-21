import "server-only";

import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  colleges,
  organizations,
} from "@/db/schema";
import type {
  AdminScope,
  RequestContext,
} from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";

export const scopeSelectionSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("organization"),
    organizationId: z.string().uuid(),
  }).strict(),
  z.object({
    kind: z.literal("college"),
    collegeId: z.string().uuid(),
  }).strict(),
]);


// Legacy source IDs are importer-provenance columns, never session or cookie
// identifiers. Old selectors posted numeric orgId/collegeId and used 0 to
// indicate "All". New selectors post {kind, UUID} and clear with DELETE.
const historicalSelectionSchema = z.strictObject({
  organizationId: z.union([z.string().trim(), z.number().int()]).nullish(),
  orgId: z.union([z.string().trim(), z.number().int()]).nullish(),
  collegeId: z.union([z.string().trim(), z.number().int()]).nullish(),
});
type HistoricalSelectionId = string | number | null | undefined;
function legacyScopeIdentifier(value: HistoricalSelectionId): string | number | null {
  if (value===null || value===undefined || value==="") return null;
  if (typeof value==="number") {
    if (!Number.isSafeInteger(value)) throw new AdminScopeServiceError("ADMIN_SCOPE_NOT_FOUND");
    return value>0?value:null;
  }
  const trimmed=value.trim();
  if (/^-?[0-9]+$/.test(trimmed)) {
    const parsed=Number(trimmed);
    if (!Number.isSafeInteger(parsed)) throw new AdminScopeServiceError("ADMIN_SCOPE_NOT_FOUND");
    return parsed>0?parsed:null;
  }
  if (z.string().uuid().safeParse(trimmed).success) return trimmed;
  throw new AdminScopeServiceError("ADMIN_SCOPE_NOT_FOUND");
}

export type AdminScopeChoices = {
  organizations: Array<{
    id: string;
    name: string;
    legacyId?: number | null;
  }>;
  colleges: Array<{
    id: string;
    organizationId: string;
    organizationName: string;
    name: string;
    code: string;
    // Old uniqueId / integer identifiers are display/migration hints only.
    uniqueId?: string;
    legacyId?: number | null;
    legacyOrganizationId?: number | null;
    logoAvailable?: boolean;
    logoUrl?: null;
  }>;
};

export class AdminScopeServiceError extends Error {
  constructor(
    public readonly code: "ADMIN_SCOPE_NOT_FOUND",
  ) {
    // Safe for UI: neither confirms a foreign tenant nor exposes a raw ID.
    super("Invalid college or organization selection. Choose an active scope and try again.");
    this.name = "AdminScopeServiceError";
  }
}

export async function listAdminScopeChoices(
  context: RequestContext,
): Promise<AdminScopeChoices> {
  requirePermission(context, "admin-scope.select");

  const db = getDb();
  const [organizationRows, collegeRows] = await Promise.all([
    db
      .select({
        id: organizations.id,
        name: organizations.name,
        legacyId: organizations.legacyOrganizationId,
      })
      .from(organizations)
      .where(eq(organizations.status, "ACTIVE"))
      .orderBy(asc(organizations.name)),
    db
      .select({
        id: colleges.id,
        organizationId: organizations.id,
        organizationName: organizations.name,
        name: colleges.name,
        code: colleges.code,
        legacyUniqueId: colleges.legacyUniqueId,
        legacyId: colleges.legacyCollegeId,
        legacyOrganizationId: organizations.legacyOrganizationId,
        logoObjectPath: colleges.logoObjectPath,
        legacyLogoUrl: colleges.legacyLogoUrl,
      })
      .from(colleges)
      .innerJoin(
        organizations,
        eq(organizations.id, colleges.organizationId),
      )
      .where(
        and(
          eq(colleges.status, "ACTIVE"),
          eq(organizations.status, "ACTIVE"),
        ),
      )
      .orderBy(
        asc(organizations.name),
        asc(colleges.name),
      ),
  ]);

  return {
    organizations: organizationRows,
    colleges: collegeRows.map(({legacyUniqueId,logoObjectPath,legacyLogoUrl,...row})=>({
      ...row,uniqueId:legacyUniqueId??row.code,
      // Legacy logo URLs and private GCS object keys are not exposed as img
      // sources. A separate authorized signed-URL endpoint can supply a logo.
      logoAvailable:Boolean(logoObjectPath||legacyLogoUrl),
      logoUrl:null,
    })),
  };
}

export async function resolveAdminScopeSelection(
  context: RequestContext,
  rawInput: unknown,
): Promise<AdminScope> {
  requirePermission(context, "admin-scope.select");
  const current=scopeSelectionSchema.safeParse(rawInput);
  const historical=current.success?null:historicalSelectionSchema.safeParse(rawInput);
  if (!current.success && !historical?.success) {
    // Modern callers still receive field-level Zod input diagnostics.
    throw scopeSelectionSchema.parse(rawInput);
  }
  const db = getDb();
  if (historical?.success) {
    const firstOrgId=legacyScopeIdentifier(historical.data.organizationId);
    const alternateOrgId=legacyScopeIdentifier(historical.data.orgId);
    if (firstOrgId!==null&&alternateOrgId!==null&&firstOrgId!==alternateOrgId)
      throw new AdminScopeServiceError("ADMIN_SCOPE_NOT_FOUND");
    const organizationId=firstOrgId??alternateOrgId;
    const collegeId=legacyScopeIdentifier(historical.data.collegeId);
    if (collegeId!==null) {
      const [selected]=await db.select({
        id:colleges.id, organizationId:organizations.id,
        legacyOrgId:organizations.legacyOrganizationId,
      }).from(colleges)
       .innerJoin(organizations,eq(organizations.id,colleges.organizationId))
       .where(and(
         typeof collegeId==="number"?eq(colleges.legacyCollegeId,collegeId):eq(colleges.id,collegeId),
         eq(colleges.status,"ACTIVE"),eq(organizations.status,"ACTIVE"),
       )).limit(1);
      if (!selected || (organizationId!==null && (
        typeof organizationId==="number"
          ?selected.legacyOrgId!==organizationId
          :selected.organizationId!==organizationId
      ))) throw new AdminScopeServiceError("ADMIN_SCOPE_NOT_FOUND");
      return {organizationId:selected.organizationId,collegeId:selected.id};
    }
    if (organizationId!==null) {
      const [selected]=await db.select({id:organizations.id}).from(organizations)
        .where(and(
          typeof organizationId==="number"
            ?eq(organizations.legacyOrganizationId,organizationId)
            :eq(organizations.id,organizationId),
          eq(organizations.status,"ACTIVE"),
        )).limit(1);
      if (!selected) throw new AdminScopeServiceError("ADMIN_SCOPE_NOT_FOUND");
      return {organizationId:selected.id,collegeId:null};
    }
    // POST from a legacy chooser's "All Orgs / All Colleges" is
    // equivalent to modern DELETE, and encodes an empty scope cookie.
    return {organizationId:null,collegeId:null};
  }
  const input=scopeSelectionSchema.parse(rawInput);

  if (input.kind === "organization") {
    const [organization] = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(
        and(
          eq(organizations.id, input.organizationId),
          eq(organizations.status, "ACTIVE"),
        ),
      )
      .limit(1);

    if (!organization) {
      throw new AdminScopeServiceError(
        "ADMIN_SCOPE_NOT_FOUND",
      );
    }

    return {
      organizationId: organization.id,
      collegeId: null,
    };
  }

  const [college] = await db
    .select({
      id: colleges.id,
      organizationId: organizations.id,
    })
    .from(colleges)
    .innerJoin(
      organizations,
      eq(organizations.id, colleges.organizationId),
    )
    .where(
      and(
        eq(colleges.id, input.collegeId),
        eq(colleges.status, "ACTIVE"),
        eq(organizations.status, "ACTIVE"),
      ),
    )
    .limit(1);

  if (!college) {
    throw new AdminScopeServiceError(
      "ADMIN_SCOPE_NOT_FOUND",
    );
  }

  return {
    organizationId: college.organizationId,
    collegeId: college.id,
  };
}
