import { readFileSync } from "node:fs";
import type { ReactNode } from "react";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PermissionAction } from "@/components/ui/permission-action";
import { ownsOverlayHistoryEntry } from "@/components/ui/use-overlay-webview";
import { DataTable, isSafeDataTableHref } from "@/components/ui/data-table";
import { Pagination, normalizedPageCount, paginationWindow } from "@/components/ui/pagination";
import { fileMatchesAccept, fileSizeIsValid } from "@/components/ui/file-upload";
import { clearEvictedToastTimers, enqueueToast, ToastStack, type ToastItem } from "@/components/ui/toast";
import type { RequestContext } from "@/modules/identity/context";

const ORG = "11111111-1111-4111-8111-111111111111";
const OWN = "22222222-2222-4222-8222-222222222222";
const OTHER = "33333333-3333-4333-8333-333333333333";
const member = (overrides: Partial<RequestContext> = {}): RequestContext => ({
  user: { id: "44444444-4444-4444-8444-444444444444", identityUid: "ui-kit-test",
    platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: "55555555-5555-4555-8555-555555555555",
    collegeId: OWN, organizationId: ORG, status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
  adminScope: null,
  recruiter: null,
  ...overrides,
});
const render = (node: ReactNode) => renderToStaticMarkup(<>{node}</>);

describe("UX-kit-HARDEN-23 authorization boundaries and WebView history", () => {
  it("UX-kit-HARDEN-23 permission action renders controls only in the actor's college", () => {
    const own = render(<PermissionAction context={member()} permission="projects.manage"
      resource={{collegeId: OWN, organizationId: ORG}}><button>Archive workspace</button></PermissionAction>);
    expect(own).toContain("Archive workspace");

    const foreign = render(<PermissionAction context={member()} permission="projects.manage"
      resource={{collegeId: OTHER, organizationId: ORG}}><button>Archive workspace</button></PermissionAction>);
    expect(foreign).not.toContain("<button");
    expect(foreign).toContain("You do not have permission");

    const disabled = render(<PermissionAction context={member({
      user: { ...member().user, platformStatus: "DISABLED" }
    })} permission="projects.manage" resource={{collegeId: OWN}}>
      <button>Archive workspace</button>
    </PermissionAction>);
    expect(disabled).not.toContain("<button");
  });

  it("UX-kit-HARDEN-24 hide-sensitive and stale membership never leak child DOM", () => {
    const stale = member({membership: {...member().membership!, status:"ENDED"}});
    const invisible = render(<PermissionAction context={stale} permission="projects.read"
      resource={{collegeId:OWN}} deniedMode="hide-sensitive">
      <span>Private project student contacts</span>
    </PermissionAction>);
    expect(invisible).not.toContain("Private project student contacts");
    expect(invisible).toBe("");
    const fallback = render(<PermissionAction context={stale} permission="projects.read"
      resource={{collegeId:OWN}} fallback={<span>Request access</span>}>
      <span>Secret</span>
    </PermissionAction>);
    expect(fallback).toContain("Request access");
    expect(fallback).not.toContain("Secret");
  });

  it("UX-kit-HARDEN-25 scoped super admin cannot get global system-role mutation control", () => {
    const superAdmin = member({
      user: { ...member().user, systemRoles:["SUPER_ADMIN"] },
      membership:null,
      adminScope:{organizationId:null,collegeId:null},
    });
    expect(render(<PermissionAction context={superAdmin} permission="system-role.manage">
      <button>Grant super admin</button>
    </PermissionAction>)).toContain("Grant super admin");
    const scoped = {...superAdmin,adminScope:{organizationId:ORG,collegeId:OWN}};
    const denied = render(<PermissionAction context={scoped} permission="system-role.manage">
      <button>Grant super admin</button>
    </PermissionAction>);
    expect(denied).not.toContain("Grant super admin");
    expect(denied).toContain('role="note"');
  });

  it("UX-kit-HARDEN-26 native back only matches exactly the active overlay marker", () => {
    const marker="lms-overlay:project-dialog:1";
    expect(ownsOverlayHistoryEntry({lmsOverlay:marker},marker)).toBe(true);
    for(const value of [null,undefined,marker,5,[],{}, {lmsOverlay:marker+"-old"},
      {lmsOverlay:null},{lmsOverlay:1}]) {
      expect(ownsOverlayHistoryEntry(value,marker)).toBe(false);
    }
    const source=readFileSync(join(process.cwd(),"src/components/ui/use-overlay-webview.ts"),"utf8");
    expect(source.startsWith('"use client";')).toBe(true);
    expect(source).toContain('event.preventDefault()');
    expect(source).toContain('if (dismissibleRef.current) callback.current()');
    expect(source).toContain("window.visualViewport?.removeEventListener");
    expect(source).toContain("activeOverlayStack.splice(index, 1)");
  });

  it("UX-kit-HARDEN-27 table cells render once per row and redacts unsafe rowHref navigation", () => {
    const called = vi.fn((row:{id:string,title:string})=>row.title);
    const columns = [{key:"title",header:"Project",mobilePriority:"primary" as const,cell:called}];
    const rows = [{id:"1",title:"Project North"},{id:"2",title:"Project South"}];
    const html=render(<DataTable columns={columns} rows={rows} getRowKey={row=>row.id}
      rowHref={()=>"//unsafe.example"} caption="College projects" empty={<p>No projects</p>}/>);
    expect(called).toHaveBeenCalledTimes(2);
    expect(html).toContain("Project North");
    expect(html).toContain("Project South");
    expect(html).not.toContain('href="//unsafe.example"');
    // ScrollCue only assigns a named region AFTER measuring real overflow in
    // the client. SSR cannot truthfully claim it is scrollable.
    expect(html).toContain('<caption class="sr-only">College projects</caption>');
    expect(html).toContain('data-slot="scroll-cue"');
    const scrollSource=readFileSync(join(process.cwd(),"src/components/ui/data-table.tsx"),"utf8");
    expect(scrollSource).toContain('caption+" scrollable columns"');
  });

  it("UX-kit-HARDEN-30 rejects encoded slash/backslash row links before Next navigation", () => {
    for (const href of [
      "https://attacker.test", "//attacker.test", "/\\\\attacker.test",
      "/%2Fattacker.test", "/%5Cattacker.test", "/%252Fattacker.test",
      "/%255Cattacker.test", "/%2f%2fattacker.test", " /college/projects",
      "/college/projects\\\\attacker.test", "/college/projects\u000a",
    ]) expect(isSafeDataTableHref(href)).toBe(false);
    for (const href of ["/college/projects", "/college/projects?id=7", "/learn/projects#tasks"]) {
      expect(isSafeDataTableHref(href)).toBe(true);
    }
    const columns=[{key:"project",header:"Project",mobilePriority:"primary" as const,
      cell:(row:{id:string,name:string})=>row.name}];
    const html=render(<DataTable columns={columns}
      rows={[{id:"1",name:"Alpha"}]} getRowKey={r=>r.id} empty="No projects"
      rowHref={()=>"/%2fattacker.test"} />);
    expect(html).toContain("Alpha");
    expect(html).not.toContain("View details");
  });

  it("UX-kit-HARDEN-31 NaN/Infinity pager inputs cannot yield links to non-finite pages", () => {
    for (const invalid of [Infinity, -Infinity, NaN, 0, -5]) {
      expect(normalizedPageCount(invalid)).toBe(1);
      expect(paginationWindow(20, invalid)).toEqual([1]);
      const html=render(<Pagination page={invalid} pageCount={invalid}
        hrefForPage={index=>"/mentor/projects?page="+index}/>);
      expect(html).toContain('Page 1 of 1');
      expect(html).not.toMatch(/href="[^"]*(?:Infinity|NaN)/);
      expect(html).toContain('aria-disabled="true"');
    }
    expect(normalizedPageCount(10000)).toBe(10000);
    expect(paginationWindow(10000,10000)).toEqual([9996,9997,9998,9999,10000]);
  });

  it("UX-kit-HARDEN-28 upload prechecks fail closed for invalid sizes and untrusted types", () => {
    expect(fileSizeIsValid(Number.NaN)).toBe(false);
    expect(fileSizeIsValid(Number.POSITIVE_INFINITY)).toBe(false);
    expect(fileSizeIsValid(-1)).toBe(false);
    expect(fileSizeIsValid(4096,4096)).toBe(true);
    expect(fileSizeIsValid(4097,4096)).toBe(false);
    expect(fileMatchesAccept({name:"proof.jpeg",type:"image/jpeg"}, ".pdf, image/*")).toBe(true);
    expect(fileMatchesAccept({name:"payload.exe",type:"application/x-msdownload"},".pdf, image/*")).toBe(false);
    expect(fileMatchesAccept({name:"proof.pdf",type:"application/pdf"},".pdf")).toBe(true);
  });

  it("UX-kit-HARDEN-29 persistent errors never evict and timed toast timers are cleaned up", () => {
    const errors:ToastItem[]=Array.from({length:6},(_,i)=>({
      id:"err-"+i,title:"Could not save attempt "+i,tone:"error",
    }));
    let current=errors;
    let evicted:string[]=[];
    for(let i=0;i<6;i++){
      const next=enqueueToast(current,{id:"info-"+i,title:"Saved "+i,tone:"info"},2);
      current=next.items;
      evicted=[...evicted,...next.evictedIds];
    }
    expect(current.filter(x=>x.tone==="error")).toHaveLength(6);
    expect(current.filter(x=>x.tone==="info")).toHaveLength(2);
    const handles=new Map<string,ReturnType<typeof setTimeout>>();
    for(const id of evicted)handles.set(id,setTimeout(()=>{},100_000));
    const canceled=vi.fn((timer:ReturnType<typeof setTimeout>)=>clearTimeout(timer));
    try{
      clearEvictedToastTimers(evicted,handles,canceled);
      expect(canceled).toHaveBeenCalledTimes(evicted.length);
      expect(handles.size).toBe(0);
    }finally{
      handles.forEach(clearTimeout);
    }
    const html=render(<ToastStack toasts={current} onDismiss={()=>{}} viewport={{height:320,bottom:0}}/>);
    expect((html.match(/role="alert"/g)??[])).toHaveLength(6);
    expect(html).toContain("overscroll-contain");
    expect(html).toContain('tabindex="0"');
  });
});
