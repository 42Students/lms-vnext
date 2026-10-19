import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("chat-13 Super Admin first third NORTH STAR manual skin drift", () => {
 it("TOPBAR-SA-SKIN-01 checks all 37 documented first-third route sources for dark primary-button text and literal palette colors", () => {
   const list=readFileSync("docs/orchestrator/ui-ux/pages-admin.md","utf8")
     .split("\n").filter(row=>row.includes(" (src/app/"))
     .map(row=>row.slice(row.indexOf("(src/app/")+1,row.lastIndexOf(")")));
   expect(list.length).toBeGreaterThanOrEqual(37);
   const pages=list.slice(0,37);
   expect(pages[0]).toContain("/admin/academics/page.tsx");
   expect(pages[36]).toContain("/admin/features/[collegeId]/trace/page.tsx");
   for(const path of pages) {
     const source=readFileSync(path,"utf8");
     expect(source,path).not.toMatch(/bg-primary[^"'<>]{0,100}text-foreground/);
     expect(source,path).not.toMatch(/#[0-9a-fA-F]{6}(?![0-9a-fA-F])/);
     expect(source,path).not.toMatch(/style=\{\{[^}]*?(?:backgroundColor|color):/);
   }
 });
 it("TOPBAR-SA-SKIN-02 retains in-page composition and shared page headers while inheriting the 68px shell", () => {
   const shell=readFileSync("src/components/shell/app-shell.tsx","utf8");
   const legacy=readFileSync("src/components/shell/topbar/legacy-topbar.tsx","utf8");
   expect(shell).toContain("{children}");
   expect(shell).toContain("<LegacyTopbar");
   expect(legacy).toContain("organizationName={organizationName}");
 });
});
