import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {recordedOutsideParticipantSchema,outsideDriveResultLabel}
 from "@/modules/placements/recorded-outside-participation-model";
const read=(p:string)=>readFileSync(p,"utf8");
const id="11111111-2222-4333-8444-555555555555";
describe("chat-14 final sprint",()=>{
 it("TPO-drives-31 records valid historical outcomes without inventing an offer",()=>{
  expect(recordedOutsideParticipantSchema.safeParse({recordId:id,membershipId:id,result:"SELECTED"}).success).toBe(true);
  expect(recordedOutsideParticipantSchema.safeParse({recordId:id,membershipId:id,result:"OFFER_ISSUED"}).success).toBe(false);
  expect(outsideDriveResultLabel("HIRED")).toContain("external");
 });
 it("TPO-drives-31 keeps college-scoped parent and learner foreign keys",()=>{
  const schema=read("src/db/schema/placement-outside-drives.ts");
  const sql=read("docs/proposed-migrations/registered-0135/tpo-outside-drive-participants.sql");
  expect(schema).toContain("outside_drive_participant_record_college_fk");
  expect(schema).toContain("outside_drive_participant_learner_college_fk");
  expect(sql).toContain("UNIQUE INDEX IF NOT EXISTS outside_drive_participant_once_uq");
 });
 it("TPO-drives-31 only allows active college learners and creates an audit event",()=>{
  const service=read("src/modules/placements/recorded-outside-participation-service.ts");
  expect(service).toContain("requireTpoJobActor(tx,context)");
  expect(service).toContain('eq(collegeMemberships.collegeId,collegeId)');
  expect(service).toContain('eq(users.platformStatus,"ACTIVE")');
  expect(service).toContain('eq(membershipRoles.role,"LEARNER")');
  expect(service).toContain('eventType:"placements.outside_drive.participant_recorded"');
  expect(service).not.toContain("tx.insert(placementOffers)");
 });
 it("TPO-drives-31 supports add/update from the TPO page and does not mix with live drive reminders",()=>{
  const page=read("src/app/(authenticated)/tpo/placements/recorded-outside/page.tsx");
  const detail=read("src/app/(authenticated)/tpo/placements/recorded-outside/[recordId]/page.tsx");
  const route=read("src/app/api/placements/tpo/outside-drives/[recordId]/participants/route.ts");
  expect(page).toContain("Recorded outside drives");
  expect(page).toContain("Add students and results");
  expect(detail).toContain("TpoOutsideParticipantsEditor");
  expect(route).toContain("isSameOriginRequest(request)");
  expect(route).toContain("setTpoOutsideDriveParticipant");
  expect(read("src/app/(authenticated)/tpo/placements/lifecycle/page.tsx")).toContain("Recorded outside · history");
 });
});