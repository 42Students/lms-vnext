import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {canRecruiterEditRound,hrRoundFormSchema}
 from "@/modules/placements/hr-round-editor-model";

const actor="123e4567-e89b-42d3-a456-426614174001";
const round="123e4567-e89b-42d3-a456-426614174002";
const base={status:"PENDING",createdByUserId:actor,recruiterUserId:actor,
 hasResults:false,hasSlots:false};

describe("HR-ROUND-ARCHIVE-26 archived drives cannot expose editable rounds",()=>{
 it("both write transaction and list read exclude an archived drive at SQL scope",()=>{
  const service=readFileSync(join(process.cwd(),
   "src/modules/placements/hr-round-editor-service.ts"),"utf8");
  const occurrences=service.match(/isNull\(placementJobs\.archivedAt\)/g)??[];
  expect(occurrences).toHaveLength(2);
  const mutation=service.slice(service.indexOf("export async function editHrJobRound"),
   service.indexOf("export async function listHrRoundEditorRows"));
  const listing=service.slice(service.indexOf("export async function listHrRoundEditorRows"));
  for(const body of [mutation,listing]){
   const authorize=body.indexOf("isNull(placementJobs.archivedAt)");
   const recruiter=body.indexOf("recruiterOwnJobPredicate(context.user.id)");
   expect(authorize).toBeGreaterThan(-1);
   expect(recruiter).toBeGreaterThan(-1);
   expect(authorize).toBeGreaterThan(recruiter-250);
  }
 });
 it("unrelated recruiter and already-used round remain non-mutable despite pending status",()=>{
  expect(canRecruiterEditRound(base)).toBe(true);
  for(const patch of [
   {createdByUserId:"other-recruiter"},{createdByUserId:" "},
   {recruiterUserId:""},{status:"CANCELLED"},
   {status:"COMPLETED"},{hasResults:true},{hasSlots:true},
  ])expect(canRecruiterEditRound({...base,...patch})).toBe(false);
 });
 it("removal demands an optimistic version and cannot smuggle updated round details",()=>{
  expect(hrRoundFormSchema.safeParse({action:"REMOVE",roundId:round,
   expectedUpdatedAt:"2099-01-01T00:00:00.000Z"}).success).toBe(true);
  for(const input of [
   {action:"REMOVE",roundId:round},
   {action:"REMOVE",roundId:round,expectedUpdatedAt:"stale"},
   {action:"REMOVE",roundId:round,expectedUpdatedAt:"2099-01-01T00:00:00.000Z",name:"Hijack"},
   {action:"REMOVE",roundId:round,expectedUpdatedAt:"2099-01-01T00:00:00.000Z",kind:"INTERVIEW"},
  ])expect(hrRoundFormSchema.safeParse(input).success).toBe(false);
 });
 it("HR-ROUND-TENANT-46 both job round operations reject disabled colleges and employers before round data",()=>{
  const source=readFileSync("src/modules/placements/hr-round-editor-service.ts","utf8");
  const edit=source.slice(source.indexOf("export async function editHrJobRound"),
   source.indexOf("export async function listHrRoundEditorRows"));
  const list=source.slice(source.indexOf("export async function listHrRoundEditorRows"));
  for(const body of [edit,list]){
   for(const required of [
    'eq(placementCompanies.id,placementCompanyRelationships.companyId)',
    'eq(placementCompanies.status,"ACTIVE")',
    'eq(colleges.status,"ACTIVE")',
    'eq(placementRecruiterCollegeGrants.status,"ACTIVE")',
    'eq(placementRecruiterCollegeGrants.verificationStatus,"VERIFIED")',
    'gt(placementRecruiterCollegeGrants.validUntil,sql`clock_timestamp()`)',
   ])expect(body).toContain(required);
   expect(body).toContain('eq(users.id,context.user.id)');
   expect(body).toContain('eq(users.platformStatus,"ACTIVE")');
  }
 });

});
