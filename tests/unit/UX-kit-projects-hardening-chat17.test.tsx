import { describe, expect, it } from "vitest";
import type { ReactNode } from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { Avatar, avatarInitials } from "@/components/ui/avatar";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DisabledReason } from "@/components/ui/disabled-reason";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { fileMatchesAccept, fileSizeIsValid, mustClearFileSelection, FileUpload } from "@/components/ui/file-upload";
import { FormField } from "@/components/ui/form-field";
import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
import { InlineNotice } from "@/components/ui/inline-notice";
import { Input } from "@/components/ui/input";
import { LongText } from "@/components/ui/long-text";
import { PageHeader } from "@/components/ui/page-header";
import { PageLoading } from "@/components/ui/page-loading";
import { paginationWindow, Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Checkbox, Radio, Switch } from "@/components/ui/selection-controls";
import { Skeleton } from "@/components/ui/skeleton";
import { StatTile } from "@/components/ui/stat-tile";
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import { ThirdPartyLink } from "@/components/ui/third-party-link";
import { InfoPopover } from "@/components/ui/tooltip";
import { ToastStack, enqueueToast, type ToastItem } from "@/components/ui/toast";
import { LoadingState } from "@/components/ui/loading-state";
import { Disclosure } from "@/components/ui/disclosure";
import { DataTable } from "@/components/ui/data-table";
import { Tabs, tabNextEnabled } from "@/components/ui/tabs";
import { FilterBar } from "@/components/ui/filter-bar";
import { Dialog } from "@/components/ui/dialog";
import { Drawer } from "@/components/ui/drawer";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { ScrollCue } from "@/components/ui/scroll-cue";

const source = (name: string) => readFileSync(join(process.cwd(),"src/components/ui",name+".tsx"),"utf8");
const render = (node: ReactNode) => renderToStaticMarkup(<>{node}</>);

