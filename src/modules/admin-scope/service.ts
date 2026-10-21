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

export type AdminScopeChoices = {
  organizations: Array<{
    id: string;
    name: string;
  }>;
  colleges: Array<{
    id: string;
    organizationId: string;
    organizationName: string;
    name: string;
    code: string;
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
    colleges: collegeRows,
  };
}

export async function resolveAdminScopeSelection(
  context: RequestContext,
  rawInput: unknown,
): Promise<AdminScope> {
  requirePermission(context, "admin-scope.select");
  const input = scopeSelectionSchema.parse(rawInput);
  const db = getDb();

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
