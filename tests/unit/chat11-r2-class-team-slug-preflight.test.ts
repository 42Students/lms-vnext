import {describe,expect,it} from "vitest";
import {isValidClassTeamBaseSlug} from "@/modules/projects/class-team-slug-model";
describe("class team workspace slug preflight",()=>{
 it("allows the same hyphenated names accepted by the server",()=>{
  expect(isValidClassTeamBaseSlug("capstone-team-2026")).toBe(true);
  expect(isValidClassTeamBaseSlug("a")).toBe(true);
 });
 it.each(["","My Project","bad_slug","-bad","bad-","bad--slug","a".repeat(51)])("disables Create for invalid slug %s",(value)=>{
  expect(isValidClassTeamBaseSlug(value)).toBe(false);
 });
});
