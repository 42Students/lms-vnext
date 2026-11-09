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
  it("G021 template availability and detail errors return to the template catalogue",()=>{
    expect(route("projects/templates/[templateId]/colleges/error.tsx")).toContain('homeHref="/admin/projects/templates"');
    expect(route("projects/templates/[templateId]/error.tsx")).toContain('href="/admin/projects/templates"');
  });
});
