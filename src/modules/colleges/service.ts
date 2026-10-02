import { and, asc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { colleges, organizations } from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import {
  hasMembershipRole,
  isSuperAdmin,
} from "@/modules/identity/context";
import {
  AuthorizationError,
  requirePermission,
} from "@/modules/permissions/policy";
import {
  collegeIdSchema,
  collegeOrganizationIdSchema,
  createCollegeInputSchema,
  updateCollegeInputSchema,
  type CreateCollegeInput,
  type UpdateCollegeInput,
} from "./validation";

export type CollegeServiceErrorCode =
  | "ORGANIZATION_NOT_FOUND"
  | "COLLEGE_NOT_FOUND"
  | "COLLEGE_CODE_CONFLICT";

export class CollegeServiceError extends Error {
  constructor(public readonly code: CollegeServiceErrorCode) {
    super(code);
    this.name = "CollegeServiceError";
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
    .select({ id: organizations.id })
    .from(organizations)
    .where(
      and(
        eq(organizations.id, organizationId),
        eq(organizations.status, "ACTIVE"),
      ),
    )
    .limit(1);

  if (!organization) {
    throw new CollegeServiceError("ORGANIZATION_NOT_FOUND");
  }

  return organization;
}

async function loadActiveCollege(collegeId: string) {
  const db = getDb();

  const [college] = await db
    .select({
      id: colleges.id,
      organizationId: colleges.organizationId,
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
        eq(colleges.id, collegeId),
        eq(colleges.status, "ACTIVE"),
        eq(organizations.status, "ACTIVE"),
      ),
    )
    .limit(1);

  if (!college) {
    throw new CollegeServiceError("COLLEGE_NOT_FOUND");
  }

  return college;
}

async function assertUniqueCode(code: string) {
  const db = getDb();

  const [existing] = await db
    .select({ id: colleges.id })
    .from(colleges)
    .where(
      sql<boolean>`lower(${colleges.code}) = ${code.toLowerCase()}`,
    )
    .limit(1);

  if (existing) {
    throw new CollegeServiceError("COLLEGE_CODE_CONFLICT");
  }
}

export async function listColleges(
  context: RequestContext,
  organizationIdInput?: string | null,
) {
  const db = getDb();

  if (isSuperAdmin(context)) {
    const organizationId = organizationIdInput
      ? collegeOrganizationIdSchema.parse(organizationIdInput)
      : null;

    if (organizationId) {
      await loadActiveOrganization(organizationId);
    }

    return db
      .select({
        id: colleges.id,
        organizationId: colleges.organizationId,
        name: colleges.name,
        code: colleges.code,
        logoObjectPath: colleges.logoObjectPath,
        city: colleges.city,
        state: colleges.state,
        country: colleges.country,
        createdAt: colleges.createdAt,
        updatedAt: colleges.updatedAt,
      })
      .from(colleges)
      .where(
        organizationId
          ? and(
              eq(colleges.status, "ACTIVE"),
              eq(colleges.organizationId, organizationId),
            )
          : eq(colleges.status, "ACTIVE"),
      )
      .orderBy(asc(colleges.name));
  }

  if (
    !context.membership ||
    !hasMembershipRole(context, "COLLEGE_ADMIN")
  ) {
    throw new AuthorizationError("college.read");
  }

  if (
    organizationIdInput &&
    organizationIdInput !== context.membership.organizationId
  ) {
    throw new AuthorizationError("college.read");
  }

  requirePermission(context, "college.read", {
    organizationId: context.membership.organizationId,
    collegeId: context.membership.collegeId,
  });

  return db
    .select({
      id: colleges.id,
      organizationId: colleges.organizationId,
      name: colleges.name,
      code: colleges.code,
      logoObjectPath: colleges.logoObjectPath,
      city: colleges.city,
      state: colleges.state,
      country: colleges.country,
      createdAt: colleges.createdAt,
      updatedAt: colleges.updatedAt,
    })
    .from(colleges)
    .where(
      and(
        eq(colleges.id, context.membership.collegeId),
        eq(colleges.status, "ACTIVE"),
      ),
    )
    .limit(1);
}

export async function createCollege(
  context: RequestContext,
  rawInput: CreateCollegeInput,
) {
  const input = createCollegeInputSchema.parse(rawInput);
  const organization = await loadActiveOrganization(
    input.organizationId,
  );

  requirePermission(context, "college.manage", {
    organizationId: organization.id,
  });

  await assertUniqueCode(input.code);

  const db = getDb();

  try {
    const [created] = await db
      .insert(colleges)
      .values(input)
      .returning();

    return created;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new CollegeServiceError("COLLEGE_CODE_CONFLICT");
    }
    throw error;
  }
}

export async function updateCollege(
  context: RequestContext,
  collegeIdInput: string,
  rawInput: UpdateCollegeInput,
) {
  const collegeId = collegeIdSchema.parse(collegeIdInput);
  const input = updateCollegeInputSchema.parse(rawInput);
  const college = await loadActiveCollege(collegeId);

  requirePermission(context, "college.manage", {
    organizationId: college.organizationId,
    collegeId: college.id,
  });

  const db = getDb();
  const [updated] = await db
    .update(colleges)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(colleges.id, collegeId),
        eq(colleges.status, "ACTIVE"),
      ),
    )
    .returning();

  if (!updated) {
    throw new CollegeServiceError("COLLEGE_NOT_FOUND");
  }

  return updated;
}
