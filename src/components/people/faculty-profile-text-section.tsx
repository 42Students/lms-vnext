"use client";
import { useState, type FormEvent } from "react";
import type { FacultySelfSection } from "@/modules/people/faculty-self-section-model";
import { facultyProfileAnchor } from "@/modules/people/faculty-profile-navigation";
import { restoreFacultyTextDraft, facultyProfileTextDraftIssue } from "@/modules/people/faculty-profile-draft-actions";
import { useFacultyProfileUnsavedWarning } from "./faculty-unsaved-warning";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export type FacultyProfileTextField = {
  name: string; label: string; maxLength: number;
  type?: "text" | "url" | "date"; multiline?: boolean;
};
export function FacultyProfileTextSection({ section, title, description, fields, initial, pending, onSave }: {
  section: FacultySelfSection; title: string; description: string;
  fields: readonly FacultyProfileTextField[];
  initial: Record<string,string>; pending: boolean;
  onSave: (section:FacultySelfSection,value:Record<string,string>)=>Promise<void>;
}) {
  const [draft,setDraft] = useState<Record<string,string>>(initial);
  const [discardOpen,setDiscardOpen] = useState(false);
  const changed=fields.some(field=>(draft[field.name]??"")!==(initial[field.name]??""));
  const issue=facultyProfileTextDraftIssue(section,draft,initial);
  useFacultyProfileUnsavedWarning(changed);

  function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(issue) {
      document.getElementById(`${facultyProfileAnchor(section)}-${fields[0]?.name??""}`)?.focus();
      return;
    }
    if(!pending && changed) void onSave(section,draft);
  }
  return <form id={facultyProfileAnchor(section)} onSubmit={submit}
    className="min-w-0 space-y-4 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4 sm:p-6" aria-label={title} aria-busy={pending}>
    <div>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-1 text-sm text-body">{description}</p>
    </div>
    <div className="grid min-w-0 gap-4 sm:grid-cols-2">
      {fields.map(field=>{
        const id=`${facultyProfileAnchor(section)}-${field.name}`;
        return <FormField key={field.name} id={id} label={field.label}>
          {props=>field.multiline
            ? <Textarea {...props} rows={4} value={draft[field.name]??""} maxLength={field.maxLength}
                disabled={pending} onChange={event=>setDraft(current=>({...current,[field.name]:event.target.value}))}/>
            : <Input {...props} type={field.type??"text"} value={draft[field.name]??""}
                maxLength={field.maxLength} disabled={pending}
                onChange={event=>setDraft(current=>({...current,[field.name]:event.target.value}))}/>}
        </FormField>;
      })}
    </div>
    {changed && issue ? <p role="alert" className="text-sm text-foreground">Review {title}: {issue}</p> : null}
    <div className="flex flex-wrap items-center gap-3">
      {changed ? <Button variant="secondary" disabled={pending} onClick={()=>setDiscardOpen(true)}>Discard edits</Button> : null}
      <Button type="submit" loading={pending} disabled={!changed||Boolean(issue)}>{pending?"Saving…":"Save "+title}</Button>
    </div>
    <ConfirmDialog open={discardOpen} onOpenChange={setDiscardOpen} title={"Discard unsaved changes to "+title+"?"}
      description={"Discard unsaved changes to "+title+"?"} confirmLabel="Discard edits" onConfirm={()=>{
        setDraft(restoreFacultyTextDraft(initial)); setDiscardOpen(false);
      }}/>
  </form>;
}
