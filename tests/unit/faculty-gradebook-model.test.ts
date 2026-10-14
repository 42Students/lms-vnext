import {describe,expect,it} from "vitest";
import {facultyGradebookCsv,facultyGradebookParamsSchema,facultyPublishedGradeRows,
  facultyPublishedLearnerBreakdown}
  from "@/modules/courses/faculty-gradebook-model";
const roster=[
  {membershipId:"a",displayName:" =NOW()",email:"+unsafe@x.y",rollNumber:"@SUM(1,2)"},
  {membershipId:"b",displayName:"Student B",email:null,rollNumber:null},
];
describe("Faculty published Section gradebook",()=>{
  it("totals only passed published scores and does not invent zeros",()=>{
    const rows=facultyPublishedGradeRows(roster,[
      {membershipId:"a",earned:8,possible:10,kind:"ASSIGNMENT",assessmentId:"q1"},
      {membershipId:"a",earned:9,possible:10,kind:"ASSIGNMENT",assessmentId:"q1"},
      {membershipId:"foreign",earned:10,possible:10,kind:"QUIZ",assessmentId:"q2"},
    ],2);
    expect(rows[0]).toMatchObject({earned:8,possible:10,percent:80,
      gradedCount:1,publishedAssessments:2,hasUnknown:true});
    expect(rows[1]).toMatchObject({earned:null,possible:null,percent:null,
      gradedCount:0,hasUnknown:true});
  });
  it("retains recorded zero as real only when zero is published",()=>{
    const rows=facultyPublishedGradeRows(roster,[
      {membershipId:"a",earned:0,possible:10,kind:"QUIZ",assessmentId:"q"},
    ],1);
    expect(rows[0]).toMatchObject({earned:0,percent:0,hasUnknown:false});
  });
  it("neutralizes spreadsheet formulas for roster fields",()=>{
    const csv=facultyGradebookCsv(facultyPublishedGradeRows(roster,[],0));
    expect(csv).toContain('"\' =NOW()"');
    expect(csv).toContain('"\'+unsafe@x.y"');
    expect(csv).toContain('"\'@SUM(1,2)"');
  });
  it("validates only the UUID delivery selector",()=>{
    const id="00000000-0000-4000-8000-000000000001";
    expect(facultyGradebookParamsSchema.safeParse({deliveryId:id}).success).toBe(true);
    expect(facultyGradebookParamsSchema.safeParse({deliveryId:id,collegeId:id}).success).toBe(false);
  });
  it("drills down only to actually published learner evidence",()=>{
    const details=facultyPublishedLearnerBreakdown("a",[
      {assessmentId:"q1",kind:"ASSIGNMENT",title:"Written task"},
      {assessmentId:"q2",kind:"QUIZ",title:"Knowledge check"},
      {assessmentId:"q3",kind:"ASSIGNMENT",title:"Not graded"},
    ],[
      {membershipId:"a",assessmentId:"q1",kind:"ASSIGNMENT",earned:0,possible:10},
      {membershipId:"other",assessmentId:"q2",kind:"QUIZ",earned:8,possible:10},
    ]);
    expect(details).toEqual([
      {assessmentId:"q1",kind:"ASSIGNMENT",title:"Written task",
        earned:0,possible:10,percent:0,status:"PUBLISHED_SCORE"},
      {assessmentId:"q2",kind:"QUIZ",title:"Knowledge check",
        earned:null,possible:null,percent:null,status:"UNKNOWN"},
      {assessmentId:"q3",kind:"ASSIGNMENT",title:"Not graded",
        earned:null,possible:null,percent:null,status:"UNKNOWN"},
    ]);
  });
});
