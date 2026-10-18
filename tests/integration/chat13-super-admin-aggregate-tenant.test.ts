import {afterAll,beforeAll,describe,expect,it} from "vitest";
import type {Pool} from "pg";
import {
  createPlacementFixture,createPrincipal,createTenant,
  newHarnessPool,withProjectPg,
} from "./support/projects-placements-pg-harness";

let pool:Pool;
beforeAll(()=>{pool=newHarnessPool();});
afterAll(async()=>{if(pool)await pool.end();});

describe("SA-HIRING-REPORT-SCOPE-03 and SA-PIPELINE-TENANT-02 persisted college pairing",()=>{
 it("excludes a foreign-college application despite valid standalone job/member FKs",async()=>{
  await withProjectPg(pool,async db=>{
   const a=await createTenant(db,"Hiring tenant A");
   const b=await createTenant(db,"Hiring tenant B");
   const tpoA=await createPrincipal(db,a,["TPO"]);
   const tpoB=await createPrincipal(db,b,["TPO"]);
   const learnerA=await createPrincipal(db,a,["LEARNER"]);
   const learnerB=await createPrincipal(db,b,["LEARNER"]);
   const jobA=await createPlacementFixture(db,a,tpoA);
   const jobB=await createPlacementFixture(db,b,tpoB);
   const [role]=await db.query<{id:string}>(`
     insert into placement_job_role_options(job_id,title,employment_type,work_mode)
     values($1,'Software Developer','FULL_TIME','REMOTE') returning id`,[jobB.jobId]);
   const add=async(membershipId:string)=>db.query<{id:string}>(`
     insert into placement_applications
       (job_id,role_option_id,membership_id,channel,eligibility_status,eligibility_snapshot,submitted_by_user_id)
     values($1,$2,$3,'INTERNAL','ELIGIBLE','{}'::jsonb,$4) returning id`,
     [jobB.jobId,role!.id,membershipId,tpoB.userId]);
   await add(learnerA.membershipId!);
   await add(learnerB.membershipId!);
   const naive=await db.query<{n:number}>(`
     select count(a.id)::int n from placement_jobs j
     left join placement_applications a on a.job_id=j.id
     left join college_memberships m on m.id=a.membership_id and m.college_id=j.college_id
     where j.id=$1`,[jobB.jobId]);
   expect(naive[0]?.n).toBe(2);

   const correct=await db.query<{n:number}>(`
     select count(a.id)::int n from placement_jobs j
     left join placement_applications a on a.job_id=j.id
       and exists(select 1 from college_memberships m
         where m.id=a.membership_id and m.college_id=j.college_id)
     where j.id=$1`,[jobB.jobId]);
   expect(correct[0]?.n).toBe(1);

   const pipeline=await db.query<{n:number}>(`
     select count(a.id)::int n from placement_applications a
     join college_memberships m on m.id=a.membership_id and m.college_id=$2
     where a.job_id=$1 and a.status='SUBMITTED'`,[jobB.jobId,b.collegeId]);
   expect(pipeline[0]?.n).toBe(1);

   const noApplications=await db.query<{n:number}>(`
     select count(a.id)::int n from placement_jobs j
     left join placement_applications a on a.job_id=j.id
       and exists(select 1 from college_memberships m
         where m.id=a.membership_id and m.college_id=j.college_id)
     where j.id=$1`,[jobA.jobId]);
   expect(noApplications[0]?.n).toBe(0);
  });
 });
});
