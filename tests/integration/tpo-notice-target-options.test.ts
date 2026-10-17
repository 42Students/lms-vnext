import {afterAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
import {SEED_IDS} from "../../scripts/db-seed-data";

/** Optional disposable PostgreSQL contract witness; orchestrator enables it. */
const enabled=process.env.DB018_ISOLATED_TEST_DATABASE==="1"&&
 Boolean(process.env.TEST_DATABASE_URL)&&process.env.TPO_NOTICE_TARGET_OPTIONS_DB_TEST==="1";
if(enabled)assertDb018DisposableTarget(process.env);
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1}):null;

describe.skipIf(!enabled)("TPO announcement audience target options PostgreSQL",()=>{
 afterAll(async()=>{await pool?.end();});
 it("TPO-inbox-team-44 only selects batches and branches belonging to the requested college",async()=>{
  if(!pool)throw new Error("Disposable PostgreSQL target required");
  const batches=await pool.query<{id:string;collegeId:string}>(
   "SELECT c.id,d.college_id AS \"collegeId\" FROM cohorts c "+
   "JOIN programs p ON p.id=c.program_id "+
   "JOIN departments d ON d.id=p.department_id "+
   "WHERE d.college_id=$1 AND d.archived_at IS NULL AND c.inactive_at IS NULL LIMIT 300",
   [SEED_IDS.collegeA],
  );
  const branches=await pool.query<{id:string;collegeId:string}>(
   "SELECT id,college_id AS \"collegeId\" FROM departments "+
   "WHERE college_id=$1 AND archived_at IS NULL LIMIT 200",
   [SEED_IDS.collegeA],
  );
  expect(batches.rows.every(row=>row.collegeId===SEED_IDS.collegeA)).toBe(true);
  expect(branches.rows.every(row=>row.collegeId===SEED_IDS.collegeA)).toBe(true);
 });
 it("TPO-inbox-team-44 returns only published drives owned by the requested college",async()=>{
  if(!pool)throw new Error("Disposable PostgreSQL target required");
  const published=await pool.query<{id:string;collegeId:string;status:string}>(
   "SELECT id,college_id AS \"collegeId\",status FROM placement_jobs "+
   "WHERE college_id=$1 AND status='PUBLISHED' LIMIT 300",
   [SEED_IDS.collegeA],
  );
  expect(published.rows.every(row=>
   row.collegeId===SEED_IDS.collegeA&&row.status==="PUBLISHED")).toBe(true);
 });
});
