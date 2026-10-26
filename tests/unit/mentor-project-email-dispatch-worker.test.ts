import {describe,expect,it} from "vitest";
import {mentorProjectEmailWorkerReady,mentorProjectEmailClaimDelayMs} from
 "@/modules/projects/mentor-project-email-dispatch-worker";
const READY={
 MENTOR_PROJECT_EMAIL_OUTBOX_READY:"verified",
 MENTOR_PROJECT_EMAIL_DISPATCH_READY:"verified",
 ZEPTOMAIL_IDEMPOTENCY_SUPPORTED:"confirmed",
 MENTOR_PROJECT_EMAIL_ACTIVATED_AT:"2026-10-25T00:00:00Z",
};
describe("Mentor email dispatcher operational safety",()=>{
 it("does not run before activation or without every attestation",()=>{
  expect(mentorProjectEmailWorkerReady({})).toEqual({ready:false});
  for(const key of Object.keys(READY)){
   const partial={...READY};
   delete (partial as Record<string,string|undefined>)[key];
   expect(mentorProjectEmailWorkerReady(partial,new Date("2026-11-01T00:00:00Z")))
    .toEqual({ready:false});
  }
  expect(mentorProjectEmailWorkerReady(READY,new Date("2026-10-24T00:00:00Z")))
   .toEqual({ready:false});
 });
 it("accepts a strict UTC deployment cutover only after operator verification",()=>{
  expect(mentorProjectEmailWorkerReady(READY,new Date("2026-10-25T01:00:00Z")))
   .toEqual({ready:true,activatedAt:new Date("2026-10-25T00:00:00Z")});
  expect(mentorProjectEmailWorkerReady({
   ...READY,MENTOR_PROJECT_EMAIL_ACTIVATED_AT:"yesterday",
  })).toEqual({ready:false});
  for(const invalid of [
   "2026-02-30T00:00:00Z","2025-02-29T00:00:00Z",
   "2026-13-01T00:00:00Z","2026-10-25T25:00:00Z",
  ]){
   expect(mentorProjectEmailWorkerReady({
    ...READY,MENTOR_PROJECT_EMAIL_ACTIVATED_AT:invalid,
   },new Date("2026-11-01T00:00:00Z"))).toEqual({ready:false});
  }
  expect(mentorProjectEmailWorkerReady({
   ...READY,MENTOR_PROJECT_EMAIL_ACTIVATED_AT:"2026-10-25T00:00:00.000Z",
  },new Date("2026-11-01T00:00:00Z"))).toEqual({
   ready:true,activatedAt:new Date("2026-10-25T00:00:00Z"),
  });
 });
 it("enforces a twenty-minute unexpired claim lease and staggered retries",()=>{
  const minutes=60*1000;
  expect(mentorProjectEmailClaimDelayMs("CLAIMED",1)).toBe(20*minutes);
  expect(mentorProjectEmailClaimDelayMs("CLAIMED",3)).toBe(20*minutes);
  expect(mentorProjectEmailClaimDelayMs("RETRY",1)).toBe(5*minutes);
  expect(mentorProjectEmailClaimDelayMs("RETRY",2)).toBe(10*minutes);
  expect(mentorProjectEmailClaimDelayMs("RETRY",3)).toBe(15*minutes);
  expect(mentorProjectEmailClaimDelayMs("RETRY",999)).toBe(15*minutes);
  expect(mentorProjectEmailClaimDelayMs("RETRY",undefined)).toBe(5*minutes);
  expect(mentorProjectEmailClaimDelayMs("ACCEPTED",3)).toBe(0);
  expect(mentorProjectEmailClaimDelayMs("EXHAUSTED",3)).toBe(0);
  expect(mentorProjectEmailClaimDelayMs("SUPPRESSED",3)).toBe(0);
 });
});
