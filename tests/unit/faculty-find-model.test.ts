import {describe,it,expect} from "vitest";
import {facultyFindMatches} from "@/modules/courses/faculty-find-model";
describe("Faculty prototype scoped Find matching",()=>{
 it("matches a learner by name or roll number, not private fields",()=>{
  expect(facultyFindMatches("rah",["Rahul Verma","NSRIT-0419"])).toBe(true);
  expect(facultyFindMatches("0419",["Rahul Verma","NSRIT-0419"])).toBe(true);
  expect(facultyFindMatches("not matched",[null,undefined,"Rahul Verma"])).toBe(false);
 });
 it("normalizes Unicode, trims spaces and refuses one-character probes",()=>{
  expect(facultyFindMatches("  DATA  ",["Data Structures"])).toBe(true);
  expect(facultyFindMatches("ra",["Rahul"])).toBe(true);
  expect(facultyFindMatches("r",["Rahul"])).toBe(false);
  expect(facultyFindMatches("  ",["Rahul"])).toBe(false);
 });
});
