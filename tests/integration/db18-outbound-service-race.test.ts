import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Pool } from "pg";
import { getDb, closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
import {
  queueOutboundDeliveryInTransaction,
  claimOutboundDispatchBatch,
} from "@/modules/operations/outbound-delivery-queue";
import {
  dispatchClaimedOutbound,
} from "@/modules/operations/outbound-dispatch-runner";
import {
  deriveGlobalEmailSuppressionHashForAddress,
} from "@/modules/operations/outbound-delivery-envelope";

/**
 * DB018 P5-R09/P5-R21: true encrypted business-queue producer + registered
 * fenced PG17 worker/consumer integration. The test provider is a fake:
 * never send email, invite links or tokens over the network from CI.
 * This proves application ordering only, not real provider authorization.
 */
const enabled = process.env["DB018_ISOLATED_TEST_DATABASE"] === "1" &&
  Boolean(process.env["TEST_DATABASE_URL"]) &&
  process.env["DATABASE_URL"] === process.env["TEST_DATABASE_URL"];
const pool = enabled ? new Pool({
  connectionString: process.env["TEST_DATABASE_URL"], max: 4,
}) : null;
const encryptionKey = Buffer.alloc(32, 77).toString("base64");
const globalKey = Buffer.alloc(32, 78).toString("base64");
const flags = {
  DB10_OUTBOUND_READY:"DB10_VERIFIED",
  DB10_OUTBOUND_DISPATCH_READY:"DB10_VERIFIED",
  DB10_EMAIL_SENDER_VERIFIED:"DB10_VERIFIED",
  DB10_GLOBAL_SUPPRESSION_VERIFIED:"DB10_VERIFIED",
  DB10_OUTBOUND_ENCRYPTION_KEY_BASE64:encryptionKey,
  DB10_GLOBAL_EMAIL_HMAC_KEY_BASE64:globalKey,
};
const saved = Object.fromEntries(
  Object.keys(flags).map(key => [key, process.env[key]]),
);
const issued: string[] = [];
const suppressions: string[] = [];
const admin: RequestContext = {
  user: {
    id:SEED_IDS.collegeAdminUser,identityUid:"seed-college-admin",
    platformStatus:"ACTIVE",systemRoles:[],
  },
  membership:{
    id:SEED_IDS.collegeAdminMembership,organizationId:SEED_IDS.organization,
    collegeId:SEED_IDS.collegeA,status:"ACTIVE",roles:["COLLEGE_ADMIN"],
  },
};
const recipient = "db18-outbound-private@example.test";
function payload(sourceEventId:string) {
  return {
    organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeA,
    sourceEventId,channel:"EMAIL",templateKey:"RECRUITER_INVITATION",
    recipient,
    variables:{
      companyName:"Private Firm",collegeName:"College A",
      invitationUrl:"https://private.example.test/invite?token=TEST_ONLY_PRIVATE",
    },
  };
}
function sourceId() { const id=randomUUID(); issued.push(id); return id; }
const enqueue=(id:string) => getDb().transaction(tx =>
  queueOutboundDeliveryInTransaction(tx,admin,payload(id)));
const claim=(worker:string) => claimOutboundDispatchBatch(worker,1,60);

describe.skipIf(!enabled)("DB018 registered PG17 real outbound worker producer/consumer race",()=>{
  beforeAll(()=>{
    assertDb018DisposableTarget(process.env,{serviceBound:true});
    for(const [key,value] of Object.entries(flags))process.env[key]=value;
  });
  afterAll(async()=>{
    if(pool){
      if(issued.length)await pool.query(
        "delete from outbound_messages where source_event_id=any($1::uuid[])",[issued],
      );
      if(suppressions.length)await pool.query(
        "delete from outbound_global_email_suppressions where recipient_hash=any($1::varchar[])",[suppressions],
      );
      await pool.end();
    }
    for(const [key,value] of Object.entries(saved)){
      if(value===undefined)delete process.env[key];
      else process.env[key]=value;
    }
    await closeDatabaseConnection();
  });
  it("two real claimers only deliver one encrypted logical invitation through fake provider",async()=>{
    if(!pool)throw new Error("Disposable PG pool missing");
    const id=sourceId();
    const first=await enqueue(id);
    expect(first.status).toBe("QUEUED");
    const replay=await enqueue(id);
    expect(replay).toEqual({status:"ALREADY_QUEUED",id:first.id});
    const [a,b]=await Promise.all([claim("db18-outbound-A"),claim("db18-outbound-B")]);
    const issuedClaims=[...a,...b].filter(x=>x.messageId===first.id);
    expect(issuedClaims).toHaveLength(1);
    const worker=a.some(x=>x.messageId===first.id)?"db18-outbound-A":"db18-outbound-B";
    const send=vi.fn(async()=>({
      kind:"ACCEPTED" as const,providerMessageId:"db18-fake-provider-accepted",
    }));
    expect(await dispatchClaimedOutbound(issuedClaims[0]!,worker,{send}))
      .toBe("PROVIDER_ACCEPTED");
    expect(send).toHaveBeenCalledTimes(1);
    const persisted=await pool.query<{
      status:string;attempts:number;claim_fence:number;ciphertext_base64:string;
      provider_message_id:string|null;
    }>(`select status,attempts,claim_fence,ciphertext_base64,provider_message_id
        from outbound_messages where source_event_id=$1`,[id]);
    expect(persisted.rows).toHaveLength(1);
    expect(persisted.rows[0]).toMatchObject({
      status:"PROVIDER_ACCEPTED",attempts:1,claim_fence:1,
      provider_message_id:"db18-fake-provider-accepted",
    });
    expect(JSON.stringify(persisted.rows)).not.toContain(recipient);
    expect(JSON.stringify(persisted.rows)).not.toContain("TEST_ONLY_PRIVATE");
    const another=await claim("db18-outbound-reclaimer");
    expect(another.some(x=>x.messageId===first.id)).toBe(false);
  });
  it("late cross-college email suppression denies actual dispatcher and never calls fake provider",async()=>{
    if(!pool)throw new Error("Disposable PG pool missing");
    const id=sourceId();
    const queued=await enqueue(id);
    expect(queued.status).toBe("QUEUED");
    const recipientHash=deriveGlobalEmailSuppressionHashForAddress(recipient,globalKey);
    suppressions.push(recipientHash);
    await pool.query(
      "insert into outbound_global_email_suppressions(recipient_hash,reason) values($1,'UNSUBSCRIBED')",
      [recipientHash],
    );
    const claims=await claim("db18-outbound-late-optout");
    const owned=claims.find(x=>x.messageId===queued.id);
    expect(owned).toBeDefined();
    const send=vi.fn(async()=>({
      kind:"ACCEPTED" as const,providerMessageId:"should-never-send",
    }));
    expect(await dispatchClaimedOutbound(owned!,"db18-outbound-late-optout",{send}))
      .toBe("NOT_AUTHORIZED");
    expect(send).not.toHaveBeenCalled();
    const record=await pool.query<{status:string;provider_message_id:string|null}>(
      "select status,provider_message_id from outbound_messages where source_event_id=$1",[id],
    );
    expect(record.rows).toEqual([{status:"SUPPRESSED",provider_message_id:null}]);
    // Restore global consent only for later disposable cases; leave the
    // suppressed outbox row in place for teardown/audit.
    await pool.query("delete from outbound_global_email_suppressions where recipient_hash=$1",[recipientHash]);
    suppressions.pop();
  });
  it("a provider exception leaves the exact claim quarantined, never auto-reissued",async()=>{
    if(!pool)throw new Error("Disposable PG pool missing");
    const id=sourceId(),queued=await enqueue(id);
    expect(queued.status).toBe("QUEUED");
    const claims=await claim("db18-outbound-uncertain");
    const owned=claims.find(x=>x.messageId===queued.id);
    expect(owned).toBeDefined();
    const send=vi.fn(async():Promise<never>=>{throw new Error("UNKNOWN_PROVIDER_OUTCOME")});
    expect(await dispatchClaimedOutbound(owned!,"db18-outbound-uncertain",{send}))
      .toBe("RECONCILIATION_REQUIRED");
    expect(send).toHaveBeenCalledTimes(1);
    await pool.query(
      "update outbound_messages set claim_expires_at=clock_timestamp()-interval '1 second' where source_event_id=$1",
      [id],
    );
    const claimsAfter=await claim("db18-outbound-after-crash");
    expect(claimsAfter.some(x=>x.messageId===queued.id)).toBe(false);
    const record=await pool.query<{
      status:string;attempts:number;claim_fence:number;provider_message_id:string|null;
    }>(
      "select status,attempts,claim_fence,provider_message_id from outbound_messages where source_event_id=$1",
      [id],
    );
    expect(record.rows).toEqual([{
      status:"CLAIMED",attempts:1,claim_fence:1,provider_message_id:null,
    }]);
  });
});
