import {beforeEach,describe,expect,it,vi} from "vitest";
import {readFileSync} from "node:fs";
const requireSource=()=>readFileSync("src/modules/placements/recruiter-message-email-dispatch-service.ts","utf8");
import {getDb} from "@/db/client";
import {readZeptoMailConfig} from "@/modules/notifications/zeptomail-email";
import {sendRecruiterMessageDigest} from "@/modules/placements/recruiter-message-email-provider";
import {dispatchRecruiterUnreadMessageDigests}
 from "@/modules/placements/recruiter-message-email-dispatch-service";

vi.mock("@/db/client",()=>({getDb:vi.fn()}));
vi.mock("@/modules/notifications/zeptomail-email",()=>({readZeptoMailConfig:vi.fn()}));
vi.mock("@/modules/placements/recruiter-message-email-provider",()=>({
 sendRecruiterMessageDigest:vi.fn(),
}));
const now=new Date("2026-10-18T12:00:00Z");
const env={
 RECRUITER_MESSAGE_EMAIL_BRIDGE_ENABLED:"true",
 RECRUITER_MESSAGE_REPLY_DOMAIN:"reply.example.org",
 RECRUITER_MESSAGE_REPLY_TOKEN_SECRET:"r".repeat(64),
 RECRUITER_MESSAGE_INBOUND_HMAC_SECRET:"s".repeat(64),
 RECRUITER_MESSAGE_DIGEST_TEMPLATE_KEY:"campaign.recruiter_digest",
};
const threadId="11111111-1111-4111-8111-111111111111";
const userId="22222222-2222-4222-8222-222222222222";
const due={
 thread_id:threadId,recruiter_user_id:userId,
 recipient_email:"recruiter@example.org",college_name:"Example College",
 company_name:"Example Company",
 first_unread_at:new Date("2026-10-18T09:00:00Z"),
 last_unread_at:new Date("2026-10-18T10:00:00Z"),
};
function mockDb(granted:boolean){
 const readiness=vi.fn().mockResolvedValueOnce({rows:[{ok:true}]})
  .mockResolvedValueOnce({rows:[due]});
 const lockedState={threadId,recruiterUserId:userId,lastSentAt:null};
 const limit=vi.fn(async()=>[lockedState]);
 const select=vi.fn(()=>({from:vi.fn(()=>({where:vi.fn(()=>({
  for:vi.fn(()=>({limit})),
 }))}))}));
 const onConflictDoNothing=vi.fn(async()=>undefined);
 const insert=vi.fn(()=>({values:vi.fn(()=>({onConflictDoNothing}))}));
 const grant=vi.fn(async()=>({rows:[{allowed:granted}]}));
 const tx={select,insert,execute:grant};
 const db={execute:readiness,transaction:vi.fn(async(fn:(t:typeof tx)=>Promise<unknown>)=>fn(tx))};
 vi.mocked(getDb).mockReturnValue(db as unknown as ReturnType<typeof getDb>);
 return {db,tx,grant,select};
}
beforeEach(()=>{
 vi.clearAllMocks();
 vi.mocked(readZeptoMailConfig).mockReturnValue({
  apiUrl:"https://api.zeptomail.in/v1.1/email/template",token:"safe-provider-token",
  otpTemplateKey:"auth.otp",fromAddress:"hello@42lms.com",fromName:"42Learn",
 });
});

describe("chat-16 recruiter digest scheduler live authorization",()=>{
 it("email-bridge-digest-worker-16 is inert when a verified bridge is not enabled",async()=>{
  await expect(dispatchRecruiterUnreadMessageDigests({
   ...env,RECRUITER_MESSAGE_EMAIL_BRIDGE_ENABLED:"false",
  },now)).resolves.toEqual({examined:0,sent:0,enabled:false});
  expect(getDb).not.toHaveBeenCalled();
  expect(sendRecruiterMessageDigest).not.toHaveBeenCalled();
 });
 it("email-bridge-digest-worker-17 denies weak secrets and auth template reuse before storage",async()=>{
  for(const options of [
   {...env,RECRUITER_MESSAGE_REPLY_TOKEN_SECRET:"short"},
   {...env,RECRUITER_MESSAGE_INBOUND_HMAC_SECRET:"short"},
   {...env,RECRUITER_MESSAGE_DIGEST_TEMPLATE_KEY:"auth.otp"},
  ]){
   await expect(dispatchRecruiterUnreadMessageDigests(options,now))
    .resolves.toMatchObject({examined:0,sent:0,enabled:false});
  }
  expect(getDb).not.toHaveBeenCalled();
 });
 it("email-bridge-digest-worker-18 denies a grant revoked after the initial due-list snapshot",async()=>{
  const f=mockDb(false);
  const result=await dispatchRecruiterUnreadMessageDigests(env,now);
  expect(result).toEqual({examined:1,sent:0,enabled:true});
  expect(f.db.transaction).toHaveBeenCalledOnce();
  expect(f.grant).toHaveBeenCalledOnce();
  expect(f.tx.select).toHaveBeenCalledTimes(1);
  expect(sendRecruiterMessageDigest).not.toHaveBeenCalled();
 });
 it("email-bridge-digest-worker-20 checks grant expiration at actual send time, not a stale scheduler timestamp",()=>{
  const source=requireSource();
  const recheck=source.slice(source.indexOf("const grant=await tx.execute"),source.indexOf("if(grant.rows[0]?.allowed!==true)"));
  expect(recheck).toContain("g.valid_until > clock_timestamp()");
  expect(recheck).toContain("lower(u.email)=lower(");
  expect(recheck).toContain("placement_companies co");
  expect(recheck).toContain("placement_jobs j");
 });
 it("email-bridge-digest-worker-19 does not retrieve message body before in-transaction current grant check",async()=>{
  const f=mockDb(false);
  await dispatchRecruiterUnreadMessageDigests(env,now);
  expect(f.tx.select).toHaveBeenCalledTimes(1);
  expect(f.grant).toHaveBeenCalledOnce();
  expect(sendRecruiterMessageDigest).not.toHaveBeenCalled();
 });
});