import "server-only";

import { and, asc, count, eq, exists, ilike, inArray, isNull, or } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import {
  collegeMemberships, membershipRoles, facultyProfiles, departments, users,
} from "@/db/schema";
import {
  hasActiveMembership, hasMembershipRole, type RequestContext,
} from "@/modules/identity/context";
import { can } from "@/modules/permissions/policy";
import { CoursesServiceError } from "./errors";
import {
  facultyContactDetailParamsSchema, facultyContactTabMatches,
} from "./faculty-contact-detail-model";

const querySchema=z.object({
  tab:z.enum(["ALL","FACULTY","LEARNER"]),
  search:z.string().trim().max(200).default(""),
  page:z.coerce.number().int().min(1).max(100000).default(1),
  pageSize:z.coerce.number().int().min(10).max(50).default(20),
}).strict();

/** Contacts parity/security crosswalk:
 * Old ContactDTO included first/last, email, mobile, photo and userType.
 * This learner/teacher directory deliberately exposes only active, same-
 * college membership ID, display name, department and public role badges.
 * The membership ID is an opaque, scoped route key; userId, email, mobile,
 * photo and any storage path are never queried or exposed here.
 * Email/mobile search remains disabled to prevent existence probing.
 * Old staff-wide access is intentionally narrower: the vNext teacher role
 * workspace requires a persisted ACTIVE FACULTY grant plus courses.read.
 * Super Admin, College Admin, Mentor, Recruiter and Learner instead use
 * their own role workspace; never infer access merely from an old URL.
 */
async function requirePersistedFaculty(context:RequestContext) {
  const membership=context.membership;
  if (!membership || context.user.platformStatus!=="ACTIVE" ||
      !hasActiveMembership(context) || !hasMembershipRole(context,"FACULTY") ||
      !can(context,"courses.read",{
        collegeId:membership.collegeId,organizationId:membership.organizationId,
      })) throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
  const [row]=await getDb().select({
    id:collegeMemberships.id,collegeId:collegeMemberships.collegeId,
  }).from(collegeMemberships)
    .innerJoin(users,eq(users.id,collegeMemberships.userId))
    .innerJoin(membershipRoles,and(
      eq(membershipRoles.membershipId,collegeMemberships.id),
      eq(membershipRoles.role,"FACULTY"),
    ))
    .where(and(
      eq(collegeMemberships.id,membership.id),
      eq(collegeMemberships.userId,context.user.id),
      eq(collegeMemberships.collegeId,membership.collegeId),
      eq(collegeMemberships.status,"ACTIVE"),
      eq(users.platformStatus,"ACTIVE"),
    )).limit(1);
  if(!row) throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
  return row;
}

