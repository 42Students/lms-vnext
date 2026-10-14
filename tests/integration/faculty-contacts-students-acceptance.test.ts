import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import {getFacultyContactDetail,listFacultyContacts} from "@/modules/courses/faculty-contacts-service";
import type {RequestContext} from "@/modules/identity/context";
import {SEED_IDS} from "../../scripts/db-seed-data";

if(!process.env.TEST_DATABASE_URL)
  throw new Error("Faculty Students Contacts acceptance requires disposable TEST_DATABASE_URL");

const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
const faculty:RequestContext={
  user:{id:SEED_IDS.facultyUser,identityUid:"seed-shared-faculty",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["FACULTY","MENTOR"]},
};
const learner:RequestContext={
  user:{id:SEED_IDS.learnerUser,identityUid:"seed-learner",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:SEED_IDS.learnerCollegeAMembership,collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["LEARNER"]},
};
afterAll(async()=>{await pool.end();await closeDatabaseConnection();});

describe("Faculty Students Contacts registered PostgreSQL acceptance",()=>{
  it("lists active learners with public fields and read-only Student detail in actor college",async()=>{
    const page=await listFacultyContacts(faculty,{tab:"LEARNER",search:"",page:1,pageSize:50});
    expect(page.tab).toBe("LEARNER");
    expect(page.total).toBeGreaterThanOrEqual(1);
    const student=page.items.find(x=>x.membershipId===SEED_IDS.learnerCollegeAMembership);
    expect(student).toBeDefined();
    expect(student!.roles).toContain("LEARNER");
    expect(page.items.some(x=>x.membershipId===SEED_IDS.facultyCollegeAMembership)).toBe(false);
    expect(page.items.some(x=>x.membershipId===SEED_IDS.facultyCollegeBMembership)).toBe(false);
    const detail=await getFacultyContactDetail(faculty,{
      contactsTab:"students",membershipId:SEED_IDS.learnerCollegeAMembership,
    });
    expect(detail).toMatchObject({
      membershipId:student!.membershipId,displayName:student!.displayName,
      departmentName:student!.departmentName,contactsTab:"students",
    });
    expect(detail.roles).toContain("LEARNER");
    for(const record of [student!,detail]){
      expect(Object.keys(record).some(key=>
        /email|phone|aadhaar|pan|address|identity|document|verification|resume/i.test(key)
      )).toBe(false);
    }
  });
  it("searches public fields, caps page size, and never searches private login email",async()=>{
    const listed=await listFacultyContacts(faculty,{tab:"LEARNER",search:"",page:1,pageSize:10});
    const student=listed.items.find(x=>x.membershipId===SEED_IDS.learnerCollegeAMembership);
    expect(student).toBeDefined();
    if(student!.displayName?.trim()){
      const searched=await listFacultyContacts(faculty,{
        tab:"LEARNER",search:student!.displayName!.trim(),page:1,pageSize:20,
      });
      expect(searched.items.some(x=>x.membershipId===student!.membershipId)).toBe(true);
    }
    const email=await listFacultyContacts(faculty,{
      tab:"LEARNER",search:"learner.seed@example.com",page:1,pageSize:10,
    });
    expect(email.total).toBe(0);
    expect(email.items).toEqual([]);
    await expect(listFacultyContacts(faculty,{
      tab:"LEARNER",search:"",page:1,pageSize:51,
    })).rejects.toBeDefined();
  });
  it("denies foreign-college learner detail and forged caller scope, wrong role and suspension",async()=>{
    const u=randomUUID(),m=randomUUID(),r=randomUUID();
    await pool.query(
      "INSERT INTO users(id,identity_uid,email,display_name,platform_status) VALUES($1::uuid,$2::text,$3::text,$4::text,'ACTIVE')",
      [u,"faculty-contact-student-"+u,"student-"+u+"@example.invalid","Foreign College Student"],
    );
    try{
      await pool.query(
        "INSERT INTO college_memberships(id,user_id,college_id,status) VALUES($1::uuid,$2::uuid,$3::uuid,'ACTIVE')",
        [m,u,SEED_IDS.collegeB],
      );
      await pool.query(
        "INSERT INTO membership_roles(id,membership_id,role) VALUES($1::uuid,$2::uuid,'LEARNER')",
        [r,m],
      );
      const list=await listFacultyContacts(faculty,{tab:"LEARNER",search:"Foreign College Student",page:1,pageSize:10});
      expect(list.items).toEqual([]);
      await expect(getFacultyContactDetail(faculty,{contactsTab:"students",membershipId:m}))
        .rejects.toBeDefined();
    }finally{
      await pool.query("DELETE FROM membership_roles WHERE id=$1::uuid",[r]);
      await pool.query("DELETE FROM college_memberships WHERE id=$1::uuid",[m]);
      await pool.query("DELETE FROM users WHERE id=$1::uuid",[u]);
    }
    await expect(getFacultyContactDetail(faculty,{
      contactsTab:"students",membershipId:SEED_IDS.facultyCollegeAMembership,
    })).rejects.toBeDefined();
    for(const actor of [
      learner,
      {...faculty,membership:{...faculty.membership!,status:"SUSPENDED" as const}},
      {...faculty,user:{...faculty.user,platformStatus:"DISABLED" as const}},
      {...faculty,membership:{...faculty.membership!,collegeId:SEED_IDS.collegeB}},
      {...faculty,user:{...faculty.user,id:SEED_IDS.learnerUser}},
    ]){
      await expect(listFacultyContacts(actor,{tab:"LEARNER",search:"",page:1,pageSize:10}))
        .rejects.toBeDefined();
    }
    await expect(listFacultyContacts(faculty,{
      tab:"LEARNER",search:"",page:1,pageSize:10,collegeId:SEED_IDS.collegeB,
    })).rejects.toBeDefined();
    await expect(getFacultyContactDetail(faculty,{
      contactsTab:"students",membershipId:SEED_IDS.learnerCollegeAMembership,
      collegeId:SEED_IDS.collegeB,
    })).rejects.toBeDefined();
  });
});
