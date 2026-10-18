import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Pool, QueryResultRow } from "pg";
import {
  createPlacementCandidateFixture, createPlacementFixture, createRecruiterFixture, createPrincipal,
  createTenant, newHarnessPool, withProjectPg,
  type PgHarness,
} from "./support/projects-placements-pg-harness";

let pool: Pool;
beforeAll(() => { pool = newHarnessPool(); });
afterAll(async () => { if (pool) await pool.end(); });

async function withPlacementCase(fn: (f: {
  db: PgHarness;
  tenant: Awaited<ReturnType<typeof createTenant>>;
  outsiderTenant: Awaited<ReturnType<typeof createTenant>>;
  actor: Awaited<ReturnType<typeof createPrincipal>>;
  learner: Awaited<ReturnType<typeof createPrincipal>>;
  outsider: Awaited<ReturnType<typeof createPrincipal>>;
  drive: Awaited<ReturnType<typeof createPlacementFixture>>;
  candidate: Awaited<ReturnType<typeof createPlacementCandidateFixture>>;
}) => Promise<void>) {
  await withProjectPg(pool, async db => {
    const tenant = await createTenant(db, "IIT Dharwad placement");
    const outsiderTenant = await createTenant(db, "Other college placement");
    const actor = await createPrincipal(db,tenant,["TPO"]);
    const learner = await createPrincipal(db,tenant,["LEARNER"]);
    const outsider = await createPrincipal(db,outsiderTenant,["LEARNER"]);
    const drive = await createPlacementFixture(db,tenant,actor);
    const candidate = await createPlacementCandidateFixture(db,drive,learner,actor);
    await fn({db,tenant,outsiderTenant,actor,learner,outsider,drive,candidate});
  });
}

