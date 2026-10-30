import {randomBytes} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {drizzle} from "drizzle-orm/node-postgres";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";
import {persistVerifiedGlobalEmailSuppression} from "@/modules/operations/global-email-suppression-service";

const enabled=process.env.DB10_ISOLATED_TEST_DATABASE==="1"&&Boolean(process.env.TEST_DATABASE_URL);
if(enabled)assertDb018DisposableTarget({...process.env,DB018_ISOLATED_TEST_DATABASE:"1"});
const pool=enabled?new Pool({connectionString:process.env.TEST_DATABASE_URL,max:6}):null;
afterAll(async()=>{await pool?.end()});

describe.skipIf(!enabled)("DB050 durable global-email suppression concurrent receipt",()=>{
  it("coalesces simultaneous cross-organization opt-out/provider events to one active HMAC",async()=>{
    if(!pool)throw Error("Disposable PG required");
    const hash=randomBytes(32).toString("hex");
    const writer=drizzle(pool);
    try{
      // These simulated trusted, already-verified events share the same
      // canonical recipient identity but never expose a raw email address.
      await Promise.all(Array.from({length:6},(_,i)=>
        persistVerifiedGlobalEmailSuppression({
          recipientHash:hash,reason:i%2===0?"UNSUBSCRIBED":"BOUNCE",
        },writer)
      ));
      const state=await pool.query(
        "select reason from outbound_global_email_suppressions "+
        "where recipient_hash=$1 and cleared_at is null",[hash]);
      expect(state.rows).toHaveLength(1);
      expect(["UNSUBSCRIBED","BOUNCE"]).toContain(state.rows[0]?.reason);
    }finally{
      // The entire PostgreSQL test database is disposable. Remove only this
      // randomized synthetic fixture, never a shared or real recipient.
      await pool.query(
        "delete from outbound_global_email_suppressions where recipient_hash=$1",
        [hash]);
    }
  });
});
