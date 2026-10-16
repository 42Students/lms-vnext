import {randomUUID} from "node:crypto";
import {Pool} from "pg";
import {afterAll,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {getTpoDriveLifecycleList} from "@/modules/placements/tpo-drive-lifecycle-list-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";

const enabled=process.env.DB12_ISOLATED_TEST_DATABASE==="1" &&
  !!process.env.TEST_DATABASE_URL &&
  process.env.TEST_DATABASE_URL===process.env.DATABASE_URL;
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:2}):null;
const tpo:RequestContext={
  user:{id:SEED_IDS.facultyUser,identityUid:"seed-tpo",
    platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"]},
};
const fixture={company:randomUUID(),relationship:randomUUID(),request:randomUUID(),
  submission:randomUUID()};
async function cleanup(){
  if(!pool)return;
  await pool.query("DELETE FROM placement_recruiter_drive_requests WHERE id=$1",[fixture.request]);
  await pool.query("DELETE FROM placement_company_relationships WHERE id=$1",[fixture.relationship]);
  await pool.query("DELETE FROM placement_companies WHERE id=$1",[fixture.company]);
}
describe.skipIf(!enabled)("TPO-drives-02 TPO-requests-verification-33 on registered 0101 PostgreSQL",()=>{
  afterAll(async()=>{await cleanup();await pool?.end();await closeDatabaseConnection();});
  it("lists only current-college recruiter approval requests and never treats drafts as requests",async()=>{
    if(!pool)throw new Error("Disposable PostgreSQL required");
    await pool.query(
      "INSERT INTO placement_companies(id,name,created_by_user_id) VALUES($1,$2,$3)",
      [fixture.company,"Request Company "+fixture.company,SEED_IDS.facultyUser],
    );
    await pool.query(
      "INSERT INTO placement_company_relationships(id,college_id,company_id,created_by_user_id) VALUES($1,$2,$3,$4)",
      [fixture.relationship,SEED_IDS.collegeA,fixture.company,SEED_IDS.facultyUser],
    );
    await pool.query(
      "INSERT INTO placement_recruiter_drive_requests(id,college_id,company_relationship_id,recruiter_user_id,submission_id,status,draft) VALUES($1,$2,$3,$4,$5,'REQUEST',$6::jsonb)",
      [fixture.request,SEED_IDS.collegeA,fixture.relationship,SEED_IDS.facultyUser,
        fixture.submission,JSON.stringify({title:"Candidate Hiring Request"})],
    );
    const list=await getTpoDriveLifecycleList(tpo,{view:"REQUESTS",search:"Candidate Hiring"});
    expect(list.requestsAvailable).toBe(true);
    expect(list.requestRows).toEqual(expect.arrayContaining([
      expect.objectContaining({id:fixture.request,status:"REQUEST",title:"Candidate Hiring Request"}),
    ]));
    const other=await getTpoDriveLifecycleList({
      ...tpo,membership:{...tpo.membership!,collegeId:SEED_IDS.collegeB},
    },{view:"REQUESTS"});
    expect(other.requestRows.some(row=>row.id===fixture.request)).toBe(false);
    await pool.query(
      "UPDATE placement_recruiter_drive_requests SET status='DRAFT' WHERE id=$1",
      [fixture.request],
    );
    const draft=await getTpoDriveLifecycleList(tpo,{view:"REQUESTS"});
    expect(draft.requestRows.some(row=>row.id===fixture.request)).toBe(false);
  });
});