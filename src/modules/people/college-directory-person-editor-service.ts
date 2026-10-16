import "server-only";
import {and,eq,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {collegeMemberships,departments,facultyProfiles,learnerProfiles,membershipRoles,users} from "@/db/schema";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import type {RequestContext} from "@/modules/identity/context";
import {requirePermission} from "@/modules/permissions/policy";
import {facultyProfileDocumentSchema} from "./faculty-profile-document";
import {learnerProfileDocumentSchema} from "./profile-validation";

const uuid=z.string().uuid();
const role=z.enum(["FACULTY","LEARNER"]);
const inputSchema=z.strictObject({
  kind:role,address:z.string().trim().max(1000),bio:z.string().trim().max(3000),
  gender:z.enum(["","Male","Female","Other","Prefer not to say"]),
  dateOfBirth:z.union([z.iso.date(),z.literal("")]),
  contactEmail:z.union([z.email(),z.literal("")]),
  contactPhone:z.string().trim().max(32),
  primaryDepartmentId:uuid.nullable().optional(),
  employmentType:z.string().trim().max(128).optional(),
  academicTitle:z.string().trim().max(128).optional(),
  rollNumber:z.string().trim().max(128).optional(),
  registrationNumber:z.string().trim().max(128).optional(),
});
function scope(context:RequestContext){
  const m=context.membership;
  if(!m||m.status!=="ACTIVE")throw Error("COLLEGE_MEMBERSHIP_REQUIRED");
  requirePermission(context,"people.manage",{collegeId:m.collegeId,organizationId:m.organizationId});
  return m;
}
export async function getCollegePersonEditor(context:RequestContext,rawId:unknown,kind:"FACULTY"|"LEARNER"){
  const own=scope(context),id=uuid.parse(rawId);
  const [row]=await getDb().select({
    id:collegeMemberships.id,status:collegeMemberships.status,
    name:users.displayName,phone:users.phoneE164,email:users.email,
    faculty:facultyProfiles.profileDocument,learner:learnerProfiles.profileDocument,
    departmentId:facultyProfiles.primaryDepartmentId,
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
  return {id,kind,name:row.name??"",canonicalPhone:row.phone??"",canonicalEmail:row.email??"",
    gender:faculty?.personalDetails.gender??learner?.personalDetails.gender??"",
    dateOfBirth:faculty?.personalDetails.dateOfBirth??learner?.personalDetails.dateOfBirth??"",
    address:faculty?.address.currentAddress??learner?.address.currentAddress??"",
    contactPhone:faculty?.contact.contactMobile??learner?.contacts.alternatePhone??"",
    contactEmail:faculty?.contact.contactMail??learner?.contacts.contactEmail??"",
    bio:faculty?.about.description??learner?.bio??"",
    primaryDepartmentId:row.departmentId,academicTitle:row.title,
    employmentType:row.employmentType,rollNumber:row.roll,registrationNumber:row.registration};
}
export async function saveCollegePersonEditor(context:RequestContext,rawId:unknown,raw:unknown){
  const own=scope(context),id=uuid.parse(rawId),input=inputSchema.parse(raw);
  return getDb().transaction(async tx=>{
    const [member]=await tx.select({id:collegeMemberships.id,status:collegeMemberships.status})
      .from(collegeMemberships).innerJoin(membershipRoles,and(
        eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,input.kind)))
      .where(and(eq(collegeMemberships.id,id),eq(collegeMemberships.collegeId,own.collegeId)))
      .for("update",{of:collegeMemberships}).limit(1);
    if(!member||member.status==="ENDED")throw Error("PERSON_NOT_EDITABLE");
    if(input.kind==="FACULTY"){
      if(input.primaryDepartmentId){
        const [dept]=await tx.select({id:departments.id}).from(departments)
          .where(and(eq(departments.id,input.primaryDepartmentId),
            eq(departments.collegeId,own.collegeId))).limit(1);
        if(!dept)throw Error("DEPARTMENT_NOT_FOUND");
      }
      const [found]=await tx.select({document:facultyProfiles.profileDocument})
        .from(facultyProfiles).where(eq(facultyProfiles.membershipId,id)).for("update").limit(1);
      const original=facultyProfileDocumentSchema.parse(found?.document??{});
      const doc=facultyProfileDocumentSchema.parse({...original,
        about:{...original.about,description:input.bio},
        personalDetails:{...original.personalDetails,gender:input.gender,dateOfBirth:input.dateOfBirth},
        address:{...original.address,currentAddress:input.address},
        contact:{...original.contact,contactMobile:input.contactPhone,contactMail:input.contactEmail}});
      await tx.insert(facultyProfiles).values({membershipId:id,profileDocument:doc,
        primaryDepartmentId:input.primaryDepartmentId??null,
        academicTitle:input.academicTitle||null,employmentType:input.employmentType||null})
        .onConflictDoUpdate({target:facultyProfiles.membershipId,
          set:{profileDocument:doc,profileDocumentVersion:sql`${facultyProfiles.profileDocumentVersion}+1`,
            primaryDepartmentId:input.primaryDepartmentId??null,
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
      metadata:{role:input.kind}});
    return {id,updated:true};
  });
}
