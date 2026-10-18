import {afterAll,beforeAll,describe,expect,it} from "vitest";
import type {Pool} from "pg";
import {
  createPlacementFixture,createPrincipal,createTenant,newHarnessPool,withProjectPg,
} from "./support/projects-placements-pg-harness";

let pool:Pool;
beforeAll(()=>{pool=newHarnessPool();});
afterAll(async()=>{if(pool)await pool.end();});

describe("SA-HIRING-LEDGER-14 confirmed hires are accepted, joined and in the selected college",()=>{
 it("excludes foreign applicants and JOINED outcomes on non-accepted offers",async()=>{
  await withProjectPg(pool,async db=>{
   const collegeA=await createTenant(db,"Hiring verified A");
   const collegeB=await createTenant(db,"Hiring verified B");
   const owner=await createPrincipal(db,collegeA,["TPO"]);
   const ownLearner=await createPrincipal(db,collegeA,["LEARNER"]);
   const anomalousLearner=await createPrincipal(db,collegeA,["LEARNER"]);
   const foreignLearner=await createPrincipal(db,collegeB,["LEARNER"]);
   const job=await createPlacementFixture(db,collegeA,owner);
   const [role]=await db.query<{id:string}>(`
    insert into placement_job_role_options(job_id,title,employment_type,work_mode)
    values($1,'Graduate trainee','FULL_TIME','REMOTE') returning id`,[job.jobId]);

   const application=async(membershipId:string)=>{
    const [row]=await db.query<{id:string}>(`
     insert into placement_applications
      (job_id,role_option_id,membership_id,channel,eligibility_status,
       eligibility_snapshot,submitted_by_user_id)
     values($1,$2,$3,'INTERNAL','ELIGIBLE','{}'::jsonb,$4) returning id`,
     [job.jobId,role!.id,membershipId,owner.userId]);
    return row!.id;
   };
   const owned=await application(ownLearner.membershipId!);
   const anomalous=await application(anomalousLearner.membershipId!);
   const foreign=await application(foreignLearner.membershipId!);

   const offer=async(applicationId:string,status:"ACCEPTED"|"ISSUED")=>{
    const accepted=status==="ACCEPTED";
    const [row]=await db.query<{id:string}>(`
      insert into placement_offers
       (application_id,version,role_title,status,issued_by_user_id,
        responded_by_user_id,responded_at)
      values($1,1,'Graduate trainee',$2,$3,$4,$5) returning id`,
      [applicationId,status,owner.userId,accepted?owner.userId:null,
       accepted?new Date("2026-10-01T00:00:00Z"):null]);
    await db.query(`
      insert into placement_joining_outcomes
       (offer_id,status,joining_date,recorded_by_user_id,recorded_at)
      values($1,'JOINED','2026-10-15',$2,'2026-10-16T00:00:00Z')`,
      [row!.id,owner.userId]);
    return row!.id;
   };
   await offer(owned,"ACCEPTED");
   await offer(anomalous,"ISSUED"); // FK-legal but semantically inconsistent
   await offer(foreign,"ACCEPTED"); // both FKs valid, wrong college pairing

   const [naive]=await db.query<{total:number}>(`
      select count(distinct a.id)::int total
      from placement_applications a
      join placement_offers o on o.application_id=a.id
      join placement_joining_outcomes j on j.offer_id=o.id
      where a.job_id=$1 and j.status='JOINED'`,[job.jobId]);
   expect(naive?.total).toBe(3);

   const [verified]=await db.query<{total:number}>(`
      select count(distinct a.id)::int total
      from placement_applications a
      where a.job_id=$1 and a.status='SUBMITTED'
      and exists(select 1 from college_memberships m
        where m.id=a.membership_id and m.college_id=$2)
      and exists(select 1 from placement_offers o
       join placement_joining_outcomes j on j.offer_id=o.id
       where o.application_id=a.id and o.status='ACCEPTED' and j.status='JOINED')`,
     [job.jobId,collegeA.collegeId]);
   expect(verified?.total).toBe(1);
  });
 });
});
