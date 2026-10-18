import {describe,expect,it} from "vitest";
import {friendlyApiError} from "@/lib/friendly-error";
import {facultyGradebookCsv,facultyPublishedGradeRows,
  facultyPublishedLearnerBreakdown,type GradebookScore}
  from "@/modules/courses/faculty-gradebook-model";

const own="11111111-1111-4111-8111-111111111111";
const foreign="22222222-2222-4222-8222-222222222222";
const roster=[{membershipId:own,displayName:"Faculty learner",email:null,rollNumber:"CS-101"}];
const assessments=[
  {kind:"QUIZ" as const,assessmentId:"quiz-1",title:"Quiz 1"},
  {kind:"ASSIGNMENT" as const,assessmentId:"task-1",title:"Assignment 1"},
];

describe("chat-3 Faculty course journey: published-grade integrity",()=>{
  it("FAC-attendance-grades-01 large Section error gives a next step without database identifiers",()=>{
    const message=friendlyApiError({status:409,code:"FACULTY_GRADEBOOK_TOO_MANY_ASSESSMENTS"});
    expect(message).toContain("college administrator");
    expect(message).toContain("100 published assessments");
    expect(message).not.toContain("FACULTY_GRADEBOOK_TOO_MANY_ASSESSMENTS");
  });

  it("FAC-attendance-grades-01 ignores a corrupt first record identically in Section totals and individual breakdown",()=>{
    const records:GradebookScore[]=[
      {membershipId:own,kind:"QUIZ",assessmentId:"quiz-1",earned:Infinity,possible:10},
      {membershipId:own,kind:"QUIZ",assessmentId:"quiz-1",earned:7,possible:10},
      {membershipId:own,kind:"ASSIGNMENT",assessmentId:"task-1",earned:0,possible:20},
    ];
    const row=facultyPublishedGradeRows(roster,records,2)[0]!;
    const detail=facultyPublishedLearnerBreakdown(own,assessments,records);
    expect(row).toMatchObject({gradedCount:2,earned:7,possible:30,
      percent:23,hasUnknown:false});
    expect(detail).toMatchObject([
      {assessmentId:"quiz-1",earned:7,possible:10,percent:70,status:"PUBLISHED_SCORE"},
      {assessmentId:"task-1",earned:0,possible:20,percent:0,status:"PUBLISHED_SCORE"},
    ]);
    expect(detail.reduce((sum,item)=>sum+(item.earned??0),0)).toBe(row.earned);
    expect(detail.reduce((sum,item)=>sum+(item.possible??0),0)).toBe(row.possible);
  });

  it("FAC-attendance-grades-01 rejects forged foreign-tenant scores and does not export emails",()=>{
    const scores:GradebookScore[]=[
      {membershipId:foreign,kind:"QUIZ",assessmentId:"quiz-1",earned:10,possible:10},
      {membershipId:own,kind:"QUIZ",assessmentId:"quiz-1",earned:11,possible:10},
      {membershipId:own,kind:"ASSIGNMENT",assessmentId:"task-1",earned:NaN,possible:20},
    ];
    const [row]=facultyPublishedGradeRows(roster,scores,2);
    expect(row).toMatchObject({earned:null,possible:null,percent:null,
      gradedCount:0,hasUnknown:true});
    const detail=facultyPublishedLearnerBreakdown(own,assessments,scores);
    expect(detail.every(item=>item.status==="UNKNOWN"&&item.earned===null)).toBe(true);
    expect(facultyGradebookCsv([row!])).not.toContain(foreign);
  });

  it("FAC-attendance-grades-01 deterministically deduplicates retry records across summary and detail",()=>{
    const records:GradebookScore[]=[
      {membershipId:own,kind:"QUIZ",assessmentId:"quiz-1",earned:8,possible:10},
      {membershipId:own,kind:"QUIZ",assessmentId:"quiz-1",earned:9,possible:10},
    ];
    const row=facultyPublishedGradeRows(roster,records,1)[0]!;
    const [detail]=facultyPublishedLearnerBreakdown(own,assessments.slice(0,1),records);
    expect(row).toMatchObject({gradedCount:1,earned:8,possible:10,percent:80});
    expect(detail).toMatchObject({earned:8,possible:10,percent:80});
  });
});
