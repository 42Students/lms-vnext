import {describe,it,expect} from "vitest";
import {legacySyllabusKind,selectedLessonCompletion} from "@/modules/courses/legacy-syllabus-detail-model";

describe("chat-20 verify2: legacy lesson content classification and completion",()=>{
 it.each(["assessment","assessments","quiz_v2","quiz-v2","quiz2","quiz_content","QUIZ"])(
  "classifies %s as a quiz exactly as the old learner syllabus does",kind=>{
   expect(legacySyllabusKind(kind)).toBe("QUIZ");
  });
 it.each(["assignment","ASSIGNMENT"])("preserves authored assignments %s",kind=>{
  expect(legacySyllabusKind(kind)).toBe("ASSIGNMENT");
 });
 it.each(["live class","live_class","youtube","resource","notes"])(
  "keeps %s as a content card",kind=>{
   expect(legacySyllabusKind(kind)).toBe("CONTENT");
  });
 it("never silently coerces an unknown imported activity into a resource",()=>{
  expect(legacySyllabusKind("unknown-activity")).toBe("UNSUPPORTED");
 });
 it("does not claim selected-lesson completion when any source is unavailable",()=>{
  const items=[
   {id:"c",title:"Read",kind:"CONTENT" as const,progress:{status:"COMPLETED"}},
   {id:"q",title:"Quiz",kind:"QUIZ" as const,progress:{status:"NOT_STARTED"}},
  ];
  expect(selectedLessonCompletion(items,true)).toMatchObject({
   completed:1,total:2,percent:50,complete:false,nextIncomplete:items[1],stateKnown:true,
  });
  expect(selectedLessonCompletion(items,false)).toMatchObject({
   completed:null,total:null,percent:null,complete:false,nextIncomplete:null,stateKnown:false,
  });
 });
});
