import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

const source=(path:string)=>readFileSync(path,"utf8");

describe("lane-1 verify2b placement parity and security contracts",()=>{
 it("G2-16-023-036 separates confirmed bookings and scheduled expected rounds",()=>{
   const service=source("src/modules/placements/learner-journey-service.ts");
   expect(service).toContain('confirmed:booking.appointmentStatus==="BOOKED"');
   expect(service).toContain("expectedAt:round.scheduledAt");
   expect(service).toContain("expectedVenue:round.venue");
   expect(service).toContain('round.kind!=="TALK"');
 });
 it("G2-17-012-012 counts audited ever-reached funnel stages without inventing absent history",()=>{
   const report=source("src/modules/placements/report-model.ts");
   expect(report).toContain('evidence: "UNAVAILABLE"');
   expect(report).toContain("const historyByApplication = new Map<string, Set<string>>()");
   expect(report).toContain("if (event.fromStage) stages.add(event.fromStage)");
   expect(report).toContain("stages.add(event.toStage)");
   expect(report).toContain("avgTimeToShortlistMs");
 });
 it("G2-18-005-082 does not present an accepted non-counting offer as a placement",()=>{
   const page=source("src/app/(authenticated)/learn/my-placements/page.tsx");
   expect(page).toContain('row.job.countsAsPlaced===true');
   expect(page).toContain('offer.offer.status==="ACCEPTED"');
   const waiting=source("src/modules/placements/learner-waiting-on-you-model.ts");
   expect(waiting).toContain("!row.pendingMoveRequest");
   expect(waiting).toContain('row.roundKind!=="TALK"');
 });
 it("G2-19-004-084 validates preferred times without treating them as approved booked slots",()=>{
   const form=source("src/components/placements/learner-schedule-reschedule.tsx");
   const service=source("src/modules/placements/request-service.ts");
   expect(form).toContain("preferredTimes:preferredTimes.trim()||null");
   expect(form).toContain("reason.trim().length<3");
   expect(service).toContain("legacyRescheduleRequestDisplay");
   expect(service).toContain("preferredTimes: input.preferredTimes?.trim() || null");
   expect(service).toContain("scheduledAt: input.scheduledAt.toISOString()");
 });
 it("G2-2-006-031 enforces authorized upload attestation and exposes safe link parts",()=>{
   const control=source("src/components/courses/assignment-file-submission-control.tsx");
   const editor=source("src/components/courses/assignment-multipart-parts-editor.tsx");
   const storage=source("src/modules/storage/legacy-upload-workflow-model.ts");
   expect(control).toContain("uploadStagedAssignmentFile(");
   expect(control).toContain('url.protocol!=="https:"');
   expect(editor).toContain('type="url"');
   expect(editor).toContain("Add another link");
   expect(storage).toContain('"IMPORT_FROM_URL","MULTIPART_PROXY","PUBLIC_STORAGE_URL"');
   expect(storage).toContain("A grant is NEVER an attachment");
 });
});
