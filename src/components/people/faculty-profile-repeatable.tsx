"use client";

import { useState, type FormEvent } from "react";
import type { FacultySelfSection } from "@/modules/people/faculty-self-section-model";
import { facultyEducationFieldEdit } from "@/modules/people/faculty-education-editor-model";
import { facultyProfileRecordHasManagedDocument } from "@/modules/people/faculty-receipt-row-policy";
import {restoreFacultyProfileRows,removeFacultyProfileDraftRow,duplicateFacultyProfileDraftRow} from "@/modules/people/faculty-profile-repeatable-actions";

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
    if (changed && !pending && !missingRequired) void onSave(section, rows);
  }
  return (
    <form aria-label={title} onSubmit={submit}
      className="space-y-4 rounded-xl border border-border bg-surface p-4 sm:p-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {rows.length === 0 ? <p className="text-sm text-muted-foreground">No records added yet.</p> : null}
      <div className="space-y-3">
        {rows.map((row, index) => (
          <fieldset key={row.id} className="min-w-0 rounded-lg border border-border p-3 sm:p-4">
            <legend className="px-1 text-xs font-semibold text-muted-foreground">Record {index + 1}</legend>
            <div className="grid gap-3 sm:grid-cols-2">
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
                    <textarea className="mt-1.5 min-h-24 w-full min-w-0 rounded-md border border-border bg-background p-3"
                      maxLength={field.maxLength} value={typeof value === "string" ? value : ""}
                      disabled={pending || currentDegreeEndYear} required={field.required}
                      onChange={event => update(row.id, field.name, event.target.value)} />
                  ) : (
                    <input className="mt-1.5 w-full min-w-0 rounded-md border border-border bg-background p-3"
                      type={field.kind ?? "text"} maxLength={field.maxLength}
                      value={typeof value === "string" ? value : ""}
                      disabled={pending || currentDegreeEndYear} required={field.required}
                      onChange={event => update(row.id, field.name, event.target.value)} />
                  )}
                </label>;
              })}
            </div>
            <button type="button" disabled={pending || rows.length >= maxItems} onClick={() => {
              setRows(current=>duplicateFacultyProfileDraftRow(current,row.id,maxItems,crypto.randomUUID()));
              setChanged(true);
            }} className="mt-3 mr-2 min-h-11 rounded-md border border-border px-4 text-sm font-semibold">
              Duplicate draft
            </button>
            <button type="button" disabled={pending || facultyProfileRecordHasManagedDocument(row)} onClick={() => {
              if (!window.confirm("Remove record "+(index+1)+" from "+title+"? It remains saved until you submit the section.")) return;
              setRows(current => removeFacultyProfileDraftRow(current,row.id)); setChanged(true);
            }} className="mt-3 min-h-11 rounded-md border border-border px-4 text-sm font-semibold text-error">
              Remove draft record
            </button>
            {facultyProfileRecordHasManagedDocument(row) ? <p className="mt-2 text-xs text-muted-foreground">This entry has a managed document. Contact your College to remove it.</p> : null}
          </fieldset>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={pending || rows.length >= maxItems}
          className="min-h-11 rounded-md border border-border px-4 text-sm font-semibold"
          onClick={() => { setRows(current => [...current, create()]); setChanged(true); }}>
          Add {title.toLowerCase()} record
        </button>
        <button type="submit" disabled={!changed || pending || missingRequired}
          className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-white disabled:opacity-50">
          {pending ? "Saving…" : "Save " + title.toLowerCase()}
        </button>
      </div>
      {changed ? <button type="button" disabled={pending} className="min-h-11 rounded-md border border-border px-4 text-sm font-semibold"
        onClick={()=>{if(!window.confirm("Discard unsaved changes to "+title+"?"))return;
          setRows(restoreFacultyProfileRows(initial));setChanged(false);}}>
        Discard unsaved edits
      </button> : null}
      {changed ? <p className="text-xs text-muted-foreground">
        Draft changes, including removals, remain unsaved until you choose Save.
      </p> : null}
    </form>
  );
}
