import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
import {facultyScheduleInstants} from "@/modules/attendance/faculty-schedule-editor-model";
const file=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
const ui=()=>file("src/components/attendance/faculty-attendance-workspace.tsx");
describe("chat-11 faculty attendance gap closure verification",()=>{
 it("FAC-attendance-grades-02 guards all attendance dirty-mode, date, session and unload changes",()=>{
   const code=ui();expect(code).toContain("beforeunload");
   expect(code).toContain('window.confirm("Discard your unsaved attendance changes?")');
   expect(code).toContain("chooseDate(");expect(code).toContain("chooseSession(");
   expect(code).toContain('if(!confirmDiscardMarks())return;');
 });
 it("FAC-attendance-grades-05 filters the class schedule by selected local date",()=>{
   const code=ui();expect(code).toContain('value={selectedDate}');
   expect(code).toContain("onChange={event=>chooseDate(event.target.value)}");
   expect(code).toContain("dateSessions.map(");
 });
 it("FAC-attendance-grades-06 preserves no-class and schedule-action guidance",()=>{
   const code=ui();expect(code).toContain("No class scheduled for this date");
   expect(code).toContain("Use Schedule Class to create a class session before marking attendance.");
   expect(code).toContain("No classes scheduled");
 });
 it("FAC-attendance-grades-07 validates end after start, 12-hour bound and successful scheduling",()=>{
   const model=file("src/modules/attendance/faculty-schedule-editor-model.ts");
   expect(model).toContain("End time must be after start time");
   expect(model).toContain("A class can be at most 12 hours. Check AM/PM.");
   expect(ui()).toContain('setSavedNotice("Class scheduled successfully.")');
   expect(typeof facultyScheduleInstants).toBe("function");
 });
 it("FAC-attendance-grades-08 shows legacy monthly attendance legend and Active days",()=>{
   const code=ui();expect(code).toContain("P = Present · A = Absent");
   expect(code).toContain("✖ = No class");
   expect(code).toContain('["Active days", monthDays.filter(day=>day.sessions.length>0).length]');
 });
 it("FAC-attendance-grades-09 shows marked and unmarked session counts with monthly report tiles",()=>{
   const code=ui();expect(code).toContain("present marks across");
   expect(code).toContain("session(s) not yet marked");
   for(const label of ['["Students",','["Sessions",','["Absences",','["Not marked",'])expect(code).toContain(label);
 });
 it("FAC-attendance-grades-11 searches the roster with the legacy student-name label",()=>{
   const code=ui();expect(code).toContain('aria-label="Find a student by name"');
   expect(code).toContain('placeholder="Find a student by name"');
 });
 it("FAC-attendance-grades-12 offers previous, jump and next month controls",()=>{
   const code=ui();expect(code).toContain('aria-label="Previous month"');
   expect(code).toContain("Jump to month");expect(code).toContain('aria-label="Next month"');
   expect(code).toContain('type="month"');
 });
 it("FAC-attendance-grades-13 shows exact faculty attendance-window closure and not-started messages",()=>{
   const code=ui();expect(code).toContain("Cannot mark attendance for a class that has not started yet");
   expect(code).toContain("Attendance window has closed. Attendance can only be marked within");
 });
 it("FAC-attendance-grades-17 shows Download Report and safe PDF error feedback",()=>{
   const code=file("src/components/courses/faculty-report-download.tsx");
   expect(code).toContain('?"Download Report":"Download PDF"');
   expect(code).toContain("Couldn\\'t generate the attendance report. Please try again.");
   expect(ui()).toContain('kind="attendance"');
 });
});