export async function listFacultyContacts(context:RequestContext,rawInput:unknown) {
  const input=querySchema.parse(rawInput);
  const actor=await requirePersistedFaculty(context);
  const db=getDb();
  const role=input.tab==="ALL"?null:input.tab;
  const escaped=input.search.replace(/[%_\\]/g,"\\$&");
  // Restrict the ALL directory to the old teaching/learner audience.
  // EXISTS avoids multiplying one person across multiple role grants.
  const contactAudience=exists(db.select({id:membershipRoles.id})
    .from(membershipRoles)
    .where(and(eq(membershipRoles.membershipId,collegeMemberships.id),
      inArray(membershipRoles.role,["FACULTY","LEARNER"]))));
  const filters=and(
    contactAudience,
    eq(collegeMemberships.collegeId,actor.collegeId),
    eq(collegeMemberships.status,"ACTIVE"),
    eq(users.platformStatus,"ACTIVE"),
    escaped ? or(
      ilike(users.displayName,"%"+escaped+"%"),
      ilike(departments.name,"%"+escaped+"%"),
    ):undefined,
  );
  const departmentJoin=and(
    eq(departments.id,facultyProfiles.primaryDepartmentId),
    eq(departments.collegeId,actor.collegeId),
    isNull(departments.archivedAt),
  );
  const base=db.select({
    membershipId:collegeMemberships.id,
    displayName:users.displayName,
    departmentName:departments.name,
  }).from(collegeMemberships)
    .innerJoin(users,eq(users.id,collegeMemberships.userId))
    .leftJoin(facultyProfiles,eq(facultyProfiles.membershipId,collegeMemberships.id))
    .leftJoin(departments,departmentJoin);
  const countBase=db.select({total:count()}).from(collegeMemberships)
    .innerJoin(users,eq(users.id,collegeMemberships.userId))
    .leftJoin(facultyProfiles,eq(facultyProfiles.membershipId,collegeMemberships.id))
    .leftJoin(departments,departmentJoin);
  const roleJoin=and(
    eq(membershipRoles.membershipId,collegeMemberships.id),
    eq(membershipRoles.role,role??"FACULTY"),
  );
  const totals=role ? await countBase.innerJoin(membershipRoles,roleJoin).where(filters)
    :await countBase.where(filters);
  const total=Number(totals[0]?.total??0);
  const totalPages=Math.max(1,Math.ceil(total/input.pageSize));
  const page=Math.min(input.page,totalPages);
  const rows=role
    ?await base.innerJoin(membershipRoles,roleJoin).where(filters)
      .orderBy(asc(users.displayName),asc(collegeMemberships.id))
      .limit(input.pageSize).offset((page-1)*input.pageSize)
    :await base.where(filters)
      .orderBy(asc(users.displayName),asc(collegeMemberships.id))
      .limit(input.pageSize).offset((page-1)*input.pageSize);
  const ids=rows.map(row=>row.membershipId);
  const grants=ids.length===0?[]:await db.select({
    membershipId:membershipRoles.membershipId,role:membershipRoles.role,
  }).from(membershipRoles).where(and(
    inArray(membershipRoles.role,["FACULTY","LEARNER"]),
    or(...ids.map(id=>eq(membershipRoles.membershipId,id))),
  )).orderBy(asc(membershipRoles.role));
  const byId=new Map<string,string[]>();
  for(const grant of grants){
    const roles=byId.get(grant.membershipId)??[];
    roles.push(grant.role);byId.set(grant.membershipId,roles);
  }
  return {
    tab:input.tab,search:input.search,page,pageSize:input.pageSize,
    total,totalPages,
    items:rows.map(row=>({...row,roles:byId.get(row.membershipId)??[]})),
  };
}

export async function getFacultyContactDetail(context:RequestContext,rawParams:unknown) {
  const params=facultyContactDetailParamsSchema.parse(rawParams);
  const actor=await requirePersistedFaculty(context);
  const db=getDb();
  const [contact]=await db.select({
    membershipId:collegeMemberships.id,
    displayName:users.displayName,
    departmentName:departments.name,
  }).from(collegeMemberships)
    .innerJoin(users,eq(users.id,collegeMemberships.userId))
    .leftJoin(facultyProfiles,eq(facultyProfiles.membershipId,collegeMemberships.id))
    .leftJoin(departments,and(
      eq(departments.id,facultyProfiles.primaryDepartmentId),
      eq(departments.collegeId,actor.collegeId),
      isNull(departments.archivedAt),
    ))
    .where(and(
      eq(collegeMemberships.id,params.membershipId),
      eq(collegeMemberships.collegeId,actor.collegeId),
      eq(collegeMemberships.status,"ACTIVE"),
      eq(users.platformStatus,"ACTIVE"),
      exists(db.select({id:membershipRoles.id}).from(membershipRoles)
        .where(and(eq(membershipRoles.membershipId,collegeMemberships.id),
          inArray(membershipRoles.role,["FACULTY","LEARNER"])))),
    )).limit(1);
  if(!contact) throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
  const grants=await db.select({role:membershipRoles.role}).from(membershipRoles)
    .where(and(eq(membershipRoles.membershipId,contact.membershipId),
      inArray(membershipRoles.role,["FACULTY","LEARNER"])))
    .orderBy(asc(membershipRoles.role));
  const roles=grants.map(x=>x.role);
  if(!facultyContactTabMatches(params.contactsTab,roles))
    throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
  return {...contact,roles,contactsTab:params.contactsTab};
}
