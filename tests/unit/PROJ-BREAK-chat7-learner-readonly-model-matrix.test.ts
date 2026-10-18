import {describe,expect,it} from "vitest";
import {summarizeLearnerProjectProgress} from "@/modules/projects/learner-project-progress-model";
import {sortLearnerProjectRows,compareNumberedTeamProjects} from "@/modules/projects/learner-project-sort-model";
import {learnerTaskLane,groupLearnerBoardLanes} from "@/modules/projects/learner-board-lanes-model";
import {learnerBoardPriorityCounts,learnerBoardPriorityFilterHref} from "@/modules/projects/learner-board-priority-model";
import {learnerBoardStatusCounts,learnerBoardStatusFilterHref} from "@/modules/projects/learner-board-summary-model";
import {learnerBoardTaskSelectionNotice} from "@/modules/projects/learner-board-selection-notice-model";
import {learnerProjectActivityLastFetched} from "@/modules/projects/learner-project-activity-cursor-model";
import {learnerProjectActivityPageSummary} from "@/modules/projects/learner-project-activity-page-summary-model";
import {learnerProjectActivityEmptyMessage} from "@/modules/projects/learner-project-activity-empty-model";
import {learnerProjectActivityCsv} from "@/modules/projects/learner-project-activity-csv-model";
import {learnerProjectMatchesSearch} from "@/modules/projects/learner-project-search-model";
import {learnerProjectTabHref} from "@/modules/projects/learner-project-tab-href-model";
import {learnerProjectMobileFilterSummary} from "@/modules/projects/learner-project-mobile-filter-model";
import {learnerProjectListEmptyState} from "@/modules/projects/learner-project-list-empty-model";
import {learnerProjectTaskReviewNotice,learnerProjectDeliveryReviewNotice,
  learnerProjectDeliveryReopenedNotice} from "@/modules/projects/learner-project-review-notification-model";

const projectId="11111111-1111-4111-8111-111111111111";
const taskId="22222222-2222-4222-8222-222222222222";
const sprintId="33333333-3333-4333-8333-333333333333";
const filters={taskSearch:"my project",priority:"",status:"",sprintId:"",releaseId:""};

