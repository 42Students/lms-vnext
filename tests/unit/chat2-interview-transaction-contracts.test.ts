import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

const source=(path:string)=>readFileSync("src/modules/placements/"+path,"utf8");

describe("chat-2 TPO round and interview transaction boundaries",()=>{
 it("TPO-drive-workspace-44 begins from scoped college and round IDs before reading slot data",()=>{
  const s=source("tpo-interview-slot-service.ts");
  expect(s).toContain("const collegeId=await requireTpoJobCollege(context)");
  expect(s).toContain("placementJobIdSchema.parse(rawJobId)");
  expect(s).toContain("placementRoundIdSchema.parse(rawRoundId)");
  expect(s).toContain("eq(placementJobs.collegeId,collegeId)");
  expect(s).toContain("eq(placementJobRounds.id,roundId)");
  expect(s).toContain("eq(collegeMemberships.status,\"ACTIVE\")");
  expect(s).toContain("eq(users.platformStatus,\"ACTIVE\")");
 });
 it("TPO-drive-workspace-44 requires actor revalidation and a locked scheduled round in every mutation",()=>{
  const s=source("tpo-interview-slot-service.ts");
  expect(s).toContain("tpoInterviewSlotActionSchema.parse(raw)");
  expect(s).toContain("getDb().transaction(async tx=>");
  expect(s).toContain("await requireTpoJobActor(tx,context)");
  expect(s).toContain('.for("update").limit(1)');
  expect(s).toContain('current?.status!=="SCHEDULED"');
  expect(s).toContain('eq(placementRoundCandidateSlots.version,slot.version)');
 });
 it("TPO-drive-workspace-44 moves create a learner override even when a first booking had none",()=>{
  const s=source("tpo-interview-slot-service.ts");
  const move=s.slice(s.indexOf('if(input.action==="MOVE"){'));
  expect(move).toContain("tx.insert(placementApplicationRoundExceptions).values({");
  expect(move).toContain("applicationId:slot.applicationId,roundId:info.round.id");
  expect(move).toContain("scheduledAt:target.startsAt,timezone:\"Asia/Kolkata\"");
  expect(move).toContain(".onConflictDoUpdate({");
  expect(move).toContain("placementApplicationRoundExceptions.applicationId,placementApplicationRoundExceptions.roundId");
  expect(move).toContain('await notice(tx,context,job,slot.applicationId,"PLACEMENTS_TPO_INTERVIEW_MOVED"');
  expect(move).not.toContain("tx.update(placementApplicationRoundExceptions).set({");
 });
 it("TPO-drive-workspace-44 bulk room change updates existing learner overrides before notification",()=>{
  const s=source("tpo-interview-slot-service.ts");
  const bulk=s.slice(s.indexOf('if(input.action==="ASSIGN_ROOMS_BY_ROLL"){'),s.indexOf('if(input.action==="MOVE_REQUEST"){'));
  expect(bulk).toContain('eq(placementRoundCandidateSlots.version,slot.version)');
  const update=bulk.indexOf("tx.update(placementApplicationRoundExceptions).set({");
  const notify=bulk.indexOf("await notice(tx,context,job,slot.applicationId!");
  expect(update).toBeGreaterThanOrEqual(0);
  expect(notify).toBeGreaterThan(update);
  expect(bulk).toContain('if(info.round.mode!=="VIRTUAL")');
  expect(bulk).toContain("venue:input.room,updatedAt:new Date()");
 });
 it("TPO-drive-workspace-42 whole-round apply rechecks version for every selected applicant",()=>{
  const s=source("tpo-round-apply-service.ts");
  const core=source("result-service.ts");
  expect(s).toContain("roundApplyInputSchema.parse(raw)");
  expect(s).toContain('!preview.ready');
  expect(s).toContain('input.expectedPreviewToken!==preview.previewToken');
  expect(s).toContain('preview.rows.filter(r=>r.status==="STAGED")');
  expect(s).toContain("applyPlacementRoundResult(context,row.resultId,row.version)");
  expect(core).toContain("expectedVersion?: number");
  expect(core).toContain('current.result.version !== expectedVersion');
  expect(core).toContain('lockedResult.version !== expectedVersion');
  expect(core).toContain('"PLACEMENT_JOB_PREVIEW_STALE"');
  expect(core).toMatch(/eq\(\s*placementRoundResults\.status,\s*"STAGED"/);
  expect(core).toContain("recordActivityEventInTransaction(");
  expect(core).toContain("deliverRecordedLearnerPlacementEvent(tx");
 });
 it("TPO-drive-workspace-40 result imports are college-scoped and matched against the persisted roster",()=>{
  const s=source("tpo-round-import-service.ts");
  expect(s).toContain("await requireTpoJobCollege(context)");
  expect(s).toContain("eq(placementJobs.collegeId,collegeId)");
  expect(s).toContain("eq(placementApplications.jobId,jobId)");
  expect(s).toContain("uniqueTpoRoundImportRoster(rows)");
  expect(s).toContain("tpoRoundImportPreviewToken");
  expect(s).toContain("confirmTpoRoundResult(");
  expect(s).toContain("eq(collegeMemberships.status,\"ACTIVE\")");
  expect(s).toContain("eq(users.platformStatus,\"ACTIVE\")");
 });
});
