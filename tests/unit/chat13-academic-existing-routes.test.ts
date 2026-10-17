import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const read=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("Chat13 Academic existing route and mutation contracts",()=>{
  it("SA-academics-people-05 department mutations enforce selected-college scope",()=>{
    const content=read("src/modules/departments/college-department-mutation-service.ts");
    expect(content).toContain("resolveActingCollege(context, \"department.manage\")");
    expect(content).toContain("recordActivityEventInTransaction");
    expect(content).toContain("await liveCollege");
  });
  it("SA-academics-people-14 semester create edit and delete mounted",()=>{
    const content=read("src/app/(authenticated)/admin/semesters/page.tsx");
    expect(content).toContain("CollegeSemesterCreateForm");
    expect(content).toContain("CollegeSemesterRowActions");
  });
  it("SA-academics-people-18 batch create and edit mounted",()=>{
    const content=read("src/app/(authenticated)/admin/batches/page.tsx");
    expect(content).toContain("CollegeCohortCreateForm");
    expect(content).toContain("CollegeCohortRowActions");
  });
  it("SA-academics-people-26 room availability under Super Admin route",()=>{
    const content=read("src/app/(authenticated)/admin/lecture-halls/[hallId]/page.tsx");
    expect(content).toContain("getCollegeHallAvailability");
    expect(content).toContain("Back to Lecture Halls");
  });
  it("SA-academics-people-27 lecture hall search export and paging",()=>{
    const content=read("src/app/(authenticated)/admin/lecture-halls/page.tsx");
    expect(content).toContain("Search halls");
    expect(content).toContain("Export CSV");
    expect(content).toContain("Refresh");
    expect(content).toContain("Rows per page");
  });
  it("SA-academics-people-33 semester active status editable",()=>{
    const content=read("src/components/academics/college-semester-management.tsx");
    expect(content).toContain("setIsActive");
    expect(content).toContain("isActive ? SEMESTER_COPY.statusActive");
  });
  it("SA-academics-people-39 academic tables have narrow screen horizontal scrolling",()=>{
    const content=read("src/components/ui/data-table.tsx");
    expect(content).toContain("overflow-x-auto");
    expect(content).toContain("border-collapse");
  });
});
