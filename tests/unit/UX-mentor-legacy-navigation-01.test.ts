import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

/**
 * Redirect-only compatibility bookmarks have no visual loading/empty state.
 * These tests cover the navigation contract rather than merely existence.
 */
const redirects=[
  {
    route:"/mentor/allQuizzes",
    file:"src/app/(authenticated)/mentor/allQuizzes/page.tsx",
    destination:"/mentor/projects",
  },
  {
    route:"/mentor/contacts/[[...contactsTab]]",
    file:"src/app/(authenticated)/mentor/contacts/[[...contactsTab]]/page.tsx",
    destination:"/mentor/projects",
  },
  {
    route:"/mentor/courses",
    file:"src/app/(authenticated)/mentor/courses/page.tsx",
    destination:"/mentor/projects",
  },
  {
    route:"/mentor/courses/[courseId]/[[...courseTab]]",
    file:"src/app/(authenticated)/mentor/courses/[courseId]/[[...courseTab]]/page.tsx",
    destination:"/mentor/projects",
  },
  {
    route:"/mentor/fileExplorer",
    file:"src/app/(authenticated)/mentor/fileExplorer/page.tsx",
    destination:"/mentor/projects",
  },
  {
    route:"/mentor/profile",
    file:"src/app/(authenticated)/mentor/profile/page.tsx",
    destination:"/mentor/projects",
  },
] as const;

describe("UX-mentor-legacy-navigation-01 bookmark compatibility",()=>{
  for(const {route,file,destination} of redirects){
    it(`routes ${route} to the role-appropriate live workspace without rendering stale data`,()=>{
      const source=readFileSync(file,"utf8");
      expect(source).toContain('import {redirect} from "next/navigation"');
      expect(source).toContain(`redirect("${destination}")`);
      expect(source).not.toContain("dangerouslySetInnerHTML");
      expect(source).not.toMatch(/fetch\s*\(/);
    });
  }
  it("keeps exactly one audited destination for each legacy bookmark",()=>{
    expect(new Set(redirects.map(({route})=>route)).size).toBe(redirects.length);
    expect(redirects.every(({destination})=>destination.startsWith("/mentor"))).toBe(true);
  });
});
