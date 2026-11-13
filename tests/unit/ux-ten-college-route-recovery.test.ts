import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
const route=(path:string)=>readFileSync("src/app/(authenticated)/college/"+path,"utf8");
const cases=[
  ["batch-promotion/error.tsx",'href="/college/batches"'],
  ["college-profile/error.tsx",'href="/college/contacts"'],
  ["courses/error.tsx",'href="/college"'],
  ["electives/[slotId]/allocate/error.tsx",'href="/college/electives"'],
  ["groups/error.tsx",'href="/college"'],
  ["lecture-halls/[hallId]/loading.tsx",'href="/college/lecture-halls"'],
  ["placements/jobs/[jobId]/error.tsx",'homeHref="/college/placements"'],
  ["placements/new/error.tsx",'homeHref="/college/placements"'],
  ["projects/error.tsx",'homeHref="/college/projects"'],
  ["projects/audit/error.tsx",'homeHref="/college/projects"'],
] as const;
describe("UX-G030–G040 scoped College Admin recovery",()=>{
  for(const [path,destination] of cases)it("shows safe return: "+path,()=>{
    const code=route(path);
    expect(code).toContain(destination);
    expect(code).not.toContain("error.message");
    expect(code).not.toContain("error.digest");
  });
  it("project detail and review subroutes return to the College project workspace",()=>{
    for(const file of [
      "projects/[projectId]/error.tsx",
      "projects/[projectId]/readiness/error.tsx",
      "projects/at-risk/error.tsx",
      "projects/readiness/error.tsx",
      "projects/reassign-mentor/error.tsx",
      "projects/submissions/error.tsx",
      "projects/templates/error.tsx",
    ])expect(route(file)).toContain('homeHref="/college/projects"');
  });
  it("keeps Retry plus an alternate path on failed College Admin directories",()=>{
    for(const [file,href] of [
      ["batches/[cohortId]/students/error.tsx","/college/batches"],
      ["batches/error.tsx","/college"],
      ["branding/error.tsx","/college"],
      ["classes/recurring-preview/error.tsx","/college/classes"],
      ["companies/error.tsx","/college"],
      ["contacts/[membershipId]/error.tsx","/college/contacts"],
      ["course-progress/error.tsx","/college"],
      ["departments/error.tsx","/college"],
      ["domains/error.tsx","/college"],
      ["electives/error.tsx","/college"],
      ["electives/[slotId]/offerings/[offeringId]/roster/error.tsx","/college/electives"],
      ["faculty-assignment/error.tsx","/college/faculty"],
      ["faculty/error.tsx","/college"],
      ["groups/[groupId]/error.tsx","/college/groups"],
      ["groups/[groupId]/import-preview/error.tsx","/college/groups"],
      ["groups/[groupId]/rule-preview/error.tsx","/college/groups"],
      ["lecture-halls/error.tsx","/college"],
      ["people/manage/error.tsx","/college/people"],
      ["placements/jobs/[jobId]/applications/error.tsx","/college/placements"],
      ["placements/jobs/[jobId]/interviews/error.tsx","/college/placements"],
      ["placements/jobs/[jobId]/overview/error.tsx","/college/placements"],
      ["placements/readiness-by-department/error.tsx","/college/placements"],
      ["programs/error.tsx","/college"],
      ["projects/[projectId]/[section]/error.tsx","/college/projects"],
    ] as const){
      const code=route(file);
      // Most boundaries link to a fixed path; the placement drive boundaries build a path under it from the validated job id.
      expect(code.includes('href="'+href+'"')||code.includes(href+"/")).toBe(true);
      expect(code).toContain("onClick={reset}");
      // A typed comparison against known internal codes is safe; rendering
      // the original exception message or digest to the user is not.
      expect(code).not.toContain("{error.message}");
      expect(code).not.toContain("{error.digest}");
    }
    expect(route("profile/error.tsx")).toContain('homeHref="/college"');
    expect(route("course-progress/error.tsx")).toContain('error.message==="COURSE_PROGRESS_FILTERS_UNAVAILABLE"');
  });
  it("keeps at least 44px touch-sized error retry controls on mobile",()=>{
    for(const file of ["classes/error.tsx","lessons/error.tsx","faculty/error.tsx","lecture-halls/error.tsx"]){
      expect(route(file)).toContain("min-h-11");
      expect(route(file)).toContain("md:min-h-9");
    }
  });
  it("UX-G032 shows an accessible recovery path when course URL filters are invalid",()=>{
    const code=route("courses/page.tsx");
    expect(code).toContain("!parsedCatalogue.success");
    expect(code).toContain("Invalid course filters were ignored.");
    expect(code).toContain('href="/college/courses"');
    expect(code).toContain("min-h-11");
    expect(code).toContain("collegeCourseCatalogueQuerySchema.safeParse");
  });
  it("UX-G030 recovery for failed period reads is touch accessible",()=>{
    const code=route("batches/page.tsx");
    expect(code).toContain('className="ml-2 inline-flex min-h-11 items-center md:min-h-9">Retry periods');
    expect(code).toContain('periodRead.status==="rejected"');
  });
  it("UX-G031 contact clear-search action meets mobile touch target",()=>{
    const code=route("contacts/page.tsx");
    expect(code).toContain('min-h-11 items-center md:min-h-9">Clear search');
    expect(code).toContain("Student contact details are masked");
  });
  it("UX-G033 elective allocation denied-state provides a touch-sized safe exit",()=>{
    const code=route("electives/[slotId]/allocate/page.tsx");
    expect(code).toContain('href="/college/electives" className="inline-flex min-h-11 items-center md:min-h-9"');
    expect(code).toContain('hasMembershipRole(actor,"COLLEGE_ADMIN")');
  });
  it("UX-G034 empty-state copy does not conflate study groups and other types",()=>{
    const code=route("groups/page.tsx");
    expect(code).toContain("No study groups have been created in this college yet.");
    expect(code).toContain("Choose All types");
    expect(code).toContain('process.env["COLLEGE_STUDY_GROUPS_RELEASED"] !== "true"');
  });
  it("does not remove College Admin role guard",()=>{
    const code=route("placements/new/page.tsx");
    expect(code).toContain("hasMembershipRole(");
    expect(code).toContain('"COLLEGE_ADMIN"');
    expect(code).toContain('redirect("/dashboard")');
  });
  it("test-only preview is a 404 unless explicitly enabled in development",()=>{
    const code=readFileSync("src/app/e2e/ux-ten-college-recovery/page.tsx","utf8");
    expect(code).toContain('process.env.NODE_ENV!=="development"');
    expect(code).toContain('process.env["UX_TEN_COLLEGE_FIXTURE"]!=="1"');
    expect(code).toContain("notFound()");
  });
});
