import {describe,expect,it} from "vitest";
import {singleValueMentorCalendarFilters as normalize}
 from "@/modules/projects/mentor-filter-query";
import {mentorCalendarFiltersSchema}
 from "@/modules/projects/mentor-calendar-filter-model";

describe("Mentor calendar's exact query allowlist",()=>{
 it("preserves every supported filter, including those absent from project lists",()=>{
  const request={
   search:"review",status:"SCHEDULED",period:"NEXT_7_DAYS",
   projectId:"11111111-1111-4111-8111-111111111111",
   sprint:"LINKED",join:"HAS_SAFE_LINK",attention:"NOTES_MISSING",
   type:"RETRO",projectState:"ACTIVE",
  };
  expect(normalize(request)).toEqual(request);
  expect(mentorCalendarFiltersSchema.safeParse(normalize(request)).success)
   .toBe(true);
 });
 it("rejects forged period, join, sprint, and project state instead of stripping them",()=>{
  for(const invalid of [
   {period:"INVALID"}, {join:"INVALID"},{sprint:"INVALID"},
   {projectState:"INVALID"},
  ]){
   const parsed=mentorCalendarFiltersSchema.safeParse(normalize(invalid));
   expect(parsed.success).toBe(false);
  }
 });
 it("rejects repeated recognized keys and cannot pick a privileged ID silently",()=>{
  for(const query of [
   {period:["TODAY","ALL"]},
   {projectId:["11111111-1111-4111-8111-111111111111",
      "22222222-2222-4222-8222-222222222222"]},
  ])expect(normalize(query)).toBeNull();
 });
 it("does not allow unrelated query parameters to influence meeting filters",()=>{
  expect(normalize({period:"TODAY",collegeId:"other",admin:"true"}))
   .toEqual({period:"TODAY"});
 });
});
