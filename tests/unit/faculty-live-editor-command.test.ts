import {describe,expect,it} from "vitest";
import {facultyLiveEditorCommand} from "@/modules/courses/faculty-live-editor-command";
const id="00000000-0000-4000-8000-000000000012";
const base={action:"CREATE" as const,lessonId:id,selected:undefined,title:"Section class",
 meetingUrl:"https://meet.example.org/class",startsAt:"2026-10-20T09:00",endsAt:"2026-10-20T10:00"};
describe("Faculty live editor validate before confirmation",()=>{
 it("converts IST and enforces a complete valid create command",()=>{
  const cmd=facultyLiveEditorCommand(base);
  expect(cmd.action).toBe("CREATE");
  if(cmd.action==="CREATE")expect(cmd.startsAt).toBe("2026-10-20T03:30:00.000Z");
 });
 it("rejects missing class, insecure link, reverse and invalid local dates",()=>{
  for(const changes of [
   {lessonId:""},{meetingUrl:"http://example.com"},
   {endsAt:"2026-10-20T08:00"},{startsAt:"2026-02-30T09:00"},
  ])expect(()=>facultyLiveEditorCommand({...base,...changes})).toThrow();
 });
 it("validates cancel without requiring irrelevant meeting fields",()=>{
  expect(facultyLiveEditorCommand({...base,action:"CANCEL",selected:{id,expectedUpdatedAt:"2026-10-20T05:00:00Z"},meetingUrl:""}).action).toBe("CANCEL");
 });
});
