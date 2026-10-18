import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Pool } from "pg";
import {
  createPlacementCandidateFixture, createPlacementFixture,
  createPrincipal, createTenant, newHarnessPool, withProjectPg,
} from "./support/projects-placements-pg-harness";

let pool: Pool;
beforeAll(() => { pool = newHarnessPool(); });
afterAll(async () => { if (pool) await pool.end(); });

describe("SA-BOOKED-INTERVIEWS-04 registered PostgreSQL candidate/job isolation", () => {
  it("excludes a booked foreign applicant while retaining a valid same-college booking", async () => {
    await withProjectPg(pool, async db => {
      const collegeA=await createTenant(db, "Admin interview A");
      const collegeB=await createTenant(db, "Admin interview B");
      const coordinatorA=await createPrincipal(db,collegeA,["TPO"]);
      const coordinatorB=await createPrincipal(db,collegeB,["TPO"]);
      const learnerA=await createPrincipal(db,collegeA,["LEARNER"]);
      const learnerB=await createPrincipal(db,collegeB,["LEARNER"]);
      const driveA=await createPlacementFixture(db,collegeA,coordinatorA);
      const driveB=await createPlacementFixture(db,collegeB,coordinatorB);
      const candidateA=await createPlacementCandidateFixture(db,driveA,learnerA,coordinatorA);
      const candidateB=await createPlacementCandidateFixture(db,driveB,learnerB,coordinatorB);
      // Booking FK covers round+job, not application+job. A malformed
      // historical row must never appear in the Super Admin calendar.
      const [invalid]=await db.query<{id:string}>(`
        insert into placement_round_candidate_slots
          (job_id,round_id,application_id,starts_at,ends_at,room,panel,status,changed_by_user_id)
        values ($1,$2,$3,'2026-10-20T10:00:00Z','2026-10-20T11:00:00Z','Room B1','Panel B','BOOKED',$4)
        returning id`,
        [driveB.jobId,driveB.roundId,candidateA.applicationId,coordinatorB.userId]);
      const [valid]=await db.query<{id:string}>(`
        insert into placement_round_candidate_slots
          (job_id,round_id,application_id,starts_at,ends_at,room,panel,status,changed_by_user_id)
        values ($1,$2,$3,'2026-10-20T12:00:00Z','2026-10-20T13:00:00Z','Room B2','Panel B','BOOKED',$4)
        returning id`,
        [driveB.jobId,driveB.roundId,candidateB.applicationId,coordinatorB.userId]);
      expect(invalid?.id).toBeTruthy();
      expect(valid?.id).toBeTruthy();

      const naive=await db.query<{id:string}>(`
        select s.id from placement_round_candidate_slots s
        join placement_jobs j on j.id=s.job_id
        left join placement_applications a on a.id=s.application_id and a.job_id=s.job_id
        where j.college_id=$1 and s.status='BOOKED'`,[collegeB.collegeId]);
      expect(naive).toHaveLength(2);

      // Mirrors the production service's inner candidate and selected-college
      // relationship predicates. A foreign row must not survive anonymously.
      const scoped=await db.query<{id:string;membership_id:string}>(`
        select s.id,m.id as membership_id
          from placement_round_candidate_slots s
          join placement_jobs j on j.id=s.job_id and j.college_id=$1
          join placement_job_rounds r on r.id=s.round_id and r.job_id=s.job_id
          join placement_company_relationships cr
            on cr.id=j.company_relationship_id and cr.college_id=$1
          join placement_applications a on a.id=s.application_id and a.job_id=s.job_id
          join college_memberships m on m.id=a.membership_id and m.college_id=$1
          join users u on u.id=m.user_id
         where s.status='BOOKED'`,[collegeB.collegeId]);
      expect(scoped).toEqual([{id:valid!.id,membership_id:learnerB.membershipId}]);
      expect(scoped.some(row=>row.id===invalid?.id)).toBe(false);
    });
  });
});
