import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import {resolveRequestContext} from "@/modules/identity/context-service";
import {isTenantAccessAllowed,scopeContextToTenant} from "@/modules/auth/tenant-access";
import {getShellNavigation,scopedShellNavigation} from "@/components/shell/shell-model";

/**
 * Checklist #53: a single persisted identity legitimately has both an
 * active college membership and an independently verified recruiter grant.
 * Prove DB resolution, per-host tenant isolation and the visible shell model.
 * Uses disposable PostgreSQL only; it is not a deployed-browser witness.
 */
const url=process.env.TEST_DATABASE_URL;
if(!url||url!==process.env.DATABASE_URL)
 throw new Error("Combined recruiter/membership acceptance needs a matching isolated TEST_DATABASE_URL");
const pool=new Pool({connectionString:url,max:2});

afterAll(async()=>{await pool.end();await closeDatabaseConnection();});

describe("live recruiter plus college membership (#53)",()=>{
 it("isolates combined roles, host grants, and HR vs Learner navigation without privilege union",async()=>{
  const userId=randomUUID(),identityUid="security-combined-"+userId;
  const orgId=randomUUID(),collegeA=randomUUID(),collegeB=randomUUID();
  const membershipId=randomUUID(),companyId=randomUUID();
  const relationshipA=randomUUID(),relationshipB=randomUUID();
  const grantA=randomUUID(),grantB=randomUUID();
  const suffix=userId.replaceAll("-","");
  try{
   await pool.query("insert into organizations(id,name,status) values($1,$2,'ACTIVE')",
    [orgId,"Combined role org "+suffix]);
   await pool.query(
    "insert into colleges(id,organization_id,name,code,status) values($1,$2,$3,$4,'ACTIVE'),($5,$2,$6,$7,'ACTIVE')",
    [collegeA,orgId,"Combined College A "+suffix,"CMB-"+suffix+"-A",
     collegeB,"Combined College B "+suffix,"CMB-"+suffix+"-B"]);
   await pool.query("insert into users(id,identity_uid,platform_status) values($1,$2,'ACTIVE')",
    [userId,identityUid]);
   await pool.query(
    "insert into college_memberships(id,user_id,college_id,status) values($1,$2,$3,'ACTIVE')",
    [membershipId,userId,collegeA]);
   await pool.query(
    "insert into membership_roles(membership_id,role) values($1,'LEARNER')",
    [membershipId]);
   await pool.query(
    "insert into placement_companies(id,name,created_by_user_id,status) values($1,$2,$3,'ACTIVE')",
    [companyId,"Combined Company "+suffix,userId]);
   await pool.query(
    "insert into placement_company_relationships(id,college_id,company_id,created_by_user_id,status) values($1,$2,$3,$4,'ACTIVE'),($5,$6,$3,$4,'ACTIVE')",
    [relationshipA,collegeA,companyId,userId,relationshipB,collegeB]);
   await pool.query(
    "insert into placement_recruiter_profiles(user_id,company_id,created_by_user_id,status,title) values($1,$2,$1,'ACTIVE','Recruiter and learner')",
    [userId,companyId]);
   await pool.query(
    `insert into placement_recruiter_college_grants
     (id,recruiter_user_id,company_relationship_id,granted_by_user_id,status,verification_status,valid_until,capabilities)
     values($1,$3,$4,$3,'ACTIVE','VERIFIED',clock_timestamp()+interval '2 days',ARRAY['DRIVES']::text[]),
           ($2,$3,$5,$3,'ACTIVE','VERIFIED',clock_timestamp()+interval '2 days',ARRAY['DRIVES']::text[])`,
    [grantA,grantB,userId,relationshipA,relationshipB]);

   const selected=await resolveRequestContext({
    identityUid,activeMembershipId:membershipId,activeRole:"LEARNER",
   });
   expect(selected.membership).toMatchObject({id:membershipId,collegeId:collegeA,roles:["LEARNER"]});
   expect(selected.recruiter?.grants.map(g=>g.collegeId).sort())
    .toEqual([collegeA,collegeB].sort());
   // No other college can host the selected LEARNER membership merely because
   // the same user has a valid recruiter grant there.
   expect(isTenantAccessAllowed(selected,{kind:"college",collegeId:collegeA})).toBe(true);
   expect(isTenantAccessAllowed(selected,{kind:"college",collegeId:collegeB})).toBe(false);
   const hostA=scopeContextToTenant(selected,{kind:"college",collegeId:collegeA});
   expect(hostA.recruiter?.grants.map(g=>g.collegeId)).toEqual([collegeA]);
   const all=getShellNavigation(hostA);
   expect(all.map(item=>item.href)).toContain("/hr/home");
   expect(all.map(item=>item.href)).toContain("/learn/courses");
   const hr=scopedShellNavigation(all,"/hr/home").map(item=>item.href);
   const learn=scopedShellNavigation(all,"/learn/courses").map(item=>item.href);
   expect(hr).toEqual(["/hr/home","/hr/drives","/hr/calendar","/hr/conversations","/hr/company"]);
   expect(hr.some(href=>href.startsWith("/learn/"))).toBe(false);
   expect(learn).toContain("/learn/courses");
   expect(learn.some(href=>href.startsWith("/hr/"))).toBe(false);

   // Grant changes are re-read; a revoked recruiter permission never inherits
   // the still-active learner membership as its fallback.
   await pool.query(
    "update placement_recruiter_college_grants set status='REVOKED',revoked_at=clock_timestamp(),revoked_by_user_id=$1 where id=$2",
    [userId,grantA]);
   const revoked=await resolveRequestContext({
    identityUid,activeMembershipId:membershipId,activeRole:"LEARNER",
   });
   expect(revoked.recruiter?.grants.map(g=>g.collegeId)).toEqual([collegeB]);
   expect(scopeContextToTenant(revoked,{kind:"college",collegeId:collegeA}).recruiter).toBeNull();
   expect(getShellNavigation(scopeContextToTenant(revoked,{kind:"college",collegeId:collegeA}))
    .some(item=>item.href.startsWith("/hr/"))).toBe(false);
   const onlyRecruiter=await resolveRequestContext({identityUid});
   expect(isTenantAccessAllowed(onlyRecruiter,{kind:"college",collegeId:collegeB})).toBe(true);
   expect(isTenantAccessAllowed(onlyRecruiter,{kind:"college",collegeId:collegeA})).toBe(false);
  }finally{
   await pool.query("delete from placement_recruiter_college_grants where id=any($1::uuid[])",[[grantA,grantB]]);
   await pool.query("delete from placement_recruiter_profiles where user_id=$1",[userId]);
   await pool.query("delete from placement_company_relationships where id=any($1::uuid[])",[[relationshipA,relationshipB]]);
   await pool.query("delete from placement_companies where id=$1",[companyId]);
   await pool.query("delete from membership_roles where membership_id=$1",[membershipId]);
   await pool.query("delete from college_memberships where id=$1",[membershipId]);
   await pool.query("delete from users where id=$1",[userId]);
   await pool.query("delete from colleges where id=any($1::uuid[])",[[collegeA,collegeB]]);
   await pool.query("delete from organizations where id=$1",[orgId]);
  }
 });
});
