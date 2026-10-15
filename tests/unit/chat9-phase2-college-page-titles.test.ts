import {describe,expect,it} from "vitest";
import {COLLEGE_LEGACY_PAGE_TITLES} from "@/modules/people/college-page-title-model";
import {COLLEGE_LEGACY_GROUPS} from "@/modules/people/college-legacy-tabs-model";

describe("legacy College Admin page title consistency",()=>{
  it("uses exact dashboard and people directory titles",()=>{
    expect(COLLEGE_LEGACY_PAGE_TITLES.dashboard).toBe("Dashboard");
    expect(COLLEGE_LEGACY_PAGE_TITLES.peopleDirectory).toBe("People Directory");
  });
  it("agrees with legacy Placements > Drives tab",()=>{
    expect(COLLEGE_LEGACY_PAGE_TITLES.drives).toBe("Drives");
    expect(COLLEGE_LEGACY_GROUPS.find(g=>g.title==="Placements")?.tabs[0]?.label)
      .toBe(COLLEGE_LEGACY_PAGE_TITLES.drives);
  });
  it("agrees with People Directory subtab",()=>{
    expect(COLLEGE_LEGACY_GROUPS.find(g=>g.title==="People")?.tabs.at(-1)?.label)
      .toBe(COLLEGE_LEGACY_PAGE_TITLES.peopleDirectory);
  });
});
