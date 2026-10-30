import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { randomUUID } from "node:crypto";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { facultyProfileDocumentStorageReady } from "@/modules/people/faculty-profile-readiness";
import { loadOwnFacultyProfileDocumentStaged } from "@/modules/people/faculty-profile-self.staged";
import { patchOwnFacultyProfileSection } from "@/modules/people/faculty-self-section-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

if (!process.env.TEST_DATABASE_URL) {
 throw new Error("Faculty profile integration requires disposable TEST_DATABASE_URL");
}
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
const suffix=randomUUID().slice(0,12);
const facultyId=randomUUID(), facultyMembershipId=randomUUID(),facultyRoleId=randomUUID();
const learnerId=randomUUID(), learnerMembershipId=randomUUID(),learnerRoleId=randomUUID();
function actor(id:string,membershipId:string,role:"FACULTY"|"LEARNER"):RequestContext{
 return {user:{id,identityUid:"faculty-self-"+id,platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:membershipId,collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,
   status:"ACTIVE",roles:[role]}};
}
const faculty=actor(facultyId,facultyMembershipId,"FACULTY");
const learner=actor(learnerId,learnerMembershipId,"LEARNER");
async function seed(id:string,membershipId:string,roleId:string,role:string){
 await pool.query("insert into users(id,identity_uid,email,display_name,platform_status) values($1::uuid,$2::text,$3::text,$4::text,'ACTIVE')",
  [id,"c4profile-"+id,"faculty-self-"+id+"@example.invalid","Profile "+suffix]);
 await pool.query("insert into college_memberships(id,user_id,college_id,status) values($1::uuid,$2::uuid,$3::uuid,'ACTIVE')",
  [membershipId,id,SEED_IDS.collegeA]);
 await pool.query("insert into membership_roles(id,membership_id,role) values($1::uuid,$2::uuid,$3::text::membership_role)",
  [roleId,membershipId,role]);
}
beforeAll(async()=>{
 await seed(facultyId,facultyMembershipId,facultyRoleId,"FACULTY");
 await seed(learnerId,learnerMembershipId,learnerRoleId,"LEARNER");
});
afterAll(async()=>{
 try{
  if(await facultyProfileDocumentStorageReady()){
   await pool.query("delete from faculty_profiles where membership_id=$1::uuid",[facultyMembershipId]);
  }
  for(const [id,membership] of [[facultyId,facultyMembershipId],[learnerId,learnerMembershipId]]){
   await pool.query("delete from membership_roles where membership_id=$1::uuid",[membership]);
   await pool.query("delete from college_memberships where id=$1::uuid",[membership]);
   await pool.query("delete from users where id=$1::uuid",[id]);
  }
 }finally{await pool.end();await closeDatabaseConnection();}
});
describe("Faculty staged private profile integration",()=>{
 it("gates writes until migration, then checks success/foreign role/stale token",async()=>{
  if(!(await facultyProfileDocumentStorageReady())){
   // Registered migrations do not yet expose DB04: no success claim is possible.
   await expect(loadOwnFacultyProfileDocumentStaged(faculty))
    .rejects.toMatchObject({code:"PRIVATE_IDENTITY_STORAGE_NOT_READY"});
   return;
  }
  const first=await loadOwnFacultyProfileDocumentStaged(faculty);
  expect(first.version).toBe(0);
  const saved=await patchOwnFacultyProfileSection(faculty,{
   section:"about",value:{description:"Faculty Mathematics"},expectedVersion:first.version,
  });
  expect(saved.version).toBe(1);
  expect(saved.document.about.description).toBe("Faculty Mathematics");
  // Exercise multiple repeatable sections against the same versioned profile.
  let latest=saved;
  const rows=[
   {section:"languages",value:[{id:randomUUID(),language:"Telugu",proficiency:"Fluent"}]},
   {section:"education",value:[{id:randomUUID(),institutionName:"University",startYear:"2020",endYear:"2024"}]},
   {section:"certifications",value:[{id:randomUUID(),name:"Faculty Training"}]},
   {section:"experiences",value:[{id:randomUUID(),organization:"College"}]},
   {section:"publications",value:[{id:randomUUID(),title:"Teaching paper"}]},
   {section:"awards",value:[{id:randomUUID(),title:"Academic Merit"}]},
  ] as const;
  for (const row of rows){
   latest=await patchOwnFacultyProfileSection(faculty,{
    section:row.section,value:row.value,expectedVersion:latest.version,
   });
  }
  expect(latest.version).toBe(saved.version+rows.length);
  const reloaded=await loadOwnFacultyProfileDocumentStaged(faculty);
  expect(reloaded.document.languages[0]?.language).toBe("Telugu");
  expect(reloaded.document.education[0]?.institutionName).toBe("University");
  expect(reloaded.document.awards[0]?.title).toBe("Academic Merit");
  await expect(patchOwnFacultyProfileSection(faculty,{
   section:"about",value:{description:"Stale"},expectedVersion:0,
  })).rejects.toMatchObject({code:"FACULTY_PROFILE_VERSION_CONFLICT"});
  await expect(loadOwnFacultyProfileDocumentStaged(learner))
   .rejects.toMatchObject({code:"FACULTY_ROLE_REQUIRED"});
  const forged:RequestContext={...faculty,membership:{...faculty.membership!,collegeId:SEED_IDS.collegeB}};
  await expect(loadOwnFacultyProfileDocumentStaged(forged)).rejects.toBeDefined();
  await pool.query("delete from membership_roles where membership_id=$1::uuid and role=$2::text::membership_role",
   [facultyMembershipId,"FACULTY"]);
  try{
   await expect(patchOwnFacultyProfileSection(faculty,{
    section:"about",value:{description:"Revoked"},expectedVersion:latest.version,
   })).rejects.toBeDefined();
  }finally{
   await pool.query("insert into membership_roles(id,membership_id,role) values($1::uuid,$2::uuid,$3::text::membership_role)",
    [facultyRoleId,facultyMembershipId,"FACULTY"]);
  }
 });
 it("persists contacts, address, social, personal details, skills and metadata without touching verified identity",async()=>{
  const sections=[
   {section:"contact",value:{contactMobile:"9876543210",contactPhone:"9123456780",contactMail:"faculty-public@example.invalid"}},
   {section:"address",value:{currentAddress:"Faculty Block",currentCity:"Hyderabad",currentState:"Telangana",currentPincode:"500001"}},
   {section:"socialProfiles",value:{linkedIn:"https://www.linkedin.com/in/verified-faculty"}},
   {section:"personalDetails",value:{gender:"Prefer not to say",dateOfBirth:"1985-05-06",bloodGroup:""}},
   {section:"skills",value:[{id:randomUUID(),skill:"Teaching",proficiency:"Advanced"}]},
   {section:"metadata",value:{officeHours:"Tuesday 10:00"}},
  ] as const;
  let version=(await loadOwnFacultyProfileDocumentStaged(faculty)).version;
  for(const row of sections){
   const updated=await patchOwnFacultyProfileSection(faculty,{
    section:row.section,value:row.value,expectedVersion:version,
   });
   expect(updated.version).toBe(version+1);
   version=updated.version;
  }
  const reloaded=await loadOwnFacultyProfileDocumentStaged(faculty);
  expect(reloaded.document.contact.contactMobile).toBe("9876543210");
  expect(reloaded.document.address.currentCity).toBe("Hyderabad");
  expect(reloaded.document.socialProfiles.linkedIn).toBe("https://www.linkedin.com/in/verified-faculty");
  expect(reloaded.document.personalDetails.dateOfBirth).toBe("1985-05-06");
  expect(reloaded.document.skills[0]?.skill).toBe("Teaching");
  expect(reloaded.document.metadata["officeHours"]).toBe("Tuesday 10:00");
  expect(reloaded.document.identitySummary.aadhaarLast4).toBe("");
  await expect(patchOwnFacultyProfileSection(faculty,{
   section:"metadata",value:{aadhaarNumber:"123456789012"},expectedVersion:version,
  })).rejects.toBeDefined();
  await expect(patchOwnFacultyProfileSection(faculty,{
   section:"socialProfiles",value:{linkedIn:"http://private.test"},expectedVersion:version,
  })).rejects.toBeDefined();
  await expect(patchOwnFacultyProfileSection(learner,{
   section:"about",value:{description:"Learner hijack"},expectedVersion:version,
  })).rejects.toBeDefined();

 });
});
