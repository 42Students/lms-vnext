import {beforeEach,describe,expect,it,vi} from "vitest";
import {getDb} from "@/db/client";
import {notifyTpoOfRecruiterMessage}
 from "@/modules/placements/recruiter-message-tpo-notification-service";
import {recruiterMailBridgeSignature}
 from "@/modules/placements/recruiter-message-email-model";
import {acceptAuthenticatedRecruiterEmailReply}
 from "@/modules/placements/recruiter-message-email-inbound-service";

vi.mock("@/db/client",()=>({getDb:vi.fn()}));
vi.mock("@/modules/placements/recruiter-message-tpo-notification-service",()=>({
 notifyTpoOfRecruiterMessage:vi.fn(async()=>undefined),
}));

const env={
 RECRUITER_MESSAGE_EMAIL_BRIDGE_ENABLED:"true",
 RECRUITER_MESSAGE_INBOUND_HMAC_SECRET:"k".repeat(64),
 RECRUITER_MESSAGE_REPLY_DOMAIN:"reply.example.org",
};
const threadId="11111111-1111-4111-8111-111111111111";
const userId="22222222-2222-4222-8222-222222222222";
const messageId="33333333-3333-4333-8333-333333333333";
const raw=JSON.stringify({
 from:"recruiter@example.org",to:"r-"+"a".repeat(32)+"@reply.example.org",
 text:"Confirmed for Friday.\n\nOn Wednesday, 1 January 2099 wrote:\nPrivate old history",
 providerMessageId:"signed-upstream-message-001",
});
const signature=recruiterMailBridgeSignature(env.RECRUITER_MESSAGE_INBOUND_HMAC_SECRET,raw);
const validState={threadId,recruiterUserId:userId,replyTokenExpiresAt:new Date("2099-01-01T00:00:00Z")};

function transactionFixture(options:{
 state?:typeof validState|null;granted?:boolean;
 duplicate?:{id:string;threadId:string}|null;insertedId?:string|null;
}={}){
 const rows=[
  options.state===undefined?validState:options.state,
  options.duplicate===undefined?null:options.duplicate,
 ];
 let selected=0;
 const select=vi.fn(()=>({
  from:vi.fn(()=>({
   where:vi.fn(()=>({
    for:vi.fn(()=>({limit:vi.fn(async()=>rows[selected++]?[rows[selected-1]]:[])})),
    limit:vi.fn(async()=>rows[selected++]?[rows[selected-1]]:[]),
   })),
  })),
 }));
 let executed=0;
 const execute=vi.fn(async()=>{
  executed++;
  if(executed===1)return {rows:options.granted===false?[]:[{college_id:"college-1"}]};
  if(executed===2)return {rows:options.insertedId===null?[]:[{id:options.insertedId??messageId}]};
  return {rows:[]};
 });
 const values=vi.fn(async()=>undefined);
 const insert=vi.fn(()=>({values}));
 const tx={select,execute,insert};
 const db={
  execute:vi.fn(async()=>({rows:[{ok:true}]})),
  transaction:vi.fn(async(fn:(arg:typeof tx)=>Promise<unknown>)=>fn(tx)),
 };
 vi.mocked(getDb).mockReturnValue(db as unknown as ReturnType<typeof getDb>);
 return {db,tx,values};
}

beforeEach(()=>vi.clearAllMocks());

describe("chat-16 signed recruiter reply actual transaction decisions",()=>{
 it("email-bridge-inbound-transaction-16 denies an expired token before reading recruiter grants",async()=>{
  const f=transactionFixture({state:{...validState,replyTokenExpiresAt:new Date("2000-01-01T00:00:00Z")}});
  await expect(acceptAuthenticatedRecruiterEmailReply(raw,signature,env))
   .resolves.toEqual({accepted:false,replayed:false});
  expect(f.tx.execute).not.toHaveBeenCalled();
  expect(f.tx.insert).not.toHaveBeenCalled();
  expect(notifyTpoOfRecruiterMessage).not.toHaveBeenCalled();
 });
 it("email-bridge-inbound-transaction-17 denies revoked or foreign grant before saving email bodies",async()=>{
  const f=transactionFixture({granted:false});
  await expect(acceptAuthenticatedRecruiterEmailReply(raw,signature,env))
   .resolves.toEqual({accepted:false,replayed:false});
  expect(f.tx.insert).not.toHaveBeenCalled();
  expect(notifyTpoOfRecruiterMessage).not.toHaveBeenCalled();
 });
 it("email-bridge-inbound-transaction-18 safely acknowledges an existing same-thread provider event without inserting twice",async()=>{
  const f=transactionFixture({duplicate:{id:messageId,threadId}});
  await expect(acceptAuthenticatedRecruiterEmailReply(raw,signature,env))
   .resolves.toEqual({accepted:true,replayed:true});
  expect(f.tx.insert).not.toHaveBeenCalled();
  expect(f.tx.execute).toHaveBeenCalledTimes(1);
  expect(notifyTpoOfRecruiterMessage).not.toHaveBeenCalled();
 });
 it("email-bridge-inbound-transaction-19 refuses a reused upstream ID from another thread",async()=>{
  const f=transactionFixture({duplicate:{
   id:messageId,threadId:"44444444-4444-4444-8444-444444444444",
  }});
  await expect(acceptAuthenticatedRecruiterEmailReply(raw,signature,env))
   .resolves.toEqual({accepted:false,replayed:true});
  expect(f.tx.insert).not.toHaveBeenCalled();
  expect(notifyTpoOfRecruiterMessage).not.toHaveBeenCalled();
 });
 it("email-bridge-inbound-transaction-20 persists only new reply text, then receipt and scoped placement alert",async()=>{
  const f=transactionFixture();
  await expect(acceptAuthenticatedRecruiterEmailReply(raw,signature,env))
   .resolves.toEqual({accepted:true,replayed:false});
  expect(f.tx.execute).toHaveBeenCalledTimes(3);
  expect(f.tx.insert).toHaveBeenCalledTimes(1);
  expect(f.values).toHaveBeenCalledWith(expect.objectContaining({
   threadId,messageId,
  }));
  expect(notifyTpoOfRecruiterMessage).toHaveBeenCalledWith(f.tx,{
   collegeId:"college-1",threadId,messageId,senderUserId:userId,at:expect.any(Date),
  });
  expect(JSON.stringify(f.values.mock.calls)).not.toContain("recruiter@example.org");
 });
});
