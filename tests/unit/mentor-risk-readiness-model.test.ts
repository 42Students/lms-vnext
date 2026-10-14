import {describe,expect,it} from "vitest";
import {mentorRiskReadiness,mentorRiskReadinessQuerySchema,mentorRiskReadinessHref}
  from "@/modules/projects/mentor-risk-readiness-model";
const projectId="00000000-0000-4000-8000-000000000001";
const query={projectId,focus:"ALL" as const,taskPriority:"ALL" as const,page:1};
describe("Mentor recorded risk and readiness",()=>{
  it("links actual task, meeting, and final-delivery status",()=>{
    const data=mentorRiskReadiness({
      projectId,projectStatus:"ACTIVE",
      releases:[{id:"r",title:"R1",status:"IN_PROGRESS"}],
      sprints:[{id:"s",title:"Sprint",status:"ACTIVE"}],
      tasks:[{id:"t1",title:"Blocked",status:"BLOCKED",priority:"HIGH",sprintId:"s"},
        {id:"t2",title:"Review",status:"IN_REVIEW",priority:"LOW",sprintId:"s"}],
      meetings:[{id:"m",title:"Standup",status:"REQUESTED",
        startsAt:new Date("2026-10-01T08:00:00Z")},
        {id:"m2",title:"Unclosed review",status:"SCHEDULED",
        startsAt:new Date("2026-10-01T08:00:00Z")}],
      latestSubmissionStatus:"SUBMITTED",finalApproved:false,evaluationRecorded:false,
    },query,new Date("2026-10-14T10:00:00Z"));
    expect(data).toMatchObject({riskCount:5,counts:{
      blockedTasks:1,reviewTasks:1,pendingMeetings:1,scheduledPastDay:1,incompleteTasks:2,
    }});
    expect(data.items).toEqual(expect.arrayContaining([
      expect.objectContaining({key:"blocked:t1",href:expect.stringContaining("mentor-task-t1")}),
      expect.objectContaining({key:"final-review",category:"RISK"}),
      expect.objectContaining({key:"scheduled-past:m2",category:"RISK"}),
      expect.objectContaining({key:"release:r",category:"READINESS"}),
    ]));
    expect(mentorRiskReadinessHref({...query,focus:"RISK",page:2})).toContain("focus=RISK");
  });
  it("filters task drill-ins by registered priority, not unrelated meetings",()=>{
    const view=mentorRiskReadiness({
      projectId,projectStatus:"ACTIVE",releases:[],sprints:[],
      tasks:[{id:"h",title:"High",status:"BLOCKED",priority:"HIGH",sprintId:"s"},
        {id:"l",title:"Low",status:"BLOCKED",priority:"LOW",sprintId:"s"}],
      meetings:[],latestSubmissionStatus:null,finalApproved:false,
      evaluationRecorded:false,
    },{...query,taskPriority:"HIGH"});
    expect(view.items.some(x=>x.key==="blocked:h")).toBe(true);
    expect(view.items.some(x=>x.key==="blocked:l")).toBe(false);
    expect(view.counts.blockedTasks).toBe(2);
    expect(mentorRiskReadinessHref({...query,taskPriority:"HIGH"}))
      .toContain("taskPriority=HIGH");
    expect(mentorRiskReadinessQuerySchema.safeParse({...query,taskPriority:"SUPER"}).success)
      .toBe(false);
  });
  it("treats absent registered work as unknown rather than complete",()=>{
    const data=mentorRiskReadiness({projectId,projectStatus:"PLANNED",
      releases:[],sprints:[],tasks:[],meetings:[],latestSubmissionStatus:null,
      finalApproved:false,evaluationRecorded:false},query);
    expect(data.riskCount).toBe(0);
    expect(data.readinessGapCount).toBeGreaterThan(0);
    expect(data.items.some(row=>row.key==="tasks-none")).toBe(true);
    expect(mentorRiskReadinessQuerySchema.safeParse({...query,collegeId:projectId}).success).toBe(false);
    expect(mentorRiskReadinessQuerySchema.safeParse({...query,focus:"HIGH"}).success).toBe(false);
  });
});