describe("PROJ-HARNESS-PLACEMENTS canonical real PostgreSQL fixtures", () => {
  it("PROJ-HARNESS-PLACEMENTS-01 constructs season → drive → round → application → offer in the correct college",async()=>{
    await withPlacementCase(async({db,tenant,learner,drive,candidate})=>{
      const chain=await db.query<{college_id:string,season_id:string,member_college:string,offer_id:string}>(`
        select j.college_id,j.season_id,m.college_id as member_college,o.id as offer_id
        from placement_jobs j
        join placement_applications a on a.job_id=j.id
        join college_memberships m on m.id=a.membership_id
        join placement_offers o on o.application_id=a.id
        where j.id=$1 and a.id=$2`,[drive.jobId,candidate.applicationId]);
      expect(chain).toHaveLength(1);
      expect(chain[0]).toMatchObject({college_id:tenant.collegeId,season_id:drive.seasonId,
        member_college:learner.collegeId,offer_id:candidate.offerId});
    });
  });
  it("PROJ-HARNESS-PLACEMENTS-25 fixture season dates are valid and encompass the job deadline",async()=>{
    await withPlacementCase(async({db,drive})=>{
      const dates=await db.query<{valid:boolean;deadline_in_season:boolean}>(`
        select s.end_date >= s.start_date as valid,
          j.application_deadline::date between s.start_date and s.end_date as deadline_in_season
        from placement_jobs j join placement_seasons s on s.id=j.season_id
        where j.id=$1`,[drive.jobId]);
      expect(dates).toEqual([{valid:true,deadline_in_season:true}]);
    });
  });
  it("PROJ-HARNESS-PLACEMENTS-02 season prevents second active season in same college",async()=>{
    await withPlacementCase(async({db,tenant,actor})=>{
      await db.expectSqlState(()=>db.query(`
        insert into placement_seasons(college_id,name,code,start_date,end_date,created_by_user_id)
        values ($1,'Concurrent season','ALTERNATE','2098-10-01','2099-06-30',$2)`,
        [tenant.collegeId,actor.userId]),"23505");
    });
  });
  it("PROJ-HARNESS-PLACEMENTS-02B can add a second drive under the same active season",async()=>{
    await withPlacementCase(async({db,tenant,actor,drive})=>{
      const second=await createPlacementFixture(db,tenant,actor);
      expect(second.jobId).not.toBe(drive.jobId);
      expect(second.seasonId).toBe(drive.seasonId);
      const rows=await db.query<{n:number}>(`
        select count(*)::int n from placement_seasons
        where college_id=$1 and status='ACTIVE'`,[tenant.collegeId]);
      expect(rows[0]?.n).toBe(1);
    });
  });
  it("PROJ-HARNESS-RECRUITER-22 company-bound verified recruiter grant is not a college membership",async()=>{
    await withPlacementCase(async({db,actor,drive,tenant})=>{
      const recruiter=await createRecruiterFixture(db,drive,actor);
      const rows=await db.query<{
        status:string;verification_status:string;company_id:string;college_id:string;
        valid:boolean;membership_count:number;
      }>(`
        select grant.status,grant.verification_status,profile.company_id,
          rel.college_id,grant.valid_until>now() as valid,
          (select count(*)::int from college_memberships cm where cm.user_id=profile.user_id)
            as membership_count
        from placement_recruiter_college_grants grant
        join placement_recruiter_profiles profile on profile.user_id=grant.recruiter_user_id
        join placement_company_relationships rel on rel.id=grant.company_relationship_id
        where grant.id=$1`,[recruiter.grantId]);
      expect(rows).toMatchObject([{
        status:"ACTIVE",verification_status:"VERIFIED",
        company_id:drive.companyId,college_id:tenant.collegeId,
        valid:true,membership_count:0,
      }]);
    });
  });
  it("PROJ-HARNESS-RECRUITER-25 duplicate active grant rejected, revoked grant can be reissued",async()=>{
    await withPlacementCase(async({db,drive,actor})=>{
      const recruiter=await createRecruiterFixture(db,drive,actor);
      await db.expectSqlState(()=>db.query(`
        insert into placement_recruiter_college_grants
          (recruiter_user_id,company_relationship_id,granted_by_user_id,valid_until,
           verification_status,capabilities)
        values ($1,$2,$3,'2099-12-31T23:59:00Z','VERIFIED',ARRAY['DRIVES']::text[])`,
        [recruiter.userId,drive.relationshipId,actor.userId]),"23505");
      await db.query(`
        update placement_recruiter_college_grants
          set status='REVOKED',revoked_by_user_id=$2,revoked_at=now()
        where id=$1`,[recruiter.grantId,actor.userId]);
      const newGrant=await db.query<{id:string}>(`
        insert into placement_recruiter_college_grants
          (recruiter_user_id,company_relationship_id,granted_by_user_id,valid_until,
           verification_status,capabilities)
        values ($1,$2,$3,'2099-12-31T23:59:00Z','VERIFIED',ARRAY['DRIVES']::text[])
        returning id`,[recruiter.userId,drive.relationshipId,actor.userId]);
      expect(newGrant).toHaveLength(1);
      const active=await db.query<{n:number}>(`
        select count(*)::int n from placement_recruiter_college_grants
        where recruiter_user_id=$1 and status='ACTIVE'`,[recruiter.userId]);
      expect(active[0]?.n).toBe(1);
    });
  });

  it("PROJ-HARNESS-RECRUITER-26 grant capability, verification and expiry constraints fail closed",async()=>{
    await withPlacementCase(async({db,drive,actor})=>{
      const recruiter=await createRecruiterFixture(db,drive,actor);
      for(const [query,values] of [
        ["update placement_recruiter_college_grants set capabilities=ARRAY['SUPER_ADMIN']::text[] where id=$1",
          [recruiter.grantId]],
        ["update placement_recruiter_college_grants set verification_status='UNREVIEWED' where id=$1",
          [recruiter.grantId]],
        ["update placement_recruiter_college_grants set valid_until=created_at-interval '1 minute' where id=$1",
          [recruiter.grantId]],
      ] as const) await db.expectSqlState(()=>db.query(query,[...values]),"23514");
      const rows=await db.query<{status:string;verification_status:string}>(`
        select status,verification_status from placement_recruiter_college_grants
        where id=$1`,[recruiter.grantId]);
      expect(rows).toEqual([{status:"ACTIVE",verification_status:"VERIFIED"}]);
    });
  });

  it("PROJ-HARNESS-PLACEMENTS-26 failed offer insert rolls back application, screening and round",async()=>{
    await withPlacementCase(async({db,drive,actor})=>{
      const fresh=await createPrincipal(db,{organizationId:"",collegeId:actor.collegeId!},["LEARNER"]);
      const broken:PgHarness={...db,
        async query<T extends QueryResultRow=QueryResultRow>(sql:string,values?:unknown[]):Promise<T[]> {
          if(sql.includes("insert into placement_offers")) throw new Error("simulated offer failure");
          return db.query<T>(sql,values);
        },
      };
      await expect(createPlacementCandidateFixture(broken,drive,fresh,actor))
        .rejects.toThrow("simulated offer failure");
      for(const table of ["placement_applications","placement_application_screenings","placement_round_results","placement_offers"]) {
        const rows=await db.query<{n:number}>(`
          select count(*)::int n from ${table} where
          ${table==="placement_applications" ? "membership_id=$1" :
            table==="placement_application_screenings" ? "application_id in (select id from placement_applications where membership_id=$1)" :
            table==="placement_round_results" ? "application_id in (select id from placement_applications where membership_id=$1)" :
            "application_id in (select id from placement_applications where membership_id=$1)"}`,[fresh.membershipId]);
        expect(rows[0]?.n,table).toBe(0);
      }
      await expect(createPlacementCandidateFixture(db,drive,fresh,actor))
        .resolves.toHaveProperty("offerId");
    });
  });

  it("PROJ-HARNESS-RECRUITER-24 a grant failure leaves no orphaned user or company profile",async()=>{
    await withPlacementCase(async({db,actor,drive})=>{
      const before=await db.query<{n:number}>(`
        select count(*)::int n from placement_recruiter_profiles`);
      const failed:PgHarness={...db,
        async query<T extends QueryResultRow=QueryResultRow>(sql:string,values?:unknown[]):Promise<T[]>{
          if(sql.includes("insert into placement_recruiter_college_grants"))
            throw new Error("simulated grant constraint failure");
          return db.query<T>(sql,values);
        },
      };
      await expect(createRecruiterFixture(failed,drive,actor))
        .rejects.toThrow(/simulated grant constraint failure/);
      const after=await db.query<{n:number}>(`
        select count(*)::int n from placement_recruiter_profiles`);
      expect(after[0]?.n).toBe(before[0]?.n);
      await expect(createRecruiterFixture(db,drive,actor)).resolves.toHaveProperty("grantId");
    });
  });

  it("PROJ-HARNESS-RECRUITER-23 wrong-college coordinator cannot issue an HR grant",async()=>{
    await withPlacementCase(async({db,outsiderTenant,drive})=>{
      const foreignAdmin=await createPrincipal(db,outsiderTenant,["COLLEGE_ADMIN"]);
      const before=await db.query<{n:number}>(`
        select count(*)::int n from placement_recruiter_college_grants`);
      await expect(createRecruiterFixture(db,drive,foreignAdmin))
        .rejects.toThrow(/actor role or college|active member/);
      const after=await db.query<{n:number}>(`
        select count(*)::int n from placement_recruiter_college_grants`);
      expect(after[0]?.n).toBe(before[0]?.n);
    });
  });

  it("PROJ-HARNESS-PLACEMENTS-03 application and screening enforce one candidate per drive and decision shape",async()=>{
    await withPlacementCase(async({db,learner,drive,candidate})=>{
      await db.expectSqlState(()=>db.query(`
        insert into placement_applications
        (job_id,role_option_id,membership_id,channel,eligibility_status,eligibility_snapshot,submitted_by_user_id)
        values ($1,$2,$3,'INTERNAL','ELIGIBLE','{}'::jsonb,$4)`,
        [drive.jobId,drive.roleOptionId,learner.membershipId,learner.userId]),"23505");
      await db.expectSqlState(()=>db.query(`
        update placement_application_screenings set status='HOLD' where application_id=$1`,
        [candidate.applicationId]),"23514");
      const rows=await db.query<{status:string}>(`
        select status from placement_application_screenings where application_id=$1`,[candidate.applicationId]);
      expect(rows[0]?.status).toBe("PENDING");
    });
  });
  it("PROJ-HARNESS-PLACEMENTS-04 round result enforces current version and waitlist rank",async()=>{
    await withPlacementCase(async({db,actor,drive,candidate})=>{
      await db.expectSqlState(()=>db.query(`
        insert into placement_round_results
        (round_id,application_id,version,outcome,submitted_by_user_id)
        values ($1,$2,2,'HOLD',$3)`,[drive.roundId,candidate.applicationId,actor.userId]),"23514");
      await db.expectSqlState(()=>db.query(`
        insert into placement_round_results
        (round_id,application_id,version,outcome,submitted_by_user_id)
        values ($1,$2,2,'PASS',$3)`,[drive.roundId,candidate.applicationId,actor.userId]),"23505");
      expect((await db.query("select id from placement_round_results where id=$1",
        [candidate.roundResultId]))).toHaveLength(1);
    });
  });
  it("PROJ-HARNESS-PLACEMENTS-05 offer accepts no duplicate active version and rejects false acceptance",async()=>{
    await withPlacementCase(async({db,actor,candidate})=>{
      await db.expectSqlState(()=>db.query(`
        insert into placement_offers (application_id,version,role_title,issued_by_user_id)
        values ($1,2,'Duplicated offer',$2)`,[candidate.applicationId,actor.userId]),"23505");
      await db.expectSqlState(()=>db.query(`
        update placement_offers set status='ACCEPTED' where id=$1`,[candidate.offerId]),"23514");
      await db.expectSqlState(()=>db.query(`
        update placement_offers set expires_at=issued_at-interval '1 second' where id=$1`,
        [candidate.offerId]),"23514");
    });
  });
  it("PROJ-HARNESS-PLACEMENTS-06 joining outcome requires recorded actor and date",async()=>{
    await withPlacementCase(async({db,candidate})=>{
      await db.expectSqlState(()=>db.query(`
        update placement_joining_outcomes set status='JOINED' where offer_id=$1`,[candidate.offerId]),"23514");
      const status=await db.query<{status:string}>(`
        select status from placement_joining_outcomes where offer_id=$1`,[candidate.offerId]);
      expect(status[0]?.status).toBe("PENDING");
    });
  });
  it("PROJ-HARNESS-PLACEMENTS-07 prevents hard deleting a drive with applications and rounds",async()=>{
    await withPlacementCase(async({db,drive,candidate})=>{
      await db.expectSqlState(()=>db.query("delete from placement_jobs where id=$1",[drive.jobId]),"23503");
      expect((await db.query("select id from placement_applications where id=$1",
        [candidate.applicationId]))).toHaveLength(1);
    });
  });
  it("PROJ-HARNESS-PLACEMENTS-08 fixture refuses other-college applicant before any write",async()=>{
    await withPlacementCase(async({db,outsider,drive,actor})=>{
      const before=await db.query<{n:number}>(`
        select count(*)::int n from placement_applications where job_id=$1`,[drive.jobId]);
      await expect(createPlacementCandidateFixture(db,drive,outsider,actor))
        .rejects.toThrow(/college/);
      const after=await db.query<{n:number}>(`
        select count(*)::int n from placement_applications where job_id=$1`,[drive.jobId]);
      expect(after[0]?.n).toBe(before[0]?.n);
    });
  });
  it("PROJ-HARNESS-PLACEMENTS-12 rejects a forged round from another drive before inserting applications",async()=>{
    await withPlacementCase(async({db,tenant,actor,learner,drive})=>{
      const secondDrive=await createPlacementFixture(db,tenant,actor);
      const countBefore=await db.query<{count:number}>(`
        select count(*)::int as count from placement_applications where job_id=$1`,[drive.jobId]);
      await expect(createPlacementCandidateFixture(db,{
        ...drive,roundId:secondDrive.roundId,
      },learner,actor)).rejects.toThrow(/round does not belong to this drive/);
      const countAfter=await db.query<{count:number}>(`
        select count(*)::int as count from placement_applications where job_id=$1`,[drive.jobId]);
      expect(countAfter[0]?.count).toBe(countBefore[0]?.count);
    });
  });

  it("PROJ-HARNESS-PLACEMENTS-13 closed, draft or expired drive rejects new applications",async()=>{
    await withPlacementCase(async({db,learner,actor,drive})=>{
      const initial=await db.query<{count:number}>(`
        select count(*)::int as count from placement_applications where job_id=$1`,[drive.jobId]);
      const before=initial[0]!.count;
      await db.query("update placement_jobs set status='DRAFT',published_at=null where id=$1",
        [drive.jobId]);
      await expect(createPlacementCandidateFixture(db,drive,learner,actor))
        .rejects.toThrow(/drive is not open for applications/);
      await db.query("update placement_jobs set status='PUBLISHED',published_at=now() where id=$1",
        [drive.jobId]);
      await db.query("update placement_jobs set status='CLOSED',closed_at=now() where id=$1",
        [drive.jobId]);
      await expect(createPlacementCandidateFixture(db,drive,learner,actor))
        .rejects.toThrow(/drive is not open for applications/);
      await db.query("update placement_jobs set status='PUBLISHED',closed_at=null,application_deadline='2020-01-01T00:00:00Z' where id=$1",
        [drive.jobId]);
      await expect(createPlacementCandidateFixture(db,drive,learner,actor))
        .rejects.toThrow(/drive is not open for applications/);
      const after=await db.query<{count:number}>(`
        select count(*)::int as count from placement_applications where job_id=$1`,[drive.jobId]);
      expect(after[0]?.count).toBe(before);
    });
  });

  it("PROJ-HARNESS-PLACEMENTS-14 published fixture has future deadline and real compensation",async()=>{
    await withPlacementCase(async({db,drive})=>{
      const rows=await db.query<{status:string;has_future_deadline:boolean;minimum_annual_ctc_inr:number;published_at:Date|null}>(`
        select status,application_deadline>now() as has_future_deadline,
          minimum_annual_ctc_inr,published_at from placement_jobs where id=$1`,
        [drive.jobId]);
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({status:"PUBLISHED",has_future_deadline:true,minimum_annual_ctc_inr:800000});
      expect(rows[0]!.published_at).not.toBeNull();
    });
  });

  it("PROJ-HARNESS-PLACEMENTS-19 PostgreSQL forbids mismatched job and role option even via direct SQL",async()=>{
    await withPlacementCase(async({db,tenant,actor,learner,drive})=>{
      const other=await createPlacementFixture(db,tenant,actor);
      await db.expectSqlState(()=>db.query(`
        insert into placement_applications
          (job_id,role_option_id,membership_id,channel,eligibility_status,eligibility_snapshot,submitted_by_user_id)
        values ($1,$2,$3,'INTERNAL','ELIGIBLE','{}'::jsonb,$4)`,
        [drive.jobId,other.roleOptionId,learner.membershipId,learner.userId]),"23503");
      const rows=await db.query<{n:number}>(`
        select count(*)::int n from placement_applications
        where job_id=$1 and role_option_id=$2`,[drive.jobId,other.roleOptionId]);
      expect(rows[0]?.n).toBe(0);
    });
  });

  it("PROJ-HARNESS-PLACEMENTS-15 candidate belongs to an active role option of exactly this drive",async()=>{
    await withPlacementCase(async({db,tenant,actor,learner,drive,candidate})=>{
      const rows=await db.query<{role_option_id:string;job_id:string;status:string}>(`
        select a.role_option_id,role.job_id,role.status
          from placement_applications a
          join placement_job_role_options role on role.id=a.role_option_id
         where a.id=$1`,[candidate.applicationId]);
      expect(rows).toEqual([{role_option_id:drive.roleOptionId,job_id:drive.jobId,status:"ACTIVE"}]);
      const another=await createPlacementFixture(db,tenant,actor);
      const before=await db.query<{n:number}>(`
        select count(*)::int n from placement_applications where job_id=$1`,[drive.jobId]);
      await expect(createPlacementCandidateFixture(db,{...drive,roleOptionId:another.roleOptionId},learner,actor))
        .rejects.toThrow(/role option is not active on this drive/);
      const after=await db.query<{n:number}>(`
        select count(*)::int n from placement_applications where job_id=$1`,[drive.jobId]);
      expect(after[0]?.n).toBe(before[0]?.n);
    });
  });
  it("PROJ-HARNESS-PLACEMENTS-18 a cancelled round cannot receive candidate results",async()=>{
    await withPlacementCase(async({db,drive,actor,learner})=>{
      const before=await db.query<{n:number}>(`
        select count(*)::int n from placement_round_results where round_id=$1`,[drive.roundId]);
      await db.query(`
        update placement_job_rounds set status='CANCELLED',cancelled_at=now() where id=$1`,
        [drive.roundId]);
      await expect(createPlacementCandidateFixture(db,drive,learner,actor))
        .rejects.toThrow(/cancelled round cannot accept candidate results/);
      const after=await db.query<{n:number}>(`
        select count(*)::int n from placement_round_results where round_id=$1`,[drive.roundId]);
      expect(after[0]?.n).toBe(before[0]?.n);
    });
  });

  it("PROJ-HARNESS-PLACEMENTS-17 closed season cannot accept a candidate even with a published job",async()=>{
    await withPlacementCase(async({db,drive,actor,learner})=>{
      const before=await db.query<{n:number}>(`
        select count(*)::int n from placement_applications where job_id=$1`,[drive.jobId]);
      await db.query(`
        update placement_seasons set status='CLOSED',closed_by_user_id=$2,closed_at=now()
        where id=$1`,[drive.seasonId,actor.userId]);
      await expect(createPlacementCandidateFixture(db,drive,learner,actor))
        .rejects.toThrow(/drive is not open for applications/);
      const after=await db.query<{n:number}>(`
        select count(*)::int n from placement_applications where job_id=$1`,[drive.jobId]);
      expect(after[0]?.n).toBe(before[0]?.n);
    });
  });

  it("PROJ-HARNESS-PLACEMENTS-16 archived role option cannot be used by a stale draft",async()=>{
    await withPlacementCase(async({db,drive,actor,learner})=>{
      await db.query("update placement_job_role_options set status='ARCHIVED',archived_at=now() where id=$1",
        [drive.roleOptionId]);
      await expect(createPlacementCandidateFixture(db,drive,learner,actor))
        .rejects.toThrow(/role option is not active on this drive/);
    });
  });

  it("PROJ-HARNESS-PLACEMENTS-09 suspended learner cannot be added from a stale fixture object",async()=>{
    await withPlacementCase(async({db,learner,actor,drive})=>{
      const before=await db.query<{count:number}>(`
        select count(*)::int as count from placement_applications where job_id=$1`,[drive.jobId]);
      await db.query("update college_memberships set status='SUSPENDED' where id=$1",[learner.membershipId]);
      await expect(createPlacementCandidateFixture(db,drive,learner,actor))
        .rejects.toThrow(/not an active member in the required role/);
      const after=await db.query<{count:number}>(`
        select count(*)::int as count from placement_applications where job_id=$1`,[drive.jobId]);
      expect(after[0]?.count).toBe(before[0]?.count);
    });
  });

  it("PROJ-HARNESS-PLACEMENTS-10 coordinator without a current TPO role cannot issue an offer fixture",async()=>{
    await withPlacementCase(async({db,learner,actor,drive})=>{
      const before=await db.query<{count:number}>(`
        select count(*)::int as count from placement_offers`);
      await db.query("delete from membership_roles where membership_id=$1 and role='TPO'",[actor.membershipId]);
      await expect(createPlacementCandidateFixture(db,drive,learner,actor))
        .rejects.toThrow(/not an active member in the required role/);
      const after=await db.query<{count:number}>(`
        select count(*)::int as count from placement_offers`);
      expect(after[0]?.count).toBe(before[0]?.count);
    });
  });

  it("PROJ-HARNESS-PLACEMENTS-11 disabled TPO account cannot create application or offer rows",async()=>{
    await withPlacementCase(async({db,learner,actor,drive})=>{
      const before=await db.query<{count:number}>(`
        select count(*)::int as count from placement_round_results where round_id=$1`,[drive.roundId]);
      await db.query("update users set platform_status='DISABLED' where id=$1",[actor.userId]);
      await expect(createPlacementCandidateFixture(db,drive,learner,actor))
        .rejects.toThrow(/not an active member in the required role/);
      const after=await db.query<{count:number}>(`
        select count(*)::int as count from placement_round_results where round_id=$1`,[drive.roundId]);
      expect(after[0]?.count).toBe(before[0]?.count);
    });
  });

});
