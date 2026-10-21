import {
  and,
  asc,
  count,
  eq,
  isNull,
  ne,
  sql,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {z} from "zod";
import {isSuperAdmin} from "@/modules/identity/context";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {
  collegeMemberships,
  colleges,
  courses,
  departments,
  facultyProfiles,
  organizations,
  programs,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission,AuthorizationError } from "@/modules/permissions/policy";
import {
  assertDepartmentCanArchive,
  type DepartmentUsage,
} from "./archive-policy";
import {
  collegeIdSchema,
  createDepartmentInputSchema,
  departmentIdSchema,
  renameDepartmentInputSchema,
  type CreateDepartmentInput,
  type RenameDepartmentInput,
} from "./validation";

export type DepartmentServiceErrorCode =
  | "COLLEGE_NOT_FOUND"
  | "DEPARTMENT_NOT_FOUND"
  | "DEPARTMENT_NAME_CONFLICT";

export class DepartmentServiceError extends Error {
  constructor(public readonly code: DepartmentServiceErrorCode) {
    super(code);
    this.name = "DepartmentServiceError";
  }
}

export type DepartmentUsageResolver = (
  departmentId: string,
) => Promise<DepartmentUsage>;

export async function resolveDepartmentUsage(
  departmentId: string,
): Promise<DepartmentUsage> {
  const db = getDb();
  const [programRows, facultyRows, courseRows] =
    await Promise.all([
      db
        .select({
          count: sql<number>`count(*)::int`,
        })
        .from(programs)
        .where(
          and(
            eq(
              programs.departmentId,
              departmentId,
            ),
            eq(programs.status, "ACTIVE"),
          ),
        ),
      db
        .select({
          count: sql<number>`count(*)::int`,
        })
        .from(facultyProfiles)
        .innerJoin(
          collegeMemberships,
          eq(
            collegeMemberships.id,
            facultyProfiles.membershipId,
          ),
        )
        .where(
          and(
            eq(
              facultyProfiles.primaryDepartmentId,
              departmentId,
            ),
            ne(
              collegeMemberships.status,
              "ENDED",
            ),
          ),
        ),
      db
        .select({
          count: sql<number>`count(*)::int`,
        })
        .from(courses)
        .where(
          and(
            eq(
              courses.departmentId,
              departmentId,
            ),
            eq(courses.status, "ACTIVE"),
          ),
        ),
    ]);

  return {
    programs: Number(
      programRows[0]?.count ?? 0,
    ),
    faculty: Number(
      facultyRows[0]?.count ?? 0,
    ),
    courses: Number(
      courseRows[0]?.count ?? 0,
    ),
  };
}

async function loadActiveCollegeScope(collegeId: string) {
  const db = getDb();

  const [college] = await db
    .select({
      id: colleges.id,
      organizationId: colleges.organizationId,
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
    throw new DepartmentServiceError("COLLEGE_NOT_FOUND");
  }

  return college;
}

async function loadActiveDepartmentScope(departmentId: string) {
  const db = getDb();

  const [department] = await db
    .select({
      id: departments.id,
      collegeId: departments.collegeId,
      organizationId: colleges.organizationId,
    })
    .from(departments)
    .innerJoin(colleges, eq(colleges.id, departments.collegeId))
    .innerJoin(
      organizations,
      eq(organizations.id, colleges.organizationId),
    )
    .where(
      and(
        eq(departments.id, departmentId),
        isNull(departments.archivedAt),
        eq(colleges.status, "ACTIVE"),
        eq(organizations.status, "ACTIVE"),
      ),
    )
    .limit(1);

  if (!department) {
    throw new DepartmentServiceError("DEPARTMENT_NOT_FOUND");
  }

  return department;
}

async function assertUniqueActiveName(
  collegeId: string,
  name: string,
  excludeDepartmentId?: string,
) {
  const db = getDb();

  const conditions = [
    eq(departments.collegeId, collegeId),
    isNull(departments.archivedAt),
    sql<boolean>`lower(${departments.name}) = ${name.toLowerCase()}`,
  ];

  if (excludeDepartmentId) {
    conditions.push(ne(departments.id, excludeDepartmentId));
  }

  const [existing] = await db
    .select({ id: departments.id })
    .from(departments)
    .where(and(...conditions))
    .limit(1);

  if (existing) {
    throw new DepartmentServiceError("DEPARTMENT_NAME_CONFLICT");
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

export async function listDepartments(
  context: RequestContext,
  collegeIdInput: string,
) {
  const collegeId = collegeIdSchema.parse(collegeIdInput);
  const college = await loadActiveCollegeScope(collegeId);

  requirePermission(context, "department.read", {
    organizationId: college.organizationId,
    collegeId: college.id,
  });

  const db = getDb();

  return db
    .select({
      id: departments.id,
      collegeId: departments.collegeId,
      name: departments.name,
      createdAt: departments.createdAt,
      updatedAt: departments.updatedAt,
    })
    .from(departments)
    .where(
      and(
        eq(departments.collegeId, collegeId),
        isNull(departments.archivedAt),
      ),
    )
    .orderBy(asc(departments.name));
}

export async function createDepartment(
  context: RequestContext,
  rawInput: CreateDepartmentInput,
) {
  const input = createDepartmentInputSchema.parse(rawInput);
  const college = await loadActiveCollegeScope(input.collegeId);

  requirePermission(context, "department.manage", {
    organizationId: college.organizationId,
    collegeId: college.id,
  });

  await assertUniqueActiveName(input.collegeId, input.name);

  const db = getDb();

  try {
    const [created] = await db.transaction(async tx=>{
      const [created] = await tx
      .insert(departments)
      .values({
        collegeId: input.collegeId,
        name: input.name,
      })
      .returning({
        id: departments.id,
        collegeId: departments.collegeId,
        name: departments.name,
        createdAt: departments.createdAt,
        updatedAt: departments.updatedAt,
      });
      if(created)await recordActivityEventInTransaction(tx,context,{
        eventType:ACTIVITY_EVENT_TYPES.ACADEMICS_DEPARTMENT_CREATED,
        collegeId:college.id,organizationId:college.organizationId,
        subjectType:"department",subjectId:created.id,subjectLabel:created.name,
        summary:"Department created",
        metadata:{collegeId:college.id,operation:"CREATE"},
      });
      return [created];
    });

    return created;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new DepartmentServiceError("DEPARTMENT_NAME_CONFLICT");
    }
    throw error;
  }
}

export async function renameDepartment(
  context: RequestContext,
  departmentIdInput: string,
  rawInput: RenameDepartmentInput,
) {
  const departmentId = departmentIdSchema.parse(departmentIdInput);
  const input = renameDepartmentInputSchema.parse(rawInput);
  const scope = await loadActiveDepartmentScope(departmentId);

  requirePermission(context, "department.manage", {
    organizationId: scope.organizationId,
    collegeId: scope.collegeId,
  });

  await assertUniqueActiveName(scope.collegeId, input.name, departmentId);

  const db = getDb();

  try {
    const [updated] = await db.transaction(async tx=>{
      const [updated] = await tx
      .update(departments)
      .set({
        name: input.name,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(departments.id, departmentId),
          isNull(departments.archivedAt),
        ),
      )
      .returning({
        id: departments.id,
        collegeId: departments.collegeId,
        name: departments.name,
        createdAt: departments.createdAt,
        updatedAt: departments.updatedAt,
      });
      if(updated)await recordActivityEventInTransaction(tx,context,{
        eventType:ACTIVITY_EVENT_TYPES.ACADEMICS_DEPARTMENT_UPDATED,
        collegeId:scope.collegeId,organizationId:scope.organizationId,
        subjectType:"department",subjectId:updated.id,subjectLabel:updated.name,
        summary:"Department updated",
        metadata:{operation:"RENAME"},
      });
      return [updated];
    });

    if (!updated) {
      throw new DepartmentServiceError("DEPARTMENT_NOT_FOUND");
    }

    return updated;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new DepartmentServiceError("DEPARTMENT_NAME_CONFLICT");
    }
    throw error;
  }
}

export async function archiveDepartment(
  context: RequestContext,
  departmentIdInput: string,
  resolveUsage: DepartmentUsageResolver =
    resolveDepartmentUsage,
) {
  const departmentId = departmentIdSchema.parse(departmentIdInput);
  const scope = await loadActiveDepartmentScope(departmentId);

  requirePermission(context, "department.manage", {
    organizationId: scope.organizationId,
    collegeId: scope.collegeId,
  });

  const usage = await resolveUsage(departmentId);
  assertDepartmentCanArchive(usage);

  const db = getDb();
  const archivedAt = new Date();

  const [archived] = await db.transaction(async tx=>{
    const [archived] = await tx
    .update(departments)
    .set({
      archivedAt,
      updatedAt: archivedAt,
    })
    .where(
      and(
        eq(departments.id, departmentId),
        isNull(departments.archivedAt),
      ),
    )
    .returning({
      id: departments.id,
      collegeId: departments.collegeId,
      name: departments.name,
      archivedAt: departments.archivedAt,
    });
    if(archived)await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.ACADEMICS_DEPARTMENT_ARCHIVED,
      collegeId:scope.collegeId,organizationId:scope.organizationId,
      subjectType:"department",subjectId:archived.id,subjectLabel:archived.name,
      summary:"Department archived",
      metadata:{operation:"ARCHIVE",legacySoftDelete:true},
    });
    return [archived];
  });

  if (!archived) {
    throw new DepartmentServiceError("DEPARTMENT_NOT_FOUND");
  }

  return archived;
}


