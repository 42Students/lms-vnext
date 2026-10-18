import {describe,it,expect} from "vitest";
import {facultyPublishedGradeRows,facultyPublishedLearnerBreakdown,facultyGradebookCsv,
 facultyGradebookViewQuerySchema,paginateFacultyGradebookRows,facultyGradebookViewHref} from "@/modules/courses/faculty-gradebook-model";
const roster=[
 {membershipId:"a",displayName:"Asha",email:"a@example.com",rollNumber:"2"},
 {membershipId:"b",displayName:"Bhanu",email:"b@example.com",rollNumber:"10"},
];
describe("FAC gradebook Section scope, privacy and CSV correctness",()=>{
 it("FAC-GRADE-01 ignores non-roster, duplicate and impossible score records",()=>{
  const rows=facultyPublishedGradeRows(roster,[
   {membershipId:"a",earned:8,possible:10,kind:"QUIZ",assessmentId:"q"},
   {membershipId:"a",earned:2,possible:10,kind:"QUIZ",assessmentId:"q"},
   {membershipId:"b",earned:-1,possible:10,kind:"QUIZ",assessmentId:"q"},
   {membershipId:"b",earned:Infinity,possible:10,kind:"ASSIGNMENT",assessmentId:"a"},
   {membershipId:"other",earned:10,possible:10,kind:"QUIZ",assessmentId:"q"},
  ],2);
  expect(rows).toHaveLength(2);
  expect(rows[0]).toMatchObject({gradedCount:1,earned:8,possible:10,percent:80,hasUnknown:true});
  expect(rows[1]).toMatchObject({gradedCount:0,earned:null,possible:null,percent:null,hasUnknown:true});
 });
 it("FAC-GRADE-02 a learner breakdown cannot expose another learner score",()=>{
  const rows=facultyPublishedLearnerBreakdown("a",[
   {assessmentId:"q",kind:"QUIZ",title:"Quiz"},
   {assessmentId:"ass",kind:"ASSIGNMENT",title:"Assignment"}
  ],[
   {membershipId:"b",earned:10,possible:10,kind:"QUIZ",assessmentId:"q"},
   {membershipId:"a",earned:9,possible:10,kind:"QUIZ",assessmentId:"q"},
   {membershipId:"a",earned:11,possible:10,kind:"ASSIGNMENT",assessmentId:"ass"}
  ]);
  expect(rows[0]).toMatchObject({percent:90,status:"PUBLISHED_SCORE"});
  expect(rows[1]).toMatchObject({percent:null,status:"UNKNOWN"});
 });
 it("FAC-GRADE-03 natural roll ordering, bounded search and page URL are stable",()=>{
  const query=facultyGradebookViewQuerySchema.parse({search:"",page:"1"});
  expect(paginateFacultyGradebookRows(roster,query).items.map(row=>row.rollNumber)).toEqual(["2","10"]);
  expect(paginateFacultyGradebookRows(roster,{search:"asha",page:100})).toMatchObject({matching:1,page:1});
  expect(facultyGradebookViewQuerySchema.safeParse({page:"0"}).success).toBe(false);
  expect(facultyGradebookViewQuerySchema.safeParse({search:"a".repeat(121)}).success).toBe(false);
  expect(facultyGradebookViewHref("unsafe/delivery",{search:"Asha",page:2})).toContain("search=Asha&page=2");
 });
 it("FAC-GRADE-04 CSV safely caps large exports and neutralizes spreadsheet formula text",()=>{
  const many=Array.from({length:502},(_,i)=>({
   membershipId:String(i),displayName:i===0?"=HYPERLINK(1)":"Student",
   email:null,rollNumber:String(i)
  }));
  const csv=facultyGradebookCsv(facultyPublishedGradeRows(many,[],0));
  expect(csv).toContain("Export capped at 500 learners");
  expect(csv).not.toContain('"=HYPERLINK(1)"');
  expect(csv).toContain("Incomplete grading");
  expect(csv.endsWith("\r\n")).toBe(true);
 });
});