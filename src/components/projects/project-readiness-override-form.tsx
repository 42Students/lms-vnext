"use client";
import {useRouter} from "next/navigation";
import {useState,type FormEvent} from "react";
import {projectReadinessLegacyCopy as copy} from "@/modules/projects/readiness-override-copy";
import type {ReadinessOverrideState} from "@/modules/projects/readiness-override-model";
export function ProjectReadinessOverrideForm({projectId,initialState,initialNote}:{
  projectId:string;initialState:ReadinessOverrideState|null;initialNote:string|null;
}){
  const router=useRouter();
  const [state,setState]=useState<ReadinessOverrideState>(initialState??"CLEAR");
  const [note,setNote]=useState(initialNote??"");
  const [pending,setPending]=useState(false);
  const [feedback,setFeedback]=useState<string|null>(null);
  async function save(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(state!=="CLEAR"&&!note.trim()){setFeedback(copy.noteRequired);return;}
    if(!window.confirm(state==="CLEAR"?copy.clearConfirm:copy.applyConfirm))return;
    setPending(true);setFeedback(null);
    try{
      const response=await fetch("/api/projects/"+encodeURIComponent(projectId)+"/readiness/override",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify(state==="CLEAR"?{state}:{state,note:note.trim()}),
      });
      if(!response.ok)throw new Error(copy.failed);
      setFeedback(copy.updated);router.refresh();
    }catch{setFeedback(copy.failed)}finally{setPending(false)}
  }
  return <form onSubmit={save} className="space-y-3 rounded-xl border border-border bg-surface p-5">
    <h2 className="text-lg font-semibold">{copy.overrideTitle}</h2>
    <label className="block text-sm font-medium" htmlFor="project-readiness-override">{copy.stateLabel}</label>
    <select id="project-readiness-override" className="w-full rounded border border-border bg-surface p-2" value={state}
      disabled={pending} onChange={e=>setState(e.target.value as ReadinessOverrideState)}>
      <option value="FORCE_UNLOCK">{copy.unlock}</option>
      <option value="FORCE_BLOCK">{copy.block}</option>
      <option value="CLEAR">{copy.clear}</option>
    </select>
    {state!=="CLEAR"&&<><label className="block text-sm font-medium" htmlFor="project-readiness-note">{copy.note}</label>
      <textarea id="project-readiness-note" value={note} disabled={pending} onChange={e=>setNote(e.target.value)}
        placeholder={copy.notePlaceholder} maxLength={2000} rows={3} className="w-full rounded border border-border bg-surface p-2" /></>}
    <button type="submit" disabled={pending} className="rounded bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">{copy.submit}</button>
    {feedback&&<p role="status" className="text-sm text-body">{feedback}</p>}
  </form>;
}
