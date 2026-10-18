import {describe,expect,it} from "vitest";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {
  mentorProjectTimeline,mentorTimelineHref,mentorTimelineQuerySchema,
} from "@/modules/projects/mentor-project-timeline-model";
import {
  mentorReviewExportCsv,mentorReviewExportHref,
} from "@/modules/projects/mentor-review-export-model";
import {
  mentorPortfolioActivityCutoff,mentorActivityPagination,
  mentorActivityProjectTitleMatch,mentorActivityFormLayout,
  mentorDeliveryReviewMobileForm,mentorReviewQuerySchema,
} from "@/modules/projects/mentor-portfolio-model";
import {mentorTaskReviewMobileLayout,mentorTaskReviewMobileFilters} from "@/modules/projects/mentor-task-review-model";
import {mentorProjectActivityMobileLayout,mentorProjectActivityMobileFilters} from "@/modules/projects/mentor-project-activity-model";
import {mentorResourceDirectoryFilterLayout} from "@/modules/projects/mentor-resource-directory-layout-model";
import {mentorSprintCreateParamsSchema,mentorSprintTransitionParamsSchema} from "@/modules/projects/mentor-sprint-write-model";
import {mentorSprintDetailsParamsSchema} from "@/modules/projects/mentor-sprint-details-model";
import {mentorTaskCreateParamsSchema} from "@/modules/projects/mentor-task-create-model";
import {mentorTaskDetailsParamsSchema} from "@/modules/projects/mentor-task-details-model";
import {mentorTaskTransitionParamsSchema} from "@/modules/projects/mentor-task-transition-model";
import {projectResourceAuditInput} from "@/modules/projects/mentor-resource-audit-model";
import {projectTeamAuditInput} from "@/modules/projects/mentor-team-audit-model";

const projectId="11111111-1111-4111-8111-111111111111";
const releaseId="22222222-2222-4222-8222-222222222222";
const sprintId="33333333-3333-4333-8333-333333333333";
const taskId="44444444-4444-4444-8444-444444444444";
const scope={projectId,collegeId:"55555555-5555-4555-8555-555555555555",
 organizationId:"66666666-6666-4666-8666-666666666666"};

