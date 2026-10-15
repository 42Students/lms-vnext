import {randomUUID} from "node:crypto";
import {afterAll,beforeAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {listCollegeContacts} from "@/modules/people/college-contacts-service";
import {exportCollegeContactsCsv} from "@/modules/people/college-contacts-export-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL}):null;
const admin:RequestContext={user:{id:SEED_IDS.collegeAdminUser,identityUid:"contacts-fixture",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.collegeAdminMembership,collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["COLLEGE_ADMIN"]}};
const wrong:RequestContext={...admin,membership:{...admin.membership!,roles:["LEARNER"]}};
const ids={u1:randomUUID(),m1:randomUUID(),r1:randomUUID(),u2:randomUUID(),m2:randomUUID(),r2:randomUUID()};
describe.skipIf(!enabled)("read-only college contact isolation",()=>{
 beforeAll(async()=>{
  if(!pool)throw Error("Disposable PG required");
  for(const [user,member,role,college] of [[ids.u1,ids.m1,ids.r1,SEED_IDS.collegeA],[ids.u2,ids.m2,ids.r2,SEED_IDS.collegeB]]){
   await pool.query("INSERT INTO users(id,identity_uid,display_name,email,phone_e164) VALUES ($1::uuid,$2::text,$3::text,$4::text,$5::text)",
    [user,"contact-"+user,"Contact "+user.slice(0,8),"contact-"+user+"@example.edu",null]);
   await pool.query("INSERT INTO college_memberships(id,user_id,college_id) VALUES($1::uuid,$2::uuid,$3::uuid)",[member,user,college]);
   await pool.query("INSERT INTO membership_roles(id,membership_id,role) VALUES($1::uuid,$2::uuid,'LEARNER')",[role,member]);
  }
 });
 afterAll(async()=>{
  try{
   if(pool)for(const [user,member,role] of [[ids.u1,ids.m1,ids.r1],[ids.u2,ids.m2,ids.r2]]){
    await pool.query("DELETE FROM membership_roles WHERE id=$1::uuid",[role]);
    await pool.query("DELETE FROM college_memberships WHERE id=$1::uuid",[member]);
    await pool.query("DELETE FROM users WHERE id=$1::uuid",[user]);
   }
  }finally{await pool?.end();await closeDatabaseConnection();}
 });
 it("returns only same-college student contacts, and masks learner emails",async()=>{
  const found=await listCollegeContacts(admin,{tab:"STUDENT",q:ids.u1.slice(0,8)});
  expect(found.items.some(x=>x.membershipId===ids.m1)).toBe(true);
  expect(found.items.some(x=>x.membershipId===ids.m2)).toBe(false);
  expect(found.items.find(x=>x.membershipId===ids.m1)?.email).not.toContain("contact-");
 });
 it("denies wrong-role access, even for a same-college claim",async()=>{
  await expect(listCollegeContacts(wrong,{})).rejects.toBeInstanceOf(AuthorizationError);
 });
 it("never returns foreign-college matches despite a direct query",async()=>{
  const found=await listCollegeContacts(admin,{q:ids.u2.slice(0,8),tab:"STUDENT"});
  expect(found.items.some(x=>x.membershipId===ids.m2)).toBe(false);
 });
 it("exports scoped learner contacts but never raw learner email or foreign membership",async()=>{
  const report=await exportCollegeContactsCsv(admin,{tab:"STUDENT",q:ids.u1.slice(0,8)});
  expect(report.exported).toBeGreaterThanOrEqual(1);
  expect(report.csv).toContain("Contact "+ids.u1.slice(0,8));
  expect(report.csv).not.toContain("contact-"+ids.u1+"@example.edu");
  expect(report.csv).not.toContain("Contact "+ids.u2.slice(0,8));
  await expect(exportCollegeContactsCsv(wrong,{tab:"STUDENT"})).rejects.toBeInstanceOf(AuthorizationError);
 });

});
