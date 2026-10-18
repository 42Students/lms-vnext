import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {Pool,type PoolClient} from "pg";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";

const enabled=process.env.DB09_ISOLATED_TEST_DATABASE==="1"&&
 Boolean(process.env.TEST_DATABASE_URL);
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1}):null;

async function isolated<T>(action:(client:PoolClient,companyId:string)=>Promise<T>):Promise<T>{
 if(!pool)throw new Error("Disposable PostgreSQL required");
 const client=await pool.connect();
 await client.query("BEGIN");
 try{
  const company=await client.query<{id:string}>(
   "INSERT INTO placement_companies(name,created_by_user_id) VALUES($1,$2) RETURNING id",
   ["Team integration "+randomUUID(),SEED_IDS.facultyUser]);
  const companyId=company.rows[0]?.id;
  if(!companyId)throw new Error("Missing company fixture");
  await client.query(
   "INSERT INTO placement_company_relationships(college_id,company_id,created_by_user_id) VALUES($1,$2,$3)",
   [SEED_IDS.collegeA,companyId,SEED_IDS.facultyUser]);
  return await action(client,companyId);
 }finally{
  await client.query("ROLLBACK");
  client.release();
 }
}
async function rejected(client:PoolClient,query:string,values:unknown[],errorCode:string){
 await client.query("SAVEPOINT chat3_expected_error");
 try{
  await expect(client.query(query,values)).rejects.toMatchObject({code:errorCode});
 }finally{
  await client.query("ROLLBACK TO SAVEPOINT chat3_expected_error");
  await client.query("RELEASE SAVEPOINT chat3_expected_error");
 }
}

describe.skipIf(!enabled)("TPO-companies-05 registered 0137 company Team PostgreSQL",()=>{
 afterAll(async()=>{await pool?.end();});
 it("atomically deduplicates concurrent-style replay by college/company/author UUID",async()=>{
  await isolated(async(client,companyId)=>{
   const key=randomUUID();
   const insert=()=>{
    client.query<{id:string}>(`
     INSERT INTO placement_tpo_company_team_messages
      (college_id,company_id,author_membership_id,idempotency_key,body)
     VALUES($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING RETURNING id`,
     [SEED_IDS.collegeA,companyId,SEED_IDS.facultyCollegeAMembership,key,"One decision"]);
   const first=await insert();
   const retry=await insert();
   expect(first.rows).toHaveLength(1);
   expect(retry.rows).toHaveLength(0);
   const rows=await client.query<{n:number}>(
    `SELECT count(*)::integer AS n FROM placement_tpo_company_team_messages
     WHERE college_id=$1 AND company_id=$2 AND idempotency_key=$3`,
    [SEED_IDS.collegeA,companyId,key]);
   expect(rows.rows[0]?.n).toBe(1);
  });
 });
 it("rejects cross-college authors and followers through composite foreign keys",async()=>{
  await isolated(async(client,companyId)=>{
   await rejected(client,`
    INSERT INTO placement_tpo_company_team_messages
     (college_id,company_id,author_membership_id,body)
    VALUES($1,$2,$3,$4)`,
    [SEED_IDS.collegeA,companyId,SEED_IDS.facultyCollegeBMembership,"Foreign author"],"23503");
   await rejected(client,`
    INSERT INTO placement_tpo_company_team_follows
     (college_id,company_id,membership_id) VALUES($1,$2,$3)`,
    [SEED_IDS.collegeA,companyId,SEED_IDS.facultyCollegeBMembership],"23503");
  });
 });
 it("rejects empty messages and impossible Ask state before creating an activity-worthy row",async()=>{
  await isolated(async(client,companyId)=>{
   const values=[SEED_IDS.collegeA,companyId,SEED_IDS.facultyCollegeAMembership];
   await rejected(client,`
    INSERT INTO placement_tpo_company_team_messages
      (college_id,company_id,author_membership_id,body)
    VALUES($1,$2,$3,'   ')`,values,"23514");
   await rejected(client,`
    INSERT INTO placement_tpo_company_team_messages
      (college_id,company_id,author_membership_id,body,ask_status)
    VALUES($1,$2,$3,'Invalid Ask','OPEN')`,values,"23514");
   const count=await client.query<{n:number}>(
    "SELECT count(*)::integer AS n FROM placement_tpo_company_team_messages WHERE company_id=$1",
    [companyId]);
   expect(count.rows[0]?.n).toBe(0);
  });
 });
 it("follow insert is unique and delete leaves no retained follower within the transaction",async()=>{
  await isolated(async(client,companyId)=>{
   const vals=[SEED_IDS.collegeA,companyId,SEED_IDS.facultyCollegeAMembership];
   const query=`
    INSERT INTO placement_tpo_company_team_follows(college_id,company_id,membership_id)
    VALUES($1,$2,$3) ON CONFLICT DO NOTHING RETURNING membership_id`;
   expect((await client.query(query,vals)).rowCount).toBe(1);
   expect((await client.query(query,vals)).rowCount).toBe(0);
   expect((await client.query(
    "DELETE FROM placement_tpo_company_team_follows WHERE college_id=$1 AND company_id=$2 AND membership_id=$3 RETURNING membership_id",
    vals)).rowCount).toBe(1);
   expect((await client.query(
    "SELECT membership_id FROM placement_tpo_company_team_follows WHERE company_id=$1",
    [companyId])).rowCount).toBe(0);
  });
 });
});