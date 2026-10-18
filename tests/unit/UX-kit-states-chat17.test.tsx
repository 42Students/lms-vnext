import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ReactNode } from "react";
import { Avatar, avatarInitials } from "@/components/ui/avatar";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { Disclosure } from "@/components/ui/disclosure";
import { Drawer } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { FileUpload } from "@/components/ui/file-upload";
import { FilterBar } from "@/components/ui/filter-bar";
import { FormField } from "@/components/ui/form-field";
import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";
import { InlineNotice } from "@/components/ui/inline-notice";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { LongText } from "@/components/ui/long-text";
import { PageHeader } from "@/components/ui/page-header";
import { PageLoading } from "@/components/ui/page-loading";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Checkbox, Radio, Switch } from "@/components/ui/selection-controls";
import { ScrollCue } from "@/components/ui/scroll-cue";
import { Skeleton } from "@/components/ui/skeleton";
import { StatTile } from "@/components/ui/stat-tile";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, tabNextEnabled } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ThirdPartyLink } from "@/components/ui/third-party-link";
import { Tooltip } from "@/components/ui/tooltip";

const render = (child: ReactNode) => renderToStaticMarkup(<>{child}</>);
const moduleSource = (name: string) =>
  readFileSync(join(process.cwd(), "src/components/ui", name + ".tsx"), "utf8");

