import {afterAll,beforeAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {setTpoPublicPlacementPublication,PublicPlacementPublishError,
 registeredPublicPlacementCohort} from "@/modules/placements/public-page/publication-service";
import {getDb} from "@/db/client";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
const enabled=process.env.DB09_ISOLATED_TEST_DATABASE==="1"&&Boolean(process.env.TEST_DATABASE_URL);
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:2}):null;
const actor:RequestContext={
 user:{id:SEED_IDS.facultyUser,identityUid:"tpo-public-page-check",
   platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,
  organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["TPO"]},
};
const inserted:string[]=[];
describe.skipIf(!enabled)("TPO-campaigns-public-32 disposable database first publication",()=>{
 beforeAll(async()=>{
  if(!pool)throw new Error("Disposable database required");
  const result=await pool.query<{id:string}>(
    "INSERT INTO membership_roles(membership_id,role) VALUES($1,'TPO') ON CONFLICT DO NOTHING RETURNING id",
    [SEED_IDS.facultyCollegeAMembership]);
  if(result.rows[0]?.id)inserted.push(result.rows[0].id);
 });
 afterAll(async()=>{
  if(pool){
   for(const id of inserted)await pool.query("DELETE FROM membership_roles WHERE id=$1",[id]);
   await pool.end();
  }
  await closeDatabaseConnection();
 });
 it("derives cohort from registered consent, not browser-controlled totals",async()=>{
  const total=await registeredPublicPlacementCohort(getDb(),SEED_IDS.collegeA);
  expect(Number.isSafeInteger(total)).toBe(true);
  expect(total).toBeGreaterThanOrEqual(0);
  if(total<5){
   await expect(setTpoPublicPlacementPublication(actor,{enabled:true}))
    .rejects.toBeInstanceOf(PublicPlacementPublishError);
  }
  await expect(setTpoPublicPlacementPublication(actor,{
   enabled:true,populationCount:999999,
  })).rejects.toBeDefined();
 });
 it("refuses a foreign college membership identity",async()=>{
  const wrong:RequestContext={...actor,membership:{...actor.membership!,
   collegeId:SEED_IDS.collegeB}};
  await expect(setTpoPublicPlacementPublication(wrong,{enabled:true}))
   .rejects.toBeDefined();
 });
});
