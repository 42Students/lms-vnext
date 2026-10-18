import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {COLLEGE_LEGACY_GROUPS,collegeLegacyGroupForPath,collegeLegacyTabActive} from
  "@/modules/people/college-legacy-tabs-model";

describe("college group tabs exact legacy navigation labels",()=>{
  it("renders academic section labels in exact dev-legacy order",()=>{
    expect(COLLEGE_LEGACY_GROUPS[0]?.tabs.map(t=>t.label)).toEqual([
      "Departments","Programs","Semesters","Semester–Course Mapping",
      "Batches","Classes","Batch Promotion","Lecture Halls","Electives","Attendance",
    ]);
  });
  it("renders exact content and people tab names (including legacy case)",()=>{
    expect(COLLEGE_LEGACY_GROUPS[1]?.tabs.map(t=>t.label)).toEqual([
      "Courses","Lessons","Video","Resources","Live Classes",
      "Assignments","Quizzes","Progress",
    ]);
    expect(COLLEGE_LEGACY_GROUPS[2]?.tabs.map(t=>t.label)).toEqual([
      "Faculty","Faculty Assignment","Students","People Directory",
    ]);
  });
  it("uses all six project monitor tabs without inventing action tabs",()=>{
    expect(COLLEGE_LEGACY_GROUPS[4]?.tabs.map(t=>t.label)).toEqual([
      "Workspaces","At Risk","Readiness","Submissions","Templates","Audit",
    ]);
  });
  it("resolves the longest nested prefix for academic subpages",()=>{
    expect(collegeLegacyGroupForPath("/college/attendance/departments")?.title).toBe("Academic Setup");
    expect(collegeLegacyGroupForPath("/college/projects/123/summary")?.title).toBe("Projects");
    expect(collegeLegacyTabActive("/college/projects/at-risk","/college/projects")).toBe(false);
    expect(collegeLegacyTabActive("/college/projects/123/summary","/college/projects")).toBe(true);
    expect(collegeLegacyGroupForPath("/college/verification")).toBeNull();
    expect(collegeLegacyTabActive("/college/programs/more","/college/programs")).toBe(true);
  });
  it("preserves legacy group heading and active tab for secondary routes",()=>{
    expect(collegeLegacyGroupForPath("/college/groups")?.title).toBe("People");
    expect(collegeLegacyTabActive("/college/groups/abc","/college/people")).toBe(true);
    expect(collegeLegacyGroupForPath("/college/placements/readiness-by-department")?.title).toBe("Placements");
    expect(collegeLegacyTabActive("/college/placements/readiness-by-department",
      "/college/hiring-dashboard")).toBe(true);
    expect(collegeLegacyTabActive("/college/placements/readiness-by-department",
      "/college/placements")).toBe(false);
    expect(COLLEGE_LEGACY_GROUPS[3]?.tabs.map(t=>t.label)).toEqual([
      "Drives","Companies","Interviews","Analytics",
    ]);
  });
  it("never exposes foreign-scope Companies routes as a college tab",()=>{
    expect(COLLEGE_LEGACY_GROUPS.flatMap(g=>g.tabs).every(t=>t.href.startsWith("/college/"))).toBe(true);
    expect(COLLEGE_LEGACY_GROUPS[3]?.tabs.map(t=>t.label)).toEqual(["Drives","Companies","Interviews","Analytics"]);
  });
  it("COL-academic-setup-13 keeps the academic-period overview reachable without inventing a legacy tab",()=>{
    expect(COLLEGE_LEGACY_GROUPS[0]?.tabs.some(tab=>tab.href==="/college/academics")).toBe(false);
    const college=readFileSync(join(process.cwd(),"src/app/(authenticated)/college/departments/page.tsx"),"utf8");
    const admin=readFileSync(join(process.cwd(),"src/app/(authenticated)/admin/departments/page.tsx"),"utf8");
    expect(college).toContain('href="/college/academics"');
    expect(admin).toContain('href="/admin/academics"');
  });
});
