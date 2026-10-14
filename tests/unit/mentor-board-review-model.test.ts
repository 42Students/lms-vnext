import {describe,expect,it} from "vitest";
import {mentorBoardReview,mentorBoardReviewQuerySchema,mentorBoardReviewHref}
  from "@/modules/projects/mentor-board-review-model";
const query={projectId:"00000000-0000-4000-8000-000000000001",
  status:"ALL" as const,search:"",page:1};
describe("Mentor registered project board read",()=>{
  it("separates actual registered states from absent workload evidence",()=>{
    const view=mentorBoardReview([
      {id:"a",sprintId:"s",title:"Draft",status:"TODO",priority:"HIGH",sequence:0},
      {id:"b",sprintId:"s",title:"Review",status:"IN_REVIEW",priority:"MEDIUM",sequence:1},
      {id:"c",sprintId:"s",title:"Done",status:"DONE",priority:"LOW",sequence:2},
    ],[{id:"s",title:"Sprint A",sequence:0}],query);
    expect(view).toMatchObject({count:3,total:3,completedPercent:33,
      totals:{TODO:1,IN_REVIEW:1,DONE:1,BLOCKED:0,IN_PROGRESS:0}});
    expect(view.items[1]?.sprintTitle).toBe("Sprint A");
  });
  it("keeps zero-task progress unknown and denies caller-supplied college",()=>{
    expect(mentorBoardReview([],[],query).completedPercent).toBeNull();
    expect(mentorBoardReviewQuerySchema.safeParse({...query,collegeId:query.projectId}).success)
      .toBe(false);
    expect(mentorBoardReviewHref(query)).toBe("/mentor/projects/"+query.projectId+"/board-review");
  });
});
