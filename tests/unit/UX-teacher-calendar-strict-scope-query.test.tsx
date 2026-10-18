import {beforeEach,describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
vi.mock("server-only",()=>({}));
const stubs=vi.hoisted(()=>({actor:vi.fn(),month:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:stubs.actor}));
vi.mock("@/modules/courses/faculty-ist-month-service",()=>({
 getFacultyIstMonth:stubs.month,
}));
vi.mock("@/components/academics/learner-class-schedule",()=>({
 LearnerClassSchedule:()=>null,
}));
import FacultyCalendarPage from "@/app/(authenticated)/teacher/calendar/page";

const deliveryId="11111111-1111-4111-8111-111111111111";
const actor={user:{id:"faculty"}};
const page=(raw:Record<string,string|string[]|undefined>)=>
 FacultyCalendarPage({searchParams:Promise.resolve(raw)});
beforeEach(()=>{
 vi.resetAllMocks();
 stubs.actor.mockResolvedValue(actor);
 stubs.month.mockResolvedValue({
  grid:{query:{month:"2026-10",deliveryId:null},days:[]},
  schedule:{events:[],courses:[],sections:[]},
 });
});
describe("FAC-CALENDAR-QUERY-01 Faculty calendar deep-link role and filter safety",()=>{
 it("refuses duplicated and unknown tenant selectors before any schedule read",async()=>{
  for(const raw of [
   {month:["2026-10","2027-01"]},
   {deliveryId:[deliveryId]},
   {deliveryId:[deliveryId,"22222222-2222-4222-8222-222222222222"]},
   {collegeId:"foreign"},{month:"2026-13"},
   {month:"not-month"},{deliveryId:"not-uuid"},
  ]){
   const html=renderToStaticMarkup(await page(raw));
   expect(html).toContain("Invalid month or Section filter");
   expect(html).toContain("Clear filters");
  }
  expect(stubs.actor).not.toHaveBeenCalled();
  expect(stubs.month).not.toHaveBeenCalled();
 });
 it("loads the selected Section/month and a truthful empty calendar",async()=>{
  const element=await page({month:"2026-10",deliveryId});
  expect(stubs.month).toHaveBeenCalledWith(actor,{month:"2026-10",deliveryId});
  const html=renderToStaticMarkup(element);
  expect(html).toContain("Class Schedule");
  expect(html).toContain("No current teaching assignments");
 });
 it("does not normalize a forged delivery into the Faculty first available Section",async()=>{
  const foreign="22222222-2222-4222-8222-222222222222";
  stubs.month.mockRejectedValueOnce(new Error("FACULTY_TEACHING_SCOPE_REQUIRED"));
  await expect(page({month:"2026-10",deliveryId:foreign}))
   .rejects.toThrow("FACULTY_TEACHING_SCOPE_REQUIRED");
 });
});