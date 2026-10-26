import {describe,expect,it} from "vitest";
import {selectFacultyPrototypeSession} from "../../src/modules/attendance/faculty-prototype-session-selection";
const session=(id:string,start:string,end:string)=>({id,startsAt:start,endsAt:end});
const now=new Date("2026-10-26T10:15:00+05:30");
const rows=[
 session("tomorrow","2026-10-27T09:00:00+05:30","2026-10-27T10:00:00+05:30"),
 session("running","2026-10-26T10:00:00+05:30","2026-10-26T11:00:00+05:30"),
 session("yesterday","2026-10-25T09:00:00+05:30","2026-10-25T10:00:00+05:30"),
];
describe("Faculty screenshot Attendance default class",()=>{
 it("prefers current markable class over later future sessions",()=>{
  expect(selectFacultyPrototypeSession(rows,null,now)?.id).toBe("running");
 });
 it("preserves explicit authorized class session deep links",()=>{
  expect(selectFacultyPrototypeSession(rows,"tomorrow",now)?.id).toBe("tomorrow");
 });
 it("prefers the most recent already started session when no class is running",()=>{
  const later=new Date("2026-10-26T12:00:00+05:30");
  expect(selectFacultyPrototypeSession(rows,null,later)?.id).toBe("running");
 });
 it("falls back to the nearest upcoming class if all classes are future",()=>{
  const early=new Date("2026-10-24T12:00:00+05:30");
  expect(selectFacultyPrototypeSession(rows,null,early)?.id).toBe("yesterday");
 });
 it("reports genuine no-session case without faking a class",()=>{
  expect(selectFacultyPrototypeSession([],null,now)).toBeNull();
 });
});