describe("PROJ-BREAK-LEARNER-99 read-only role journey and data leak regressions",()=>{
  it("keeps unknown progress distinct from 0% and never counts a foreign project",()=>{
    const result=summarizeLearnerProjectProgress(["own","empty"],[
      {projectId:"own",status:"DONE"},{projectId:"own",status:"BLOCKED"},
      {projectId:"foreign",status:"DONE"},
    ]);
    expect(result).toEqual([
      {projectId:"own",totalTasks:2,completedTasks:1,blockedTasks:1,percentage:50},
      {projectId:"empty",totalTasks:0,completedTasks:0,blockedTasks:0,percentage:null},
    ]);
  });
  it("keeps archived Projects last, naturally numbers teams, and does not mutate the authorized rows",()=>{
    const rows=[
      {project:{id:"10",title:"Team 10",status:"ACTIVE",updatedAt:new Date("2099-02-01T00:00:00Z")}},
      {project:{id:"2",title:"Team 2",status:"ACTIVE",updatedAt:new Date("2099-01-01T00:00:00Z")}},
      {project:{id:"archived",title:"Team 1",status:"ARCHIVED",updatedAt:new Date("2099-03-01T00:00:00Z")}},
    ];
    expect(compareNumberedTeamProjects("Team 2","Team 10")).toBeLessThan(0);
    expect(sortLearnerProjectRows(rows,"RECENT",new Map()).map(r=>r.project.id))
      .toEqual(["2","10","archived"]);
    expect(sortLearnerProjectRows(rows,"TITLE",new Map()).map(r=>r.project.id))
      .toEqual(["2","10","archived"]);
    expect(sortLearnerProjectRows(rows,"PROGRESS",new Map([
      ["10",{percentage:10}],["2",{percentage:90}],
    ])).map(r=>r.project.id)).toEqual(["10","2","archived"]);
    expect(rows.map(r=>r.project.id)).toEqual(["10","2","archived"]);
  });
  it("only promotes sprint-active TODO tasks from backlog and never treats unknown states as completed",()=>{
    const sprints=new Map([[sprintId,"ACTIVE"]]);
    expect(learnerTaskLane({status:"TODO",sprintId},sprints)).toBe("TODO");
    expect(learnerTaskLane({status:"TODO",sprintId:null},sprints)).toBe("BACKLOG");
    expect(learnerTaskLane({status:"TODO",sprintId},new Map())).toBe("BACKLOG");
    expect(learnerTaskLane({status:"GARBAGE",sprintId},sprints)).toBe("BACKLOG");
    const lanes=groupLearnerBoardLanes([
      {status:"TODO",sprintId},{status:"BLOCKED",sprintId},{status:"TODO",sprintId:null},
    ],[{id:sprintId,status:"ACTIVE"}]);
    expect(lanes.find(l=>l.id==="TODO")?.tasks).toHaveLength(1);
    expect(lanes.find(l=>l.id==="BLOCKED")?.tasks).toHaveLength(1);
    expect(lanes.find(l=>l.id==="BACKLOG")?.tasks).toHaveLength(1);
    expect(learnerBoardPriorityCounts([
      {priority:"LOW"},{priority:"CRITICAL"},{priority:"FORGED"},
    ])).toEqual({LOW:1,MEDIUM:0,HIGH:0,CRITICAL:1});
    expect(learnerBoardStatusCounts([
      {status:"DONE"},{status:"IN_REVIEW"},{status:"UNKNOWN"},
    ])).toEqual({TODO:0,IN_PROGRESS:0,BLOCKED:0,IN_REVIEW:1,DONE:1});
  });
  it("changes the requested Board filter without dropping authorized sibling filters",()=>{
    const p=new URL(learnerBoardPriorityFilterHref(projectId,{...filters,
      status:"TODO",sprintId,mine:true},"HIGH"),"https://app.example");
    expect(p.searchParams.get("priority")).toBe("HIGH");
    expect(p.searchParams.get("taskStatus")).toBe("TODO");
    expect(p.searchParams.get("assignee")).toBe("mine");
    expect(p.searchParams.get("sprintId")).toBe(sprintId);
    const s=new URL(learnerBoardStatusFilterHref(projectId,{...filters,priority:"LOW",
      mine:true},"IN_REVIEW"),"https://app.example");
    expect(s.searchParams.get("taskStatus")).toBe("IN_REVIEW");
    expect(s.searchParams.get("priority")).toBe("LOW");
    expect(s.searchParams.get("assignee")).toBe("mine");
    expect(learnerBoardTaskSelectionNotice(taskId,false)).toContain("unavailable");
    expect(learnerBoardTaskSelectionNotice(taskId,true)).toBeNull();
    expect(learnerBoardTaskSelectionNotice("foreign-bad-uuid",false)).toBeNull();
  });
  it("keeps history cursors tied to fetched authorized rows instead of filtered rows",()=>{
    const page=[{id:"first",cursorOccurredAt:"2099-01-02T00:00:00Z"},
      {id:"last",cursorOccurredAt:"2099-01-01T00:00:00Z"}];
    expect(learnerProjectActivityLastFetched(page)?.id).toBe("last");
    expect(learnerProjectActivityLastFetched([])).toBeUndefined();
    expect(learnerProjectActivityPageSummary(2,5,true))
      .toBe("2 of 5 events match on this loaded page");
    expect(learnerProjectActivityPageSummary(10,5,true))
      .toBe("5 of 5 events match on this loaded page");
    expect(learnerProjectActivityPageSummary(Number.NaN,Number.POSITIVE_INFINITY,true))
      .toBe("0 of 0 events match on this loaded page");
    expect(learnerProjectActivityEmptyMessage({
      valid:true,fetchedCount:5,pageCount:0,searching:false,
      filtered:true,olderPage:false,hasMore:true,
    })).toContain("loaded page");
  });
  it("escapes spreadsheet injection, caps exported cells and limits export to the scoped page",()=>{
    const at=new Date("2099-01-01T00:00:00Z");
    const row={occurredAt:at,actorDisplayName:"=HYPERLINK()",subjectLabel:"+SUM(1)",
      summary:"@"+"a".repeat(300)};
    const csv=learnerProjectActivityCsv(Array.from({length:101},()=>row));
    expect(csv.truncated).toBe(true);
    expect(csv.content.split("\r\n")).toHaveLength(102);
    expect(csv.content).toContain("'=HYPERLINK()");
    expect(csv.content).toContain("'+SUM(1)");
    expect(csv.content).not.toContain("a".repeat(300));
  });
  it("searches only the authorized project summary and preserves safe filters without modal URLs",()=>{
    const project={title:"IIT Dharwad",slug:"team-2",summary:"Capstone"};
    expect(learnerProjectMatchesSearch(project,"Mentor A"," dharwad ")).toBe(true);
    expect(learnerProjectMatchesSearch(project,"Mentor A","private finance")).toBe(false);
    expect(learnerProjectMatchesSearch(project,"Mentor A","x".repeat(101))).toBe(true);
    const query=new URLSearchParams({taskSearch:"capstone",priority:"HIGH",
      taskId,activityCursor:"foreign",page:"999",activityFrom:"2099-01-01"});
    const path=learnerProjectTabHref(projectId,"activity",query);
    expect(path).toContain("taskSearch=capstone");
    expect(path).toContain("activityFrom=2099-01-01");
    expect(path).not.toContain("taskId=");
    expect(path).not.toContain("activityCursor=");
    expect(path).not.toContain("page=");
  });
  it("distinguishes unassigned from filtered-out projects and exposes mobile active filters",()=>{
    expect(learnerProjectListEmptyState(0,0).reason).toBe("NO_ASSIGNMENTS");
    expect(learnerProjectListEmptyState(2,0).reason).toBe("FILTERED_EMPTY");
    expect(learnerProjectListEmptyState(2,2).reason).toBe("HAS_RESULTS");
    const active=learnerProjectMobileFilterSummary({
      search:"capstone",sort:"PROGRESS",work:"BLOCKED",
      status:"CURRENT",attention:"LEARNER_ACTION",pageSize:50,
    });
    expect(active.labels).toEqual(["Search","Progress order","Blocked tasks",
      "Current","Needs my action","50 rows"]);
    expect(active.count).toBe(active.labels.length);
  });
  it("keeps review notices generic with only in-app authorized learner links",()=>{
    const task=learnerProjectTaskReviewNotice({projectId,taskId,decision:"APPROVED"});
    expect(task.title).toBe("Task approved");
    expect(task.actionHref).toContain("tab=board&taskId=");
    const rejected=learnerProjectTaskReviewNotice({projectId,taskId,decision:"REJECTED"});
    expect(rejected.body).not.toContain("reviewer");
    expect(learnerProjectDeliveryReviewNotice(projectId,"APPROVED").actionHref)
      .toBe("/learn/projects/"+projectId+"?tab=delivery");
    expect(learnerProjectDeliveryReviewNotice(projectId,"REJECTED").title)
      .toBe("Changes requested");
    expect(learnerProjectDeliveryReopenedNotice(projectId).body)
      .toContain("reopened");
  });
});
