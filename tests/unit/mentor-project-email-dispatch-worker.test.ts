import {describe,expect,it} from "vitest";
import {mentorProjectEmailWorkerReady} from
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
 });
});