describe("PROJ-BREAK-MENTOR-148..163 uncovered mentor model behaviours",()=>{
 it("PROJ-BREAK-MENTOR-148 timeline includes only matching releases and sprint states with persisted task progress",()=>{
  const releases=[
   {id:releaseId,title:"R1",sequence:1,status:"IN_PROGRESS"},
   {id:"77777777-7777-4777-8777-777777777777",title:"R2",sequence:2,status:"PLANNED"},
  ];
  const sprints=[
   {id:sprintId,releaseId,title:"Sprint A",sequence:1,status:"ACTIVE"},
   {id:"88888888-8888-4888-8888-888888888888",releaseId,title:"Sprint B",sequence:2,status:"COMPLETED"},
  ];
  const tasks=[{sprintId,status:"DONE"},{sprintId,status:"BLOCKED"},
   {sprintId:"88888888-8888-4888-8888-888888888888",status:"DONE"}];
  const result=mentorProjectTimeline(releases,sprints,tasks,
   {projectId,releaseStatus:"IN_PROGRESS",sprintStatus:"ACTIVE",page:20});
  expect(result.total).toBe(1);
  expect(result.page).toBe(1);
  expect(result.items).toHaveLength(1);
  expect(result.items[0]?.sprints).toMatchObject([{id:sprintId,taskCount:2,doneCount:1,progressPercent:50}]);
  expect(mentorProjectTimeline(releases,sprints,tasks,
   {projectId,releaseStatus:"PLANNED",sprintStatus:"ACTIVE",page:1}).items).toEqual([]);
 });
 it("PROJ-BREAK-MENTOR-149 timeline validates scope and reconstructs only safe filters",()=>{
  expect(mentorTimelineQuerySchema.safeParse({projectId,page:"0"}).success).toBe(false);
  expect(mentorTimelineQuerySchema.safeParse({projectId,releaseStatus:"ARCHIVED"}).success).toBe(false);
  expect(mentorTimelineQuerySchema.safeParse({projectId,otherCollegeId:scope.collegeId}).success).toBe(false);
  expect(mentorTimelineQuerySchema.parse({projectId,page:"2"}).page).toBe(2);
  expect(mentorTimelineHref({projectId,releaseStatus:"PLANNED",sprintStatus:"ACTIVE",page:2}))
   .toBe("/mentor/projects/"+projectId+"/timeline?releaseStatus=PLANNED&sprintStatus=ACTIVE&page=2");
 });
 it("PROJ-BREAK-MENTOR-150 review export keeps assignment filters, drops pagination and never exposes notes",()=>{
  const query=mentorReviewQuerySchema.parse({search:"Atlas",assignment:"PRIMARY",page:8,pageSize:50});
  const href=mentorReviewExportHref(query);
  expect(href).toContain("search=Atlas");
  expect(href).toContain("assignment=PRIMARY");
  expect(href).not.toContain("page=8");
  expect(href).not.toContain("pageSize=50");
  expect(href).toMatch(/^\/api\/mentor\/reviews\/export/);
 });
 it("PROJ-BREAK-MENTOR-151 review CSV neutralizes invisible formulas, invalid times, and enforces 200 rows",()=>{
  const rows=Array.from({length:202},(_,i)=>({
   projectId:i===0?"=SUM(1,2)":projectId,
   projectTitle:i===0?"\u200B=HYPERLINK(\"evil\")":"Project "+i,
   occurredAt:i===1?new Date(Number.NaN):new Date("2099-01-01T05:00:00Z"),
  }));
  const csv=mentorReviewExportCsv(rows,4);
  expect(csv).toContain("Submitted (IST)");
  expect(csv).toContain("'=SUM(1,2)");
  expect(csv).toContain("'\u200B=HYPERLINK");
  expect(csv).toContain("Unknown");
  expect(csv).toContain("6 more matching deliveries");
  expect(csv.split("\r\n")).toHaveLength(203);
  expect(csv).not.toContain("learner_email");
 });
 it("PROJ-BREAK-MENTOR-152 mentor activity cutoff and paging are monotonic and bounded",()=>{
  const now=new Date("2099-01-31T00:00:00.000Z");
  expect(mentorPortfolioActivityCutoff("ALL",now)).toBeNull();
  expect(mentorPortfolioActivityCutoff("PAST_7_DAYS",now)?.toISOString()).toBe("2099-01-24T00:00:00.000Z");
  expect(mentorPortfolioActivityCutoff("PAST_90_DAYS",now)?.getTime())
   .toBeLessThan(mentorPortfolioActivityCutoff("PAST_30_DAYS",now)!.getTime());
  expect(mentorActivityPagination(0,99,20)).toMatchObject({total:0,page:1,totalPages:1});
  expect(mentorActivityPagination(51,999,20)).toMatchObject({total:51,page:3,totalPages:3});
  expect(mentorActivityPagination(Number.NaN,Number.POSITIVE_INFINITY,0))
   .toEqual({total:0,page:1,pageSize:20,totalPages:1});
  expect(mentorActivityPagination(-8,-4,250))
   .toEqual({total:0,page:1,pageSize:20,totalPages:1});
  expect(mentorActivityPagination(50,1.5,10))
   .toEqual({total:50,page:1,pageSize:10,totalPages:5});
  expect(mentorActivityProjectTitleMatch("IIT Dharwad Capstone","dHaRwAd")).toBe(true);
  expect(mentorActivityProjectTitleMatch("Atlas","Elsewhere")).toBe(false);
 });
 it("PROJ-BREAK-MENTOR-153 mentor filter layouts keep 375px screen controls shrinkable",()=>{
  for(const classes of [mentorActivityFormLayout,mentorDeliveryReviewMobileForm,
   mentorTaskReviewMobileLayout,mentorTaskReviewMobileFilters,
   mentorProjectActivityMobileLayout,mentorProjectActivityMobileFilters,
   mentorResourceDirectoryFilterLayout]){
   expect(classes).toContain("min-w-0");
   expect(classes).toContain("max-w-full");
  }
 });
 it("PROJ-BREAK-MENTOR-200 mobile resource and activity selectors remain shrinkable",()=>{
  expect(mentorProjectActivityMobileLayout).toContain("overflow-x-clip");
  expect(mentorProjectActivityMobileFilters).toContain("[&_select]:min-w-0");
  expect(mentorResourceDirectoryFilterLayout).toContain("[&_input]:max-w-full");
 });
 it("PROJ-BREAK-MENTOR-154 mentor sprint param schemas fail closed on forged IDs and duplicate scope",()=>{
  expect(mentorSprintCreateParamsSchema.safeParse({projectId}).success).toBe(true);
  expect(mentorSprintCreateParamsSchema.safeParse({projectId,otherCollegeId:scope.collegeId}).success).toBe(false);
  expect(mentorSprintTransitionParamsSchema.safeParse({projectId,sprintId}).success).toBe(true);
  expect(mentorSprintTransitionParamsSchema.safeParse({projectId,sprintId:"../../other"}).success).toBe(false);
  expect(mentorSprintDetailsParamsSchema.safeParse({projectId,sprintId}).success).toBe(true);
  expect(mentorSprintDetailsParamsSchema.safeParse({projectId,sprintId:123}).success).toBe(false);
 });
 it("PROJ-BREAK-MENTOR-155 task param schemas reject URL IDOR and posted membership scope",()=>{
  for(const schema of [mentorTaskDetailsParamsSchema,mentorTaskTransitionParamsSchema]){
   expect(schema.safeParse({projectId,taskId}).success).toBe(true);
   expect(schema.safeParse({projectId,taskId,organizationId:scope.organizationId}).success).toBe(false);
   expect(schema.safeParse({projectId,taskId:"../foreign"}).success).toBe(false);
  }
  expect(mentorTaskCreateParamsSchema.safeParse({projectId}).success).toBe(true);
  expect(mentorTaskCreateParamsSchema.safeParse({projectId,role:"MENTOR"}).success).toBe(false);
 });
 it("PROJ-BREAK-MENTOR-156 resource audit records only registered action and identifiers",()=>{
  const resource={id:releaseId,title:"Architecture notes"};
  for(const action of ["CREATED","UPDATED","ARCHIVED"] as const){
   const audit=projectResourceAuditInput(action,scope,resource,"revision1");
   expect(audit.collegeId).toBe(scope.collegeId);
   expect(audit.organizationId).toBe(scope.organizationId);
   expect(audit.metadata).toEqual({projectId,resourceId:releaseId});
   expect(audit.dedupeKey).toContain("revision1");
   expect(JSON.stringify(audit)).not.toContain("privateUrl");
  }
  expect(projectResourceAuditInput("CREATED",scope,resource).eventType)
   .toBe(ACTIVITY_EVENT_TYPES.PROJECTS_RESOURCE_CREATED);
 });
 it("PROJ-BREAK-MENTOR-157 team audit never copies learner contacts and uses distinct action dedupe",()=>{
  const member={id:taskId,role:"LEARNER"};
  const added=projectTeamAuditInput("ADDED",scope,member,"v1");
  const updated=projectTeamAuditInput("UPDATED",scope,member,"v2");
  const ended=projectTeamAuditInput("ENDED",scope,member,"v3");
  expect(added.eventType).toBe(ACTIVITY_EVENT_TYPES.PROJECTS_TEAM_MEMBER_ADDED);
  expect(updated.eventType).toBe(ACTIVITY_EVENT_TYPES.PROJECTS_TEAM_MEMBER_UPDATED);
  expect(ended.eventType).toBe(ACTIVITY_EVENT_TYPES.PROJECTS_TEAM_MEMBER_ENDED);
  expect(new Set([added.dedupeKey,updated.dedupeKey,ended.dedupeKey]).size).toBe(3);
  expect(added.metadata).toEqual({projectId,projectMemberId:taskId,role:"LEARNER"});
  expect(added.subjectLabel).toBe("Project team membership");
  expect(JSON.stringify(added)).not.toContain("@");
 });
});