describe("UX-kit-STATES: semantic SSR states and accessible fallbacks", () => {
  it("UX-kit-STATES-01 button variants retain native submit, pending and touch semantics", () => {
    const busy = render(<Button variant="danger" type="submit" loading>Delete</Button>);
    expect(busy).toContain('type="submit"');
    expect(busy).toContain('aria-busy="true"');
    expect(busy).toContain('disabled=""');
    expect(busy).toContain("min-h-11");
    for (const variant of ["primary", "secondary", "ghost", "danger"] as const) {
      const html = render(<Button variant={variant}>Proceed</Button>);
      expect(html).toContain("Proceed");
      expect(html).toContain('type="button"');
      expect(html).not.toContain('aria-busy="true"');
    }
  });

  it("UX-kit-STATES-02 native input/select/textarea disabled and invalid controls remain labeled", () => {
    const items = [
      render(<Input id="a" disabled error placeholder="Name" />),
      render(<Select id="b" disabled error defaultValue="mentor">
        <option value="mentor">Mentor</option></Select>),
      render(<Textarea id="c" disabled error defaultValue="Reason" />),
    ];
    for (const html of items) {
      expect(html).toContain('disabled=""');
      expect(html).toContain('aria-invalid="true"');
      expect(html).toContain("text-base");
      expect(html).toContain("focus-visible");
    }
    expect(render(<Input required aria-label="Roll number" />)).toContain('required=""');
  });

  it("UX-kit-HARDEN-48 disabled Switch exposes a 44px target but not an interactive cursor",()=>{
    const disabled=render(<Switch label="Placement eligibility" disabled/>);
    expect(disabled).toContain('role="switch"');
    expect(disabled).toContain('disabled=""');
    expect(disabled).toContain("min-h-11");
    expect(disabled).toContain("has-[:disabled]:cursor-not-allowed");
    const enabled=render(<Switch label="Placement eligibility" defaultChecked/>);
    expect(enabled).toContain('checked=""');
    expect(enabled).not.toContain('disabled=""');
  });

  it("UX-kit-HARDEN-51 Switch thumb and track never animate when reduced motion is requested",()=>{
    const html=render(<Switch label="Notifications" defaultChecked/>);
    expect(html).toContain("motion-reduce:transition-none");
    expect(html).toContain("motion-reduce:after:transition-none");
    expect(html).toContain('role="switch"');
  });

  it("UX-kit-STATES-03 FormField merges descriptive IDs and does not silently lose errors", () => {
    const html = render(<FormField id="project" label="Project name" required helper="Student-visible"
      error="Required field">{()=><Input id="wrong" aria-describedby="external"/>}</FormField>);
    expect(html).toContain('for="project"');
    expect(html).toContain('id="project"');
    expect(html).not.toContain('id="wrong"');
    expect(html).toContain('aria-describedby="external project-hint project-error"');
    expect(html).toContain('role="alert"');
    expect(html).toContain("required");
    const good = render(<FormField id="department" label="Department">{field=>
      <Input {...field} />}</FormField>);
    expect(good).not.toContain('role="alert"');
    expect(good).toContain('for="department"');
  });

  it("UX-kit-HARDEN-49 a required field also marks the actual input required",()=>{
    const yes=render(<FormField id="student-roll" label="Roll number" required>
      {()=> <Input placeholder="Roll number"/>}</FormField>);
    expect(yes).toContain('for="student-roll"');
    expect(yes).toContain('id="student-roll"');
    expect(yes).toContain('required=""');
    const optional=render(<FormField id="middle-name" label="Middle name">
      {()=> <Input placeholder="Middle name"/>}</FormField>);
    expect(optional).not.toContain('required=""');
    const independentlyRequired=render(<FormField id="registration" label="Registration">
      {()=> <Input required />}</FormField>);
    expect(independentlyRequired).toContain('required=""');
  });

  it("UX-kit-STATES-04 destructive confirm cannot be pressed twice while pending", () => {
    const busy = render(<ConfirmDialog open pending onOpenChange={()=>{}} onConfirm={()=>{}}
      title="Delete all drafts" />);
    expect(busy).toContain("Working");
    expect(busy).toContain('aria-busy="true"');
    expect((busy.match(/disabled=""/g)??[]).length).toBeGreaterThanOrEqual(2);
    expect(busy).not.toContain('aria-label="Close dialog"');
    const inactive = render(<ConfirmDialog open confirmDisabled onOpenChange={()=>{}}
      onConfirm={()=>{}} title="Confirm grade release" />);
    expect(inactive).toContain("Confirm");
    expect(inactive).toContain('disabled=""');
    const cancellable = render(<ConfirmActionDialog open title="Archive workspace" consequence="Read only"
      onCancel={()=>{}} onConfirm={()=>{}} pending />);
    expect(cancellable).toContain("Read only");
    expect(cancellable).toContain("Working");
    expect(cancellable).not.toContain('aria-label="Close dialog"');
  });

  it("UX-kit-STATES-05 dialog, drawer and sheet expose titles, touch sizing and nondismissible states", () => {
    const cases = [
      render(<Dialog title="Project details" open dismissible={false} onOpenChange={()=>{}}>
        <p>Secret details</p></Dialog>),
      render(<Drawer title="Submission review" open dismissible={false} historyMode="route"
        onOpenChange={()=>{}}><p>Feedback</p></Drawer>),
      render(<BottomSheet title="Project filters" open dismissible={false}
        onOpenChange={()=>{}}><p>Options</p></BottomSheet>),
    ];
    for (const html of cases) {
      expect(html).toContain('aria-labelledby="');
      expect(html).toContain('data-slot="scroll-cue"');
      expect(html).toContain("--lms-visual-height");
      expect(html).not.toContain('aria-label="Close');
      expect(html).toContain("safe-area");
    }
    expect(render(<Dialog title="Edit" open onOpenChange={()=>{}}>Item</Dialog>))
      .toContain('aria-label="Close dialog"');
  });

  it("UX-kit-STATES-06 native selection controls preserve accessible labels and disabled state", () => {
    for (const html of [
      render(<Checkbox label="Eligible" name="eligible" disabled checked readOnly/>),
      render(<Radio label="Mentor" name="memberRole" disabled defaultChecked/>),
      render(<Switch label="Announcements" name="notify" disabled checked readOnly/>),
    ]) {
      expect(html).toContain("min-h-11");
      expect(html).toContain('disabled=""');
      expect(html).toContain('checked=""');
    }
    expect(render(<Switch label="Messages" name="messages" />)).toContain('role="switch"');
  });

  it("UX-kit-STATES-07 skeleton count clamps large, missing and invalid inputs and respects reduce motion", () => {
    for (const count of [0, -1, Infinity, NaN]) {
      const html = render(<Skeleton variant="row" label="Loading project status" count={count}/>);
      expect((html.match(/lms-skeleton-shimmer/g)??[])).toHaveLength(1);
      expect(html).toContain("Loading project status");
      expect(html).toContain("motion-reduce:animate-none");
    }
    expect((render(<Skeleton variant="card" count={100}/>)
      .match(/lms-skeleton-shimmer/g)??[])).toHaveLength(20);
    expect(render(<LoadingState label="Loading tasks"/>)).toContain("Loading tasks");
    expect(render(<PageLoading label="Loading workspace" variant="kpi" count={2}/>))
      .toContain("Loading workspace");
    expect(render(<GracefulPageLoading shape="directory" label="Loading directory"/>))
      .toContain("Loading directory");
  });

  it("UX-kit-STATES-08 each status tone has safe readable copy, errors never presented as empty success", () => {
    for (const tone of ["neutral", "info", "success", "warning", "error"] as const) {
      const html=render(<StatusBadge tone={tone}>{tone}</StatusBadge>);
      expect(html).toContain(tone);
      expect(html).toContain('data-slot="status-badge"');
    }
    expect(render(<EmptyState title="No projects" description="Ask your administrator"/>))
      .not.toContain('role="alert"');
    const failure=render(<ErrorState description="Not saved" action={<Button>Retry</Button>}/>);
    expect(failure).toContain('role="alert"');
    expect(failure).toContain("Retry");
    const notice=render(<InlineNotice tone="error" message="Could not save" onDismiss={()=>{}}/>);
    expect(notice).toContain('role="alert"');
    expect(notice).toContain('aria-label="Dismiss notice"');
    expect(render(<InlineNotice tone="success" message="Saved"/>)).toContain('role="status"');
  });

  it("UX-kit-STATES-09 empty/long labels and untrusted strings are escaped", () => {
    expect(avatarInitials("   ")).toBe("?");
    expect(avatarInitials("Grace Student Name")).toBe("GS");
    const img=render(<Avatar name="Project Learner" src="https://assets.example.test/p.png" size="sm"/>);
    expect(img).toMatch(/referrerpolicy="no-referrer"/i);
    expect(img).toContain('alt=""');
    expect(img).toContain('width="32"');
    expect(render(<LongText value={'<script>alert("x")</script>'}/>)).not.toContain("<script>");
    const crumbs=render(<Breadcrumbs items={[
      {label:"Projects",href:"/mentor/projects"},
      {label:"Private workspace",href:"/mentor/projects/123"}]}/>);
    expect(crumbs).toContain('href="/mentor/projects"');
    expect(crumbs).not.toContain('href="/mentor/projects/123"');
    expect(crumbs).toContain('aria-current="page"');
  });

  it("UX-kit-STATES-10 tab navigation handles zero, all-disabled and mixed items", () => {
    expect(tabNextEnabled([],0,1)).toBe(-1);
    expect(tabNextEnabled([{disabled:true},{disabled:true}],0,1)).toBe(-1);
    expect(tabNextEnabled([{disabled:false},{disabled:true},{disabled:false}],0,1)).toBe(2);
    expect(tabNextEnabled([{disabled:false},{disabled:true},{disabled:false}],0,-1)).toBe(2);
    const html=render(<Tabs value="overview" ariaLabel="Project panels" onValueChange={()=>{}} items={[
      {value:"overview",label:"Overview",content:<p>Visible project</p>},
      {value:"grade",label:"Grades",disabled:true,content:<p>Unreleased grade</p>},
    ]}/>);
    expect(html).toContain('role="tablist"');
    expect(html).toContain('role="tabpanel"');
    expect(html).toContain("Visible project");
    expect(html).not.toContain("Unreleased grade");
    expect(html).toContain('aria-selected="true"');
  });

  it("UX-kit-HARDEN-33 recovers from disabled or deleted bookmarked tab without orphaned ARIA selection",()=>{
    const items=[
      {value:"overview",label:"Overview",content:<span>Project overview</span>},
      {value:"grades",label:"Grades",disabled:true,content:<span>Private grading</span>},
      {value:"members",label:"Members",content:<span>Project members</span>},
    ];
    for(const value of ["grades","no-longer-exists"]){
      const html=render(<Tabs items={items} value={value} onValueChange={()=>{}}
        ariaLabel="Project navigation"/>);
      expect(html).toContain("Project overview");
      expect(html).not.toContain("Private grading");
      expect(html).toContain('role="tabpanel"');
      expect((html.match(/aria-selected="true"/g)??[])).toHaveLength(1);
      expect((html.match(/tabindex="0"/g)??[]).length).toBeGreaterThanOrEqual(1);
      expect(html).not.toContain("tab--1");
    }
    const allDisabled=render(<Tabs value="grade" ariaLabel="Private tabs"
      onValueChange={()=>{}} items={[
        {value:"grade",label:"Grade",disabled:true,content:<span>Private</span>},
      ]}/>);
    expect(allDisabled).not.toContain("Private</span>");
    expect(allDisabled).not.toContain('aria-selected="true"');
    expect(allDisabled).not.toContain('aria-labelledby="');
  });

  it("UX-kit-HARDEN-36 stat links, tab navigation and pagination fail closed on bad hrefs",()=>{
    const tile=render(<StatTile label="Projects" value={7} href="//evil.example.test"/>);
    expect(tile).toContain("<section");
    expect(tile).not.toContain("<a ");
    expect(tile).toContain("Projects");

    const tabs=render(<Tabs value="overview" ariaLabel="Project navigation" renderPanel={false}
      items={[
        {value:"overview",label:"Overview",href:"/mentor/projects"},
        {value:"external",label:"External",href:"/%2fevil.example.test"},
        {value:"no-access",label:"No access",disabled:true,href:"/admin/projects"},
      ]}/>);
    expect(tabs).toContain('href="/mentor/projects"');
    expect(tabs).not.toContain('href="/%2fevil.example.test"');
    expect(tabs).not.toContain('href="/admin/projects"');
    expect(tabs).toContain('aria-disabled="true"');

    const page=render(<Pagination page={2} pageCount={3} label="Projects pages"
      hrefForPage={n=>n===2?"/college/projects?page=2":"//evil.example.test"}/>);
    expect(page).toContain('href="/college/projects?page=2"');
    expect(page).not.toContain('href="//evil.example.test"');
    expect(page).toContain("Previous");
    expect(page).toContain("Next");
    expect(page).toContain('aria-label="Page 1 unavailable"');
    expect(page).toContain('aria-disabled="true"');
  });

  it("UX-kit-STATES-11 hidden filter sheet retains always-visible search and count sanitization", () => {
    const invalid=render(<FilterBar title="Candidates" activeCount={-99}
      search={<Input aria-label="Find candidates"/>}
      filters={<Checkbox name="placed" label="Placed"/>}/>);
    expect(invalid).toContain("Candidates (0)");
    expect(invalid).toContain('aria-label="Find candidates"');
    expect(invalid).toContain('aria-expanded="false"');
    expect(invalid).toContain('data-slot="scroll-cue"');
    expect(render(<FilterBar title="Projects" activeCount={Infinity} filters="Options"/>))
      .toContain("Projects (0)");
  });

  it("UX-kit-HARDEN-37 filter drawer closes on viewport resize even without matchMedia",()=>{
    const source=moduleSource("filter-bar");
    expect(source).toContain('typeof window.matchMedia === "function"');
    expect(source).toContain('media?.matches ?? window.innerWidth >= 640');
    expect(source).toContain('window.addEventListener("resize", resize)');
    expect(source).toContain('window.removeEventListener("resize", resize)');
    expect(source).toContain('media?.removeEventListener("change", resize)');
    expect(source).toContain('document.body.style.overflow = priorOverflow');
    const html=render(<FilterBar title="Filter project tasks" activeCount={2}
      search={<Input aria-label="Search tasks"/>} filters="My tasks only"/>);
    expect(html).toContain("Filter project tasks (2)");
    expect(html).toContain("Search tasks");
  });

  it("UX-kit-STATES-12 card, heading, stat and native disclosure maintain semantic hierarchy", () => {
    const card=render(<Card as="article" title="Sprint A" description="Five tasks"
      footer={<Button>Review</Button>}><p>Active sprint</p></Card>);
    expect(card).toContain("<article");
    expect(card).toContain("<h2");
    expect(card).toContain("Review");
    const heading=render(<PageHeader eyebrow="Mentor" title="Workspaces"
      actions={<Button>New project</Button>} />);
    expect(heading).toContain("<h1");
    expect(heading).toContain("New project");
    expect(render(<StatTile label="Tasks" value={Infinity}/>)).toContain("—");
    expect(render(<StatTile label="Tasks" value={1234} href="/mentor/projects"/>)).toContain("1,234");
    const details=render(<Disclosure title="More" defaultOpen><p>Documentation</p></Disclosure>);
    expect(details).toContain("<details");
    expect(details).toContain("open");
    expect(details).toContain("Documentation");
    expect(render(<Tooltip content="Hint"><span>?</span></Tooltip>)).toContain("<summary");
  });

  it("UX-kit-STATES-13 file fallback announces inability and never pretends files were selected", () => {
    const html=render(<FileUpload label="Final proof" onFiles={()=>{}} pickerUnavailable
      fallback={<a href="/support">Use URL evidence</a>}/>);
    expect(html).toContain('role="status"');
    expect(html).toContain('role="alert"');
    expect(html).toContain("Use URL evidence");
    expect(html).not.toContain('type="file"');
    const disabled=render(<FileUpload label="Evidence" onFiles={()=>{}} disabled accept=".pdf"/>);
    expect(disabled).toContain('disabled=""');
    expect(disabled).toContain("Enable file selection");
  });

  it("UX-kit-HARDEN-34 file control keeps helper and unavailable reason connected for assistive technology",()=>{
    const disabled=render(<FileUpload id="final-proof" label="Final proof" onFiles={()=>{}}
      helper="PDF, at most 5 MB" disabled/>);
    expect(disabled).toContain('aria-describedby="final-proof-help final-proof-unavailable"');
    expect(disabled).toContain('id="final-proof-help"');
    expect(disabled).toContain('id="final-proof-unavailable"');
    const allowed=render(<FileUpload id="project-proof" label="Evidence" helper="PNG files only"
      accept=".png" onFiles={()=>{}}/>);
    expect(allowed).toContain('aria-describedby="project-proof-help"');
    const source=moduleSource("file-upload");
    expect(source).toContain('error ? `${id}-error` : null');
  });

  it("UX-kit-HARDEN-50 availability transition clears obsolete file validation state",()=>{
    const source=moduleSource("file-upload");
    expect(source).toContain("if (pickerUnavailable || disabled) setError(null)");
    expect(source).toContain("selectedRef.current = false");
    expect(source).toContain("onFilesRef.current(null)");
    expect(source).toContain('aria-invalid={error ? true : undefined}');
    // Unit SSR alone cannot model FileList + effect transitions; the same
    // journey is covered in chat17-ui-kit-interactions.spec.ts.
  });

  it("UX-kit-HARDEN-47 disabled file picker must not be called invalid by assistive tech",()=>{
    const disabled=render(<FileUpload id="proof-doc" label="Project proof"
      disabled helper="PDF only" onFiles={()=>{}}/>);
    expect(disabled).toContain('disabled=""');
    expect(disabled).not.toContain('aria-invalid="true"');
    expect(disabled).toContain('aria-describedby="proof-doc-help proof-doc-unavailable"');
    expect(disabled).toContain("This upload cannot continue");
    const available=render(<FileUpload id="ready-doc" label="Project proof" onFiles={()=>{}}/>);
    expect(available).not.toContain('aria-invalid="true"');
    expect(available).not.toContain('disabled=""');
  });

  it("UX-kit-STATES-14 HTTPS links display fallback; script, HTTP and credential-bearing URLs never link", () => {
    for (const href of ["javascript:alert(1)", "data:text/html,hi", "http://example.test",
      "https://user:pass@example.test", "not a URL"]) {
      const html=render(<ThirdPartyLink href={href} label="Open attachment"/>);
      expect(html).not.toContain("<a ");
      expect(html).toContain("This link is unavailable.");
    }
    const allowed=render(<ThirdPartyLink href="https://example.test/meet" label="Join meeting"/>);
    expect(allowed).toContain('href="https://example.test/meet"');
    expect(allowed).not.toContain('target="_blank"');
    expect(allowed).toContain("Copy link");
  });

  it("UX-kit-STATES-15 scroll cue only becomes keyboard-focusable on actual measured overflow", () => {
    const html=render(<ScrollCue axis="x" label="Project navigation"><span>Small</span></ScrollCue>);
    expect(html).toContain('data-scroll-start="false"');
    expect(html).toContain('data-scroll-end="false"');
    expect(html).toContain('tabindex="-1"');
    expect(html).not.toContain('role="region"');
    expect(moduleSource("scroll-cue")).toContain("node.scrollWidth - node.clientWidth");
    expect(moduleSource("scroll-cue")).toContain('tabIndex={edges.scrollable ? 0 : -1}');
    expect(moduleSource("dialog").startsWith('"use client";')).toBe(true);
    expect(moduleSource("drawer").startsWith('"use client";')).toBe(true);
    expect(moduleSource("bottom-sheet").startsWith('"use client";')).toBe(true);
  });
});
