import { sql } from "drizzle-orm";
import {
  integer,
  check,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { collegeStatusEnum } from "./enums";

export const colleges = pgTable(
  "colleges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    legacyCollegeId: integer("legacy_college_id"),
    legacyOrganizationId: integer("legacy_organization_id"),
    legacyUniqueId: varchar("legacy_unique_id",{length:64}),
    legacyChairId: integer("legacy_chair_id"),
    legacyViceChairId: integer("legacy_vice_chair_id"),
    legacyLogoUrl: varchar("legacy_logo_url",{length:255}),
    legacyDomainHost: varchar("legacy_domain_host",{length:255}),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    code: varchar("code", { length: 64 }).notNull(),
    logoObjectPath: text("logo_object_path"),
    /** Optional roles point to a scoped college membership, not a global user. */
    chairMembershipId: uuid("chair_membership_id"),
    viceChairMembershipId: uuid("vice_chair_membership_id"),
    addressLine1: text("address_line1"),
    addressLine2: text("address_line2"),
    landmark: text("landmark"),
    city: varchar("city", { length: 128 }),
    state: varchar("state", { length: 128 }),
    country: varchar("country", { length: 128 }),
    postalCode: varchar("postal_code", { length: 32 }),
    status: collegeStatusEnum("status").notNull().default("ACTIVE"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("colleges_code_uq").on(sql`lower(${table.code})`),
    uniqueIndex("colleges_legacy_id_uq").on(table.legacyCollegeId)
      .where(sql`${table.legacyCollegeId} is not null`),
    uniqueIndex("colleges_legacy_unique_id_uq").on(sql`lower(${table.legacyUniqueId})`)
      .where(sql`${table.legacyUniqueId} is not null`),
    check("colleges_legacy_unique_id_ck",sql`
      ${table.legacyUniqueId} is null or length(trim(${table.legacyUniqueId})) between 1 and 64`),
    uniqueIndex("colleges_id_organization_uq").on(table.id, table.organizationId),
    // The two scoped leadership FKs are enforced by migration 0161.
    // Declaring them here would create a TypeScript schema cycle because
    // college_memberships already references colleges.
    index("colleges_organization_idx").on(table.organizationId),
    index("colleges_organization_status_idx").on(
      table.organizationId,
      table.status,
    ),
  ],
);

/** Source integer chair/vice-chair are never vNext user IDs. A verified
 * same-college membership and persisted FACULTY role are required before
 * an optional leadership FK can be set. The membership owner may be an
 * ADMIN or TPO as well, but the faculty role is independently mandatory. */
export function mapLegacyCollegeLeadership(input:{
 legacyCollegeId:number;legacyOrganizationId:number;
 resolvedCollegeId:string;resolvedOrganizationId:string;
 sourceCode:string;chairLegacyId:number|null;viceChairLegacyId:number|null;
 membershipMapping:readonly {legacyFacultyId:number;membershipId:string;
  collegeId:string;active:boolean;isFaculty:boolean}[];
}){
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
 if(!Number.isSafeInteger(input.legacyCollegeId)||input.legacyCollegeId<1||
   !Number.isSafeInteger(input.legacyOrganizationId)||input.legacyOrganizationId<1||
   !uuid.test(input.resolvedCollegeId)||!uuid.test(input.resolvedOrganizationId))
  throw new Error("Unmapped legacy college/organization");
 const resolved=(id:number|null)=>{
  if(id===null)return null;
  const member=input.membershipMapping.filter(m=>m.legacyFacultyId===id&&
   m.collegeId===input.resolvedCollegeId&&m.active&&m.isFaculty&&
   uuid.test(m.membershipId));
  const matchingMember=member[0];
  if(member.length!==1||!matchingMember)throw new Error("College leadership role needs reviewed faculty mapping");
  return matchingMember.membershipId;
 };
 const chairMembershipId=resolved(input.chairLegacyId);
 const viceChairMembershipId=resolved(input.viceChairLegacyId);
 if(chairMembershipId&&chairMembershipId===viceChairMembershipId)
  throw new Error("Chair and vice chair need distinct memberships");
 const code=input.sourceCode.trim();
 if(!code||code.length>64)throw new Error("Invalid historic college code");
 return {collegeId:input.resolvedCollegeId,organizationId:input.resolvedOrganizationId,
  sourceCode:code,chairMembershipId,viceChairMembershipId};
}


/** Strict one-way CollegeDTO field disposition. Source numeric keys and
 * historical chair IDs cannot act as current account/permission identifiers,
 * and old file URLs must be reuploaded before being made public. */
export const LEGACY_COLLEGE_DTO_MAP={
 id:"legacyCollegeId",
 organizationId:"legacyOrganizationId",
 name:"name",
 uniqueId:"legacyUniqueId",
 collegeCode:"code",
 logo:"legacyLogoUrl (import-only; never returned as signed URL)",
 address:"addressLine1",
 address2:"addressLine2",
 landmark:"landmark",
 city:"city",
 state:"state",
 country:"country",
 pinCode:"postalCode",
 chairId:"legacyChairId -> chairMembershipId after verified faculty membership",
 viceChairId:"legacyViceChairId -> viceChairMembershipId after verified faculty membership",
 isDeleted:"status = ARCHIVED",
 createdAt:"createdAt (source timezone reviewed)",
 updatedAt:"updatedAt (source timezone reviewed)",
} as const;
export function canonicalLegacyCollegePostalCode(input:string|null):string|null{
 if(input===null)return null;
 const trimmed=input.trim();
 if(!trimmed)return null;
 if(trimmed.length>32||/[^\p{L}\p{N} -]/u.test(trimmed))
  throw new Error("Invalid imported college postal code");
 return trimmed;
}
