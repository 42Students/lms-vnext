import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,it,expect} from "vitest";

const route=(subpath:string)=>readFileSync(join(process.cwd(),"src/app/(authenticated)/admin",subpath),"utf8");

describe("UX-G010 to G021: Super Admin atomic route recovery",()=>{
  it("G010 shows faculty assignment counts as numbers, not timestamps",()=>{
    const src=route("faculty-assignment/page.tsx");
    expect(src).toContain("formatNumberIN(stat.value)");
    expect(src).not.toContain("formatDateWith(stat.value");
    expect(src).toContain("getCurrentRequestContext()");
  });
  it.each(["electives","faculty-assignment"] as const)("G010 %s read errors preserve retry and safe academic exit",name=>{
    const src=route(name+"/error.tsx");
    expect(src).toContain("onClick={reset}");
    expect(src).toContain('href="/admin/academics"');
    expect(src).toContain("min-h-11");
    expect(src).not.toContain("error.message");
  });
  it("G011 student module-detail and history retain scoped source and in-shell retry",()=>{
    const prefix="features/[collegeId]/students/[membershipId]";
    for(const p of ["error.tsx","history/error.tsx"]){
      const src=route(prefix+"/"+p);
      expect(src).toContain("insideShell");
      expect(src).toContain('homeHref="/admin/features"');
    }
    expect(route(prefix+"/page.tsx")).toContain("notFound()");
    expect(route(prefix+"/history/page.tsx")).toContain("notFound()");
  });
  it("G012 lecture hall and lesson failures stay within Super Admin navigation",()=>{
    const room=route("lecture-halls/[hallId]/error.tsx");
    expect(room).toContain("insideShell");
    expect(room).toContain('homeHref="/admin/lecture-halls"');
    const lesson=route("lessons/error.tsx");
    expect(lesson).toContain("onClick={reset}");
    expect(lesson).toContain('href="/admin/courses"');
    expect(lesson).toContain("min-h-11");
  });
  it("G013 people directory and audit failures preserve the signed-in shell",()=>{
    const prefix="people/directory/[membershipId]";
    for(const p of ["error.tsx","audit/error.tsx"]){
      const src=route(prefix+"/"+p);
      expect(src).toContain("insideShell");
      expect(src).toContain('homeHref="/admin/people/directory"');
      expect(src).not.toContain("error.message");
    }
    expect(route(prefix+"/audit/page.tsx")).toContain("getCurrentRequestContext()");
  });
  it("G014 placement analytics failure never replaces the shell with a public 500",()=>{
    const src=route("placements/analytics/error.tsx");
    expect(src).toContain("insideShell");
    expect(src).toContain("showHeader={false}");
    expect(src).toContain('homeHref="/admin/placements"');
    expect(src).toContain("error={error} reset={reset}");
  });
  it("G016 applications and drive detail expose recovery without losing college context",()=>{
    for(const p of ["placements/jobs/[jobId]/error.tsx","placements/jobs/[jobId]/applications/error.tsx"]){
      const src=route(p);
      expect(src).toContain("insideShell");
      expect(src).toContain('homeHref="/admin/placements/drives"');
    }
  });
  it("G017 joining and drive creation have retry and safe navigation",()=>{
    const joining=route("placements/joining/[offerId]/error.tsx");
    expect(joining).toContain("onClick={reset}");
    expect(joining).toContain('href="/admin/placements/joining"');
    const create=route("placements/new/error.tsx");
    expect(create).toContain("insideShell");
    expect(create).toContain("reset={reset}");
  });
  it("G019 student search and programs recover under role-scoped paths",()=>{
    expect(route("placements/student-lookup/error.tsx")).toContain('homeHref="/admin/placements"');
    expect(route("programs/error.tsx")).toContain("insideShell");
  });
  it("G020 at-risk and audit project failures never leave the Super Admin shell",()=>{
    for(const p of ["projects/at-risk/error.tsx","projects/audit/error.tsx"]){
      const src=route(p);
      expect(src).toContain("insideShell");
      expect(src).toContain('homeHref="/admin/projects"');
    }
  });
  it("G010 elective read-failure notice gives a truthful recovery instruction",()=>{
    const src=route("electives/page.tsx");
    expect(src).toContain("Choose Retry slots below");
    expect(src).not.toContain("use Retry above");
  });
  it("G011 malformed membership history filters offer an explicit reset without a 404",()=>{
    const src=route("features/[collegeId]/students/[membershipId]/history/page.tsx");
    expect(src).toContain('title="Invalid history filters"');
    expect(src).toContain("studentRuleHistoryHref(collegeId,membershipId,null)");
    expect(src).toContain("The membership history has not been loaded.");
  });
  it("G012 hall schedule explicitly rejects unsupported and repeated filters",()=>{
    const src=route("lecture-halls/[hallId]/page.tsx");
    expect(src).toContain("supportedFilters=Object.entries(raw).every");
    expect(src).toContain('(key==="from"||key==="to")&&!Array.isArray(value)');
    expect(src).toContain("!supportedFilters||!parsed.success");
  });
  it("G013 membership audit retains a safe failure state and authorized read",()=>{
    const src=route("people/directory/[membershipId]/audit/page.tsx");
    expect(src).toContain("listSuperAdminPersonAudit(await getCurrentRequestContext(),membershipId)");
    expect(src).toContain("if(error instanceof AuthorizationError)throw error;");
    expect(src).toContain("Membership audit unavailable");
    expect(src).toContain("No audit records are shown while this request has failed.");
  });
  it("G014 application read failure keeps retry and a safe return to drives",()=>{
    const src=route("placements/applications/[applicationId]/error.tsx");
    expect(src).toContain("Retry application");
    expect(src).toContain('href="/admin/placements/drives"');
    expect(src).toContain("min-h-11");
  });
  it("G016 drive backlink requires the exact placement path boundary",()=>{
    const src=route("placements/jobs/[jobId]/page.tsx");
    expect(src).toContain("const backHref=");
    expect(src).toContain("admin\\/placements(?:\\/|\\?|$)");
    expect(src).toContain('requested:"/admin/placements/drives"');
  });
  it("G017 joining read failure cannot be mistaken for an offer decision",()=>{
    const src=route("placements/joining/[offerId]/error.tsx");
    expect(src).toContain("This is not a missing or rejected offer");
    expect(src).toContain("Retry joining outcome");
    expect(src).toContain("min-h-11");
  });
  it("G019 global programs do not pretend unsupported college filters were applied",()=>{
    const src=route("programs/page.tsx");
    expect(src).toContain('key!=="page"');
    expect(src).toContain("Invalid global program filters");
  });
  it("G020 missing college is a selection-needed state, not endless loading",()=>{
    const src=route("projects/at-risk/page.tsx");
    expect(src).toContain('title="No college selected"');
    expect(src).not.toContain('label="Awaiting college scope"');
  });
  it("G021 template college filters reject unknown URL keys",()=>{
    const src=route("projects/templates/[templateId]/colleges/page.tsx");
    expect(src).toContain("supportedFilters=Object.entries(raw).every");
    expect(src).toContain("!supportedFilters||!parsed.success");
  });
  it("G021 template availability and detail errors return to the template catalogue",()=>{
    expect(route("projects/templates/[templateId]/colleges/error.tsx")).toContain('homeHref="/admin/projects/templates"');
    expect(route("projects/templates/[templateId]/error.tsx")).toContain('href="/admin/projects/templates"');
  });
});
