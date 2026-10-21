"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { useState, type FormEvent } from "react";
import { useConfirmFlow } from "@/components/ui/use-confirm-flow";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
  const [removeTarget,setRemoveTarget]=useState<string|null>(null);
  const [collapsedIds,setCollapsedIds]=useState<string[]>(()=>initial.map(row=>row.id));
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
    if (changed && !pending && !missingRequired && !sectionIssue) {
      void onSave(section,rows).then(()=>setChanged(false)).catch(()=>undefined);
    }
  }
  return (
    <form id={facultyProfileAnchor(section)} aria-label={title} onSubmit={submit}
      className="min-w-0 scroll-mt-6 space-y-[var(--lms-space-4)] border-b border-[var(--lms-canvas-border)] py-[var(--lms-space-4)]">
      <div>
        <h2 className="text-base font-semibold leading-6 text-[var(--lms-heading)] md:text-lg">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground leading-[22px]">{description}</p>
      </div>
      {rows.length === 0 ? <p className="text-sm text-muted-foreground leading-[22px]">Nothing on file yet.</p> : null}
      {changed?<div role="status" className="flex items-center gap-2 text-sm text-warning-text">
        <span aria-hidden="true">⚠</span><strong>Unsaved changes</strong>
        <span>Draft entries and deletions are not on file until saved.</span>
      </div>:null}
      {pending?<p role="status" aria-live="polite" className="text-sm text-body">Saving section changes…</p>:null}
      {rows.length>5?<label className="block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Find {title.toLowerCase()} records
        <Input type="search" value={search} onChange={event=>setSearch(event.target.value)}
          className="mt-[var(--lms-space-2)] min-h-11 min-[768px]:min-h-9 w-full" placeholder="Search section fields"/>
      </label>:null}
      {rows.length>5&&search.trim()?<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span role="status">{facultyProfileSearchSummary(rows.length,visibleRows.length)}</span>
        <Button variant="secondary" type="button"  onClick={()=>setSearch("")}>Clear search</Button>
      </div>:null}
      {rows.length>5&&visibleRows.length===0?<p role="status" className="text-sm text-muted-foreground leading-[22px]">No matching records. Clear search to restore the full list.</p>:null}
      {rows.length>5 && !facultyProfileCanReorderVisible(rows.length,visibleRows.length)?<p className="text-xs text-muted-foreground leading-5">Clear search to reorder records in their full saved order.</p>:null}
      <div className="space-y-3">
        {visibleRows.map(({row,index}) => (
          <fieldset key={row.id} className="min-w-0 border-b border-[var(--lms-canvas-border)] py-4">
            <legend className="px-1 text-xs font-semibold text-muted-foreground">
              Record {index + 1}{changed?" · Unsaved draft":""}
            </legend>
            <Button variant="secondary" type="button" className="mb-3 min-h-11 min-[768px]:min-h-9 px-3"
              aria-expanded={!collapsedIds.includes(row.id)}
              onClick={()=>setCollapsedIds(current=>toggleFacultyProfileCollapsed(current,row.id))}>
              {collapsedIds.includes(row.id)?"Edit record "+(index+1):"Done editing record "+(index+1)}
            </Button>
            {collapsedIds.includes(row.id)?
              <dl className="grid min-w-0 grid-cols-1 gap-2 text-sm text-body sm:grid-cols-2">
                {fields.map(field=><div key={field.name} className="min-w-0">
                  <dt className="font-semibold text-muted-foreground">{field.label}</dt>
                  <dd className="break-words">{row[field.name]===true?"Yes":
                    row[field.name]===false?"No":String(row[field.name]??"").trim()||"—"}</dd>
                </div>)}
              </dl>:<div className="grid min-w-0 gap-3 sm:grid-cols-2">
              {fields.map(field => {
                const value = row[field.name];
                const currentDegreeEndYear = section === "education" && field.name === "endYear" &&
                  "isCurrentlyPursuing" in row && row.isCurrentlyPursuing === true;
                return <label key={field.name} className="block min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
                  {field.label}
                  {field.kind === "checkbox" ? (
                    <Checkbox  className="ml-3" checked={value === true} disabled={pending}
                      onChange={event => update(row.id, field.name, event.target.checked)} />
                  ) : field.multiline ? (
                    <Textarea className="mt-[var(--lms-space-2)] min-h-24 w-full min-w-0"
                      maxLength={field.maxLength} value={typeof value === "string" ? value : ""}
                      disabled={pending || currentDegreeEndYear} required={field.required}
                      onChange={event => update(row.id, field.name, event.target.value)} />
                  ) : (
                    <Input className="mt-[var(--lms-space-2)] min-h-11 min-[768px]:min-h-9 w-full min-w-0"
                      type={field.kind ?? "text"} maxLength={field.maxLength}
                      value={typeof value === "string" ? value : ""}
                      disabled={pending || currentDegreeEndYear} required={field.required}
                      onChange={event => update(row.id, field.name, event.target.value)} />
                  )}
                </label>;
              })}
            </div>:null}
            <div className="mt-[var(--lms-space-3)] flex min-w-0 flex-col gap-[var(--lms-space-2)] sm:flex-row sm:flex-wrap [&>button]:w-full sm:[&>button]:w-auto">
              <Button variant="secondary" type="button" disabled={pending || index===0 || !facultyProfileCanReorderVisible(rows.length,visibleRows.length)} className="min-h-11 min-[768px]:min-h-9" onClick={async()=>{
                setRows(current=>moveFacultyProfileDraftRow(current,row.id,index-1));setChanged(true);
              }}  aria-label={"Move "+title+" record "+(index+1)+" up"}>Move up</Button>
              <Button variant="secondary" type="button" disabled={pending || index===rows.length-1 || !facultyProfileCanReorderVisible(rows.length,visibleRows.length)} className="min-h-11 min-[768px]:min-h-9" onClick={async()=>{
                setRows(current=>moveFacultyProfileDraftRow(current,row.id,index+1));setChanged(true);
              }}  aria-label={"Move "+title+" record "+(index+1)+" down"}>Move down</Button>
            </div>
            <Button variant="secondary" type="button" disabled={pending || rows.length >= maxItems} onClick={async () => {
              setRows(current=>duplicateFacultyProfileDraftRow(current,row.id,maxItems,crypto.randomUUID()));
              setSearch(current=>facultyProfileSearchAfterInsertion(current));setChanged(true);
            }} className="mt-[var(--lms-space-3)] mr-[var(--lms-space-2)] min-h-11 w-full sm:w-auto min-[768px]:min-h-9">
              Duplicate draft
            </Button>
            <Button variant="secondary" type="button" disabled={pending || facultyProfileRecordHasManagedDocument(row)} onClick={() => setRemoveTarget(row.id)} className="mt-[var(--lms-space-3)] min-h-11 w-full text-error sm:w-auto min-[768px]:min-h-9">
              Remove draft record
            </Button>
            {facultyProfileRecordHasManagedDocument(row) ? <p className="mt-2 text-xs text-muted-foreground leading-5">This entry has a managed document. Contact your College to remove it.</p> : null}
          </fieldset>
        ))}
      </div>
      <div className="flex min-w-0 flex-col gap-[var(--lms-space-3)] sm:flex-row sm:flex-wrap [&>button]:w-full sm:[&>button]:w-auto">
        <Button variant="secondary" type="button" disabled={pending || rows.length >= maxItems} className="min-h-11 min-[768px]:min-h-9"
          
          onClick={async () => { setRows(current => [...current, create()]); setSearch(current=>facultyProfileSearchAfterInsertion(current));setChanged(true); }}>
          Add {title.toLowerCase()} record
        </Button>
        <Button variant="primary" type="submit" disabled={!changed || pending || missingRequired || Boolean(sectionIssue)}
          className="min-h-11 min-[768px]:min-h-9 px-4">
          {pending ? "Saving…" : "Save " + title.toLowerCase()}
        </Button>
      </div>
      {changed && sectionIssue?<Alert tone="error">Review this section: {sectionIssue}</Alert>:null}
      {changed ? <Button variant="secondary" type="button" disabled={pending} className="min-h-11 min-[768px]:min-h-9 px-4"
        onClick={async()=>{if(!(await askConfirm("Discard unsaved changes to "+title+"?")))return;
          setRows(restoreFacultyProfileRows(initial));setChanged(false);}}>
        Discard unsaved edits
      </Button> : null}
      {changed ? <p role="status" className="text-xs text-muted-foreground leading-5">
        Draft changes, including removals, remain unsaved until you choose Save.
      </p> : null}
    {dialog}
    <ConfirmDialog open={removeTarget!==null} onOpenChange={next=>{if(!next)setRemoveTarget(null);}}
      title="Remove this entry?" description="It remains saved until you submit the section."
      confirmLabel="Remove entry" pending={pending}
      onConfirm={()=>{
        if(!removeTarget)return;
        setRows(current=>removeFacultyProfileDraftRow(current,removeTarget));
        setChanged(true);setRemoveTarget(null);
      }}/>
 </form>
  );
}
