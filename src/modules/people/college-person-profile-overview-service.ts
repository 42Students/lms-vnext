import "server-only";
import {and,eq} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {collegeMemberships,facultyProfiles,learnerProfiles} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {resolveActingCollege} from "@/modules/permissions/acting-college";
import {getCollegePersonEditor} from "./college-directory-person-editor-service";
import {facultyProfileDocumentSchema} from "./faculty-profile-document";
import {learnerProfileDocumentSchema} from "./profile-validation";

/** COL-people-10: a sanctioned, read-only projection. Never send raw learner PAN/Aadhaar
 * values, private file receipt IDs, or undocumented profile metadata to roster UI. */
export async function getCollegePersonProfileOverview(ctx:RequestContext,rawId:unknown,rawKind:unknown){
 const id=z.uuid().parse(rawId),kind=z.enum(["FACULTY","LEARNER"]).parse(rawKind);
 const scope=await resolveActingCollege(ctx,"people.manage");
 const person=await getCollegePersonEditor(ctx,id,kind);
 const [row]=await getDb().select({
  faculty:facultyProfiles.profileDocument,learner:learnerProfiles.profileDocument,
 }).from(collegeMemberships)
  .leftJoin(facultyProfiles,eq(facultyProfiles.membershipId,collegeMemberships.id))
  .leftJoin(learnerProfiles,eq(learnerProfiles.membershipId,collegeMemberships.id))
  .where(and(eq(collegeMemberships.id,id),eq(collegeMemberships.collegeId,scope.collegeId))).limit(1);
 if(!row)throw Error("PERSON_NOT_FOUND");
 if(kind==="FACULTY"){
  const d=facultyProfileDocumentSchema.parse(row.faculty??{});
  return{person,education:d.education.map(x=>({title:x.program||x.educationType,
   detail:x.institutionName,year:x.endYear,extra:x.grade})),
   skills:d.skills.map(x=>x.skill),certifications:d.certifications.map(x=>x.name),
   projects:[],publications:d.publications.map(x=>x.title),awards:d.awards.map(x=>x.title),
   experience:d.experiences.map(x=>x.designation||x.organization),
   identity:"Identity numbers and supporting documents are private and are not shown here."};
 }
 const d=learnerProfileDocumentSchema.parse(row.learner??{});
 return{person,education:d.education.map(x=>({title:x.program||x.educationType,
  detail:x.institution,year:x.endYear,extra:x.gradeObtained})),
  skills:d.skills.map(x=>x.name),certifications:d.certifications.map(x=>x.name),
  projects:d.projects.map(x=>x.name),publications:[],awards:d.achievements.map(x=>x.title),
  experience:d.experiences.map(x=>x.designation||x.organization),
  identity:"Identity numbers and supporting documents are private and are not shown here."};
}
