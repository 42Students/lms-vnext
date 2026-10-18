import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Dialog } from "@/components/ui/dialog";
import { Drawer } from "@/components/ui/drawer";
import { DataTable } from "@/components/ui/data-table";
import { Disclosure } from "@/components/ui/disclosure";
import { FilterBar } from "@/components/ui/filter-bar";
import { LoadingState } from "@/components/ui/loading-state";
import { Checkbox, Radio, Switch } from "@/components/ui/selection-controls";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs } from "@/components/ui/tabs";
import { ToastStack } from "@/components/ui/toast";

const read = (p: string) => readFileSync(join(process.cwd(),p),"utf8");
const ui = (p: string) => read("src/components/ui/"+p+".tsx");

describe("UX-kit-scroll-motion owner invisible-scrollbar contracts", () => {
  it("UX-kit-scroll-motion-01 only reveals fades at real scroll edges and allows keyboard focus", () => {
    const source=ui("scroll-cue");
    expect(source).toContain('data-scroll-fade="start"');
    expect(source).toContain('data-scroll-fade="end"');
    expect(source).toContain('node.scrollWidth - node.clientWidth');
    expect(source).toContain('node.scrollHeight - node.clientHeight');
    expect(source).toContain('tabIndex={edges.scrollable ? 0 : -1}');
    expect(source).toContain("overscroll-x-contain");
    expect(source).toContain("overscroll-contain");
    expect(source).toContain('pointer-events-none');
    expect(source).toContain('ResizeObserver');
    expect(source).toContain('role={edges.scrollable ? "region" : undefined}');
  });
  it.each(["dialog","drawer","bottom-sheet"])("UX-kit-scroll-motion-02 %s locks its container to one scrollable content region", name => {
    const source=ui(name);
    expect(source).toContain("<ScrollCue");
    expect(source).toContain('axis="y"');
    expect(source).toContain('className="min-h-0 flex-1"');
    expect(source).toContain("overflow-hidden");
    expect(source).toContain("safe-area-inset-bottom");
    expect(source).toContain("useOverlayWebview");
    expect(source).toContain('aria-labelledby={titleId}');
  });
  it("UX-kit-scroll-motion-03 native modal semantics, focus trap and return survive edge-cue wrappers", () => {
    const dialog=renderToStaticMarkup(<Dialog open={false} onOpenChange={()=>{}} title="Edit lesson" footer={<button>Save</button>}><p>Body</p></Dialog>);
    const drawer=renderToStaticMarkup(<Drawer open={false} onOpenChange={()=>{}} title="Details"><p>Body</p></Drawer>);
    const sheet=renderToStaticMarkup(<BottomSheet open={false} onOpenChange={()=>{}} title="Filters"><p>Options</p></BottomSheet>);
    for(const markup of [dialog,drawer,sheet]){
      expect(markup).toContain('aria-labelledby="');
      expect(markup).toContain('data-slot="scroll-cue"');
      expect(markup).toContain("overscroll-contain");
      expect(markup).toContain("min-h-0");
    }
    expect(dialog).toContain("Save");
    expect(sheet).toContain("safe-area-inset-bottom");
    expect(ui("dialog")).toContain("showModal()");
    expect(ui("dialog")).toContain("opener.current?.focus()");
  });
  it("UX-kit-scroll-motion-04 tabs and filters disclose hidden horizontal and vertical scrolling", () => {
    const html=renderToStaticMarkup(<Tabs renderPanel={false} value="third" ariaLabel="Course tabs"
      items={[{value:"first",label:"Lessons",href:"/learn/courses/1/home"},
      {value:"third",label:"Results",href:"/learn/courses/1/results"}]}/>);
    expect(html).toContain('data-axis="x"');
    expect(html).toContain("overscroll-x-contain");
    expect(html).toContain('aria-label="Course tabs"');
    const filter=renderToStaticMarkup(<FilterBar title="Results filters"><p>Filter choices</p></FilterBar>);
    expect(filter).toContain('data-axis="y"');
    expect(ui("filter-bar")).toContain("overflow-hidden");
    expect(ui("filter-bar")).toContain("document.body.style.overflow = \"hidden\"");
    expect(ui("tabs")).toContain("duration-[var(--lms-motion-fast)]");
  });
  it("UX-kit-scroll-motion-05 wide DataTable has labelled focusable scroller and mobile disclosure", () => {
    const html=renderToStaticMarkup(<DataTable columns={[
      {key:"name",header:"Name",cell:(row:{name:string,grade:string})=>row.name,mobilePriority:"primary" as const},
      {key:"grade",header:"Grade",cell:(row:{name:string,grade:string})=>row.grade,mobilePriority:"secondary" as const}
    ]} rows={[{name:"A",grade:"A+"}]} getRowKey={row=>row.name} caption="Results"
      empty={<p>No results</p>}/>);
    expect(html).toContain('data-axis="x"');
    expect(html).toContain("overscroll-x-contain");
    // aria-label is applied after overflow is measured in the browser, not during SSR.
    expect(ui("data-table")).toContain("caption+\" scrollable columns\"");
    expect(ui("data-table")).toContain("Scrollable table columns");
    expect(ui("data-table")).toContain('title="More details"');
    expect(ui("data-table")).toContain("sm:sticky sm:top-0");
  });
  it("UX-kit-scroll-motion-06 toast list remains keyboard-reachable with unbounded persistent errors", () => {
    const notices=Array.from({length:8},(_,i)=>({id:String(i),title:"Error "+i,tone:"error" as const}));
    const html=renderToStaticMarkup(<ToastStack toasts={notices} onDismiss={()=>{}} viewport={{height:320,bottom:120}}/>);
    expect((html.match(/role="alert"/g)??[])).toHaveLength(8);
    expect((html.match(/aria-label="Dismiss error/g)??[])).toHaveLength(8);
    expect(html).toContain('tabindex="0"');
    expect(html).toContain("overscroll-contain");
    expect(html).toContain("--lms-toast-visual-height:320px");
    expect(read("src/app/globals.css")).toContain('[data-slot="toast-stack"] > section');
  });
  it("UX-kit-scroll-motion-07 skeleton shimmer and disclosure honor reduced-motion defaults", () => {
    const skel=renderToStaticMarkup(<Skeleton label="Loading courses" variant="card" count={2}/>);
    expect(skel).toContain("lms-skeleton-shimmer");
    expect(skel).toContain("Loading courses");
    const detail=renderToStaticMarkup(<Disclosure title="More details"><p>Hidden grade</p></Disclosure>);
    expect(detail).toContain("<details");
    expect(detail).toContain("<summary");
    expect(detail).toContain("min-h-11");
    expect(detail).toContain("motion-reduce:transition-none");
    const css=read("src/app/globals.css");
    for(const key of ["--lms-motion-fast: 150ms","--lms-motion-base: 200ms",
      "lms-drawer-in","lms-sheet-in","lms-toast-in","lms-skeleton-shimmer",
      "@media (prefers-reduced-motion: reduce)"]){expect(css).toContain(key);}
    expect(ui("selection-controls")).not.toContain("duration-[120ms]");
  });
  it("UX-kit-scroll-motion-09 observes every direct scroll content child, not only the first",()=>{
    const cue=ui("scroll-cue");
    expect(cue).toContain("for (const child of node.children) observer?.observe(child)");
    expect(cue).toContain("observeContents()");
    expect(cue).not.toContain("if (node.firstElementChild) observer?.observe(node.firstElementChild)");
    expect(cue).toContain("mutations?.observe(node, { childList: true, subtree: true })");
  });
  it("UX-kit-scroll-motion-10 all shared switch and tab transitions respect reduced motion",()=>{
    const switchControl=ui("selection-controls");
    const tabs=ui("tabs");
    expect(switchControl).toContain("motion-reduce:after:transition-none");
    expect(switchControl).toContain("motion-reduce:transition-none");
    expect(tabs).toContain("motion-reduce:transition-none");
    expect(read("src/app/globals.css")).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("UX-kit-scroll-motion-08 direct missing-coverage primitive checks: bottom-sheet, loading-state, selection-controls and use-confirm-flow", () => {
    const loading=renderToStaticMarkup(<LoadingState label="Loading college records"/>);
    expect(loading).toContain('data-slot="loading-state"');
    expect(loading).toContain("Loading college records");
    const check=renderToStaticMarkup(<Checkbox label="Present" name="isPresent"/>);
    const radio=renderToStaticMarkup(<Radio label="Next" name="phase"/>);
    const toggle=renderToStaticMarkup(<Switch label="Notify" name="notification"/>);
    expect(check).toContain('type="checkbox"');
    expect(radio).toContain('type="radio"');
    expect(toggle).toContain('role="switch"');
    expect(toggle).toContain("lms-motion-fast");
    const confirmFlow=ui("use-confirm-flow");
    expect(confirmFlow).toContain("resolver.current?.(false)");
    expect(confirmFlow).toContain("const dialog = <ConfirmDialog");
    expect(confirmFlow).toContain("onConfirm={() => finish(true)}");
    expect(confirmFlow).toContain("if (!open) finish(false)");
  });
});
