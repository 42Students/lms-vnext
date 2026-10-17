"use client";
import {apiFetch} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {useState} from "react";
import {useRouter} from "next/navigation";
export function TpoStudentNoteEditor({membershipIds,afterSave}:{
 membershipIds:readonly string[];afterSave?:()=>void;
}){
 const router=useRouter();
 const [note,setNote]=useState("");
 const [busy,setBusy]=useState(false);
 const {run:runGuarded,pending:guardedPending}=useGuardedAction();
 const [message,setMessage]=useState("");
 const [error,setError]=useState("");
 async function save(){
  if(!membershipIds.length||!note.trim()||busy)return;
  setBusy(true);setError("");setMessage("");
  try{
   const data=await apiFetch<{added:number;skipped:number}>("/api/placements/tpo/students/notes",{
    method:"POST",headers:{"Content-Type":"application/json"},
    credentials:"same-origin",body:JSON.stringify({membershipIds,note:note.trim()}),
   });
   setMessage(data.added+" note(s) saved; "+data.skipped+" skipped.");
   setNote("");afterSave?.();router.refresh();
  }catch(error){setError(error instanceof Error?error.message:"Could not save note.");}
  finally{setBusy(false);}
 }
 return <section className="space-y-2 rounded border border-border p-3">
  <h4 className="font-semibold">Add a note</h4>
  <p className="text-xs text-muted-foreground">Private to the college placement team, appended permanently to each selected student&apos;s history.</p>
  <textarea aria-label="Internal student note" value={note} rows={3} maxLength={2000}
   onChange={e=>setNote(e.target.value)} onKeyDown={e=>{
    if((e.ctrlKey||e.metaKey)&&e.key==="Enter"){e.preventDefault();void runGuarded(save);}
   }} className="w-full rounded border border-border bg-surface p-3"/>
  <button type="button" disabled={busy||guardedPending||!note.trim()||!membershipIds.length}
   onClick={()=>void runGuarded(save)} className="min-h-10 rounded bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50">
   {busy?"Saving…":"Add note"+(membershipIds.length>1?" to "+membershipIds.length+" students":"")}</button>
  <p className="text-xs text-muted-foreground">Ctrl+Enter to save</p>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {message?<p role="status" className="text-sm">{message}</p>:null}
 </section>;
}
