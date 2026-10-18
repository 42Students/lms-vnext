import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Pagination, paginationWindow } from "@/components/ui/pagination";
import { Tabs, tabNextEnabled } from "@/components/ui/tabs";
import { avatarInitials } from "@/components/ui/avatar";
import { fileSizeIsValid } from "@/components/ui/file-upload";
import { DataTable } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { StatTile } from "@/components/ui/stat-tile";

describe("UX playbook shared behaviour", () => {
  it("UX-PLAYBOOK-01 keeps pagination inside bounds on phones", () => {
    expect(paginationWindow(1, 2)).toEqual([1, 2]);
    expect(paginationWindow(7, 7)).toEqual([3, 4, 5, 6, 7]);
    expect(paginationWindow(-4, 3)).toEqual([1, 2, 3]);
  });
  it("UX-PLAYBOOK-02 skips disabled tabs in arrow order", () => {
    const items = [{ disabled: false }, { disabled: true }, { disabled: false }];
    expect(tabNextEnabled(items, 0, 1)).toBe(2);
    expect(tabNextEnabled(items, 0, -1)).toBe(2);
    expect(tabNextEnabled([], 0, 1)).toBe(-1);
  });
  it("UX-PLAYBOOK-03 validates file size without uploading", () => {
    expect(fileSizeIsValid(1024, 1024)).toBe(true);
    expect(fileSizeIsValid(1025, 1024)).toBe(false);
    expect(fileSizeIsValid(-1)).toBe(false);
  });
  it("UX-PLAYBOOK-04 handles initials and missing names", () => {
    expect(avatarInitials("  Asha   Kumar ")).toBe("AK");
    expect(avatarInitials("")).toBe("?");
  });
  it("UX-PLAYBOOK-05 exposes mobile cards and semantic desktop table", () => {
    const markup = renderToStaticMarkup(<DataTable columns={[
      { key: "name", header: "Name", mobilePriority: "primary", cell: (row: { name: string; status: string }) => row.name },
      { key: "status", header: "Status", mobilePriority: "secondary", cell: (row: { name: string; status: string }) => row.status },
    ]} rows={[{ name: "Example", status: "Active" }]} getRowKey={row => row.name} caption="People" empty={<p>No people</p>} />);
    expect(markup).toContain('sm:table-row');
    expect(markup).toContain("<table");
    expect(markup).toContain('scope="col"');
    expect(markup).toContain("People");
  });
  it("UX-PLAYBOOK-06 reserves skeleton space and announces loading", () => {
    const markup = renderToStaticMarkup(<Skeleton variant="card" count={2} label="Loading courses" />);
    expect(markup).toContain('role="status"');
    expect(markup).toContain("Loading courses");
  });
  it("UX-PLAYBOOK-08 preserves link navigation for route tabs", () => {
    const markup = renderToStaticMarkup(<Tabs renderPanel={false} ariaLabel="Project sections" value="team"
      items={[{ value: "overview", label: "Overview", href: "/project?tab=overview" },
        { value: "team", label: "People & Meetings", href: "/project?tab=team" }]} />);
    expect(markup).toContain('aria-current="page"');
    expect(markup).toContain("/project?tab=team");
    expect(markup).toContain('aria-label="Project sections"');
  });
  it("UX-PLAYBOOK-09 formats KPI counts using en-IN grouping", () => {
    const markup = renderToStaticMarkup(<StatTile label="Students" value={123456}/>);
    expect(markup).toContain("1,23,456");
  });
  it("UX-PLAYBOOK-19 evaluates each DataTable cell only once despite two semantic layouts", () => {
    const formatter=vi.fn((row:{label:string})=>row.label);
    renderToStaticMarkup(<DataTable rows={[{label:"A"},{label:"B"}]}
      columns={[{key:"label",header:"Label",cell:formatter}]}
      getRowKey={row=>row.label} empty={<p>No rows</p>}/>);
    expect(formatter).toHaveBeenCalledTimes(2);
  });
  it("RV-05 B-02 keeps hidden fields in More details without audited column mapping",()=>{
    const rows=[{id:"one",secret:"Only on roster"}];
    const html=renderToStaticMarkup(<DataTable rows={rows} getRowKey={row=>row.id}
      empty={<p>No matching learners</p>} rowHref={row=>"/learners/"+row.id}
      columns={[
        {key:"id",header:"Student",mobilePriority:"primary",cell:row=>row.id},
        {key:"secret",header:"Sensitive field",mobilePriority:"hidden",
          mobileHiddenReason:"See record",cell:row=>row.secret},
      ]}/>);
    expect(html).toContain("More details");
    expect(html).toContain("Only on roster");
  });
  it("RV-05 B-02 requires positive per-row detail authority to hide a field",()=>{
    const rows=[{id:"one",secret:"Visible without authority"}];
    const base=[
      {key:"id",header:"Student",mobilePriority:"primary" as const,cell:(row:{id:string;secret:string})=>row.id},
      {key:"secret",header:"Secret",mobilePriority:"hidden" as const,
        mobileHiddenReason:"Verified detail field",cell:(row:{id:string;secret:string})=>row.secret,
        mobileDetail:{fieldKey:"secret",href:(row:{id:string;secret:string})=>"/learners/"+row.id,
          canView:(_row:{id:string;secret:string})=>false}},
    ];
    const denied=renderToStaticMarkup(<DataTable rows={rows} getRowKey={row=>row.id}
      empty={<p>No learners</p>} columns={base}/>);
    expect(denied).toContain("More details");
    const allowed=renderToStaticMarkup(<DataTable rows={rows} getRowKey={row=>row.id}
      empty={<p>No learners</p>} columns={[
        base[0]!,{...base[1]!,mobileDetail:{...base[1]!.mobileDetail,canView:()=>true}},
      ]}/>);
    expect(allowed).toContain("Secret · View details");
  });
  it("E-05 100 rows serialize exactly one responsive table row each",()=>{
    const rows=Array.from({length:100},(_,i)=>({id:"row-"+i}));
    const formatter=vi.fn((row:{id:string})=>row.id);
    const html=renderToStaticMarkup(<DataTable rows={rows}
      empty={<p>No records in legacy role</p>} getRowKey={row=>row.id}
      columns={[{key:"id",header:"Identifier",mobilePriority:"primary",cell:formatter}]}/>);
    expect((html.match(/<tr(?: |\\>)/g)??[])).toHaveLength(101);
    expect((html.match(/<table\\b/g)??[])).toHaveLength(1);
    expect(formatter).toHaveBeenCalledTimes(100);
  });
  it("UX-PLAYBOOK-07 pagination announces current page", () => {
    const markup = renderToStaticMarkup(<Pagination page={2} pageCount={3} hrefForPage={page => "/directory?page=" + page}/>);
    expect(markup).toContain("Page 2 of 3");
    expect(markup).toContain('aria-current="page"');
  });
});
