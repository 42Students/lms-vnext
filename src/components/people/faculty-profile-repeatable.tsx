"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, type FormEvent } from "react";
import { useConfirmFlow } from "@/components/ui/use-confirm-flow";
import {facultyProfileAnchor} from "@/modules/people/faculty-profile-navigation";
import {facultyProfileActiveSearch,facultyProfileCanReorderVisible,facultyProfileSearchAfterInsertion,facultyProfileSearchSummary} from "@/modules/people/faculty-profile-search-controls";
import {useFacultyProfileUnsavedWarning} from "./faculty-unsaved-warning";

import type { FacultySelfSection } from "@/modules/people/faculty-self-section-model";
import { facultyEducationFieldEdit } from "@/modules/people/faculty-education-editor-model";
import { facultyProfileRecordHasManagedDocument } from "@/modules/people/faculty-receipt-row-policy";
import {restoreFacultyProfileRows,removeFacultyProfileDraftRow,duplicateFacultyProfileDraftRow,moveFacultyProfileDraftRow,facultyProfileRecordMatches,facultyProfileRepeatableIssue,toggleFacultyProfileCollapsed} from "@/modules/people/faculty-profile-repeatable-actions";

export type FacultyRepeatableField<T extends { id: string }> = {
  name: keyof T & string;
  label: string;
  maxLength: number;
  required?: boolean;
  multiline?: boolean;
  kind?: "text" | "url" | "date" | "checkbox";
};

