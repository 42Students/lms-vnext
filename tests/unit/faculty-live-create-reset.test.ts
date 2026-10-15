import {describe,expect,it} from "vitest";
import {emptyFacultyLiveDraft,facultyLiveEditorDraft} from "@/modules/courses/faculty-live-editor-model";
describe("Faculty live CREATE mode isolation",()=>{
 it("clears the previously selected meeting title, URL and times",()=>{
  const old=facultyLiveEditorDraft({id:"x",title:"Existing",meetingUrl:"https://example.com",
   startsAt:"2026-10-22T03:30:00Z",endsAt:"2026-10-22T04:30:00Z"});
  expect(old.title).toBe("Existing");
  expect(emptyFacultyLiveDraft()).toEqual({title:"",meetingUrl:"",startsAt:"",endsAt:""});
 });
});
