import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const source=readFileSync(new URL("../../src/modules/placements/tpo-general-request-service.ts",import.meta.url),"utf8");
const read=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
describe("chat-12 request admission and duplicate replay invariants",()=>{
 it("TPO-requests-verification-01 binds an absence dispute to its owned application",()=>{
  expect(source).toContain('if(input.kind==="ABSENCE_DISPUTE"){');
  expect(source).toContain("eq(placementApplications.membershipId,member.id)");
 });
 it("TPO-requests-verification-01 binds a disputed round to its application job",()=>{
  expect(source).toContain("eq(placementJobRounds.id,input.roundId)");
  expect(source).toContain("eq(placementJobRounds.jobId,placementJobs.id)");
 });
 it("TPO-requests-verification-01 prevents cross-college absence request targets",()=>{
  expect(source).toContain("eq(placementJobs.collegeId,member.collegeId)");
  expect(source).toContain('if(!participation)throw new TpoGeneralRequestError("SCOPE")');
 });
 it("TPO-requests-verification-01 prevents cross-college post-placement targets",()=>{
  expect(source).toContain('if(input.kind==="PLACEMENT_AFTER_PLACEMENT"){');
  expect(source).toContain("eq(placementJobs.id,input.requestedJobId)");
  expect(source).toContain('if(!requestedJob)throw new TpoGeneralRequestError("SCOPE")');
 });
 it("TPO-requests-verification-01 compares a duplicate pending payload as JSONB",()=>{
  expect(source).toContain("payloadMatches:sql<boolean>");
  expect(source).toContain("::jsonb");
  expect(source).toContain("JSON.stringify(payload)");
 });
 it("TPO-requests-verification-01 refuses changed reason rather than replaying another request",()=>{
  expect(source).toContain('if(existing.reason!==input.reason||!existing.payloadMatches)');
  expect(source).toContain('throw new TpoGeneralRequestError("TARGET_CHANGED")');
 });
 it("TPO-requests-verification-01 returns an idempotent replay only for identical pending requests",()=>{
  expect(source).toContain("return {id:existing.id,replayed:true}");
  expect(source).toContain("return {id:request.id,replayed:false}");
 });
 it("TPO-requests-verification-01 does not create a request before scope and kind guards",()=>{
  expect(source.indexOf("await requireRegisteredKind(tx,input.kind)")).toBeLessThan(source.indexOf("tx.insert(placementLearnerGeneralRequests)"));
  expect(source.indexOf('if(input.kind==="ABSENCE_DISPUTE")')).toBeLessThan(source.indexOf("tx.insert(placementLearnerGeneralRequests)"));
 });
 it("TPO-requests-verification-01 keeps all request events and placement-cell notices transactional",()=>{
  expect(source).toContain("getDb().transaction(async tx=>");
  expect(source).toContain("tx.insert(placementLearnerGeneralRequestEvents)");
  expect(source).toContain("await notifyTpo(tx,college.id,event.id)");
 });
 it("TPO-requests-verification-01 never silently approves a kind with unsupported domain consequences",()=>{
  expect(source).toContain('throw new TpoGeneralRequestError("EFFECT_UNSUPPORTED")');
  expect(source).toContain('const effect=decision.action==="APPROVE"?await approveEffect(tx,ctx,row):null');
 });
 it("TPO-requests-verification-01 persists a version-checked decision",()=>{
  expect(source).toContain("eq(placementLearnerGeneralRequests.version,decision.version)");
  expect(source).toContain('eq(placementLearnerGeneralRequests.status,"PENDING")');
 });
 it("TPO-requests-verification-01 traces the original 0134 incompatibility to the registered 0135 correction",()=>{
  const original=read("drizzle/0134_lanes_round_2.sql");
  const registered=read("drizzle/0135_lanes_round_3.sql");
  const schema=read("src/db/schema/placement-general-requests.ts");
  expect(original.split("create table if not exists placement_learner_general_requests (")[1]?.split(");")[0]).not.toContain("'OFFER_ACCEPTANCE_DISPUTE'");
  expect(registered).toContain("-- from chat-12-0134-general-requests-correction.sql");
  expect(registered).toContain("'PLACEMENT_AFTER_PLACEMENT','OFFER_ACCEPTANCE_DISPUTE'");
  expect(schema).toContain("'PLACEMENT_AFTER_PLACEMENT','OFFER_ACCEPTANCE_DISPUTE'");
  expect(read("docs/proposed-migrations/chat-12-0134-general-requests-correction.sql")).toContain("OFFER_ACCEPTANCE_DISPUTE");
  // Retain the live constraint guard for deployments whose 0135 has not yet run.
  expect(source).toContain('await requireRegisteredKind(tx,input.kind)');
 });
});
