import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("chat-9 bounded loading /admin last third A",()=>{
  it("UX-admin-placements-shortlisted-02 shows a bounded recoverable loading state",()=>{
    const file=source("src/app/(authenticated)/admin/placements/shortlisted/loading.tsx");
    expect(file).toContain("GracefulPageLoading");
    expect(file).not.toContain("animate-pulse");
    expect(file).toContain("Loading shortlisted applicants");
  });
  it("UX-admin-placements-shortlisted-application-id-02 shows a bounded recoverable loading state",()=>{
    const file=source("src/app/(authenticated)/admin/placements/shortlisted/[applicationId]/loading.tsx");
    expect(file).toContain("GracefulPageLoading");
    expect(file).not.toContain("animate-pulse");
    expect(file).toContain("Loading shortlisted detail");
  });
  it("UX-admin-projects-templates-02 shows a bounded recoverable loading state",()=>{
    const file=source("src/app/(authenticated)/admin/projects/templates/loading.tsx");
    expect(file).toContain("GracefulPageLoading");
    expect(file).not.toContain("animate-pulse");
    expect(file).toContain("Loading templates");
  });
  it("UX-admin-projects-templates-template-id-02 shows a bounded recoverable loading state",()=>{
    const file=source("src/app/(authenticated)/admin/projects/templates/[templateId]/loading.tsx");
    expect(file).toContain("GracefulPageLoading");
    expect(file).not.toContain("animate-pulse");
    expect(file).toContain("Loading template details");
  });
  it("UX-admin-projects-workspaces-new-02 shows a bounded recoverable loading state",()=>{
    const file=source("src/app/(authenticated)/admin/projects/workspaces/new/loading.tsx");
    expect(file).toContain("GracefulPageLoading");
    expect(file).not.toContain("animate-pulse");
    expect(file).toContain("Loading class and template choices");
  });
  it("UX-admin-quizzes-02 shows a bounded recoverable loading state",()=>{
    const file=source("src/app/(authenticated)/admin/quizzes/loading.tsx");
    expect(file).toContain('role="status"');
    expect(file).toContain('aria-label="Loading quizzes"');
    expect(file).toContain("Array.from({length:8}");
  });
  it("UX-admin-resources-02 shows a bounded recoverable loading state",()=>{
    const file=source("src/app/(authenticated)/admin/resources/loading.tsx");
    expect(file).toContain("GracefulPageLoading");
    expect(file).not.toContain("animate-pulse");
    expect(file).toContain("Loading resources");
  });
  it("UX-admin-semester-courses-02 shows a bounded recoverable loading state",()=>{
    const file=source("src/app/(authenticated)/admin/semester-courses/loading.tsx");
    expect(file).toContain("GracefulPageLoading");
    expect(file).not.toContain("animate-pulse");
    expect(file).toContain("Loading mapping");
  });
  it("UX-admin-semesters-02 shows a bounded recoverable loading state",()=>{
    const file=source("src/app/(authenticated)/admin/semesters/loading.tsx");
    expect(file).toContain('aria-busy="true"');
    expect(file).toContain('aria-label="Loading semesters"');
    expect(file).toContain("Array.from({length:8}");
  });
  it("UX-admin-settings-02 shows a bounded recoverable loading state",()=>{
    const file=source("src/app/(authenticated)/admin/settings/loading.tsx");
    expect(file).toContain("GracefulPageLoading");
    expect(file).not.toContain("animate-pulse");
    expect(file).toContain("Loading platform settings");
  });
});
