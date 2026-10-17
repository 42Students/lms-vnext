import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {FACULTY_IST_NOTE,facultyIstTimeParts,facultyIstWallTime,facultyIstQuarterHourIssue}
 from "@/modules/courses/faculty-ist-quarter-hour-model";
import {facultyLiveMutationSchema} from "@/modules/courses/faculty-live-mutation-model";
import {facultyLiveClassIssue} from "@/modules/courses/faculty-content-input-model";
const read=(file:string)=>readFileSync(join(process.cwd(),file),"utf8");
describe("FAC-courses-17 live lesson editor time picker parity",()=>{
 it("FAC-courses-17 round-trips midnight, noon and 11:45 PM without device timezone conversions",()=>{
  expect(FACULTY_IST_NOTE).toBe("Times are in India Standard Time (IST).");
  expect(facultyIstWallTime("2099-01-01","12","00","AM")).toBe("2099-01-01T00:00");
  expect(facultyIstWallTime("2099-01-01","12","00","PM")).toBe("2099-01-01T12:00");
  expect(facultyIstWallTime("2099-01-01","11","45","PM")).toBe("2099-01-01T23:45");
  expect(facultyIstTimeParts("2099-01-01T00:00")).toMatchObject({hour:"12",minute:"00",period:"AM"});
  expect(facultyIstTimeParts("2099-01-01T12:30")).toMatchObject({hour:"12",minute:"30",period:"PM"});
  expect(facultyIstTimeParts("2099-01-01T23:45")).toMatchObject({hour:"11",minute:"45",period:"PM"});
  expect(facultyIstQuarterHourIssue("2099-01-01T09:17")).toContain("15-minute");
  expect(facultyIstQuarterHourIssue("2099-01-01T09:15")).toBeNull();
 });
 it("FAC-courses-17 enforces 15-minute times for API creation and edit",()=>{
  const base={action:"CREATE" as const,lessonId:"00000000-0000-4000-8000-000000000001",
    title:"Math live session",meetingUrl:"https://meet.google.com/abc-def-ghi",
    startsAt:"2099-01-01T09:15:00+05:30",
    endsAt:"2099-01-01T10:15:00+05:30",confirm:true as const};
  expect(facultyLiveMutationSchema.safeParse(base).success).toBe(true);
  expect(facultyLiveMutationSchema.safeParse({...base,startsAt:"2099-01-01T09:17:00+05:30"}).success).toBe(false);
  expect(facultyLiveMutationSchema.safeParse({...base,endsAt:"2099-01-01T10:14:00+05:30"}).success).toBe(false);
  expect(facultyLiveClassIssue(base.meetingUrl,base.startsAt,base.endsAt,new Date("2098-01-01")))
   .toBeNull();
  expect(facultyLiveClassIssue(base.meetingUrl,base.startsAt,"2099-01-01T10:19:00+05:30",
   new Date("2098-01-01"))).toContain("15-minute");
 });
 it("FAC-courses-17 provides native date, explicit hour/minute/AM-PM and exact IST note in both workflows",()=>{
  const picker=read("src/components/courses/faculty-ist-quarter-hour-picker.tsx");
  const lesson=read("src/components/courses/faculty-lesson-authoring.tsx");
  const editor=read("src/components/courses/faculty-live-class-editor.tsx");
  expect(picker).toContain('type="date"');
  expect(picker).toContain('value="AM"');
  expect(picker).toContain('value="PM"');
  expect(picker).toContain("FACULTY_IST_QUARTER_MINUTES.map");
  expect(lesson).toContain("FACULTY_IST_NOTE");
  expect(editor).toContain("FACULTY_IST_NOTE");
  expect(lesson).toContain('<FacultyIstQuarterHourPicker label="Starts"');
  expect(editor).toContain('<FacultyIstQuarterHourPicker label="Start"');
  expect(editor).toContain('action!=="CANCEL"');
 });
});
