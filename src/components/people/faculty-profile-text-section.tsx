"use client";
import { useEffect, useState, type FormEvent } from "react";
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
  const [editing,setEditing] = useState(false);
  const focusId=`${facultyProfileAnchor(section)}-${fields[0]?.name??""}`;
  useEffect(()=>{
    if(editing)document.getElementById(focusId)?.focus();
  },[editing,focusId]);
  const changed=fields.some(field=>(draft[field.name]??"")!==(initial[field.name]??""));
  const issue=facultyProfileTextDraftIssue(section,draft,initial);
  const issueField=fields.find(field=>issue?.startsWith(field.name+":"))?.name;
  useFacultyProfileUnsavedWarning(changed);

  function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(!editing)return;
    if(issue) {
      document.getElementById(`${facultyProfileAnchor(section)}-${issueField??fields[0]?.name??""}`)?.focus();
      return;
    }
    if(!pending && changed) void onSave(section,draft);
  }
  return <form id={facultyProfileAnchor(section)} onSubmit={submit}
    className="min-w-0 scroll-mt-6 space-y-[var(--lms-space-4)] border-b border-[var(--lms-canvas-border)] py-[var(--lms-space-4)]" aria-label={title} aria-busy={pending}>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="text-base font-semibold leading-6 text-foreground md:text-lg">{title}</h2>
      <p className="mt-[var(--lms-space-1)] max-w-[75ch] break-words text-sm leading-6 text-body">{description}</p></div>
      {!editing?<Button type="button" variant="secondary" disabled={pending}
        onClick={()=>setEditing(true)} aria-label={"Edit "+title}>
        <svg aria-hidden="true" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L9 17l-4 1 1-4z"/></svg> Edit</Button>:null}
    </div>
    {!editing?<dl className="grid min-w-0 gap-3 sm:grid-cols-2">{fields.map(field=>
      <div key={field.name} className={field.multiline?"sm:col-span-2":""}>
        <dt className="text-xs font-semibold text-muted-foreground">{field.label}</dt>
        <dd className="mt-1 break-words whitespace-pre-wrap text-sm text-body">{
          initial[field.name]?.trim()||"Not provided"}</dd>
      </div>)}</dl>:<div className="grid min-w-0 max-w-[960px] gap-[var(--lms-space-4)] sm:grid-cols-2">
      {fields.map(field=>{
        const id=`${facultyProfileAnchor(section)}-${field.name}`;
        const fieldError=changed&&issueField===field.name ? issue?.slice(field.name.length+1).trim() : null;
        return <div key={field.name} className={field.multiline?"min-w-0 sm:col-span-2":"min-w-0"}>
          <FormField id={id} label={field.label} error={fieldError}>
          {props=>field.multiline
            ? <Textarea {...props} rows={4} value={draft[field.name]??""} maxLength={field.maxLength}
                disabled={pending} onChange={event=>setDraft(current=>({...current,[field.name]:event.target.value}))}/>
            : (field.name==="gender" || field.name==="bloodGroup") ?
              <select {...props} value={draft[field.name]??""} disabled={pending}
                className="min-h-11 w-full rounded border border-border bg-surface px-3 text-sm md:min-h-[var(--lms-control-height)]"
                onChange={event=>setDraft(current=>({...current,[field.name]:event.target.value}))}>
                <option value="">Select {field.label.toLowerCase()}</option>
                {(field.name==="gender"?["Male","Female","Other","Prefer not to say"]:
                  ["A+","A-","B+","B-","AB+","AB-","O+","O-"]).map(option=><option key={option} value={option}>{option}</option>)}
                {draft[field.name]&&!((field.name==="gender"?["Male","Female","Other","Prefer not to say"]:
                  ["A+","A-","B+","B-","AB+","AB-","O+","O-"]).includes(draft[field.name]))?
                    <option value={draft[field.name]}>Other: {draft[field.name]}</option>:null}
              </select>
            : <Input {...props} className="min-h-11 md:min-h-[var(--lms-control-height)]" type={field.type??"text"} value={draft[field.name]??""}
                maxLength={field.maxLength} disabled={pending}
                onChange={event=>setDraft(current=>({...current,[field.name]:event.target.value}))}/>}
          </FormField>
        </div>;
      })}
    </div>
    {editing&&changed&&issue ? <Alert tone="error">Review {title}: {issue}</Alert> : null}
    {editing?<div className="flex min-w-0 flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
      <Button type="button" variant="secondary" disabled={pending} className="w-full sm:w-auto"
        onClick={()=>changed?setDiscardOpen(true):setEditing(false)}>Cancel</Button>
      <Button type="submit" loading={pending} disabled={!changed||Boolean(issue)} className="w-full sm:w-auto">{pending?"Saving…":"Save "+title}</Button>
    </div>:null}
    <ConfirmDialog open={discardOpen} onOpenChange={next=>{if(!pending)setDiscardOpen(next);}}
      title={section==="personalDetails"?"Discard personal-detail changes?":"Discard "+title+" changes?"}
      description={"Discard your unsaved "+title.toLowerCase()+" changes?"}
      confirmLabel="Discard changes" confirmDisabled={!changed} pending={pending} onConfirm={()=>{
        setDraft(restoreFacultyTextDraft(initial)); setDiscardOpen(false);setEditing(false);
      }}/>
  </form>;
}