export function FacultyProfileRepeatable<T extends { id: string }>({
  section, title, description, initial, fields, maxItems, create, onSave, pending,
}: {
  section: FacultySelfSection;
  title: string;
  description: string;
  initial: readonly T[];
  fields: readonly FacultyRepeatableField<T>[];
  maxItems: number;
  create: () => T;
  pending: boolean;
  onSave: (section: FacultySelfSection, value: T[]) => Promise<void>;
}) {
  const [rows, setRows] = useState<T[]>(() => initial.map(row => ({ ...row })));
  const [changed, setChanged] = useState(false);
  useFacultyProfileUnsavedWarning(changed);
  const [search,setSearch]=useState("");
  const { askConfirm, dialog } = useConfirmFlow();
  const [collapsedIds,setCollapsedIds]=useState<string[]>([]);
  const visibleRows=rows.map((row,index)=>({row,index})).filter(({row})=>
    facultyProfileRecordMatches(row,fields.map(field=>field.name),facultyProfileActiveSearch(search,rows.length)));
  const sectionIssue=facultyProfileRepeatableIssue(section,rows);
  const missingRequired = rows.some(row => fields.some(field =>
    field.required && (typeof row[field.name] !== "string" || !String(row[field.name]).trim()),
  ));
  function update(id: string, name: keyof T & string, value: string | boolean) {
    setRows(current => current.map(row => row.id === id ?
      (section === "education" ? { ...row, ...facultyEducationFieldEdit(row, name, value) } : { ...row, [name]: value })
      : row));
    setChanged(true);
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (changed && !pending && !missingRequired && !sectionIssue) void onSave(section, rows);
  }
  return (
    <form id={facultyProfileAnchor(section)} aria-label={title} onSubmit={submit}
      className="space-y-4 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4 sm:p-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {rows.length === 0 ? <p className="text-sm text-muted-foreground">No records added yet.</p> : null}
      {rows.length>5?<label className="block text-sm font-semibold text-body">Find {title.toLowerCase()} records
        <Input type="search" value={search} onChange={event=>setSearch(event.target.value)}
          className="mt-1.5 w-full rounded-[var(--lms-control-radius)] border border-border bg-background p-3" placeholder="Search section fields"/>
      </label>:null}
      {rows.length>5&&search.trim()?<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span role="status">{facultyProfileSearchSummary(rows.length,visibleRows.length)}</span>
        <Button type="button" className="rounded border border-border px-2 py-1" onClick={()=>setSearch("")}>Clear search</Button>
      </div>:null}
      {rows.length>5&&visibleRows.length===0?<p role="status" className="text-sm text-muted-foreground">No matching records. Clear search to restore the full list.</p>:null}
      {rows.length>5 && !facultyProfileCanReorderVisible(rows.length,visibleRows.length)?<p className="text-xs text-muted-foreground">Clear search to reorder records in their full saved order.</p>:null}
      <div className="space-y-3">
        {visibleRows.map(({row,index}) => (
          <fieldset key={row.id} className="min-w-0 rounded-[var(--lms-control-radius)] border border-border p-3 sm:p-4">
            <legend className="px-1 text-xs font-semibold text-muted-foreground">Record {index + 1}</legend>
            <Button type="button" className="mb-3 min-h-9 rounded-[var(--lms-control-radius)] border border-border px-3 text-sm"
              aria-expanded={!collapsedIds.includes(row.id)}
              onClick={()=>setCollapsedIds(current=>toggleFacultyProfileCollapsed(current,row.id))}>
              {collapsedIds.includes(row.id)?"Show record fields":"Hide record fields"}
            </Button>
            {!collapsedIds.includes(row.id)?<div className="grid gap-3 sm:grid-cols-2">
              {fields.map(field => {
                const value = row[field.name];
                const currentDegreeEndYear = section === "education" && field.name === "endYear" &&
                  "isCurrentlyPursuing" in row && row.isCurrentlyPursuing === true;
                return <label key={field.name} className="block min-w-0 text-sm font-semibold text-body">
                  {field.label}
                  {field.kind === "checkbox" ? (
                    <input type="checkbox" className="ml-3" checked={value === true} disabled={pending}
                      onChange={event => update(row.id, field.name, event.target.checked)} />
                  ) : field.multiline ? (
                    <Textarea className="mt-1.5 min-h-24 w-full min-w-0 rounded-[var(--lms-control-radius)] border border-border bg-surface p-3"
                      maxLength={field.maxLength} value={typeof value === "string" ? value : ""}
                      disabled={pending || currentDegreeEndYear} required={field.required}
                      onChange={event => update(row.id, field.name, event.target.value)} />
                  ) : (
                    <input className="mt-1.5 w-full min-w-0 rounded-[var(--lms-control-radius)] border border-border bg-surface p-3"
                      type={field.kind ?? "text"} maxLength={field.maxLength}
                      value={typeof value === "string" ? value : ""}
                      disabled={pending || currentDegreeEndYear} required={field.required}
                      onChange={event => update(row.id, field.name, event.target.value)} />
                  )}
                </label>;
              })}
            </div>:null}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" disabled={pending || index===0 || !facultyProfileCanReorderVisible(rows.length,visibleRows.length)} onClick={async()=>{
                setRows(current=>moveFacultyProfileDraftRow(current,row.id,index-1));setChanged(true);
              }} className="min-h-11 rounded-[var(--lms-control-radius)] border border-border px-3 text-sm" aria-label={"Move "+title+" record "+(index+1)+" up"}>Move up</Button>
              <Button type="button" disabled={pending || index===rows.length-1 || !facultyProfileCanReorderVisible(rows.length,visibleRows.length)} onClick={async()=>{
                setRows(current=>moveFacultyProfileDraftRow(current,row.id,index+1));setChanged(true);
              }} className="min-h-11 rounded-[var(--lms-control-radius)] border border-border px-3 text-sm" aria-label={"Move "+title+" record "+(index+1)+" down"}>Move down</Button>
            </div>
            <Button type="button" disabled={pending || rows.length >= maxItems} onClick={async () => {
              setRows(current=>duplicateFacultyProfileDraftRow(current,row.id,maxItems,crypto.randomUUID()));
              setSearch(current=>facultyProfileSearchAfterInsertion(current));setChanged(true);
            }} className="mt-3 mr-2 min-h-11 rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold">
              Duplicate draft
            </Button>
            <Button type="button" disabled={pending || facultyProfileRecordHasManagedDocument(row)} onClick={async () => {
              if (!(await askConfirm("Remove record "+(index+1)+" from "+title+"? It remains saved until you submit the section."))) return;
              setRows(current => removeFacultyProfileDraftRow(current,row.id)); setChanged(true);
            }} className="mt-3 min-h-11 rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-error">
              Remove draft record
            </Button>
            {facultyProfileRecordHasManagedDocument(row) ? <p className="mt-2 text-xs text-muted-foreground">This entry has a managed document. Contact your College to remove it.</p> : null}
          </fieldset>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <Button type="button" disabled={pending || rows.length >= maxItems}
          className="min-h-11 rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold"
          onClick={async () => { setRows(current => [...current, create()]); setSearch(current=>facultyProfileSearchAfterInsertion(current));setChanged(true); }}>
          Add {title.toLowerCase()} record
        </Button>
        <Button type="submit" disabled={!changed || pending || missingRequired || Boolean(sectionIssue)}
          className="min-h-9 rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50">
          {pending ? "Saving…" : "Save " + title.toLowerCase()}
        </Button>
      </div>
      {changed && sectionIssue?<p role="alert" className="text-sm text-error">Review this section: {sectionIssue}</p>:null}
      {changed ? <Button type="button" disabled={pending} className="min-h-9 rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold"
        onClick={async()=>{if(!(await askConfirm("Discard unsaved changes to "+title+"?")))return;
          setRows(restoreFacultyProfileRows(initial));setChanged(false);}}>
        Discard unsaved edits
      </Button> : null}
      {changed ? <p className="text-xs text-muted-foreground">
        Draft changes, including removals, remain unsaved until you choose Save.
      </p> : null}
    {dialog}
 </form>
  );
}
