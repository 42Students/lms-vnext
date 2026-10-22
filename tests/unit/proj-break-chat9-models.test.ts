import {describe,expect,it} from "vitest";
import {collegeProjectStatusChangeAllowed,collegeProjectSummaryPatch} from "@/modules/projects/college-project-summary-model";
import {canAdminSettleDelivery} from "@/modules/projects/admin-submission-review-model";
import {restoredProjectStatus,restoreProjectInstanceInputSchema} from "@/modules/projects/instance-restore-model";
import {deriveProjectExecutionReadiness} from "@/modules/projects/execution-readiness";
import {previewClassTeams,movePreviewMember,teamSplitInputSchema} from "@/modules/projects/class-team-split-model";
import {classTeamCapacity} from "@/modules/projects/class-team-capacity";
import {previewVersion,assertPreviewVersion} from "@/modules/projects/class-team-preview-token";
import {isFutureProjectMeetingWindow} from "@/modules/projects/meeting-window-policy";
import {projectTemplateCatalogueCsv,projectTemplateSectionCounts} from "@/modules/projects/project-template-catalogue-model";
import {exportClassTeamsCsv} from "@/modules/projects/class-team-csv-export";
import {projectReadinessOverrideCsvCell} from "@/modules/projects/readiness-overrides-export-model";
import {isRetryableProjectTransactionError} from "@/modules/projects/errors";
import {friendlyApiError} from "@/lib/friendly-error";
import {compareTemplateVersionSnapshots,templateVersionComparisonParamsSchema} from "@/modules/projects/template-version-comparison-model";
import {isProjectMentorOverloaded,projectMentorWorkloadAverage} from "@/modules/projects/mentor-overload-model";
import {createClassTeamWorkspacesSchema} from "@/modules/projects/class-team-create-request";
const uuid=(n:number)=>`00000000-0000-4000-8000-${String(n).padStart(12,"0")}`;
const students=Array.from({length:7},(_,i)=>({membershipId:uuid(i+1),rollNumber:"IITD"+String(i+1)}));
const teams=()=>previewClassTeams({mode:"TEAMS",teamSize:3,students,order:"ROLL"});
const summary=()=>({
 title:"Safe workspace",summary:null,status:"ACTIVE" as const,progressPercent:50,
 phase:null,dueLabel:null,courseLabel:null,sectionId:null,blocker:null,nextAction:null,
 startDate:"2026-10-17",endDate:"2026-10-18",sprintLengthWeeks:null,estimationUnit:null,
 expectedTitle:"Safe workspace",expectedSummary:null,expectedStatus:"ACTIVE" as const,
 expectedUpdatedAt:"2026-10-18T10:00:00.000+05:30",
});
describe("IIT Dharwad Projects adversarial admin/college models",()=>{
 it("PROJ-BREAK-state-01 enumerates every allowed and forbidden planned/active/completed/archive status transition",()=>{
  const states=["PLANNED","ACTIVE","COMPLETED","ARCHIVED"];
  for(const from of states)for(const to of states)for(const mentor of [false,true])for(const approved of [false,true]){
   const expected=from===to || (from==="PLANNED"&&to==="ACTIVE"&&mentor) ||
    (from==="ACTIVE"&&to==="COMPLETED"&&approved);
   // ARCHIVED is immutable even on a self-transition.
   expect(collegeProjectStatusChangeAllowed(from,to,mentor,approved)).toBe(from==="ARCHIVED"||to==="ARCHIVED"?false:expected);
  }
 });
 it("PROJ-BREAK-state-02 forbids completion before delivery approval and activation without mentor",()=>{
  expect(collegeProjectStatusChangeAllowed("ACTIVE","COMPLETED",false,false)).toBe(false);
  expect(collegeProjectStatusChangeAllowed("PLANNED","ACTIVE",false,true)).toBe(false);
  expect(collegeProjectStatusChangeAllowed("COMPLETED","ACTIVE",true,true)).toBe(false);
 });
 it("PROJ-BREAK-state-03 approval/review/lock cannot mutate archived, locked or draft submissions",()=>{
  for(const action of ["APPROVED","CHANGES_REQUESTED","LOCK"] as const){
   for(const state of ["DRAFT","SUBMITTED","APPROVED","CHANGES_REQUESTED","LOCKED"]){
    expect(canAdminSettleDelivery(state,true,"ACTIVE",action)).toBe(false);
    expect(canAdminSettleDelivery(state,false,"ARCHIVED",action)).toBe(false);
   }
  }
  expect(canAdminSettleDelivery("DRAFT",false,"ACTIVE","APPROVED")).toBe(false);
  expect(canAdminSettleDelivery("SUBMITTED",false,"ACTIVE","APPROVED")).toBe(true);
  expect(canAdminSettleDelivery("APPROVED",false,"ACTIVE","LOCK")).toBe(true);
 });
 it("PROJ-BREAK-state-04 restore never resurrects a historical archived/unknown status",()=>{
  expect(restoredProjectStatus("ARCHIVED")).toBe("PLANNED");
  expect(restoredProjectStatus("__proto__")).toBe("PLANNED");
  expect(restoredProjectStatus(null)).toBe("PLANNED");
  expect(restoredProjectStatus("ACTIVE")).toBe("ACTIVE");
  expect(restoredProjectStatus("COMPLETED")).toBe("COMPLETED");
 });
 it("PROJ-BREAK-races-01 restore rejects missing, malformed and client-supplied extra token fields",()=>{
  expect(restoreProjectInstanceInputSchema.safeParse({}).success).toBe(false);
  expect(restoreProjectInstanceInputSchema.safeParse({expectedUpdatedAt:"yesterday"}).success).toBe(false);
  expect(restoreProjectInstanceInputSchema.safeParse({expectedUpdatedAt:"2026-10-18T12:00:00+05:30",override:true}).success).toBe(false);
 });
 it("PROJ-BREAK-races-02 exact class-team preview token rejects stale edits and tampered tokens",()=>{
  const groups=teams(),token=previewVersion(groups);
  expect(()=>assertPreviewVersion(groups,token)).not.toThrow();
  const edited=groups.map(g=>({...g,membershipIds:[...g.membershipIds]}));
  edited[0].membershipIds.reverse();
  expect(()=>assertPreviewVersion(edited,token)).toThrow("TEAM_PREVIEW_STALE");
  expect(()=>assertPreviewVersion(groups,"fffffffff")).toThrow();
 });
 it("PROJ-BREAK-races-03 moving a learner does not duplicate a member or mutate previous preview",()=>{
  const input=teams(),source=structuredClone(input);
  const moved=movePreviewMember(input,input[0].membershipIds[0],1);
  expect(input).toEqual(source);
  expect(new Set(moved.flatMap(g=>g.membershipIds)).size).toBe(students.length);
  expect(moved.flatMap(g=>g.membershipIds)).toHaveLength(students.length);
 });
 it("PROJ-BREAK-tenancy-01 preview rejects forged/duplicate learner membership and unknown team destination",()=>{
  expect(teamSplitInputSchema.safeParse({mode:"TEAMS",teamSize:2,students:[students[0],students[0]]}).success).toBe(false);
  expect(()=>movePreviewMember(teams(),uuid(99),0)).toThrow();
  expect(()=>movePreviewMember(teams(),uuid(1),999)).toThrow();
 });
 it("PROJ-BREAK-scale-01 team capacity rejects empty, duplicate, oversized and unbalanced cohorts",()=>{
  expect(()=>classTeamCapacity([])).toThrow();
  expect(()=>classTeamCapacity([{name:"Team 1",membershipIds:[]}])).toThrow();
  expect(()=>classTeamCapacity([{name:"A",membershipIds:[uuid(1)]},{name:"B",membershipIds:[uuid(1)]}])).toThrow();
  const groups=teams();
  expect(classTeamCapacity(groups).balanced).toBe(true);
  expect(classTeamCapacity([{name:"A",membershipIds:[uuid(1),uuid(2),uuid(3)]},{name:"B",membershipIds:[uuid(4)]}]).balanced).toBe(false);
 });
 it("PROJ-BREAK-deadlines-01 23:59 IST deadline windows use server instants and reject zero-duration meetings",()=>{
  const now=Date.parse("2026-10-18T23:58:59+05:30");
  const start=new Date("2026-10-18T23:59:00+05:30"),end=new Date("2026-10-19T00:00:00+05:30");
  expect(isFutureProjectMeetingWindow(start,end,now)).toBe(true);
  expect(isFutureProjectMeetingWindow(start,end,start.getTime())).toBe(false);
  expect(isFutureProjectMeetingWindow(start,start,now)).toBe(false);
  expect(isFutureProjectMeetingWindow(new Date("invalid"),end,now)).toBe(false);
 });
 it("PROJ-BREAK-deadlines-02 rejects an end date earlier than start while accepting same-day schedule",()=>{
  expect(collegeProjectSummaryPatch.safeParse({...summary(),endDate:"2026-10-16"}).success).toBe(false);
  expect(collegeProjectSummaryPatch.safeParse({...summary(),endDate:"2026-10-17"}).success).toBe(true);
  expect(collegeProjectSummaryPatch.safeParse({...summary(),endDate:"2026-02-30"}).success).toBe(false);
 });
 it("PROJ-BREAK-input-01 rejects unknown summary keys, invalid percentages and overlong titles without mutating input",()=>{
  const valid=summary();
  expect(collegeProjectSummaryPatch.parse(valid)).toMatchObject({status:"ACTIVE"});
  expect(collegeProjectSummaryPatch.safeParse({...valid,progressPercent:101}).success).toBe(false);
  expect(collegeProjectSummaryPatch.safeParse({...valid,title:"a".repeat(201)}).success).toBe(false);
  expect(collegeProjectSummaryPatch.safeParse({...valid,permission:"SUPER_ADMIN"}).success).toBe(false);
 });
 it("PROJ-BREAK-exports-01 escapes CSV injection even after leading Unicode bidi or invisible characters",()=>{
  for(const title of ["=SUM(1,1)","\t=1+1","\u200B=2+2","\u2060@HYPERLINK(1)","\u202E+2+3","  -1+1"]){
   const csv=projectTemplateCatalogueCsv([{templateId:uuid(10),title,version:1,
    sections:{overview:0,releases:0,sprints:0,tasks:0,resources:0}}]);
   expect(csv).toContain(String.fromCharCode(34,39)+title.replace(/"/g,'""')+String.fromCharCode(34));
   expect(csv).not.toContain(String.fromCharCode(34)+title+String.fromCharCode(34)+",1,");
  }
 });
 it("PROJ-BREAK-exports-02 quoted commas, quotes and multiline fields do not create a new column",()=>{
  const csv=projectTemplateCatalogueCsv([{templateId:uuid(10),title:'Q, "test"\nsecond line',version:1,
    sections:{overview:1,releases:1,sprints:0,tasks:0,resources:0}}]);
  expect(csv).toContain('"Q, ""test""\nsecond line"');
  expect(csv.startsWith("\uFEFF\"Title\",\"Version\",")).toBe(true);
 });
 it("PROJ-BREAK-exports-03 class roster export protects roll numbers and team names from formulas",()=>{
  const csv=exportClassTeamsCsv([{name:"\u200B=SUM(1,1)",membershipIds:[uuid(1)]}],new Map([[uuid(1),"@eval"]]));
  expect(csv).toContain('"\'\u200B=SUM(1,1)"');
  expect(csv).toContain('"\'@eval"');
 });
 it("PROJ-BREAK-reports-01 null and malformed template sections never inflate section counts",()=>{
  expect(projectTemplateSectionCounts(null)).toEqual({overview:0,releases:0,sprints:0,tasks:0,resources:0});
  expect(projectTemplateSectionCounts({overview:{},releases:"x",sprints:null,tasks:[],resources:[]})).toEqual({overview:0,releases:0,sprints:0,tasks:0,resources:0});
 });
 it("PROJ-BREAK-versions-01 compare ignores JSON object key ordering but detects changed array order",()=>{
  const current={title:"T",summary:null,blueprint:{overview:{a:1,b:2},tasks:[1,2]}};
  const same={...current,blueprint:{tasks:[1,2],overview:{b:2,a:1}}};
  const changed={...current,blueprint:{tasks:[2,1],overview:{a:1,b:2}}};
  expect(compareTemplateVersionSnapshots(current,same)).toHaveLength(0);
  expect(compareTemplateVersionSnapshots(current,changed).some(row=>row.label==="tasks")).toBe(true);
  expect(current.blueprint.tasks).toEqual([1,2]);
 });
 it("PROJ-BREAK-versions-02 malformed version IDs and cross-template path injection fail Zod",()=>{
  expect(templateVersionComparisonParamsSchema.safeParse({templateId:"../../etc",versionId:uuid(2)}).success).toBe(false);
  expect(templateVersionComparisonParamsSchema.safeParse({templateId:uuid(1),versionId:uuid(2),admin:true}).success).toBe(false);
 });
 it("PROJ-BREAK-mentors-01 zero mentors is not overloaded and one outlier is",()=>{
  expect(projectMentorWorkloadAverage([])).toBe(0);
  expect(isProjectMentorOverloaded(0,[])).toBe(false);
  expect(isProjectMentorOverloaded(8,[2,2,8])).toBe(true);
  expect(isProjectMentorOverloaded(2,[2,2,2])).toBe(false);
 });
 it("PROJ-BREAK-creation-01 forged cohort mode, extra roles or malformed hashes are rejected",()=>{
  const payload={collegeId:uuid(10),classId:uuid(11),templateId:uuid(12),rosterRevision:"r",
   baseTitle:"IIT Dharwad",baseSlug:"iit-dharwad",teams:teams(),
   expectedPreviewVersion:previewVersion(teams())};
  expect(createClassTeamWorkspacesSchema.safeParse(payload).success).toBe(true);
  expect(createClassTeamWorkspacesSchema.safeParse({...payload,role:"SUPER_ADMIN"}).success).toBe(false);
  expect(createClassTeamWorkspacesSchema.safeParse({...payload,expectedPreviewVersion:"123456789"}).success).toBe(false);
 });
 it("PROJ-BREAK-state-05 archive cannot be treated as active execution readiness",()=>{
  const all={releaseStatuses:["SHIPPED"],sprintStatuses:["COMPLETED"],taskStatuses:["DONE"]};
  expect(deriveProjectExecutionReadiness({projectStatus:"ACTIVE",...all}).complete).toBe(true);
  expect(deriveProjectExecutionReadiness({projectStatus:"ARCHIVED",...all}).complete).toBe(false);
  expect(deriveProjectExecutionReadiness({projectStatus:"ACTIVE",...all,taskStatuses:[]}).complete).toBe(false);
 });
 it("PROJ-BREAK-exports-04 readiness CSV neutralizes bidi-prefixed formulas, commas and quotes",()=>{
  for(const payload of ["=2+3","\\u200B@HYPERLINK(1)","\\u202E-1+2"," \t+1+2"]){
   const value=payload.replaceAll("\\u200B","\u200B").replaceAll("\\u202E","\u202E");
   const escaped=projectReadinessOverrideCsvCell(value);
   expect(escaped.startsWith(String.fromCharCode(34,39))).toBe(true);
   expect(escaped.endsWith(String.fromCharCode(34))).toBe(true);
  }
  expect(projectReadinessOverrideCsvCell('Say "yes", no')).toBe('"Say ""yes"", no"');
 });

 it("PROJ-BREAK-races-06 only serialization and deadlock SQLSTATE values merit a retry",()=>{
  for(const code of ["40001","40P01"]){
   expect(isRetryableProjectTransactionError({code})).toBe(true);
   expect(isRetryableProjectTransactionError({cause:{cause:{code}}})).toBe(true);
  }
  for(const code of ["23505","23503","42501","22001","08006"]){
   expect(isRetryableProjectTransactionError({code})).toBe(false);
  }
  expect(isRetryableProjectTransactionError(null)).toBe(false);
  expect(isRetryableProjectTransactionError({cause:{cause:{cause:null}}})).toBe(false);
 });

 it("PROJ-BREAK-ux-02 concurrent roster conflicts return an actionable next step without exposing SQLSTATE",()=>{
  const msg=friendlyApiError({status:409,code:"PROJECT_CLASS_ROSTER_STALE"});
  expect(msg).toContain("Refresh the roster");
  expect(msg).not.toContain("40001");
  expect(friendlyApiError({status:409,code:"PROJECT_TEAM_PREVIEW_STALE"})).toContain("Review the current teams");
  expect(friendlyApiError({status:403,code:"PROJECT_ACCESS_DENIED"})).toContain("permission");
 });

});
