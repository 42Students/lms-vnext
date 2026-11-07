import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import ActivityError from "@/app/(authenticated)/hr/calendar/error";
import ConversationError from "@/app/(authenticated)/hr/conversations/[threadId]/error";
import DriveDraftError from "@/app/(authenticated)/hr/drives/new/error";
import HrRoundResultsError from "@/app/(authenticated)/hr/round-results/error";
import HrProfileError from "@/app/(authenticated)/hr/profile/error";
import { createRecruiterBellRequestGate, recruiterBellAriaLabel, recruiterBellPreview } from "@/modules/placements/recruiter-bell-model";

const groupIds = ["UX-G053","UX-G054","UX-G055","UX-G056","UX-G142"] as const;
const expected = [18,18,18,13,10] as const;
const read = (path:string) => readFileSync(path,"utf8");
const tracker = JSON.parse(read("docs/tracker.json")) as {
  uxReview:{ groups:Array<{id:string;sourceFiles:string[];status:string}> }
};

describe("Five HR UX groups: complete owned inventory", () => {
  groupIds.forEach((id,index) => {
    it(id+" retains every owned state/component in the canonical tracker", () => {
      const group = tracker.uxReview.groups.find(group=>group.id===id);
      expect(group).toBeDefined();
      expect(group?.sourceFiles).toHaveLength(expected[index]);
      for(const path of group!.sourceFiles) {
        expect(existsSync(path),path+" exists").toBe(true);
        expect(read(path).length,path+" has implementation").toBeGreaterThan(80);
      }
    });
  });

  it("all 22 HR pages remain access-guarded, not client-trusted", () => {
    const routePaths = groupIds.slice(0,4).flatMap(id=>tracker.uxReview.groups.find(g=>g.id===id)!.sourceFiles);
    const pages = routePaths.filter(path=>path.endsWith("/page.tsx"));
    expect(pages).toHaveLength(22);
    for(const path of pages) {
      const source=read(path);
      if(path.endsWith("/hr/messages/page.tsx")) {
        expect(source).toContain('from "@/app/(authenticated)/hr/conversations/page"');
      } else {
        expect(source,path+" must access server identity").toContain("getCurrentRequestContext");
      }
      expect(source).not.toContain("createSession(");
    }
  });
  it("all route error and loading files stay dedicated and non-disclosing", () => {
    const routePaths = groupIds.slice(0,4).flatMap(id=>tracker.uxReview.groups.find(g=>g.id===id)!.sourceFiles);
    const errors=routePaths.filter(path=>path.endsWith("/error.tsx"));
    const loading=routePaths.filter(path=>path.endsWith("/loading.tsx"));
    expect(errors).toHaveLength(22);
    expect(loading).toHaveLength(22);
    for(const path of errors) {
      const source=read(path);
      expect(source,path+" has retry/reset").toMatch(/reset\b/);
      expect(source,path+" no sensitive raw error console").not.toMatch(/console\.(?:log|error)\(\s*error\b/);
      expect(source,path+" no exception in screen").not.toMatch(/\{(?:error|error\.message|error\.digest)\}/);
    }
    for(const path of loading) {
      const source=read(path);
      expect(source,path+" renders purposeful skeleton/loading").toMatch(/GracefulPageLoading|SkeletonBlock/);
      expect(source,path+" bounded layout").toMatch(/min-w-0/);
    }
  });
  it("job detail not-found uses safe, nonenumerating recovery", () => {
    const source=read("src/app/(authenticated)/hr/placements/jobs/[jobId]/not-found.tsx");
    expect(source).toContain('href="/hr/placements"');
    expect(source).not.toContain("jobId}");
    expect(source).toContain("isn");
  });
});

describe("Five HR UX groups: rendered route recovery and source safeguards", () => {
  const secret="PRIVATE_STACK_TRACE_OR_AUTH_TOKEN";
  const states: Array<{name:string;fn:(props:{error:Error;reset:()=>void})=>React.ReactNode;safePath:string}> = [
    {name:"calendar",fn:ActivityError,safePath:"/hr/home"},
    {name:"conversation",fn:ConversationError,safePath:"/hr/conversations"},
    {name:"drive draft",fn:DriveDraftError,safePath:"/hr/drives"},
    {name:"round results",fn:HrRoundResultsError,safePath:"/hr/drives"},
    {name:"profile",fn:HrProfileError,safePath:"/hr/home"},
  ];
  states.forEach(state=>it(state.name+" keeps both retry and safe exit, never exception text",()=>{
    const rendered=renderToStaticMarkup(
      React.createElement(state.fn,{error:new Error(secret),reset:()=>undefined}),
    );
    expect(rendered).toContain('href="'+state.safePath+'"');
    expect(rendered).toContain('min-h-11');
    expect(rendered).toMatch(/Retry|Try again/);
    expect(rendered).not.toContain(secret);
  }));

  it("draft failure does not console-log raw server/client exceptions", () => {
    const s=read("src/app/(authenticated)/hr/drives/new/error.tsx");
    expect(s).not.toContain("console.error");
    expect(s).not.toContain("useEffect");
    expect(s).toContain('href="/hr/drives"');
  });
  it("unsent conversation draft only intercepts same-tab navigation", () => {
    const s=read("src/components/hr/recruiter-conversation-reply-form.tsx");
    expect(s).toContain('anchor.hasAttribute("download")');
    expect(s).toContain('anchor.target!==""&&anchor.target!=="_self"');
    expect(s).toContain("destination.origin!==window.location.origin");
    expect(s).toContain("setPendingLeave");
  });
  it("designation save avoids no-op network writes and lets users discard", () => {
    const s=read("src/components/hr/recruiter-designation-editor.tsx");
    expect(s).toContain("const dirty=title!==savedTitle");
    expect(s).toContain("disabled={saving||!dirty");
    expect(s).toContain("Discard changes");
    expect(s).toContain("setSavedTitle(payload.profile.title");
  });
  it("notifications expose no-access and malformed-response recovery", () => {
    const s=read("src/components/hr/recruiter-notification-bell.tsx");
    expect(s).toContain('payload.status==="READY"&&!Array.isArray(payload.rows)');
    expect(s).toContain('data?.status==="NO_ACCESS"');
    expect(s).toContain('setData(null);setError("Couldn\'t verify notifications.');
    const gate=createRecruiterBellRequestGate();
    const old=gate.begin(),now=gate.begin();
    expect(gate.isCurrent(old)).toBe(false);
    expect(gate.isCurrent(now)).toBe(true);
    gate.invalidate();
    expect(gate.isCurrent(now)).toBe(false);
    expect(recruiterBellAriaLabel(3)).toContain("3 new");
    expect(recruiterBellPreview(Array.from({length:8},(_,i)=>({
      id:String(i),title:"Notice",label:"Job",unread:false,createdAt:"2026-11-07",jobId:"id",
    })))).toHaveLength(6);
  });
  it("round editing and private applicant feedback support touch/a11y",()=>{
    const round=read("src/components/hr/recruiter-round-inline-editor.tsx");
    expect(round).toContain("min-h-11 md:min-h-9");
    expect(round).toContain("ConfirmActionDialog");
    const rating=read("src/components/hr/recruiter-private-rating-editor.tsx");
    expect(rating).toContain('?"alert":"status"');
    expect(rating).toContain('key={props.jobId+":"+props.applicationId}');
  });
});
