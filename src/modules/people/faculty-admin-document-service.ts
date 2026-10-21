import "server-only";

import {and,eq,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {colleges,collegeMemberships,membershipRoles} from "@/db/schema";
import {isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {facultyProfileDocumentStorageReady} from "./faculty-profile-readiness";
import {emptyFacultyProfileDocument,facultyProfileDocumentSchema} from "./faculty-profile-document";
import {facultySelfSectionPatchSchema,updateFacultyProfileSection} from "./faculty-self-section-model";
import {PeopleServiceError} from "./errors";

const targetSchema=z.string().uuid();
type DocumentRow={profile_document:unknown;profile_document_version:number};

async function requireFacultyTarget(
 tx:Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0],
 context:RequestContext,membershipId:string,
) {
 const [target]=await tx.select({
  id:collegeMemberships.id,userId:collegeMemberships.userId,
  collegeId:collegeMemberships.collegeId,organizationId:colleges.organizationId,
 }).from(collegeMemberships)
  .innerJoin(colleges,eq(colleges.id,collegeMemberships.collegeId))
  .where(eq(collegeMemberships.id,membershipId)).for("share").limit(1);
 if(!target)throw new PeopleServiceError("FACULTY_ROLE_REQUIRED");
 const scope={collegeId:target.collegeId,organizationId:target.organizationId};
 requirePermission(context,"people.manage",scope);
 const persisted=await assertPersistedPlatformPermission(tx,context,"people.manage",scope);
 const roles=await tx.select({role:membershipRoles.role}).from(membershipRoles)
  .where(eq(membershipRoles.membershipId,membershipId)).for("share");
 if(!roles.some(item=>item.role==="FACULTY"))throw new PeopleServiceError("FACULTY_ROLE_REQUIRED");
 if(!isSuperAdmin(persisted)&&persisted.membership?.collegeId!==target.collegeId)
  throw new AuthorizationError("people.manage");
 return {target,roles:roles.map(item=>item.role),persisted};
}

/** This scoped adapter is distinct from the faculty self endpoint. A college
 * administrator cannot use the self API to edit another person's document. */
export async function getFacultyDocumentForAdmin(context:RequestContext,idRaw:unknown) {
 const id=targetSchema.parse(idRaw);
 return getDb().transaction(async tx=>{
  await requireFacultyTarget(tx,context,id);
  if(!await facultyProfileDocumentStorageReady(tx))
   throw new PeopleServiceError("PRIVATE_IDENTITY_STORAGE_NOT_READY");
  const rows=await tx.execute<DocumentRow>(sql`
   select profile_document,profile_document_version from faculty_profiles
   where membership_id=${id} for share
  `);
  const row=rows.rows[0];
  return {document:facultyProfileDocumentSchema.parse(row?.profile_document??emptyFacultyProfileDocument),
   version:row?.profile_document_version??0};
 });
}

export async function patchFacultyDocumentForAdmin(
 context:RequestContext,idRaw:unknown,rawPatch:unknown,
) {
 const id=targetSchema.parse(idRaw);
 const patch=facultySelfSectionPatchSchema.parse(rawPatch);
 return getDb().transaction(async tx=>{
  const {roles,persisted}=await requireFacultyTarget(tx,context,id);
  if(!isSuperAdmin(persisted)&&(roles.includes("COLLEGE_ADMIN")||roles.includes("TPO")))
   throw new AuthorizationError("people.manage");
  if(!await facultyProfileDocumentStorageReady(tx))
   throw new PeopleServiceError("PRIVATE_IDENTITY_STORAGE_NOT_READY");
  const rows=await tx.execute<DocumentRow>(sql`
   select profile_document,profile_document_version from faculty_profiles
   where membership_id=${id} for update
  `);
  const row=rows.rows[0];
  const current=facultyProfileDocumentSchema.parse(row?.profile_document??emptyFacultyProfileDocument);
  const version=row?.profile_document_version??0;
  if(version!==patch.expectedVersion)
   throw new PeopleServiceError("FACULTY_PROFILE_VERSION_CONFLICT");
  const document=updateFacultyProfileSection(current,patch);
  const updated=await tx.execute<DocumentRow>(sql`
   insert into faculty_profiles
    (membership_id,profile_document,profile_document_version,created_at,updated_at)
   values (${id},${JSON.stringify(document)}::jsonb,1,clock_timestamp(),clock_timestamp())
   on conflict (membership_id) do update
    set profile_document=excluded.profile_document,
      profile_document_version=faculty_profiles.profile_document_version+1,
      updated_at=clock_timestamp()
   where faculty_profiles.profile_document_version=${version}
   returning profile_document,profile_document_version
  `);
  const next=updated.rows[0];
  if(!next)throw new PeopleServiceError("FACULTY_PROFILE_VERSION_CONFLICT");
  return {document:facultyProfileDocumentSchema.parse(next.profile_document),
   version:next.profile_document_version};
 });
}
