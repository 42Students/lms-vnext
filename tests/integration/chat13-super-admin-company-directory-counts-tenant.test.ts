import {afterAll,beforeAll,describe,expect,it} from "vitest";
import type {Pool} from "pg";
import {
 createPlacementFixture,createPrincipal,createTenant,newHarnessPool,withProjectPg,
} from "./support/projects-placements-pg-harness";

let pool:Pool;
beforeAll(()=>{pool=newHarnessPool();});
afterAll(async()=>{if(pool)await pool.end();});

describe("SA-COMPANY-DIRECTORY-COUNT-07 persisted relationship and job tenant pairing",()=>{
 it("excludes a foreign-college job from the linked employer's drive count and latest activity",async()=>{
  await withProjectPg(pool,async db=>{
   const collegeA=await createTenant(db,"Company directory A");
   const collegeB=await createTenant(db,"Company directory B");
   const tpoA=await createPrincipal(db,collegeA,["TPO"]);
   const tpoB=await createPrincipal(db,collegeB,["TPO"]);
   const a=await createPlacementFixture(db,collegeA,tpoA);
   const b=await createPlacementFixture(db,collegeB,tpoB);
   const farFuture="2099-01-01T00:00:00.000Z";
   // Both direct FKs can be valid even though the foreign job's college
   // contradicts the company relationship's college.
   await db.query(`update placement_jobs
     set company_relationship_id=$1, updated_at=$2::timestamptz
     where id=$3`,[a.relationshipId,farFuture,b.jobId]);

   const [naive]=await db.query<{n:number;latest:Date}>(`
     select count(j.id)::int n,max(j.updated_at) as latest
     from placement_company_relationships cr
     join placement_jobs j on j.company_relationship_id=cr.id
     where cr.id=$1`,[a.relationshipId]);
   expect(naive?.n).toBe(2);
   expect(new Date(naive!.latest).toISOString()).toBe(farFuture);

   const [scoped]=await db.query<{n:number;latest:Date}>(`
     select count(j.id)::int n,max(j.updated_at) as latest
     from placement_company_relationships cr
     join placement_jobs j on j.company_relationship_id=cr.id
       and j.college_id=cr.college_id
     where cr.id=$1`,[a.relationshipId]);
   expect(scoped?.n).toBe(1);
   expect(new Date(scoped!.latest).toISOString()).not.toBe(farFuture);

   const [other]=await db.query<{n:number}>(`
     select count(j.id)::int n from placement_jobs j
     where j.college_id=$1`,[collegeB.collegeId]);
   expect(other?.n).toBe(1);
  });
 });
});
