import {describe,it,expect} from "vitest";
import {
 facultyAssignmentCommandSchema,assignmentFieldsChanged,facultyAssignmentVersionMatches,
} from "@/modules/courses/faculty-assignment-authoring-model";
import {facultyQuizCommandSchema,sumQuizPoints,facultyQuizVersionMatches} from "@/modules/courses/faculty-quiz-authoring-model";
import {facultyLiveClassesQuerySchema,safeHttpsMeetingLink,pageFacultyLiveClasses} from "@/modules/courses/faculty-live-classes-model";
import {mentorTaskFeedbackParamsSchema,taskFeedbackStatusLabel} from "@/modules/projects/mentor-task-feedback-model";
const id="00000000-0000-4000-8000-000000000001";
const other="00000000-0000-4000-8000-000000000002";
const question={type:"SINGLE_CHOICE",prompt:"Which is FIFO?",points:5,sequence:0,
 options:[{text:"Queue",correct:true,sequence:0},{text:"Stack",correct:false,sequence:1}]};
describe("Faculty/Mentor authoring and registered read boundaries",()=>{
 it("requires explicit confirmation and strict own Section command fields",()=>{
  const command={action:"CREATE",lessonId:id,sequence:0,title:"Algorithms",
   description:"Instructions",dueAt:null,maxPoints:10,confirmed:true};
  expect(facultyAssignmentCommandSchema.safeParse(command).success).toBe(true);
  expect(facultyAssignmentCommandSchema.safeParse({...command,confirmed:false}).success).toBe(false);
  expect(facultyAssignmentCommandSchema.safeParse({...command,collegeId:other}).success).toBe(false);
  expect(facultyAssignmentCommandSchema.safeParse({action:"ARCHIVE",assignmentId:id,
   expectedUpdatedAt:"2026-10-14T10:00:00Z",confirmed:true}).success).toBe(true);
  expect(assignmentFieldsChanged({title:"A",description:null,dueAt:null,maxPoints:5},
   {title:"B",description:null,dueAt:null,maxPoints:5})).toEqual(["title"]);
 });
 it("matches millisecond snapshots while rejecting stale authoring tokens",()=>{
  const stored=new Date("2026-10-14T14:00:00.123Z");
  expect(facultyAssignmentVersionMatches(stored,stored.toISOString())).toBe(true);
  expect(facultyAssignmentVersionMatches(stored,"2026-10-14T14:00:00.122Z")).toBe(false);
  expect(facultyAssignmentVersionMatches(stored,"not-a-date")).toBe(false);
 });
 it("requires a valid choice builder before writing",()=>{
  const base={action:"CREATE",lessonId:id,sequence:0,title:"FIFO",
   description:null,dueAt:null,maxAttempts:1,confirmed:true,questions:[question]};
  expect(facultyQuizCommandSchema.safeParse(base).success).toBe(true);
  expect(sumQuizPoints([question,{points:10}])).toBe(15);
  expect(facultyQuizCommandSchema.safeParse({...base,collegeId:other}).success).toBe(false);
  expect(facultyQuizCommandSchema.safeParse({...base,questions:[
   {...question,options:question.options.map(o=>({...o,correct:true}))},
  ]}).success).toBe(false);
  expect(facultyQuizCommandSchema.safeParse({...base,questions:[
   {...question,options:[{...question.options[0],text:"Queue"},{
    ...question.options[1],text:"queue"}]},
  ]}).success).toBe(false);
 });
 it("refuses stale Quiz builder tokens without conflating them with lifecycle state",()=>{
   const at=new Date("2026-10-14T13:00:00.456Z");
   expect(facultyQuizVersionMatches(at,at.toISOString())).toBe(true);
   expect(facultyQuizVersionMatches(at,"2026-10-14T13:00:00.457Z")).toBe(false);
   expect(facultyQuizVersionMatches(at,"invalid")).toBe(false);
 });
 it("filters publishable live classes and refuses unsafe meeting URLs",()=>{
  for(const unsafe of ["javascript:alert(1)","http://meet.example/a",
   "https://user:pass@meet.example/a","file:///etc/passwd","not-a-url"])
   expect(safeHttpsMeetingLink(unsafe)).toBeNull();
  expect(safeHttpsMeetingLink("https://meet.example/join")).toBe("https://meet.example/join");
  const a={id,deliveryId:id,courseName:"Java",sectionName:"A",
   title:"Live",startsAt:new Date("2026-10-14T10:00:00Z"),
   endsAt:new Date("2026-10-14T11:00:00Z"),joinUrl:null,status:"PUBLISHED"};
  expect(pageFacultyLiveClasses([a],{view:"UPCOMING",page:1},
   new Date("2026-10-14T09:00:00Z")).total).toBe(1);
  expect(pageFacultyLiveClasses([a],{view:"PAST",page:1},
   new Date("2026-10-14T09:00:00Z")).total).toBe(0);
  expect(facultyLiveClassesQuerySchema.safeParse({collegeId:other}).success).toBe(false);
 });
 it("denies a caller-selected foreign task group and labels feedback honestly",()=>{
  expect(mentorTaskFeedbackParamsSchema.safeParse({projectId:id,taskId:other}).success).toBe(true);
  expect(mentorTaskFeedbackParamsSchema.safeParse({projectId:id,taskId:other,collegeId:id}).success).toBe(false);
  expect(taskFeedbackStatusLabel("CHANGES_REQUESTED")).toBe("Changes requested");
  expect(taskFeedbackStatusLabel("APPROVED")).toBe("Approved");
 });
});

describe("Faculty legacy assessment lifecycle forwarding boundaries", () => {
 it("rejects unconfirmed or unversioned publish/archive/close commands", () => {
  for (const action of ["PUBLISH","ARCHIVE"] as const) {
   const command={action,assignmentId:id,expectedUpdatedAt:"2026-10-14T10:00:00Z",confirmed:true};
   expect(facultyAssignmentCommandSchema.safeParse(command).success).toBe(true);
   expect(facultyAssignmentCommandSchema.safeParse({...command,expectedUpdatedAt:undefined}).success).toBe(false);
   expect(facultyAssignmentCommandSchema.safeParse({...command,confirmed:undefined}).success).toBe(false);
  }
  for (const action of ["PUBLISH","CLOSE","ARCHIVE"] as const) {
   const command={action,quizId:id,expectedUpdatedAt:"2026-10-14T10:00:00Z",confirmed:true};
   expect(facultyQuizCommandSchema.safeParse(command).success).toBe(true);
   expect(facultyQuizCommandSchema.safeParse({...command,expectedUpdatedAt:undefined}).success).toBe(false);
   expect(facultyQuizCommandSchema.safeParse({...command,confirmed:false}).success).toBe(false);
  }
 });
});
