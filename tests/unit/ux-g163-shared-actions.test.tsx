import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Avatar } from "@/components/ui/avatar";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DisabledReason } from "@/components/ui/disabled-reason";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { fileMatchesAccept, fileSizeIsValid } from "@/components/ui/file-upload";

describe("UX-G163 accessible shared interaction kit", () => {
  it("exposes a named image for initials and missing names", () => {
    const normal = renderToStaticMarkup(<Avatar name="Anjali Kumar" />);
    const unknown = renderToStaticMarkup(<Avatar name=" " />);
    expect(normal).toContain('role="img"');
    expect(normal).toContain('aria-label="Anjali Kumar"');
    expect(normal).toContain(">AK</span>");
    expect(unknown).toContain('aria-label="Unknown person"');
  });
  it("blocks repeat interaction even on chrome-free loading buttons", () => {
    const html = renderToStaticMarkup(<Button variant="bare" loading onClick={() => {}}>Saving</Button>);
    expect(html).toContain('disabled=""');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('data-loading="true"');
  });
  it("keeps filter-free lists free from an empty responsive dialog", () => {
    const plain = renderToStaticMarkup(<FilterBar title="Search files" search={<input aria-label="Search files" />} />);
    const filtered = renderToStaticMarkup(<FilterBar title="Filters" filters={<label>Course status <input /></label>} />);
    expect(plain).not.toContain('data-slot="drawer"');
    expect(filtered).toContain('data-slot="drawer"');
    expect(filtered).toContain('aria-expanded="false"');
  });
  it("rejects empty crumbs and external breadcrumb links", () => {
    expect(renderToStaticMarkup(<Breadcrumbs items={[]} />)).toBe("");
    const html = renderToStaticMarkup(<Breadcrumbs items={[
      {label:"Home",href:"https://example.com"}, {label:"Learner",href:"/learn"}, {label:"Current"},
    ]} />);
    expect(html).not.toContain('href="https://example.com"');
    expect(html).toContain('href="/learn"');
    expect(html).toContain('aria-current="page"');
  });
  it("matches recovery severity and keeps native confirmation semantics", () => {
    const quiet=renderToStaticMarkup(<ErrorState role="status" description="Try again shortly" retryHref="/learn"/>);
    const danger=renderToStaticMarkup(<ErrorState description="Action failed" retryHref="https://example.com"/>);
    expect(quiet).toContain('aria-live="polite"');
    expect(quiet).toContain('href="/learn"');
    expect(danger).toContain('aria-live="assertive"');
    expect(danger).not.toContain('href="https://example.com"');
    expect(renderToStaticMarkup(<ConfirmDialog open onOpenChange={() => {}} onConfirm={() => {}} title="Delete item" />))
      .toContain('role="alertdialog"');
  });
  it("preserves required explanation and empty/recoverable states", () => {
    const disabled=renderToStaticMarkup(<DisabledReason reason="Permission required"><Button disabled>Archive</Button></DisabledReason>);
    expect(disabled).toContain('aria-disabled="true"');
    expect(disabled).toContain("Permission required");
    expect(renderToStaticMarkup(<EmptyState title="No records" />)).toContain('role="status"');
    expect(renderToStaticMarkup(<Card title="Example">Content</Card>)).toContain("<h2");
  });
  it("checks file type/size locally without relaxing backend authority", () => {
    expect(fileMatchesAccept({name:"report.pdf",type:"application/pdf"},".pdf")).toBe(true);
    expect(fileMatchesAccept({name:"report.exe",type:"application/octet-stream"},".pdf")).toBe(false);
    expect(fileSizeIsValid(9,10)).toBe(true);
    expect(fileSizeIsValid(11,10)).toBe(false);
  });
});
