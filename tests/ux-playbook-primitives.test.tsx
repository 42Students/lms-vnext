import { describe, expect, it } from "vitest";
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
    ]} rows={[{ name: "Example", status: "Active" }]} getRowKey={row => row.name} caption="People" />);
    expect(markup).toContain('role="list"');
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
  it("UX-PLAYBOOK-07 pagination announces current page", () => {
    const markup = renderToStaticMarkup(<Pagination page={2} pageCount={3} hrefForPage={page => "/directory?page=" + page}/>);
    expect(markup).toContain("Page 2 of 3");
    expect(markup).toContain('aria-current="page"');
  });
});