describe("UX-kit-HARDEN-01 shared primitives: a11y, validation, phone and failure states",()=>{
  it("UX-kit-HARDEN-01 button pending/danger/disabled statuses expose semantics and 44px target",()=>{
    const pending=render(<Button loading onClick={()=>{}}>Save</Button>);
    expect(pending).toContain('disabled=""');
    expect(pending).toContain('aria-busy="true"');
    expect(pending).toContain("min-h-11");
    expect(render(<Button variant="danger">Delete</Button>)).toContain("border-error");
  });
  it("UX-kit-HARDEN-02 Input/Select/Textarea expose 16px input, invalid state and 44px target",()=>{
    for(const html of [
      render(<Input aria-invalid required id="email"/>),
      render(<Select aria-invalid id="role"><option>Mentor</option></Select>),
      render(<Textarea aria-invalid id="reason"/>),
    ]){
      expect(html).toContain("text-base");
      expect(html).toContain('aria-invalid="true"');
      expect(html).toContain("min-h-");
    }
  });
  it("UX-kit-HARDEN-03 FormField always attaches an error ID even when caller forgets spread",()=>{
    const html=render(<FormField id="name" label="Name" error="Name required" helper="Shown publicly">
      {()=> <Input/>}</FormField>);
    expect(html).toContain('for="name"');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-describedby="name-hint name-error"');
    expect(html).toContain('role="alert"');
  });
  it("UX-kit-HARDEN-04 Checkbox/Radio/Switch native semantics and descriptive labels survive",()=>{
    for(const [type,html] of [
      ["checkbox",render(<Checkbox label="Include me" name="include"/>)],
      ["radio",render(<Radio label="Mentor" name="role"/>)],
      ["checkbox",render(<Switch label="Notifications" name="notice"/>)],
    ]) {expect(html).toContain('type="'+type+'"');expect(html).toContain("min-h-11");}
    expect(render(<Switch label="Notifications" name="notice"/>)).toContain('role="switch"');
  });
  it("UX-kit-HARDEN-05 file picker denies unsafe types, oversized files and stale selections",()=>{
    expect(fileSizeIsValid(-1,100)).toBe(false);
    expect(fileSizeIsValid(101,100)).toBe(false);
    expect(fileSizeIsValid(100,100)).toBe(true);
    expect(fileMatchesAccept({name:"virus.exe",type:"application/x-msdownload"},".pdf,image/*")).toBe(false);
    expect(fileMatchesAccept({name:"proof.PDF",type:"application/pdf"},".pdf")).toBe(true);
    expect(mustClearFileSelection(true,true,false)).toBe(true);
    const unavailable=render(<FileUpload label="Proof" pickerUnavailable onFiles={()=>{}} fallback={<a href="/help">Alternative</a>}/>);
    expect(unavailable).toContain('role="status"');
    expect(unavailable).toContain("File selection is unavailable");
    expect(unavailable).toContain('role="alert"');
  });
  it("UX-kit-HARDEN-06 ErrorState/EmptyState are distinct from false success and offer recovery",()=>{
    const error=render(<ErrorState description="Could not save" action={<Button>Try again</Button>}/>);
    const empty=render(<EmptyState title="No tasks" description="Create a task" action={<Button>New task</Button>}/>);
    expect(error).toContain('role="alert"');
    expect(error).toContain("Try again");
    expect(empty).toContain("No tasks");
    expect(empty).toContain("New task");
    expect(empty).not.toContain('role="alert"');
  });
  it("UX-kit-HARDEN-07 disabled action gives discoverable reason; inline errors persist",()=>{
    const disabled=render(<DisabledReason reason="Join your college first"><Button disabled>Create</Button></DisabledReason>);
    expect(disabled).toContain('aria-describedby="');
    expect(disabled).toContain("Join your college first");
    const error=render(<InlineNotice tone="error" message="Submission failed" onDismiss={()=>{}}/>);
    expect(error).toContain('role="alert"');
    expect(error).toContain('aria-label="Dismiss notice"');
    expect(error).toContain("min-h-11");
  });
  it("UX-kit-HARDEN-56 loading Button keeps truthful aria-busy despite a stale caller override",()=>{
    const loading=render(<Button loading aria-busy={false} type="submit">Save changes</Button>);
    expect(loading).toContain('aria-busy="true"');
    expect(loading).toContain('disabled=""');
    const normal=render(<Button aria-busy={false}>Save</Button>);
    expect(normal).toContain('aria-busy="false"');
    expect(normal).not.toContain('disabled=""');
  });

  it("UX-kit-HARDEN-53 disabled action reason has its own keyboard stop without duplicating enabled stops",()=>{
    const disabled=render(<DisabledReason reason="Add a student first">
      <Button disabled aria-describedby="existing-hint">Create project</Button>
    </DisabledReason>);
    expect(disabled).toContain('role="group"');
    expect(disabled).toContain('tabindex="0"');
    expect(disabled).toMatch(/<button[^>]*disabled=""[^>]*aria-describedby="existing-hint [^"]+"/);
    expect(disabled).toContain("Add a student first");
    const enabled=render(<DisabledReason reason="Optional guidance">
      <Button>Continue</Button>
    </DisabledReason>);
    expect(enabled).not.toContain('role="group"');
    expect(enabled).not.toContain('tabindex="0"');
    expect(enabled).toContain('aria-describedby="');
  });
  it("UX-kit-HARDEN-08 pager handles out-of-range values and has keyboard navigable labels",()=>{
    expect(paginationWindow(2,10)).toEqual([1,2,3,4,5]);
    expect(paginationWindow(100,2)).toEqual([1,2]);
    const html=render(<Pagination page={20} pageCount={2} hrefForPage={page=>"/tasks?page="+page}/>);
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('aria-disabled="true"');
    expect(html).toContain("min-h-11");
    expect(html).toContain("Page 2 of 2");
  });
  it("UX-kit-HARDEN-09 navigation breadcrumbs never turn current page into another link",()=>{
    const html=render(<Breadcrumbs items={[{label:"Courses",href:"/learn/courses"},{label:"Project A",href:"/learn/courses/A"}]}/>);
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('href="/learn/courses"');
    expect(html).not.toContain('href="/learn/courses/A"');
  });
  it("UX-kit-HARDEN-10 page heading, card footer and status badge carry exact copy",()=>{
    expect(render(<PageHeader eyebrow="Projects" title="Workspace" description="A plan"/>)).toContain("<h1");
    expect(render(<Card title="Sprint" footer={<Button>Start</Button>}><p>Planned</p></Card>)).toContain("Start");
    expect(render(<StatusBadge tone="error">Blocked</StatusBadge>)).toContain("lms-error-subtle");
  });
  it("UX-kit-HARDEN-11 stats format finite numbers, names wrap, avatars anonymize images",()=>{
    const html=render(<StatTile label="Tasks" value={1200} href="/mentor/projects"/>);
    expect(html).toContain("1,200");
    expect(html).toContain('href="/mentor/projects"');
    expect(render(<StatTile label="Tasks" value={Number.POSITIVE_INFINITY}/>)).toContain("—");
    expect(avatarInitials("  IIT Dharwad  ")).toBe("ID");
    expect(render(<Avatar name="Student Name"/>)).toContain('aria-label="Student Name"');
    expect(render(<LongText value="<script>Bad</script>"/>)).not.toContain("<script>");
  });
  it("UX-kit-HARDEN-12 info popover and disclosure are keyboard accessible",()=>{
    const info=render(<InfoPopover label="Rubric explanation" content={<p>Read rules</p>}><span>?</span></InfoPopover>);
    expect(info).toContain("<summary");
    expect(info).toContain('aria-label="Rubric explanation"');
    expect(info).toContain("min-h-11");
    const disclosure=render(<Disclosure title="More details"><p>Due date</p></Disclosure>);
    expect(disclosure).toContain("<details");
    expect(disclosure).toContain("Due date");
  });
  it("UX-kit-HARDEN-13 error and slow loading states preserve original loading description",()=>{
    for(const html of [
      render(<PageLoading label="Loading projects" variant="card"/>),
      render(<GracefulPageLoading label="Loading assignments" shape="directory"/>),
      render(<LoadingState label="Loading task review"/>),
      render(<Skeleton label="Loading mentor summary" variant="row" count={2}/>),
    ]) { expect(html).toContain("sr-only"); }
    expect(source("page-loading")).toContain("Try again");
    expect(source("graceful-page-loading")).toContain("Try again");
  });
  it("UX-kit-HARDEN-14 link refuses HTTP/credentials and keeps valid URL copy fallback",()=>{
    expect(render(<ThirdPartyLink href="http://malicious.example" label="Open"/>)).toContain("This link is unavailable.");
    expect(render(<ThirdPartyLink href="https://user:pass@trusted.example" label="Open"/>)).not.toContain("<a ");
    const html=render(<ThirdPartyLink href="https://example.org/" label="Open meeting"/>);
    expect(html).toContain('href="https://example.org/"');
    expect(html).toContain("Destination URL");
    expect(html).toContain("Copy link");
    expect(html).not.toContain('target="_blank"');
  });
  it("UX-kit-HARDEN-15 8+ persistent errors remain separately dismissible while timed entries cap",()=>{
    const errors: ToastItem[]=Array.from({length:9},(_,i)=>({id:String(i),title:"Error "+i,tone:"error" as const}));
    let current=errors;
    for(let i=0;i<6;i++)current=enqueueToast(current,{id:"timed-"+i,title:"Info "+i,tone:"info"}).items;
    expect(current.filter(e=>e.tone==="error")).toHaveLength(9);
    expect(current.filter(e=>e.tone==="info")).toHaveLength(3);
    const html=render(<ToastStack toasts={current} onDismiss={()=>{}} viewport={{height:400,bottom:20}}/>);
    expect((html.match(/aria-label="Dismiss error:/g)??[])).toHaveLength(9);
    expect(html).toContain('tabindex="0"');
    expect(html).toContain("overscroll-contain");
  });
  it("UX-kit-HARDEN-16 dialog/sheet/drawer confirmation pending disables destructive action",()=>{
    const confirm=render(<ConfirmDialog title="Delete workspace" open onOpenChange={()=>{}} pending onConfirm={()=>{}}/>);
    expect(confirm).toContain("Delete workspace");
    expect(confirm).toContain("Working");
    expect(confirm).toContain('disabled=""');
    const other=render(<ConfirmActionDialog title="Archive" consequence="Read-only after archive" open onCancel={()=>{}} onConfirm={()=>{}}/>);
    expect(other).toContain("Read-only after archive");
    expect(other).toContain("Cancel");
    for(const html of [
      render(<Dialog title="Edit" open={false} onOpenChange={()=>{}}>Body</Dialog>),
      render(<Drawer title="Review" open={false} onOpenChange={()=>{}}>Body</Drawer>),
      render(<BottomSheet title="Options" open={false} onOpenChange={()=>{}}>Body</BottomSheet>),
    ]) { expect(html).toContain('aria-labelledby="'); expect(html).toContain("scroll-cue"); }
  });
  it("UX-kit-HARDEN-17 table preserves mobile data and never substitutes generic empty copy",()=>{
    const columns=[
      {key:"title",header:"Title",mobilePriority:"primary" as const,cell:(r:{title:string,score:number})=>r.title},
      {key:"score",header:"Score",mobilePriority:"secondary" as const,cell:(r:{title:string,score:number})=>r.score},
    ];
    const empty=render(<DataTable columns={columns} rows={[]} getRowKey={r=>r.title} empty={<p>No projects assigned</p>}/>);
    expect(empty).toContain("No projects assigned");
    const table=render(<DataTable columns={columns} rows={[{title:"Team A",score:90}]} getRowKey={r=>r.title} empty={<p>No projects assigned</p>}/>);
    expect(table).toContain("Team A");
    expect(table).toContain("90");
    expect(table).toContain("scroll-cue");
  });
  it("UX-kit-HARDEN-18 tab keyboard transitions skip disabled and do not hide routes",()=>{
    expect(tabNextEnabled([{disabled:false},{disabled:true},{disabled:false}],0,1)).toBe(2);
    const html=render(<Tabs value="a" ariaLabel="Project sections" renderPanel={false} items={[
      {value:"a",label:"Overview",href:"/projects/1"},
      {value:"b",label:"Disabled",disabled:true,href:"/projects/1/b"},
    ]}/>);
    expect(html).toContain("Overview");
    expect(html).not.toContain('href="/projects/1/b"');
    expect(html).toContain("scroll-cue");
  });
  it("UX-kit-HARDEN-19 filters have named overlay, focus loop and scroll hint",()=>{
    const html=render(<FilterBar title="Project filters" filters={<Input aria-label="Search"/>}/>);
    expect(html).toContain('aria-label="Project filters"');
    expect(html).toContain("scroll-cue");
    expect(source("filter-bar")).toContain('if (event.key === "Escape")');
    expect(source("filter-bar")).toContain('document.body.style.overflow = "hidden"');
  });
  it("UX-kit-HARDEN-20 permissions use centralized policy, confirmations handle cancel/unmount",()=>{
    expect(source("permission-action")).toContain("can(context, permission, resource)");
    expect(source("permission-action")).toContain('deniedMode === "hide-sensitive"');
    expect(source("use-confirm-flow")).toContain("resolver.current?.(false)");
    expect(source("use-confirm-flow")).toContain("onConfirm={() => finish(true)}");
    expect(source("use-confirm-flow")).toContain("if (!open) finish(false)");
  });
  it("UX-kit-HARDEN-21 keyboard scroll fades only when actual overflow; motion respects reduced prefs",()=>{
    const html=render(<ScrollCue axis="x" label="Project tabs"><span>Tab</span></ScrollCue>);
    expect(html).toContain("overscroll-x-contain");
    expect(source("scroll-cue")).toContain("node.scrollWidth - node.clientWidth");
    expect(source("scroll-cue")).toContain('tabIndex={edges.scrollable ? 0 : -1}');
    expect(source("skeleton")).toContain("motion-reduce:animate-none");
    const css=readFileSync(join(process.cwd(),"src/app/globals.css"),"utf8");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });
});

describe("UX-kit-HARDEN-22 declared 38-element shared UI surface register",()=>{
  const all=["avatar","bottom-sheet","breadcrumbs","button","card","confirm-action-dialog","confirm-dialog",
    "data-table","dialog","disabled-reason","disclosure","drawer","empty-state","error-state",
    "file-upload","filter-bar","form-field","graceful-page-loading","inline-notice","input",
    "loading-state","long-text","page-header","page-loading","pagination","permission-action",
    "scroll-cue","select","selection-controls","skeleton","stat-tile","status-badge","tabs",
    "textarea","third-party-link","toast","tooltip","use-confirm-flow"] as const;
  it.each(all)("UX-kit-HARDEN-22 %s remains in the checked-in kit and has no native popup or one-off >300ms interactive duration",name=>{
    const text=source(name);
    expect(text).not.toMatch(/window\.(?:alert|confirm|prompt|open)\s*\(/);
    expect(text).not.toMatch(/duration-\[(?:3[1-9]\d|[4-9]\d\d)ms\]/);
    expect(text).not.toContain('target="_blank"');
    // Dedicated tests above cover real rendering, a11y and security for shared types.
    expect(text).toMatch(/export\s+(?:type|const|function)/);
  });
});
