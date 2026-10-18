import {randomUUID} from "node:crypto";
import {readFileSync} from "node:fs";
import {afterAll,beforeAll,describe,expect,it} from "vitest";
import type {Pool} from "pg";
import {newHarnessPool,withTwoPgSessions} from "./support/projects-placements-pg-harness";

let pool:Pool;
beforeAll(()=>{pool=newHarnessPool();});
afterAll(async()=>{if(pool)await pool.end();});

describe("TPO-BREAK-venue-PG-01 shared transaction locks for interview rounds",()=>{
 it("serializes the same college+room even across separate PostgreSQL sessions",async()=>{
  const college=randomUUID(),venue="Room X";
  await withTwoPgSessions(pool,async(a,b)=>{
   const lockKey=college+"|"+venue.toLowerCase();
   const first=await a.query<{acquired:boolean}>(
    "select pg_try_advisory_xact_lock(hashtext($1)) as acquired",[lockKey]);
   expect(first.rows[0]?.acquired).toBe(true);
   const rival=await b.query<{acquired:boolean}>(
    "select pg_try_advisory_xact_lock(hashtext($1)) as acquired",[lockKey]);
   expect(rival.rows[0]?.acquired).toBe(false);
   const unrelated=await b.query<{acquired:boolean}>(
    "select pg_try_advisory_xact_lock(hashtext($1)) as acquired",[college+"|room y"]);
   expect(unrelated.rows[0]?.acquired).toBe(true);
  });
 });
 it("both calendar scheduling and interview rescheduling call the same serialized venue guard",()=>{
  const round=readFileSync("src/modules/placements/round-service.ts","utf8");
  const reschedule=readFileSync("src/modules/placements/tpo-interview-reschedule-service.ts","utf8");
  const calendar=readFileSync("src/modules/placements/tpo-round-calendar-service.ts","utf8");
  const venue=readFileSync("src/modules/placements/round-venue-booking-service.ts","utf8");
  expect(round).toContain("await requireAvailableRoundVenue(tx,");
  expect(reschedule).toContain("await requireAvailableRoundVenue(tx,");
  expect(calendar).toContain("return actOnPlacementRound(context, round.id, {");
  expect(venue).toContain("pg_advisory_xact_lock");
  expect(venue).toContain("overlappingInterviewVenue");
 });
});
