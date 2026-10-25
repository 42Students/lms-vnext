import {describe,expect,it} from "vitest";
import {summarizeMentorProjectActivityCounts}
  from "@/modules/projects/mentor-project-activity-counts-model";

describe("Mentor full-history grouped activity totals",()=>{
  it("counts 1240 events beyond any 100-row workspace snapshot",()=>{
    const result=summarizeMentorProjectActivityCounts([
      {eventType:"projects.task.status_changed",total:1100,lastSevenDays:1000},
      {eventType:"projects.meeting.scheduled",total:20,lastSevenDays:15},
      {eventType:"projects.resource.created",total:90,lastSevenDays:30},
      {eventType:"projects.resource.deleted",total:30,lastSevenDays:2},
    ]);
    expect(result.lastSevenDays).toEqual({
      count:1047,task:1000,meeting:15,resource:32,other:0,
    });
    expect(result.resources).toEqual({
      changes:120,added:90,edited:0,saved:0,removed:30,other:0,
    });
  });
  it("keeps edited and saved evidence separate while still reporting both",()=>{
    const result=summarizeMentorProjectActivityCounts([
      {eventType:"projects.resource.updated",total:7,lastSevenDays:1},
      {eventType:"projects_resource_saved",total:4,lastSevenDays:2},
      {eventType:"projects.resource.renamed",total:3,lastSevenDays:0},
      {eventType:"projects.project.updated",total:2,lastSevenDays:1},
    ]);
    expect(result.resources).toEqual({
      changes:14,added:0,edited:7,saved:4,removed:0,other:3,
    });
    expect(result.lastSevenDays.count).toBe(4);
  });
  it("never produces a false zero from inconsistent aggregate rows",()=>{
    expect(()=>summarizeMentorProjectActivityCounts([
      {eventType:"projects.task.created",total:3,lastSevenDays:4},
    ])).toThrow("Invalid grouped project activity counts");
  });
});
