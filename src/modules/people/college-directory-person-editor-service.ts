import "server-only";
import {and,eq,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {collegeMemberships,departments,facultyProfiles,learnerProfiles,membershipRoles,users} from "@/db/schema";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import type {RequestContext} from "@/modules/identity/context";
import {requirePermission} from "@/modules/permissions/policy";
import {resolveActingCollege} from "@/modules/permissions/acting-college";
import {facultyContactEditSchema,facultyProfileDocumentSchema} from "./faculty-profile-document";
import {learnerProfileDocumentSchema} from "./profile-validation";

const uuid=z.string().uuid();
const role=z.enum(["FACULTY","LEARNER"]);
const inputSchema=z.strictObject({
  kind:role,address:z.string().trim().max(1000),bio:z.string().trim().max(3000),
  gender:z.enum(["","Male","Female","Other","Prefer not to say"]),
  dateOfBirth:z.union([z.iso.date(),z.literal("")]),
  contactEmail:z.union([z.email().max(255),z.literal("")]),
  // Legacy FacultyDTO accepted separate names with 255-character caps.
  firstName:z.string().trim().min(1).max(255).optional(),
  lastName:z.string().trim().max(255).optional(),
  websiteUrl:z.union([
    z.literal(""),z.url().max(500).refine(value=>/^https?:\/\//i.test(value),
      {message:"Website must use HTTP or HTTPS"}),
  ]).optional(),
  contactPhone:z.string().trim().max(32),
  primaryDepartmentId:uuid.nullable().optional(),
  // Per-profile CAS; older clients can omit it, new editors must send it.
  expectedProfileVersion:z.number().int().min(0).optional(),
  employmentType:z.string().trim().max(128).optional(),
  academicTitle:z.string().trim().max(128).optional(),
  rollNumber:z.string().trim().max(128).optional(),
  registrationNumber:z.string().trim().max(128).optional(),
});
async function scope(context:RequestContext){
  // The selected Super Admin college is real and checked by the central
  // acting-college resolver; never invent a College Admin membership.
  return resolveActingCollege(context,"people.manage");
}
/** Deprecated numeric facultyId is a lookup alias ONLY, never the mutation
 * identity: all current routes and optimistic updates use membership UUIDs. */
export async function findCollegeFacultyLegacyDeepLink(context:RequestContext,rawId:unknown){
 const legacyId=z.coerce.number().int().min(1).parse(rawId);
 const own=await scope(context);
 const [row]=await getDb().select({membershipId:facultyProfiles.membershipId})
  .from(facultyProfiles)
  .innerJoin(collegeMemberships,eq(collegeMemberships.id,facultyProfiles.membershipId))
  .where(and(eq(facultyProfiles.legacyFacultyId,legacyId),
   eq(collegeMemberships.collegeId,own.collegeId))).limit(1);
 if(!row)return null;
 return {membershipId:row.membershipId,
  href:"/college/people/manage?membershipId="+encodeURIComponent(row.membershipId)};
}

export async function getCollegePersonEditor(context:RequestContext,rawId:unknown,kind:"FACULTY"|"LEARNER"){
  const own=await scope(context),id=uuid.parse(rawId);
  const [row]=await getDb().select({
    id:collegeMemberships.id,status:collegeMemberships.status,
    name:users.displayName,phone:users.phoneE164,email:users.email,
    faculty:facultyProfiles.profileDocument,learner:learnerProfiles.profileDocument,
    departmentId:facultyProfiles.primaryDepartmentId,
    facultyVersion:facultyProfiles.profileDocumentVersion,
    title:facultyProfiles.academicTitle,employmentType:facultyProfiles.employmentType,
    roll:learnerProfiles.rollNumber,registration:learnerProfiles.registrationNumber,
  }).from(collegeMemberships).innerJoin(users,eq(users.id,collegeMemberships.userId))
    .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
      eq(membershipRoles.role,kind)))
    .leftJoin(facultyProfiles,eq(facultyProfiles.membershipId,collegeMemberships.id))
    .leftJoin(learnerProfiles,eq(learnerProfiles.membershipId,collegeMemberships.id))
    .where(and(eq(collegeMemberships.id,id),eq(collegeMemberships.collegeId,own.collegeId))).limit(1);
  if(!row)throw Error("PERSON_NOT_FOUND");
  const faculty=kind==="FACULTY"?facultyProfileDocumentSchema.parse(row.faculty??{}):null;
  const learner=kind==="LEARNER"?learnerProfileDocumentSchema.parse(row.learner??{}):null;
  const parts=(row.name??"").trim().split(/\s+/);
  return {id,kind,name:row.name??"",firstName:parts[0]??"",
    lastName:parts.slice(1).join(" "),
    websiteUrl:faculty?.socialProfiles.portfolio??"",
    canonicalPhone:row.phone??"",canonicalEmail:row.email??"",
    gender:faculty?.personalDetails.gender??learner?.personalDetails.gender??"",
    dateOfBirth:faculty?.personalDetails.dateOfBirth??learner?.personalDetails.dateOfBirth??"",
    address:faculty?.address.currentAddress??learner?.address.currentAddress??"",
    contactPhone:faculty?.contact.contactMobile??learner?.contacts.alternatePhone??"",
    contactEmail:faculty?.contact.contactMail??learner?.contacts.contactEmail??"",
    bio:faculty?.about.description??learner?.bio??"",
    primaryDepartmentId:row.departmentId,profileVersion:row.facultyVersion??0,
    academicTitle:row.title,
    employmentType:row.employmentType,rollNumber:row.roll,registrationNumber:row.registration};
}
export async function saveCollegePersonEditor(context:RequestContext,rawId:unknown,raw:unknown){
  const own=await scope(context),id=uuid.parse(rawId),input=inputSchema.parse(raw);
  if(input.firstName!==undefined&&input.firstName.trim().length===0)
    throw Error("FIRST_NAME_REQUIRED");
  return getDb().transaction(async tx=>{
    const [member]=await tx.select({id:collegeMemberships.id,status:collegeMemberships.status})
      .from(collegeMemberships).innerJoin(membershipRoles,and(
        eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,input.kind)))
      .where(and(eq(collegeMemberships.id,id),eq(collegeMemberships.collegeId,own.collegeId)))
      .for("update",{of:collegeMemberships}).limit(1);
    if(!member||member.status==="ENDED")throw Error("PERSON_NOT_EDITABLE");
    if(input.kind==="FACULTY"){
      const [found]=await tx.select({
        document:facultyProfiles.profileDocument,
        profileVersion:facultyProfiles.profileDocumentVersion,
        departmentId:facultyProfiles.primaryDepartmentId,
      }).from(facultyProfiles).where(eq(facultyProfiles.membershipId,id)).for("update").limit(1);
      if(input.expectedProfileVersion!==undefined &&
          input.expectedProfileVersion!==(found?.profileVersion??0))
        throw Error("FACULTY_PROFILE_VERSION_CONFLICT");
      // Keep an existing department on partial updates; require and scope
      // the department when provisioning a Faculty member.
      const departmentId=input.primaryDepartmentId===undefined
        ? found?.departmentId??null : input.primaryDepartmentId;
      if(!departmentId)throw Error("DEPARTMENT_REQUIRED");
      const [dept]=await tx.select({id:departments.id}).from(departments)
        .where(and(eq(departments.id,departmentId),
          eq(departments.collegeId,own.collegeId))).limit(1);
      if(!dept)throw Error("Department does not belong to the selected college");
      const original=facultyProfileDocumentSchema.parse(found?.document??{});
      const doc=facultyProfileDocumentSchema.parse({...original,
        about:{...original.about,description:input.bio},
        personalDetails:{...original.personalDetails,gender:input.gender,dateOfBirth:input.dateOfBirth},
        address:{...original.address,currentAddress:input.address},
        contact:{...original.contact,contactMobile:input.contactPhone,contactMail:input.contactEmail},
        socialProfiles:input.websiteUrl!==undefined?{
          ...original.socialProfiles,portfolio:input.websiteUrl,
        }:original.socialProfiles});
      if (JSON.stringify(original.contact)!==JSON.stringify(doc.contact))
        facultyContactEditSchema.parse(doc.contact);
      await tx.insert(facultyProfiles).values({membershipId:id,profileDocument:doc,
        primaryDepartmentId:departmentId,
        academicTitle:input.academicTitle||null,employmentType:input.employmentType||null})
        .onConflictDoUpdate({target:facultyProfiles.membershipId,
          set:{profileDocument:doc,profileDocumentVersion:sql`${facultyProfiles.profileDocumentVersion}+1`,
            primaryDepartmentId:departmentId,
            academicTitle:input.academicTitle||null,employmentType:input.employmentType||null,updatedAt:new Date()}});
    }else{
      const [found]=await tx.select({document:learnerProfiles.profileDocument})
        .from(learnerProfiles).where(eq(learnerProfiles.membershipId,id)).for("update").limit(1);
      const original=learnerProfileDocumentSchema.parse(found?.document??{});
      const doc=learnerProfileDocumentSchema.parse({...original,bio:input.bio,
        personalDetails:{...original.personalDetails,gender:input.gender,dateOfBirth:input.dateOfBirth},
        address:{...original.address,currentAddress:input.address},
        contacts:{...original.contacts,alternatePhone:input.contactPhone,contactEmail:input.contactEmail}});
      await tx.insert(learnerProfiles).values({membershipId:id,profileDocument:doc,
        rollNumber:input.rollNumber||null,registrationNumber:input.registrationNumber||null})
        .onConflictDoUpdate({target:learnerProfiles.membershipId,
          set:{profileDocument:doc,rollNumber:input.rollNumber||null,
            registrationNumber:input.registrationNumber||null,updatedAt:new Date()}});
    }
    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.IDENTITY_COLLEGE_PERSON_PROFILE_UPDATED,
      collegeId:own.collegeId,organizationId:own.organizationId,
      subjectType:"college_membership",subjectId:id,
      summary:input.kind==="FACULTY"?"Faculty profile updated":"Student profile updated",
      metadata:{role:input.kind,action:"UPDATE",
        legacyAuditCategory:input.kind==="FACULTY"?"FACULTY_EDIT":"LEARNER_EDIT",
        actorScopeCollegeId:own.collegeId,
        fields:["bio","gender","dateOfBirth","address","contact","website"]}});
    return {id,updated:true,
      message:input.kind==="FACULTY"?"Faculty updated successfully!":"Student updated successfully!"};
  });
}
