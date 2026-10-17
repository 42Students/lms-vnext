import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const source=(p:string)=>readFileSync(p,"utf8");
describe("LEARNER-placements-35 booked-round attendance confirmation",()=>{
 it("LEARNER-placements-35 preserves TPO booking time separately from learner consent",()=>{
  const schema=source("src/db/schema/placement-round-candidate-slots.ts");
  const proposal=source("docs/proposed-migrations/chat13-learner-round-attendance-confirmation.sql");
  expect(schema).toContain('learnerConfirmedAt:timestamp("learner_confirmed_at"');
  expect(schema).toContain('confirmedAt:timestamp("confirmed_at"');
  expect(proposal).toContain("learner_confirmed_at timestamptz");
 });
 it("LEARNER-placements-35 POST validates origin, enrollment ownership, booked status, future start and optimistic update",()=>{
  const route=source("src/app/api/placements/learner/rounds/confirm/route.ts");
  expect(route).toContain("isSameOriginRequest(request)");
  const service=source("src/modules/placements/learner-round-confirmation-service.ts");
  for(const x of ["requireLearnerPlacementAccess(context)",'eq(placementApplications.membershipId,member.id)',
   'eq(placementRoundCandidateSlots.status,"BOOKED")',"gt(placementRoundCandidateSlots.startsAt,new Date())",
   "version:slot.version+1","alreadyConfirmed:true","recordActivityEventInTransaction(tx,context"])
   expect(service).toContain(x);
 });
 it("LEARNER-placements-35 offers precise confirmation chips and a grouped needs-confirmation count",()=>{
  const page=source("src/app/(authenticated)/learn/my-placements/schedule/page.tsx");
  const widget=source("src/components/placements/learner-round-confirm-attendance.tsx");
  expect(page).toContain("rounds need your confirmation");
  expect(page).toContain("learnerConfirmedAt");
  expect(page).toContain("<LearnerRoundConfirmAttendance");
  expect(widget).toContain("Confirm I'll attend");
  expect(widget).toContain("Please confirm");
  expect(widget).toContain("Confirmed");
 });
 it("LEARNER-placements-35 does not fake confirmation when migration is absent",()=>{
  const service=source("src/modules/placements/learner-round-confirmation-service.ts");
  const readiness=source("src/modules/placements/learner-round-confirmation-readiness.ts");
  expect(service).toContain("learnerRoundConfirmationReady()");
  expect(readiness).toContain("information_schema.columns");
 });
});