/** Legacy GET /api/v1/department/fetchPage compatibility at the service
 * boundary. Old 0-based page indexes are preserved but numeric department and
 * college IDs are NOT cast to vNext UUIDs. Super Admin can read the selected
 * college, selected organization or explicitly global active-college roster;
 * College Admin never gains a global fallback. This is a paginated READ only.
 */
export const departmentPageQuery=z.strictObject({
 collegeId:z.string().uuid().optional(),
 page:z.coerce.number().int().min(0).max(100000).default(0),
 size:z.coerce.number().int().min(1).max(100).default(20),
});
export async function fetchPagedDepartments(context:RequestContext,raw:unknown){
 const input=departmentPageQuery.parse(raw);
 const collegeId=input.collegeId??context.adminScope?.collegeId??
  (!isSuperAdmin(context)?context.membership?.collegeId:null);
 let organizationId:string|null=null;
 if(collegeId){
  const college=await loadActiveCollegeScope(collegeId);
  organizationId=college.organizationId;
  requirePermission(context,"department.read",{
   collegeId:college.id,organizationId:college.organizationId,
  });
 }else{
  // No other role may browse cross-tenant departments without explicit scope.
  if(!isSuperAdmin(context))throw new AuthorizationError("department.read");
  requirePermission(context,"admin-scope.select");
  organizationId=context.adminScope?.organizationId??null;
 }
 const scopeConditions=[
  isNull(departments.archivedAt),
  eq(colleges.status,"ACTIVE"),
  eq(organizations.status,"ACTIVE"),
  ...(collegeId?[eq(departments.collegeId,collegeId)]:[]),
  ...(!collegeId&&organizationId?[eq(colleges.organizationId,organizationId)]:[]),
 ];
 const base=()=>getDb().select({
  id:departments.id,collegeId:departments.collegeId,name:departments.name,
  createdAt:departments.createdAt,updatedAt:departments.updatedAt,
  collegeName:colleges.name,
 }).from(departments)
  .innerJoin(colleges,eq(colleges.id,departments.collegeId))
  .innerJoin(organizations,eq(organizations.id,colleges.organizationId))
  .where(and(...scopeConditions));
 const [rows,totalRows]=await Promise.all([
  base().orderBy(asc(colleges.name),asc(departments.name),asc(departments.id))
    .limit(input.size).offset(input.page*input.size),
  getDb().select({total:count()}).from(departments)
   .innerJoin(colleges,eq(colleges.id,departments.collegeId))
   .innerJoin(organizations,eq(organizations.id,colleges.organizationId))
   .where(and(...scopeConditions)),
 ]);
 const total=Number(totalRows[0]?.total??0);
 return {
  content:rows,page:input.page,size:input.size,totalElements:total,
  totalPages:Math.ceil(total/input.size),numberOfElements:rows.length,
  first:input.page===0,last:(input.page+1)*input.size>=total,
  scope:{collegeId:collegeId??null,organizationId},
  // Dependent UIs must resolve legacy chair/vice-chair integer actors through
  // verified tenant-scoped membership mapping. This table has no chair FKs;
  // do not fabricate or persist those roles until a migration is registered.
  idKind:"UUID" as const,archival:"archivedAt" as const,
 };
}
