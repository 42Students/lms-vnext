import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { FormField } from "@/components/ui/form-field";
import { fileMatchesAccept } from "@/components/ui/file-upload";
import { Tabs } from "@/components/ui/tabs";

// Compile-time JSX compatibility fixtures for native and original component APIs.
const formerButtonProps = { variant:"primary", size:"sm", type:"submit", disabled:true, children:"Save" } satisfies ComponentProps<typeof Button>;
const formerInputProps = { type:"email", required:true, name:"email", defaultValue:"" } satisfies ComponentProps<typeof Input>;
const formerSelectProps = { name:"role", defaultValue:"student" } satisfies ComponentProps<typeof Select>;
const formerTextareaProps = { name:"note", rows:4, defaultValue:"" } satisfies ComponentProps<typeof Textarea>;

describe("UX-PLAYBOOK compatibility and accessibility",()=>{
  it("UX-PLAYBOOK-13 preserves original Button, native Input/Select/Textarea props",()=>{
    expect(renderToStaticMarkup(<Button {...formerButtonProps}/>)).toContain("disabled");
    expect(renderToStaticMarkup(<Input {...formerInputProps}/>)).toContain('type="email"');
    expect(renderToStaticMarkup(<Select {...formerSelectProps}><option value="student">Student</option></Select>)).toContain("<select");
    expect(renderToStaticMarkup(<Textarea {...formerTextareaProps}/>)).toContain("<textarea");
  });
  it("UX-PLAYBOOK-14 preserves legacy PageHeader/StatusBadge/EmptyState/ErrorState props",()=>{
    const combined=renderToStaticMarkup(<>
      <PageHeader eyebrow="College" title="Students" description="View students" actions={<Button>Apply</Button>}/>
      <StatusBadge tone="warning">Waiting</StatusBadge>
      <EmptyState title="No students" description="Nothing found"/>
      <ErrorState description="Unable to load" action={<Button>Retry</Button>}/>
    </>);
    expect(combined).toContain("<h1");
    expect(combined).toContain("Waiting");
    expect(combined).toContain('role="alert"');
  });
  it("UX-PLAYBOOK-15 original DataTable props still work",()=>{
    const html=renderToStaticMarkup(<DataTable columns={[{key:"label",header:"Label",cell:(row:{id:string})=>row.id}]} rows={[{id:"A"}]} getRowKey={row=>row.id}/>);
    expect(html).toContain("<table");
    expect(html).toContain('role="list"');
  });
  it("UX-PLAYBOOK-16 FormField pairs label, helper and error with ARIA",()=>{
    const html=renderToStaticMarkup(<FormField id="id" label="Name" helper="Example" error="Required">
      {props=><Input {...props}/>}
    </FormField>);
    expect(html).toContain('aria-describedby="id-hint id-error"');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('id="id-error"');
    expect(html).toContain('for="id"');
  });
  it("UX-PLAYBOOK-17 disabled route-link tabs never render a prohibited destination",()=>{
    const html=renderToStaticMarkup(<Tabs ariaLabel="Project" value="overview" renderPanel={false}
      items={[{value:"overview",label:"Overview",href:"/project"},{value:"secret",label:"Private",href:"/secret",disabled:true}]}/>);
    expect(html).toContain('aria-disabled="true"');
    expect(html).not.toContain('href="/secret"');
  });
  it("UX-PLAYBOOK-18 filename and MIME accept patterns, including rejects",()=>{
    expect(fileMatchesAccept({name:"resume.pdf",type:"application/pdf"},".pdf")).toBe(true);
    expect(fileMatchesAccept({name:"photo.png",type:"image/png"},"image/*")).toBe(true);
    expect(fileMatchesAccept({name:"script.js",type:"text/javascript"},".pdf,application/pdf")).toBe(false);
  });
});
