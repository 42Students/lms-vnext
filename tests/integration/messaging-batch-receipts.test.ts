import {randomUUID} from "node:crypto";
import {afterAll,describe,it,expect} from "vitest";
import {Pool} from "pg";
import {SEED_IDS} from "../../scripts/db-seed-data";
if(!process.env.TEST_DATABASE_URL)throw new Error("Messaging PG tests require disposable TEST_DATABASE_URL");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
const batchId=randomUUID(),receiptId=randomUUID();
afterAll(async()=>{
 try{await pool.query("delete from messaging_delivery_receipts where id=$1::uuid",[receiptId]).catch(()=>{});
 await pool.query("delete from messaging_delivery_batches where id=$1::uuid",[batchId]).catch(()=>{});}
 finally{await pool.end();}
});
describe.skipIf(process.env.DB10_MESSAGING_BATCHES_READY!=="VERIFIED")("messaging staged receipt persistence",()=>{
 it("persists opaque suppressed recipients and rejects plaintext leakage",async()=>{
  await pool.query(`insert into messaging_delivery_batches (id,organization_id,college_id,actor_user_id,purpose,total,suppressed)
   values ($1::uuid,$2::uuid,$3::uuid,$4::uuid,'campaign',1,1)`,[
   batchId,SEED_IDS.organization,SEED_IDS.collegeA,SEED_IDS.collegeAdminUser
  ]);
  await pool.query(`insert into messaging_delivery_receipts
   (id,batch_id,recipient_key,channel,template_key,purpose,status,reason)
   values($1::uuid,$2::uuid,$3::varchar,'EMAIL','campaign','campaign','SUPPRESSED','nonprod-not-allowlisted')`,[
   receiptId,batchId,"a".repeat(64)
  ]);
  let result=await pool.query<{recipient_key:string;reason:string}>(`select recipient_key,reason from messaging_delivery_receipts where id=$1::uuid`,[receiptId]);
  expect(result.rows[0]).toEqual({recipient_key:"a".repeat(64),reason:"nonprod-not-allowlisted"});
  await expect(pool.query(`insert into messaging_delivery_receipts
   (id,batch_id,recipient_key,channel,template_key,purpose,status)
   values($1::uuid,$2::uuid,$3::varchar,'EMAIL','campaign','campaign','SENT')`,
   [randomUUID(),batchId,"real@example.com"])).rejects.toThrow();
 });
});
