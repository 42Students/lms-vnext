import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import {getFacultyContactDetail,listFacultyContacts} from "@/modules/courses/faculty-contacts-service";
import type {RequestContext} from "@/modules/identity/context";
import {SEED_IDS} from "../../scripts/db-seed-data";

if(!process.env.TEST_DATABASE_URL)throw new Error("All Contacts acceptance requires disposable TEST_DATABASE_URL");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
const actor:RequestContext={
 user:{id:SEED_IDS.facultyUser,identityUid:"seed-shared-faculty",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,
  organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["FACULTY","MENTOR"]},
};
const outsider:RequestContext={
 user:{id:SEED_IDS.learnerUser,identityUid:"seed-learner",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.learnerCollegeAMembership,collegeId:SEED_IDS.collegeA,
  organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["LEARNER"]},
};
afterAll(async()=>{await pool.end();await closeDatabaseConnection()});

describe("Faculty All Contacts registered PostgreSQL acceptance",()=>{
 it("shows active same-college Faculty and Student memberships with role-checked public detail",async()=>{
  const listed=await listFacultyContacts(actor,{tab:"ALL",search:"",page:1,pageSize:50});
  expect(listed.tab).toBe("ALL");
  expect(listed.total).toBeGreaterThanOrEqual(2);
  for(const [id,role] of [
   [SEED_IDS.facultyCollegeAMembership,"FACULTY"],
   [SEED_IDS.learnerCollegeAMembership,"LEARNER"],
  ]as const){
   const row=listed.items.find(x=>x.membershipId===id);
   expect(row).toBeDefined();
   expect(row!.roles).toContain(role);
   const detail=await getFacultyContactDetail(actor,{
    contactsTab:"allContacts",membershipId:id,
   });
   expect(detail).toMatchObject({
    membershipId:id,displayName:row!.displayName,departmentName:row!.departmentName,
    contactsTab:"allContacts",
   });
   expect(detail.roles).toContain(role);
   for(const publicRecord of [row!,detail]){
    expect(Object.keys(publicRecord).some(key=>/email|phone|address|aadhaar|identity|document|resume|verification/i.test(key))).toBe(false);
   }
  }
  expect(listed.items.some(x=>x.membershipId===SEED_IDS.facultyCollegeBMembership)).toBe(false);
 });
 it("pages across more than ten persisted contacts and searches public names only",async()=>{
  const marker="Faculty All Contacts "+randomUUID().slice(0,8);
  const fixtures:{userId:string;membershipId:string;roleId:string}[]=[];
  try{
   for(let i=0;i<13;i++){
    const userId=randomUUID(),membershipId=randomUUID(),roleId=randomUUID();
    await pool.query(
     "insert into users(id,identity_uid,email,display_name,platform_status) values ($1::uuid,$2::text,$3::text,$4::text,'ACTIVE')",
     [userId,"all-contact-"+userId,"all-contact-"+userId+"@example.invalid",marker+" "+String(i).padStart(2,"0")],
    );
    await pool.query(
     "insert into college_memberships(id,user_id,college_id,status) values ($1::uuid,$2::uuid,$3::uuid,'ACTIVE')",
     [membershipId,userId,SEED_IDS.collegeA],
    );
    await pool.query(
     "insert into membership_roles(id,membership_id,role) values ($1::uuid,$2::uuid,'LEARNER')",
     [roleId,membershipId],
    );
    fixtures.push({userId,membershipId,roleId});
   }
   const first=await listFacultyContacts(actor,{tab:"ALL",search:marker,page:1,pageSize:10});
   const second=await listFacultyContacts(actor,{tab:"ALL",search:marker,page:2,pageSize:10});
   const large=await listFacultyContacts(actor,{tab:"ALL",search:marker,page:1,pageSize:20});
   expect(first.total).toBe(13);
   expect(first.totalPages).toBe(2);
   expect(first.items).toHaveLength(10);
   expect(second.items).toHaveLength(3);
   expect(large.items).toHaveLength(13);
   expect(new Set([...first.items,...second.items].map(x=>x.membershipId)).size).toBe(13);
   expect(first.items[0]?.displayName).toBe(marker+" 00");
   expect(second.items[2]?.displayName).toBe(marker+" 12");
   for(const row of large.items)expect(row.roles).toContain("LEARNER");
  }finally{
   for(const f of fixtures.reverse()){
    // The source is read-only, so no activity events are written by these
    // fixtures. Keep identities if another worker has subsequently audited one.
    const count=await pool.query(
     "select count(*)::int as n from activity_events where actor_user_id=$1::uuid or actor_membership_id=$2::uuid",
     [f.userId,f.membershipId],
    );
    if(Number(count.rows[0]?.n)!==0)continue;
    await pool.query("delete from membership_roles where id=$1::uuid",[f.roleId]);
    await pool.query("delete from college_memberships where id=$1::uuid",[f.membershipId]);
    await pool.query("delete from users where id=$1::uuid",[f.userId]);
   }
  }
  const noPrivateEmail=await listFacultyContacts(actor,{
   tab:"ALL",search:"learner.seed@example.com",page:1,pageSize:10,
  });
  expect(noPrivateEmail.total).toBe(0);
  await expect(listFacultyContacts(actor,{
   tab:"ALL",search:"",page:1,pageSize:51,
  })).rejects.toBeDefined();
 });
 it("denies wrong-role, disabled/suspended, forged tenant, foreign detail and attacker-controlled filters",async()=>{
  for(const bad of [
   outsider,
   {...actor,user:{...actor.user,platformStatus:"DISABLED" as const}},
   {...actor,membership:{...actor.membership!,status:"SUSPENDED" as const}},
   {...actor,membership:{...actor.membership!,collegeId:SEED_IDS.collegeB}},
   {...actor,user:{...actor.user,id:SEED_IDS.learnerUser}},
  ]){
   await expect(listFacultyContacts(bad,{tab:"ALL",search:"",page:1,pageSize:10})).rejects.toBeDefined();
  }
  await expect(getFacultyContactDetail(actor,{
   contactsTab:"allContacts",membershipId:SEED_IDS.facultyCollegeBMembership,
  })).rejects.toBeDefined();
  await expect(getFacultyContactDetail(actor,{
   contactsTab:"allContacts",membershipId:SEED_IDS.learnerCollegeAMembership,
   collegeId:SEED_IDS.collegeB,
  })).rejects.toBeDefined();
  await expect(listFacultyContacts(actor,{
   tab:"ALL",search:"",page:1,pageSize:10,collegeId:SEED_IDS.collegeB,
  })).rejects.toBeDefined();
 });
});
