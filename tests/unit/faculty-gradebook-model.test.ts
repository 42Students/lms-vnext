import {describe,expect,it} from "vitest";
import {facultyGradebookCsv,facultyGradebookParamsSchema,facultyPublishedGradeRows,
  facultyPublishedLearnerBreakdown,facultyGradebookViewQuerySchema,
  paginateFacultyGradebookRows,facultyGradebookViewHref}
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
    expect(csv).not.toContain("+unsafe@x.y");
    expect(csv).not.toContain('"Email"');
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
  it("paginates and searches only authorized learner rows without changing grade totals",()=>{
    const learners=Array.from({length:62},(_,i)=>({
      membershipId:"learner-"+String(i).padStart(3,"0"),
      displayName:"Student "+String(i).padStart(3,"0"),
      rollNumber:"R"+String(i+1),email:"student"+i+"@example.test",
    }));
    const query=facultyGradebookViewQuerySchema.parse({search:"",page:"2"});
    const second=paginateFacultyGradebookRows(learners,query);
    expect(second).toMatchObject({total:62,matching:62,page:2,pageSize:25,totalPages:3});
    expect(second.items).toHaveLength(25);
    expect(new Set(second.items.map(x=>x.membershipId)).size).toBe(25);
    const filtered=paginateFacultyGradebookRows(learners,
      facultyGradebookViewQuerySchema.parse({search:" student12@example.test ",page:"7"}));
    expect(filtered).toMatchObject({total:62,matching:1,page:1,totalPages:1});
    expect(filtered.items[0]?.membershipId).toBe("learner-012");
    expect(learners).toHaveLength(62);
  });
  it("rejects forged gradebook view selectors and preserves safe pagination links",()=>{
    const deliveryId="00000000-0000-4000-8000-000000000001";
    expect(facultyGradebookViewQuerySchema.safeParse({collegeId:deliveryId}).success).toBe(false);
    expect(facultyGradebookViewQuerySchema.safeParse({search:"x".repeat(121)}).success).toBe(false);
    expect(facultyGradebookViewQuerySchema.safeParse({page:["1","2"]}).success).toBe(false);
    expect(facultyGradebookViewQuerySchema.safeParse({page:"0"}).success).toBe(false);
    expect(facultyGradebookViewHref(deliveryId,{search:"Anu & Co",page:3}))
      .toBe("/teacher/courses/"+deliveryId+"/gradebook?search=Anu+%26+Co&page=3");
  });
  it("does not count invalid persisted scores as a recorded published grade",()=>{
    const rows=facultyPublishedGradeRows(roster,[
      {membershipId:"a",kind:"QUIZ",assessmentId:"q1",earned:Number.NaN,possible:10},
      {membershipId:"a",kind:"ASSIGNMENT",assessmentId:"q2",earned:11,possible:10},
      {membershipId:"a",kind:"ASSIGNMENT",assessmentId:"q3",earned:-1,possible:10},
      {membershipId:"a",kind:"QUIZ",assessmentId:"q4",earned:5,possible:0},
    ],4);
    expect(rows[0]).toMatchObject({gradedCount:0,earned:null,possible:null,
      percent:null,hasUnknown:true});
  });
});
