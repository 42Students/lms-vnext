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
import { Alert } from "@/components/ui/alert";

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
  const issueField=fields.find(field=>issue?.startsWith(field.name+":"))?.name;
  useFacultyProfileUnsavedWarning(changed);

  function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(issue) {
      document.getElementById(`${facultyProfileAnchor(section)}-${issueField??fields[0]?.name??""}`)?.focus();
      return;
    }
    if(!pending && changed) void onSave(section,draft);
  }
  return <form id={facultyProfileAnchor(section)} onSubmit={submit}
    className="min-w-0 scroll-mt-6 space-y-[var(--lms-space-4)] border-b border-[var(--lms-canvas-border)] py-[var(--lms-space-4)]" aria-label={title} aria-busy={pending}>
    <div>
      <h2 className="text-base font-semibold leading-6 text-foreground md:text-lg">{title}</h2>
      <p className="mt-[var(--lms-space-1)] max-w-[75ch] break-words text-sm leading-6 text-body">{description}</p>
    </div>
    <div className="grid min-w-0 max-w-[960px] gap-[var(--lms-space-4)] sm:grid-cols-2">
      {fields.map(field=>{
        const id=`${facultyProfileAnchor(section)}-${field.name}`;
        const fieldError=changed&&issueField===field.name ? issue?.slice(field.name.length+1).trim() : null;
        return <div key={field.name} className={field.multiline?"min-w-0 sm:col-span-2":"min-w-0"}>
          <FormField id={id} label={field.label} error={fieldError}>
          {props=>field.multiline
            ? <Textarea {...props} rows={4} value={draft[field.name]??""} maxLength={field.maxLength}
                disabled={pending} onChange={event=>setDraft(current=>({...current,[field.name]:event.target.value}))}/>
            : <Input {...props} className="min-h-11 md:min-h-[var(--lms-control-height)]" type={field.type??"text"} value={draft[field.name]??""}
                maxLength={field.maxLength} disabled={pending}
                onChange={event=>setDraft(current=>({...current,[field.name]:event.target.value}))}/>}
          </FormField>
        </div>;
      })}
    </div>
    {changed && issue ? <Alert tone="error">Review {title}: {issue}</Alert> : null}
    <div className="flex min-w-0 flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
      {changed ? <Button type="button" variant="secondary" disabled={pending} className="w-full sm:w-auto" onClick={()=>setDiscardOpen(true)}>Discard edits</Button> : null}
      <Button type="submit" loading={pending} disabled={!changed||Boolean(issue)} className="w-full sm:w-auto">{pending?"Saving…":"Save "+title}</Button>
    </div>
    <ConfirmDialog open={discardOpen} onOpenChange={next=>{if(!pending)setDiscardOpen(next);}}
      title="Discard edits" description={"Discard unsaved changes to "+title+"?"}
      confirmLabel="Discard edits" confirmDisabled={!changed} pending={pending} onConfirm={()=>{
        setDraft(restoreFacultyTextDraft(initial)); setDiscardOpen(false);
      }}/>
  </form>;
}
