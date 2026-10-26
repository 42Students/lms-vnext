import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {recruiterTodayGreeting} from "@/modules/placements/recruiter-today-greeting-model";
import {recruiterTodayHeadline} from "@/modules/placements/recruiter-today-headline-model";
describe("Final sprint recruiter home greeting",()=>{
 it("REC-home-drives-04 greeting and action-count copy are time-zone deterministic",()=>{
  expect(recruiterTodayGreeting(new Date("2099-01-01T04:00:00Z"),"Asha Rao","Acme",2)).toEqual({
   title:"Good morning, Asha",subtitle:"2 things need you today.",
  });
  expect(recruiterTodayGreeting(new Date("2099-01-01T09:00:00Z"),"Asha Rao","Acme",1).title).toBe("Good afternoon, Asha");
  expect(recruiterTodayGreeting(new Date("2099-01-01T14:00:00Z"),"Asha Rao","Acme",0)).toEqual({
   title:"Good evening, Asha",subtitle:"0 things need you today.",
  });
  const source=readFileSync("src/app/(authenticated)/hr/home/page.tsx","utf8");
  expect(source).toContain("recruiterTodayGreeting(now,profile.displayName,recruiter.companyName,actionQueue.length)");
  expect(source).toContain("greeting={greeting.title}");
  const view=readFileSync("src/components/hr/recruiter-today-prototype.tsx","utf8");
  expect(view).toContain("recruiterTodayHeadline(props.greeting,visible.length");
  expect(recruiterTodayHeadline("Good morning, Asha",2,true)).toBe("Good morning, Asha. Two things need you.");
  expect(recruiterTodayHeadline("Good morning, Asha",0,true)).toBe("Good morning, Asha. You\u0027re all caught up.");
  expect(view).toContain('<h1>{headline}</h1>');
 });
});
