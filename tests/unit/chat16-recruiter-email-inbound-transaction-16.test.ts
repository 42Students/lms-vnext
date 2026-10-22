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
 auth:"dmarc=pass header.from=example.org",
});
const signature=recruiterMailBridgeSignature(env.RECRUITER_MESSAGE_INBOUND_HMAC_SECRET,raw);
const validState={threadId,recruiterUserId:userId,replyTokenExpiresAt:new Date("2099-01-01T00:00:00Z")};

function transactionFixture(options:{
 state?:typeof validState|null;granted?:boolean;
 duplicate?:{threadId:string;messageId:string}|null;insertedId?:string|null;
}={}){
 const state=options.state===undefined?validState:options.state;
 const inboxValues=vi.fn();
 const receiptValues=vi.fn();
 let insertion=0;
 const insert=vi.fn(()=>({
  values:vi.fn((record:unknown)=>{
   insertion++;
   if(insertion===1){
    inboxValues(record);
    return {onConflictDoNothing:vi.fn(()=>({returning:vi.fn(async()=>[{id:"inbox-receipt-001"}])}))};
   }
   receiptValues(record);
   return Promise.resolve();
  }),
 }));
 const update=vi.fn(()=>({set:vi.fn(()=>({where:vi.fn(async()=>[])}))}));
 const select=vi.fn(()=>({
  from:vi.fn(()=>({where:vi.fn(()=>({
   for:vi.fn(()=>({limit:vi.fn(async()=>state?[state]:[])})),
   limit:vi.fn(async()=>options.duplicate?[options.duplicate]:[]),
  }))})),
 }));
 let executed=0;
 const execute=vi.fn(async()=>{
  executed++;
  if(executed===1)return {rows:[{ok:true}]};
  if(executed===2)return {rows:options.granted===false?[]:[{college_id:"college-1"}]};
  if(executed===3)return {rows:options.insertedId===null?[]:[{id:options.insertedId??messageId}]};
  return {rows:[]};
 });
 const tx={select,execute,insert,update};
 const db={
  execute:vi.fn(async()=>({rows:[{ok:true}]})),
  transaction:vi.fn(async(fn:(arg:typeof tx)=>Promise<unknown>)=>fn(tx)),
 };
 vi.mocked(getDb).mockReturnValue(db as unknown as ReturnType<typeof getDb>);
 return {db,tx,inboxValues,receiptValues};
}

beforeEach(()=>vi.clearAllMocks());

describe("chat-16 signed recruiter reply actual transaction decisions",()=>{
 it("email-bridge-inbound-transaction-16 keeps an expired token in restricted triage without reading grants",async()=>{
  const f=transactionFixture({state:{...validState,replyTokenExpiresAt:new Date("2000-01-01T00:00:00Z")}});
  await expect(acceptAuthenticatedRecruiterEmailReply(raw,signature,env))
   .resolves.toEqual({accepted:true,replayed:false,outcome:"NO_THREAD"});
  expect(f.tx.execute).toHaveBeenCalledTimes(1);
  expect(f.tx.insert).toHaveBeenCalledTimes(1);
  expect(f.tx.update).toHaveBeenCalledTimes(1);
  expect(notifyTpoOfRecruiterMessage).not.toHaveBeenCalled();
 });
 it("email-bridge-inbound-transaction-17 stores revoked grants for triage but never posts a conversation",async()=>{
  const f=transactionFixture({granted:false});
  await expect(acceptAuthenticatedRecruiterEmailReply(raw,signature,env))
   .resolves.toEqual({accepted:true,replayed:false,outcome:"ACCESS_ENDED"});
  expect(f.tx.execute).toHaveBeenCalledTimes(2);
  expect(f.tx.insert).toHaveBeenCalledTimes(1);
  expect(f.receiptValues).not.toHaveBeenCalled();
  expect(notifyTpoOfRecruiterMessage).not.toHaveBeenCalled();
 });
 it("email-bridge-inbound-transaction-18 acknowledges an existing same-thread receipt without reposting",async()=>{
  const f=transactionFixture({duplicate:{messageId,threadId}});
  await expect(acceptAuthenticatedRecruiterEmailReply(raw,signature,env))
   .resolves.toEqual({accepted:true,replayed:true,outcome:"DUPLICATE"});
  expect(f.tx.insert).toHaveBeenCalledTimes(1);
  expect(f.tx.execute).toHaveBeenCalledTimes(2);
  expect(f.tx.update).toHaveBeenCalledTimes(1);
  expect(notifyTpoOfRecruiterMessage).not.toHaveBeenCalled();
 });
 it("email-bridge-inbound-transaction-19 cannot attribute a foreign thread's receipt",async()=>{
  const f=transactionFixture({duplicate:{
   messageId,threadId:"44444444-4444-4444-8444-444444444444",
  }});
  await expect(acceptAuthenticatedRecruiterEmailReply(raw,signature,env))
   .resolves.toEqual({accepted:true,replayed:false,outcome:"FAILED"});
  expect(f.tx.insert).toHaveBeenCalledTimes(1);
  expect(f.receiptValues).not.toHaveBeenCalled();
  expect(f.tx.update).toHaveBeenCalledTimes(1);
  expect(notifyTpoOfRecruiterMessage).not.toHaveBeenCalled();
 });
 it("email-bridge-inbound-transaction-20 writes a new verified reply, receipt and scoped TPO alert",async()=>{
  const f=transactionFixture();
  await expect(acceptAuthenticatedRecruiterEmailReply(raw,signature,env))
   .resolves.toEqual({accepted:true,replayed:false,outcome:"POSTED"});
  expect(f.tx.execute).toHaveBeenCalledTimes(4);
  expect(f.tx.insert).toHaveBeenCalledTimes(2);
  expect(f.inboxValues).toHaveBeenCalledWith(expect.objectContaining({
   fromAddress:"recruiter@example.org",kind:"REPLY",
  }));
  expect(f.receiptValues).toHaveBeenCalledWith(expect.objectContaining({threadId,messageId}));
  expect(JSON.stringify(f.receiptValues.mock.calls)).not.toContain("recruiter@example.org");
  expect(notifyTpoOfRecruiterMessage).toHaveBeenCalledWith(f.tx,{
   collegeId:"college-1",threadId,messageId,senderUserId:userId,at:expect.any(Date),
  });
 });
});
