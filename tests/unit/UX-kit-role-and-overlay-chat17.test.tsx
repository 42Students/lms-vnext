import { readFileSync } from "node:fs";
import type { ReactNode } from "react";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PermissionAction } from "@/components/ui/permission-action";
import { ownsOverlayHistoryEntry } from "@/components/ui/use-overlay-webview";
import { DataTable, isSafeDataTableHref } from "@/components/ui/data-table";
import { Pagination, normalizedPageCount, paginationWindow } from "@/components/ui/pagination";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { isSafeInternalHref } from "@/lib/safe-internal-href";
import { ThirdPartyLink } from "@/components/ui/third-party-link";
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

  it("UX-kit-HARDEN-39 overlay viewport sizing updates without visualViewport on orientation changes",()=>{
    const source=readFileSync(join(process.cwd(),"src/components/ui/use-overlay-webview.ts"),"utf8");
    expect(source).toContain('const height = viewport?.height ?? window.innerHeight');
    expect(source).toContain('window.addEventListener("resize", resize)');
    expect(source).toContain('window.removeEventListener("resize", resize)');
    expect(source).toContain('window.visualViewport?.addEventListener("resize", resize)');
    expect(source).toContain('window.visualViewport?.removeEventListener("resize", resize)');
    expect(source).toContain('setAvailableHeight');
    expect(source).toContain('setViewportBottom');
  });

  it("UX-kit-HARDEN-27 table cells render once per row and redacts unsafe rowHref navigation", () => {
    const called = vi.fn((row:{id:string,title:string})=>row.title);
    const columns = [{key:"title",header:"Project",mobilePriority:"primary" as const,cell:called}];
    const rows = [{id:"1",title:"Project North"},{id:"2",title:"Project South"}];
    const html=render(<DataTable columns={columns} rows={rows} getRowKey={row=>row.id}
      rowHref={()=>"//unsafe.example"} caption="College projects" empty={<p>No projects</p>}/>);
    // The row's cell formatter must run exactly once even though DataTable
    // renders responsive labels, details and a desktop table.
    expect(called.mock.calls.map(([row]) => row.id)).toEqual(["1", "2"]);
    expect(called).toHaveBeenCalledTimes(2);
    expect(html).toContain("Project North");
    expect(html).toContain("Project South");
    expect(html).not.toContain('href="//unsafe.example"');
    expect(html).not.toContain("View details");
    // SSR does not know whether a table actually overflows. A caption must
    // describe it while ScrollCue exposes no false scroll region until measured.
    expect(html).toMatch(/<caption\b[^>]*class="sr-only"[^>]*>College projects<\/caption>/);
    expect(html).toContain('data-slot="scroll-cue"');
    expect(html).not.toMatch(/role="region"[^>]*aria-label="College projects scrollable columns"/);
    const scrollSource=readFileSync(join(process.cwd(),"src/components/ui/data-table.tsx"),"utf8");
    expect(scrollSource).toMatch(/label=\{caption\s*\?\s*caption\s*\+\s*["'] scrollable columns["']/);
  });

  it("UX-kit-HARDEN-36 redacts mixed-permission hidden cells and never exposes denied detail links", () => {
    type Row = { id: string; title: string; canView: boolean; secret: string };
    const formatSecret=vi.fn((row:Row)=>row.secret);
    const detailHref=vi.fn((row:Row)=>"/college/projects/"+row.id+"/details");
    const columns=[
      {key:"title",header:"Workspace",mobilePriority:"primary" as const,
        cell:(row:Row)=>row.title},
      {key:"secret",header:"Private review",mobilePriority:"hidden" as const,
        mobileHiddenReason:"Review details require permission",
        mobileDetail:{fieldKey:"secret",href:detailHref,canView:(row:Row)=>row.canView},
        cell:formatSecret},
    ];
    const rows:Row[]=[
      {id:"allowed",title:"Allowed workspace",canView:true,secret:"Visible review"},
      {id:"denied",title:"Restricted workspace",canView:false,secret:"DO_NOT_RENDER_PRIVATE"},
    ];
    const html=render(<DataTable rows={rows} columns={columns}
      getRowKey={row=>row.id} empty={<p>No projects</p>}/>);
    expect(html).toContain("Allowed workspace");
    expect(html).toContain("Restricted workspace");
    expect(html).toContain("Visible review");
    expect(html).not.toContain("DO_NOT_RENDER_PRIVATE");
    expect(formatSecret).toHaveBeenCalledTimes(1);
    expect(detailHref).toHaveBeenCalledTimes(1);
    expect(html).toContain('href="/college/projects/allowed/details"');
    expect(html).not.toContain('href="/college/projects/denied/details"');
    expect((html.match(/· View details/g)??[])).toHaveLength(1);

    const deniedOnly=render(<DataTable rows={[rows[1]!]} columns={columns}
      getRowKey={row=>row.id} empty="Empty"/>);
    expect(deniedOnly).not.toContain("DO_NOT_RENDER_PRIVATE");
    expect(deniedOnly).not.toContain("Fields on detail page");
    expect(deniedOnly).not.toContain("More details");
  });

  it("UX-kit-HARDEN-58 hidden cell permissions fail closed if resolver or detail href throws",()=>{
    type Row={id:string;secret:string};
    const secretFormatter=vi.fn((row:Row)=>row.secret);
    const failPermission=vi.fn(()=>{throw new Error("permission unavailable");});
    const denied=render(<DataTable rows={[{id:"one",secret:"SECRET_ONE"}]}
      getRowKey={row=>row.id} empty="None" rowHref={()=>{throw new Error("navigation failed");}}
      columns={[
        {key:"id",header:"Project",mobilePriority:"primary",cell:(row:Row)=>row.id},
        {key:"secret",header:"Restricted",mobilePriority:"hidden",
          mobileHiddenReason:"Private",
          mobileDetail:{fieldKey:"private",canView:failPermission,href:()=>"/private"},
          cell:secretFormatter},
      ]}/>);
    expect(denied).toContain("one");
    expect(denied).not.toContain("SECRET_ONE");
    expect(denied).not.toContain('href="/private"');
    expect(secretFormatter).not.toHaveBeenCalled();
    expect(failPermission).toHaveBeenCalledTimes(1);
    const allowed=render(<DataTable rows={[{id:"two",secret:"VISIBLE_TWO"}]}
      getRowKey={row=>row.id} empty="None" columns={[
        {key:"id",header:"Project",mobilePriority:"primary",cell:(row:Row)=>row.id},
        {key:"secret",header:"Restricted",mobilePriority:"hidden",
          mobileHiddenReason:"Private",
          mobileDetail:{fieldKey:"private",canView:()=>true,href:()=>{throw Error("link unavailable");}},
          cell:secretFormatter},
      ]}/>);
    expect(allowed).toContain("VISIBLE_TWO");
    expect(allowed).not.toContain('href="/private"');
  });

  it("UX-kit-HARDEN-45 explicit mobile-hidden fields never appear in expanded mobile details",()=>{
    type Row={id:string;name:string;secret:string;other:string};
    const columns=[
      {key:"name",header:"Project",mobilePriority:"primary" as const,cell:(row:Row)=>row.name},
      ...[1,2,3,4].map(i=>({
        key:"other"+i,header:"Public "+i,mobilePriority:"secondary" as const,
        cell:(row:Row)=>row.other+"-"+i,
      })),
      {key:"secret",header:"Private feedback",mobilePriority:"hidden" as const,
        cell:(row:Row)=>row.secret},
    ];
    const html=render(<DataTable columns={columns}
      rows={[{id:"p1",name:"Project",secret:"PRIVATE_DESKTOP_VALUE",other:"Milestone"}]}
      getRowKey={row=>row.id} empty="No projects"/>);
    // The desktop-only cell is still rendered, once. It must NOT be copied
    // into the mobile disclosure, even when other secondary fields collapse.
    expect((html.match(/PRIVATE_DESKTOP_VALUE/g)??[])).toHaveLength(1);
    expect(html).toContain('class="min-w-0');
    expect(html).toContain("More details");
    const disclosure=html.slice(html.indexOf("<details"));
    expect(disclosure).not.toContain("PRIVATE_DESKTOP_VALUE");
    expect(disclosure).toContain("Milestone-4");
  });

  it("UX-kit-HARDEN-30 rejects encoded slash/backslash row links before Next navigation", () => {
    for (const href of [
      "https://attacker.test", "//attacker.test", "/\\\\attacker.test",
      "/%2Fattacker.test", "/%5Cattacker.test", "/%252Fattacker.test",
      "/%255Cattacker.test", "/%2f%2fattacker.test",
      "/%2525252fattacker.test", "/%2525255cattacker.test", " /college/projects",
      "/college/projects\\\\attacker.test", "/college/projects\u000a",
    ]) expect(isSafeDataTableHref(href)).toBe(false);
    for (const href of ["/college/projects", "/college/projects?id=7",
      "/learn/projects#tasks", "/college/projects?q=100%25", "/learn/files/%20proof"]) {
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

  it("UX-kit-HARDEN-52 huge finite page counts retain distinct safe integer links", () => {
    expect(normalizedPageCount(1e100)).toBe(Number.MAX_SAFE_INTEGER);
    const pages=paginationWindow(1e100,1e100);
    expect(pages).toHaveLength(5);
    expect(new Set(pages).size).toBe(5);
    expect(pages[4]).toBe(Number.MAX_SAFE_INTEGER);
    expect(pages.every(page=>Number.isSafeInteger(page))).toBe(true);
    const html=render(<Pagination page={1e100} pageCount={1e100}
      hrefForPage={page=>"/projects?page="+page}/>);
    expect(html).not.toContain("1e+");
    expect(html).toContain("9007199254740991");
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

  it("UX-kit-HARDEN-32 external evidence rejects backslash, trailing whitespace and embedded controls",()=>{
    for(const href of [
      "https://good.example.test\\@attacker.example.test",
      "https://example.test/path\n.evil.test",
      "https://example.test/path\t.svg",
      "https://example.test/../../bad\\file",
      " https://example.test", "https://example.test ",
    ]){
      const html=render(<ThirdPartyLink href={href} label="Evidence" />);
      expect(html).toContain("This link is unavailable.");
      expect(html).not.toContain("<a ");
    }
    const valid=render(<ThirdPartyLink href="https://example.test/proof%20one" label="Evidence" />);
    expect(valid).toContain('href="https://example.test/proof%20one"');
    expect(valid).not.toContain('target="_blank"');
  });

  it("UX-kit-HARDEN-35 breadcrumbs and table share the same hardened internal path rule",()=>{
    for(const value of ["//evil.test","/%2Fevil.test","/%252Fevil.test",
      "/%5cevil.test","/%255cevil.test","/foo\\bar",
      "javascript:alert(1)","https://evil.test", " /college/projects"]){
      expect(isSafeInternalHref(value)).toBe(false);
      expect(isSafeDataTableHref(value)).toBe(false);
      const html=render(<Breadcrumbs items={[
        {label:"Project",href:value},{label:"Members"}]}/>);
      expect(html).toContain("Project");
      expect(html).not.toContain('href=');
    }
    for(const href of ["/college/projects","/mentor/projects?q=abc%25","/learn/projects#history"]){
      expect(isSafeInternalHref(href)).toBe(true);
      const html=render(<Breadcrumbs items={[{label:"Projects",href},{label:"Current"}]}/>);
      expect(html).toContain("href=");
      expect(html).toContain('aria-current="page"');
    }
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

  it("UX-kit-HARDEN-38 toast provider uses unique local keys without requiring WebView crypto APIs",()=>{
    const source=readFileSync(join(process.cwd(),"src/components/ui/toast.tsx"),"utf8");
    expect(source).toContain("const nextToastOrdinal = useRef(0)");
    expect(source).toContain('const id = "toast-" + ++nextToastOrdinal.current');
    expect(source).not.toContain("crypto.randomUUID()");
    const notices:ToastItem[]=[
      {id:"toast-1",title:"Saved successfully",tone:"success"},
      {id:"toast-2",title:"Request failed",tone:"error"},
    ];
    expect(enqueueToast([],notices[0]!).items).toEqual([notices[0]]);
    const {items}=enqueueToast([notices[0]!],notices[1]!);
    expect(new Set(items.map(row=>row.id)).size).toBe(2);
    expect(render(<ToastStack toasts={items} onDismiss={()=>{}}/>)).toContain("Request failed");
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
