import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const read=(route:string)=>readFileSync(join(process.cwd(),"src/app/(authenticated)",route,"page.tsx"),"utf8");
describe("Faculty native input text remains 16px across breakpoints",()=>{
 it("UX-teacher-calendar-03 keeps 16px text on fields at all widths",()=>{
  const s=read("teacher/calendar");let count=0;
  for(const m of s.matchAll(/<(?:input|select|textarea|Input|Select|Textarea)\b[^>]*>/g)){
   if(/\btype="hidden"/.test(m[0]))continue;
   const cl=m[0].match(/className="([^"]+)"/)?.[1]??"";
   if(!cl.includes("text-base"))continue;
   count++;expect(cl).not.toMatch(/\bsm:text-sm\b/);
  }
  expect(count).toBeGreaterThan(0);
 });
 it("UX-teacher-contacts-contactsTab-03 keeps 16px text on fields at all widths",()=>{
  const s=read("teacher/contacts/[contactsTab]");let count=0;
  for(const m of s.matchAll(/<(?:input|select|textarea|Input|Select|Textarea)\b[^>]*>/g)){
   if(/\btype="hidden"/.test(m[0]))continue;
   const cl=m[0].match(/className="([^"]+)"/)?.[1]??"";
   if(!cl.includes("text-base"))continue;
   count++;expect(cl).not.toMatch(/\bsm:text-sm\b/);
  }
  expect(count).toBeGreaterThan(0);
 });
 it("UX-teacher-courses-deliveryId-assessment-health-03 keeps 16px text on fields at all widths",()=>{
  const s=read("teacher/courses/[deliveryId]/assessment-health");let count=0;
  for(const m of s.matchAll(/<(?:input|select|textarea|Input|Select|Textarea)\b[^>]*>/g)){
   if(/\btype="hidden"/.test(m[0]))continue;
   const cl=m[0].match(/className="([^"]+)"/)?.[1]??"";
   if(!cl.includes("text-base"))continue;
   count++;expect(cl).not.toMatch(/\bsm:text-sm\b/);
  }
  expect(count).toBeGreaterThan(0);
 });
 it("UX-teacher-courses-deliveryId-discussion-history-03 keeps 16px text on fields at all widths",()=>{
  const s=read("teacher/courses/[deliveryId]/discussion-history");let count=0;
  for(const m of s.matchAll(/<(?:input|select|textarea|Input|Select|Textarea)\b[^>]*>/g)){
   if(/\btype="hidden"/.test(m[0]))continue;
   const cl=m[0].match(/className="([^"]+)"/)?.[1]??"";
   if(!cl.includes("text-base"))continue;
   count++;expect(cl).not.toMatch(/\bsm:text-sm\b/);
  }
  expect(count).toBeGreaterThan(0);
 });
 it("UX-teacher-courses-deliveryId-gradebook-03 keeps 16px text on fields at all widths",()=>{
  const s=read("teacher/courses/[deliveryId]/gradebook");let count=0;
  for(const m of s.matchAll(/<(?:input|select|textarea|Input|Select|Textarea)\b[^>]*>/g)){
   if(/\btype="hidden"/.test(m[0]))continue;
   const cl=m[0].match(/className="([^"]+)"/)?.[1]??"";
   if(!cl.includes("text-base"))continue;
   count++;expect(cl).not.toMatch(/\bsm:text-sm\b/);
  }
  expect(count).toBeGreaterThan(0);
 });
 it("UX-teacher-courses-deliveryId-reports-03 keeps 16px text on fields at all widths",()=>{
  const s=read("teacher/courses/[deliveryId]/reports");let count=0;
  for(const m of s.matchAll(/<(?:input|select|textarea|Input|Select|Textarea)\b[^>]*>/g)){
   if(/\btype="hidden"/.test(m[0]))continue;
   const cl=m[0].match(/className="([^"]+)"/)?.[1]??"";
   if(!cl.includes("text-base"))continue;
   count++;expect(cl).not.toMatch(/\bsm:text-sm\b/);
  }
  expect(count).toBeGreaterThan(0);
 });
 it("UX-teacher-live-classes-03 keeps 16px text on fields at all widths",()=>{
  const s=read("teacher/live-classes");let count=0;
  for(const m of s.matchAll(/<(?:input|select|textarea|Input|Select|Textarea)\b[^>]*>/g)){
   if(/\btype="hidden"/.test(m[0]))continue;
   const cl=m[0].match(/className="([^"]+)"/)?.[1]??"";
   if(!cl.includes("text-base"))continue;
   count++;expect(cl).not.toMatch(/\bsm:text-sm\b/);
  }
  expect(count).toBeGreaterThan(0);
 });
 it("UX-teacher-profile-teaching-03 keeps 16px text on fields at all widths",()=>{
  const s=read("teacher/profile/teaching");let count=0;
  for(const m of s.matchAll(/<(?:input|select|textarea|Input|Select|Textarea)\b[^>]*>/g)){
   if(/\btype="hidden"/.test(m[0]))continue;
   const cl=m[0].match(/className="([^"]+)"/)?.[1]??"";
   if(!cl.includes("text-base"))continue;
   count++;expect(cl).not.toMatch(/\bsm:text-sm\b/);
  }
  expect(count).toBeGreaterThan(0);
 });
});
