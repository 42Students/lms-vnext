import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {recruiterTodayGreeting} from "@/modules/placements/recruiter-today-greeting-model";
describe("Final sprint recruiter home greeting",()=>{
 it("REC-home-drives-04 greeting and action-count copy are time-zone deterministic",()=>{
  expect(recruiterTodayGreeting(new Date("2099-01-01T04:00:00Z"),"Asha Rao","Acme",2)).toEqual({
   title:"Good morning, Asha",subtitle:"2 things need you today. Each one takes you straight to where it is done.",
  });
  expect(recruiterTodayGreeting(new Date("2099-01-01T09:00:00Z"),"Asha Rao","Acme",1).title).toBe("Good afternoon, Asha");
  expect(recruiterTodayGreeting(new Date("2099-01-01T14:00:00Z"),"Asha Rao","Acme",0)).toEqual({
   title:"Good evening, Asha",subtitle:"Acme · Nothing is waiting on you.",
  });
  const source=readFileSync("src/app/(authenticated)/hr/home/page.tsx","utf8");
  expect(source).toContain("recruiterTodayGreeting(now,profile.displayName,recruiter.companyName,actionQueue.length)");
  expect(source).toContain("title={greeting.title}");
  expect(source).toContain("description={greeting.subtitle}");
 });
});
