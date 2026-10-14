import {describe,expect,it} from "vitest";
import {mentorProjectTimeline,mentorTimelineHref,mentorTimelineQuerySchema}
  from "@/modules/projects/mentor-project-timeline-model";
const id="00000000-0000-4000-8000-000000000001";
describe("Mentor factual Release/Sprint timeline",()=>{
  const query={projectId:id,releaseStatus:"ALL" as const,page:1};
  it("orders registered releases and counts actual task statuses",()=>{
    const releases=[{id:"r2",title:"Later",sequence:1,status:"PLANNED"},
      {id:"r1",title:"First",sequence:0,status:"IN_PROGRESS"}];
    const sprints=[{id:"s1",releaseId:"r1",title:"Sprint",sequence:0,status:"ACTIVE"}];
    const tasks=[{sprintId:"s1",status:"DONE"},{sprintId:"s1",status:"BLOCKED"}];
    const view=mentorProjectTimeline(releases,sprints,tasks,query);
    expect(view.items.map(r=>r.id)).toEqual(["r1","r2"]);
    expect(view.items[0]?.sprints).toMatchObject([{taskCount:2,doneCount:1,progressPercent:50}]);
    expect(mentorProjectTimeline(releases,sprints,[],query).items[0]?.sprints[0]?.progressPercent)
      .toBeNull();
  });
  it("does not invent missing Releases",()=>{
    expect(mentorProjectTimeline([],[],[],{...query,page:999}))
      .toMatchObject({total:0,page:1,totalPages:1,items:[]});
    expect(mentorProjectTimeline([{id:"r",title:"R",sequence:0,status:"PLANNED"}],
      [],[],{...query,releaseStatus:"SHIPPED"}).items).toEqual([]);
  });
  it("rejects tenant selectors and unregistered lifecycle states",()=>{
    expect(mentorTimelineQuerySchema.safeParse({projectId:id}).success).toBe(true);
    expect(mentorTimelineQuerySchema.safeParse({projectId:id,collegeId:id}).success).toBe(false);
    expect(mentorTimelineQuerySchema.safeParse({projectId:id,releaseStatus:"CLOSED"}).success).toBe(false);
    expect(mentorTimelineQuerySchema.safeParse({projectId:id,sprintStatus:"SHIPPED"}).success).toBe(false);
    const releases=[{id:"r1",title:"One",sequence:0,status:"IN_PROGRESS"},
      {id:"r2",title:"Two",sequence:1,status:"PLANNED"}];
    const sprints=[{id:"s",releaseId:"r1",title:"Working",sequence:0,status:"ACTIVE"}];
    expect(mentorProjectTimeline(releases,sprints,[],{...query,sprintStatus:"ACTIVE"}).total).toBe(1);
    expect(mentorProjectTimeline(releases,sprints,[],{...query,sprintStatus:"PLANNED"}).total).toBe(0);
    expect(mentorTimelineHref({...query,sprintStatus:"ACTIVE",page:2})).toContain("sprintStatus=ACTIVE&page=2");
    expect(mentorTimelineHref({...query,releaseStatus:"SHIPPED",page:2}))
      .toBe("/mentor/projects/"+id+"/timeline?releaseStatus=SHIPPED&page=2");
  });
});
