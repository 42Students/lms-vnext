import {describe,expect,it} from "vitest";
import {singleValueMentorFilters} from "@/modules/projects/mentor-filter-query";
import {mentorProjectListQuerySchema} from "@/modules/projects/mentor-project-list-query";
import {mentorPortfolioSegmentHref} from
  "@/modules/projects/mentor-portfolio-segment-model";

function parse(params:Record<string,string|string[]|undefined>){
  return mentorProjectListQuerySchema.parse(singleValueMentorFilters(params));
}

describe("Mentor Projects page navigation regressions",()=>{
  it("keeps canonical 1-based pagination from the UI rather than always returning page one",()=>{
    const parsed=parse({page1:"3",pageSize:"10",segment:"NEEDS_YOU",
      search:"report",sort:"TITLE"});
    expect(parsed).toMatchObject({page:3,pageSize:10,segment:"NEEDS_YOU",
      search:"report",sort:"TITLE"});
    const fourth=parse({page1:"4",page:"0",legacyPage:"0"});
    expect(fourth.page).toBe(4);
  });
  it("supports original zero-based bookmarks without changing their numbering",()=>{
    expect(parse({page:"0"}).page).toBe(1);
    expect(parse({page:"2"}).page).toBe(3);
    expect(parse({legacyPage:"4"}).page).toBe(5);
    expect(parse({legacyPage:"3",page:"0"}).page).toBe(4);
  });
  it("does not collapse repeated page tokens or accept forged tenant selector fields",()=>{
    expect(singleValueMentorFilters({page1:["2","4"]})).toBeNull();
    expect(singleValueMentorFilters({page:["0","1"]})).toBeNull();
    expect(mentorProjectListQuerySchema.safeParse({
      collegeId:"outside",segment:"ARCHIVED",
    }).success).toBe(false);
  });
  it("resets to first page when switching segments while retaining independent filters",()=>{
    const href=mentorPortfolioSegmentHref("ARCHIVED",{
      search:"legacy meeting",sort:"TITLE",pageSize:50,
    });
    const parsed=new URL(href,"https://example.edu");
    expect(parsed.searchParams.has("page")).toBe(false);
    expect(parsed.searchParams.has("page1")).toBe(false);
    expect(parse(Object.fromEntries(parsed.searchParams))).toMatchObject({
      page:1,segment:"ARCHIVED",pageSize:50,sort:"TITLE",
      search:"legacy meeting",
    });
  });
});
