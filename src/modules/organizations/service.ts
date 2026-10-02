import { and, asc, eq, ne, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { colleges, organizations } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import {
  hasMembershipRole,
  isSuperAdmin,
} from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import {
  createOrganizationInputSchema,
  organizationIdSchema,
  renameOrganizationInputSchema,
  type CreateOrganizationInput,
  type RenameOrganizationInput,
} from "./validation";

export type OrganizationServiceErrorCode =
  | "ORGANIZATION_NOT_FOUND"
  | "ORGANIZATION_NAME_CONFLICT"
  | "ORGANIZATION_HAS_COLLEGES";

export class OrganizationServiceError extends Error {
  constructor(public readonly code: OrganizationServiceErrorCode) {
    super(code);
    this.name = "OrganizationServiceError";
  }
}

function isUniqueViolation(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: unknown }).code === "23505",
  );
}

async function loadActiveOrganization(organizationId: string) {
  const db = getDb();

  const [organization] = await db
    .select({
      id: organizations.id,
      name: organizations.name,
    })
    .from(organizations)
    .where(
      and(
        eq(organizations.id, organizationId),
        eq(organizations.status, "ACTIVE"),
      ),
    )
    .limit(1);

  if (!organization) {
    throw new OrganizationServiceError("ORGANIZATION_NOT_FOUND");
  }

  return organization;
}

async function assertUniqueActiveName(
  name: string,
  excludeOrganizationId?: string,
) {
  const db = getDb();

  const conditions = [
    eq(organizations.status, "ACTIVE"),
    sql<boolean>`lower(${organizations.name}) = ${name.toLowerCase()}`,
  ];

  if (excludeOrganizationId) {
    conditions.push(ne(organizations.id, excludeOrganizationId));
  }

  const [existing] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(and(...conditions))
    .limit(1);

  if (existing) {
    throw new OrganizationServiceError("ORGANIZATION_NAME_CONFLICT");
  }
}

export async function listOrganizations(context: RequestContext) {
  const db = getDb();

  if (isSuperAdmin(context)) {
    const selected = context.adminScope;
    const selectedOrganizationId =
      selected?.organizationId ?? null;

    if (selectedOrganizationId) {
      requirePermission(context, "organization.read", {
        organizationId: selectedOrganizationId,
        collegeId: selected?.collegeId ?? null,
      });

      return db
        .select({
          id: organizations.id,
          name: organizations.name,
          createdAt: organizations.createdAt,
          updatedAt: organizations.updatedAt,
        })
        .from(organizations)
        .where(
          and(
            eq(organizations.id, selectedOrganizationId),
            eq(organizations.status, "ACTIVE"),
          ),
        )
        .orderBy(asc(organizations.name));
    }

    return db
      .select({
        id: organizations.id,
        name: organizations.name,
        createdAt: organizations.createdAt,
        updatedAt: organizations.updatedAt,
      })
      .from(organizations)
      .where(eq(organizations.status, "ACTIVE"))
      .orderBy(asc(organizations.name));
  }

  if (
    !context.membership ||
    !hasMembershipRole(context, "COLLEGE_ADMIN")
  ) {
    requirePermission(context, "organization.read", {});
  }

  const organizationId = context.membership?.organizationId;
  if (!organizationId) {
    requirePermission(context, "organization.read", {});
    return [];
  }

  requirePermission(context, "organization.read", {
    organizationId,
  });

  return db
    .select({
      id: organizations.id,
      name: organizations.name,
      createdAt: organizations.createdAt,
      updatedAt: organizations.updatedAt,
    })
    .from(organizations)
    .where(
      and(
        eq(organizations.id, organizationId),
        eq(organizations.status, "ACTIVE"),
      ),
    )
    .limit(1);
}

export async function createOrganization(
  context: RequestContext,
  rawInput: CreateOrganizationInput,
) {
  const input = createOrganizationInputSchema.parse(rawInput);

  requirePermission(context, "organization.manage", {});
  await assertUniqueActiveName(input.name);

  const db = getDb();

  try {
    const [created] = await db
      .insert(organizations)
      .values({ name: input.name })
      .returning({
        id: organizations.id,
        name: organizations.name,
        createdAt: organizations.createdAt,
        updatedAt: organizations.updatedAt,
      });

    return created;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new OrganizationServiceError("ORGANIZATION_NAME_CONFLICT");
    }
    throw error;
  }
}

export async function renameOrganization(
  context: RequestContext,
  organizationIdInput: string,
  rawInput: RenameOrganizationInput,
) {
  const organizationId =
    organizationIdSchema.parse(organizationIdInput);
  const input = renameOrganizationInputSchema.parse(rawInput);
  const organization = await loadActiveOrganization(organizationId);

  requirePermission(context, "organization.manage", {
    organizationId: organization.id,
  });

  await assertUniqueActiveName(input.name, organizationId);

  const db = getDb();

  try {
    const [updated] = await db
      .update(organizations)
      .set({
        name: input.name,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(organizations.id, organizationId),
          eq(organizations.status, "ACTIVE"),
        ),
      )
      .returning({
        id: organizations.id,
        name: organizations.name,
        createdAt: organizations.createdAt,
        updatedAt: organizations.updatedAt,
      });

    if (!updated) {
      throw new OrganizationServiceError("ORGANIZATION_NOT_FOUND");
    }

    return updated;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new OrganizationServiceError("ORGANIZATION_NAME_CONFLICT");
    }
    throw error;
  }
}

export async function archiveOrganization(
  context: RequestContext,
  organizationIdInput: string,
) {
  const organizationId =
    organizationIdSchema.parse(organizationIdInput);
  const organization = await loadActiveOrganization(organizationId);

  requirePermission(context, "organization.manage", {
    organizationId: organization.id,
  });

  const db = getDb();

  const [activeCollege] = await db
    .select({ id: colleges.id })
    .from(colleges)
    .where(
      and(
        eq(colleges.organizationId, organizationId),
        eq(colleges.status, "ACTIVE"),
      ),
    )
    .limit(1);

  if (activeCollege) {
    throw new OrganizationServiceError("ORGANIZATION_HAS_COLLEGES");
  }

  const [archived] = await db
    .update(organizations)
    .set({
      status: "ARCHIVED",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(organizations.id, organizationId),
        eq(organizations.status, "ACTIVE"),
      ),
    )
    .returning({
      id: organizations.id,
      name: organizations.name,
      status: organizations.status,
    });

  if (!archived) {
    throw new OrganizationServiceError("ORGANIZATION_NOT_FOUND");
  }

  return archived;
}
