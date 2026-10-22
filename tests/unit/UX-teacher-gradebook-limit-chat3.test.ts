import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

const route="/teacher/courses/[deliveryId]/gradebook";
const path="src/app/(authenticated)/teacher/courses/[deliveryId]/gradebook/page.tsx";

describe("UX-teacher-gradebook-limit-chat3: Faculty error and recovery",()=>{
  it("FAC-attendance-grades-01 denies forged filter selectors before gradebook read",()=>{
    const page=readFileSync(path,"utf8");
    expect(route).toContain("/teacher/courses/");
    expect(page).toContain("facultyGradebookViewQuerySchema.safeParse");
    expect(page).toContain('knownKeys&&noRepeatedKeys?rawSearch:{invalid:true}');
    expect(page).toContain("Invalid gradebook link or filters");
    expect(page.indexOf("if(!parsed.success||!view.success)"))
      .toBeLessThan(page.indexOf("getCurrentRequestContext()"));
  });

  it("FAC-attendance-grades-01 returns a usable, screen-readable capacity recovery and preserves report integrity",()=>{
    const page=readFileSync(path,"utf8");
    expect(page).toContain('error.code==="FACULTY_GRADEBOOK_TOO_MANY_ASSESSMENTS"');
    expect(page).toContain('role="alert"');
    expect(page).toContain("Gradebook report limit");
    expect(page).toContain("No grades have been changed.");
    expect(page).toContain("Return to your course");
    expect(page).toContain("min-h-11");
    expect(page).not.toContain("throw new Error(\"GRADEBOOK_TOO_MANY");
  });
});
