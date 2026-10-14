import {describe,expect,it} from "vitest";
import {mentorBoardReview,mentorBoardReviewQuerySchema,
  mentorBoardReviewHref,mentorBoardExportCsv,mentorSprintSummaryCsv} from "@/modules/projects/mentor-board-review-model";
const projectId="00000000-0000-4000-8000-000000000001";
const sprintId="00000000-0000-4000-8000-000000000002";
const query=mentorBoardReviewQuerySchema.parse({
  projectId,status:"ALL",priority:"HIGH",sprintId,search:"",page:1,
});
describe("Mentor board sprint/priority filters and safe CSV",()=>{
  it("filters status, priority and exact sprint together",()=>{
    const view=mentorBoardReview([
      {id:"a",sprintId,title:"=cmd",status:"BLOCKED",priority:"HIGH",sequence:0},
      {id:"b",sprintId,title:"Normal",status:"TODO",priority:"LOW",sequence:1},
      {id:"c",sprintId:"other",title:"Other",status:"TODO",priority:"HIGH",sequence:2},
    ],[{id:sprintId,title:"Sprint A",sequence:0}],query);
    expect(view.total).toBe(1);
    expect(view.items[0]?.id).toBe("a");
    expect(view.exportOmitted).toBe(0);
    expect(view.sprintSummaries).toEqual([expect.objectContaining({
      id:sprintId,registeredTasks:2,matchingTasks:1,blocked:1,
      matchingDonePercent:0,
    })]);
    expect(mentorSprintSummaryCsv(view.sprintSummaryExportItems,0))
      .toContain("Sprint A");
    expect(mentorBoardReviewHref(query)).toContain("sprintId=");
    expect(mentorBoardExportCsv(view.exportItems,0)).toContain("'=cmd");
  });
  it("distinguishes zero filtered work from completed work, and caps sprint exports",()=>{
    const sprints=Array.from({length:102},(_,index)=>({
      id:"s"+index,title:index===0?"=Formula":"Sprint "+index,sequence:index,
    }));
    const view=mentorBoardReview([],sprints,{
      ...query,sprintId:"ALL",priority:"ALL",
    });
    expect(view.sprintSummaries[0]?.matchingDonePercent).toBeNull();
    expect(view.sprintSummaryExportItems).toHaveLength(100);
    expect(view.sprintSummaryExportOmitted).toBe(2);
    const csv=mentorSprintSummaryCsv(view.sprintSummaryExportItems,2);
    expect(csv).toContain("'=Formula");
    expect(csv).toContain("Unknown");
    expect(csv).toContain("2 additional matching Sprints");
  });
  it("bounds exports to 500 and prevents forged selectors",()=>{
    const rows=Array.from({length:503},(_,index)=>({
      id:String(index),sprintId,title:"-sheet",status:"TODO",priority:"HIGH",sequence:index,
    }));
    const view=mentorBoardReview(rows,[{id:sprintId,title:"Sprint",sequence:0}],query);
    expect(view.exportItems).toHaveLength(500);
    expect(view.exportOmitted).toBe(3);
    const csv=mentorBoardExportCsv(view.exportItems,view.exportOmitted);
    expect(csv).toContain("3 additional matching tasks");
    expect(csv).toContain("'-sheet");
    expect(mentorBoardReviewQuerySchema.safeParse({...query,collegeId:projectId}).success).toBe(false);
    expect(mentorBoardReviewQuerySchema.safeParse({...query,sprintId:"no"}).success).toBe(false);
  });
});
