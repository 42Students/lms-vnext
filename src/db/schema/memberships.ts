import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  check,
  integer,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import {
  membershipRoleEnum,
  membershipStatusEnum,
  systemRoleEnum,
} from "./enums";
import { colleges } from "./colleges";
import { users } from "./users";

export const collegeMemberships = pgTable(
  "college_memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    collegeId: uuid("college_id")
      .notNull()
      .references((): AnyPgColumn => colleges.id, { onDelete: "restrict" }),
    status: membershipStatusEnum("status").notNull().default("ACTIVE"),
    /** Mapping source account to one scoped membership; not an auth key. */
    legacyMembershipId: integer("legacy_membership_id"),
    legacyRemovedAt: timestamp("legacy_removed_at",{withTimezone:true}),
    suspendedAt: timestamp("suspended_at", { withTimezone: true }),
    suspensionReason: text("suspension_reason"),
    /** Membership-scoped write CAS; do not substitute for auth device revocation. */
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("college_memberships_legacy_college_id_uq")
      .on(table.collegeId,table.legacyMembershipId)
      .where(sql`${table.legacyMembershipId} is not null`),
    check("college_memberships_legacy_removed_ck",sql`
      ${table.legacyRemovedAt} is null or ${table.status} <> 'ACTIVE'`),
    uniqueIndex("college_memberships_user_college_uq").on(
      table.userId,
      table.collegeId,
    ),
    uniqueIndex("college_memberships_id_user_college_uq").on(
      table.id,
      table.userId,
      table.collegeId,
    ),
    uniqueIndex("college_memberships_id_college_uq").on(table.id, table.collegeId),
    index("college_memberships_college_status_idx").on(
      table.collegeId,
      table.status,
    ),
    index("college_memberships_user_status_idx").on(table.userId, table.status),
    check("college_memberships_version_ck", sql`${table.version} > 0`),
  ],
);

export const membershipRoles = pgTable(
  "membership_roles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => collegeMemberships.id),
    role: membershipRoleEnum("role").notNull(),
    legacyRoleId: integer("legacy_role_id"),
    /** Imported role authority and audit are separate from the protected role enum. */
    assignedByUserId: uuid("assigned_by_user_id").references(
      () => users.id, { onDelete: "restrict" },
    ),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("membership_roles_membership_role_uq").on(
      table.membershipId,
      table.role,
    ),
    index("membership_roles_role_idx").on(table.role),
    index("membership_roles_source_lookup_idx").on(table.legacyRoleId,table.membershipId)
      .where(sql`${table.legacyRoleId} is not null`),
  ],
);

export const systemRoles = pgTable(
  "system_roles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    role: systemRoleEnum("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("system_roles_user_role_uq").on(table.userId, table.role),
    index("system_roles_role_idx").on(table.role),
  ],
);

/** Legacy Role rows were global definitions, not membership assignments.
 * Original role.name/description/id/createdAt/updatedAt/isDeleted are
 * source-only audit fields. Only active, verified assignments map into a
 * persisted, same-college collegeMemberships/membershipRoles pair. */
export const LEGACY_ROLE_DEFINITION_CROSSWALK={
 STUDENT:"LEARNER",LEARNER:"LEARNER",
 FACULTY:"FACULTY",TEACHER:"FACULTY",
 COLLEGE_ADMIN:"COLLEGE_ADMIN",ADMIN:"COLLEGE_ADMIN",
 TPO:"TPO",MENTOR:"MENTOR",RECRUITER:"RECRUITER",
} as const;
export function legacyRoleAssignmentCandidate(input:{
 legacyRoleId:number;name:string;description:string|null;
 isDeleted:boolean;membershipCollegeId:string;targetCollegeId:string;
}){
 if(!Number.isSafeInteger(input.legacyRoleId)||input.legacyRoleId<1)
  throw new Error("Legacy role key needs source review");
 if(input.isDeleted)return null;
 if(input.membershipCollegeId!==input.targetCollegeId)
  throw new Error("Legacy role assignment must remain in its college");
 const key=input.name.trim().toUpperCase().replaceAll(" ","_");
 const role=LEGACY_ROLE_DEFINITION_CROSSWALK[
   key as keyof typeof LEGACY_ROLE_DEFINITION_CROSSWALK];
 if(!role)throw new Error("Unrecognized old role definition");
 // Recruiters are authorized through verified company profiles and
 // time-bounded college grants. They are never membership-role enums.
 if(role==="RECRUITER")
  throw new Error("Recruiter role requires verified company profile and college grant");
 return {legacyRoleId:input.legacyRoleId,role,
  descriptionForAudit:input.description?.trim().slice(0,500)??null,
  persistedRoleAuthority:false as const};
}

/** Suspend a scoped college membership without deactivating the shared
 * identity for unrelated colleges. A platform-wide suspension is distinct
 * and revokes all device sessions and active OTP challenges. An elevated role
 * removal also triggers explicit session entitlement revalidation. */
export function legacyIdentitySuspensionDisposition(input:{
 status:"ACTIVE"|"SUSPENDED"|"REMOVED";
 scope:"PLATFORM"|"COLLEGE";collegeId:string|null;reason:string|null;
}){
 if(input.scope==="COLLEGE"&&!input.collegeId)
  throw new Error("College suspension needs a verified college");
 if(input.scope==="PLATFORM"&&input.collegeId)
  throw new Error("Platform suspension cannot target one college");
 const suspended=input.status!=="ACTIVE";
 return {
  platformSuspended:suspended&&input.scope==="PLATFORM",
  collegeSuspended:suspended&&input.scope==="COLLEGE",
  revokeAllDeviceSessions:suspended&&input.scope==="PLATFORM",
  invalidateAllLoginChallenges:suspended&&input.scope==="PLATFORM",
  revalidateSelectedMembership:suspended&&input.scope==="COLLEGE",
  reason:input.reason?.trim().slice(0,500)??null,
 } as const;
}


/** Historic students could derive their college directly, from a home class,
 * or from elective enrollment. Elective classes do NOT grant an additional
 * membership by themselves: a verified primary college is required before
 * role provisioning. Every ambiguity is routed for explicit review. */
export function legacyLearnerCollegeScopeCandidate(input:{
 directCollegeId:string|null;homeClassCollegeId:string|null;
 electiveCollegeIds:readonly string[];selectedCollegeId:string|null;
}):{collegeId:string;origin:"DIRECT"|"HOME_CLASS";needsRoleVerification:true}{
 const idPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
 const direct=input.directCollegeId;
 const home=input.homeClassCollegeId;
 if(direct&&!idPattern.test(direct)||home&&!idPattern.test(home))
  throw new Error("Legacy college scope requires verified UUID mappings");
 if(direct&&home&&direct!==home)
  throw new Error("Legacy home class and direct learner college disagree");
 const collegeId=direct??home;
 if(!collegeId||input.selectedCollegeId&&input.selectedCollegeId!==collegeId)
  throw new Error("Ambiguous historical learner college membership");
 for(const elective of input.electiveCollegeIds){
  if(!idPattern.test(elective))
   throw new Error("Unmapped elective class college");
 }
 return {collegeId,origin:direct?"DIRECT":"HOME_CLASS",needsRoleVerification:true};
}
