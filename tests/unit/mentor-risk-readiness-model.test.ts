import {describe,expect,it} from "vitest";
import {mentorRiskReadiness,mentorRiskReadinessQuerySchema,mentorRiskReadinessHref}
  from "@/modules/projects/mentor-risk-readiness-model";
const projectId="00000000-0000-4000-8000-000000000001";
const query={projectId,focus:"ALL" as const,page:1};
describe("Mentor recorded risk and readiness",()=>{
  it("links actual task, meeting, and final-delivery status",()=>{
    const data=mentorRiskReadiness({
      projectId,projectStatus:"ACTIVE",
      releases:[{id:"r",title:"R1",status:"IN_PROGRESS"}],
      sprints:[{id:"s",title:"Sprint",status:"ACTIVE"}],
      tasks:[{id:"t1",title:"Blocked",status:"BLOCKED",priority:"HIGH",sprintId:"s"},
        {id:"t2",title:"Review",status:"IN_REVIEW",priority:"LOW",sprintId:"s"}],
      meetings:[{id:"m",title:"Standup",status:"REQUESTED"}],
      latestSubmissionStatus:"SUBMITTED",finalApproved:false,evaluationRecorded:false,
    },query);
    expect(data).toMatchObject({riskCount:4,counts:{
      blockedTasks:1,reviewTasks:1,pendingMeetings:1,incompleteTasks:2,
    }});
    expect(data.items).toEqual(expect.arrayContaining([
      expect.objectContaining({key:"blocked:t1",href:expect.stringContaining("mentor-task-t1")}),
      expect.objectContaining({key:"final-review",category:"RISK"}),
      expect.objectContaining({key:"release:r",category:"READINESS"}),
    ]));
    expect(mentorRiskReadinessHref({...query,focus:"RISK",page:2})).toContain("focus=RISK");
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
