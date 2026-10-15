import {describe,expect,it} from "vitest";
import {facultyLiveEditorDraft} from "@/modules/courses/faculty-live-editor-model";
describe("Faculty live edit draft hydration",()=>{
 it("preloads same session fields in IST without device dependence",()=>{
  const result=facultyLiveEditorDraft({id:"a",title:"Lab class",
   meetingUrl:"https://meet.example.org/abc",startsAt:"2026-10-20T04:00:00.000Z",
   endsAt:"2026-10-20T05:00:00.000Z"});
  expect(result).toEqual({title:"Lab class",meetingUrl:"https://meet.example.org/abc",
   startsAt:"2026-10-20T09:30",endsAt:"2026-10-20T10:30"});
 });
 it("does not invent an unavailable meeting URL",()=>{
  expect(facultyLiveEditorDraft({id:"a",title:"Example",meetingUrl:null,
   startsAt:"invalid",endsAt:"invalid"}).meetingUrl).toBe("");
 });
});
