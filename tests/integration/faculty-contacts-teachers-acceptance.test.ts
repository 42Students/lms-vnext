import {afterAll,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import {listFacultyContacts,getFacultyContactDetail}
 from "@/modules/courses/faculty-contacts-service";
import type {RequestContext} from "@/modules/identity/context";
import {SEED_IDS} from "../../scripts/db-seed-data";

if(!process.env.TEST_DATABASE_URL)
 throw new Error("Faculty Teachers acceptance requires disposable TEST_DATABASE_URL");

const faculty:RequestContext={
 user:{id:SEED_IDS.facultyUser,identityUid:"seed-shared-faculty",
   platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.facultyCollegeAMembership,
   collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,
   status:"ACTIVE",roles:["FACULTY","MENTOR"]},
};
const learner:RequestContext={
 user:{id:SEED_IDS.learnerUser,identityUid:"seed-learner",
   platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.learnerCollegeAMembership,
   collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,
   status:"ACTIVE",roles:["LEARNER"]},
};

afterAll(async()=>{await closeDatabaseConnection()});

describe("Faculty Teachers Contacts registered PostgreSQL acceptance",()=>{
 it("reads only current-college active teachers and follows the exact persisted profile",async()=>{
  const page=await listFacultyContacts(faculty,{
   tab:"FACULTY",search:"",page:1,pageSize:50,
  });
  expect(page.tab).toBe("FACULTY");
  expect(page.total).toBeGreaterThanOrEqual(1);
  expect(page.page).toBe(1);
  const self=page.items.find(row=>row.membershipId===SEED_IDS.facultyCollegeAMembership);
  expect(self).toBeDefined();
  expect(self!.roles).toContain("FACULTY");
  expect(page.items.some(row=>row.membershipId===SEED_IDS.learnerCollegeAMembership))
   .toBe(false);
  expect(page.items.some(row=>row.membershipId===SEED_IDS.facultyCollegeBMembership))
   .toBe(false);
  const detail=await getFacultyContactDetail(faculty,{
   contactsTab:"teachers",membershipId:SEED_IDS.facultyCollegeAMembership,
  });
  expect(detail.membershipId).toBe(self!.membershipId);
  expect(detail.displayName).toBe(self!.displayName);
  expect(detail.departmentName).toBe(self!.departmentName);
  expect(detail.roles).toContain("FACULTY");
  expect(detail.contactsTab).toBe("teachers");
  // No private identity, phone, email, address or documents escape public list/detail.
  for(const row of [self!,detail]){
   expect(Object.keys(row).some(k=>/email|phone|aadhaar|pan|address|resume|document/i.test(k)))
    .toBe(false);
  }
 });
 it("filters by public name and department, not private login email",async()=>{
  const all=await listFacultyContacts(faculty,{
   tab:"FACULTY",search:"",page:1,pageSize:50,
  });
  const known=all.items.find(x=>x.membershipId===SEED_IDS.facultyCollegeAMembership)!;
  const term=known.displayName?.trim();
  if(term){
   const results=await listFacultyContacts(faculty,{
    tab:"FACULTY",search:term,page:1,pageSize:50,
   });
   expect(results.items.some(x=>x.membershipId===known.membershipId)).toBe(true);
  }
  const secret=await listFacultyContacts(faculty,{
   tab:"FACULTY",search:"faculty-private-email-do-not-search@example.invalid",
   page:1,pageSize:10,
  });
  expect(secret.items).toEqual([]);
  expect(secret.total).toBe(0);
  expect(secret.pageSize).toBe(10);
 });
 it("denies cross-college identities, Learner role, inactive/forged actor and query injection",async()=>{
  for(const membershipId of [
   SEED_IDS.facultyCollegeBMembership,SEED_IDS.learnerCollegeAMembership,
  ])await expect(getFacultyContactDetail(faculty,{
   contactsTab:"teachers",membershipId,
  })).rejects.toBeDefined();
  const denied:RequestContext[]=[
   learner,
   {...faculty,membership:{...faculty.membership!,status:"SUSPENDED"}},
   {...faculty,user:{...faculty.user,platformStatus:"DISABLED"}},
   {...faculty,membership:{...faculty.membership!,collegeId:SEED_IDS.collegeB}},
   {...faculty,user:{...faculty.user,id:SEED_IDS.learnerUser}},
  ];
  for(const actor of denied){
   await expect(listFacultyContacts(actor,{
    tab:"FACULTY",search:"",page:1,pageSize:10,
   })).rejects.toBeDefined();
  }
  await expect(listFacultyContacts(faculty,{
   tab:"FACULTY",search:"",page:1,pageSize:10,collegeId:SEED_IDS.collegeB,
  })).rejects.toBeDefined();
  await expect(getFacultyContactDetail(faculty,{
   contactsTab:"teachers",membershipId:SEED_IDS.facultyCollegeAMembership,
   collegeId:SEED_IDS.collegeB,
  })).rejects.toBeDefined();
 });
});
