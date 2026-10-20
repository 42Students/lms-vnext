"use client";
import {Button} from "@/components/ui/button";
import { InlineNotice } from "@/components/ui/inline-notice";
import {Textarea} from "@/components/ui/textarea";
import {apiFetch} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
export function TpoStudentNoteEditor({membershipIds,afterSave}:{
 membershipIds:readonly string[];afterSave?:()=>void;
}){
 const router=useRouter();
 const [note,setNote]=useState("");
 const [busy,setBusy]=useState(false);
 const inFlight=useRef(false);
 const {run:runGuarded,pending:guardedPending}=useGuardedAction();
 const [message,setMessage]=useState("");
 const [error,setError]=useState("");
 async function save(){
  if(!membershipIds.length||!note.trim()||busy||inFlight.current)return;
  inFlight.current=true;setBusy(true);setError("");setMessage("");
  try{
   const data=await apiFetch<{added:number;skipped:number}>("/api/placements/tpo/students/notes",{
    method:"POST",headers:{"Content-Type":"application/json"},
    credentials:"same-origin",body:JSON.stringify({membershipIds,note:note.trim()}),
   });
   setMessage(data.added+" note(s) saved; "+data.skipped+" skipped.");
   setNote("");afterSave?.();router.refresh();
  }catch(error){setError(error instanceof Error?error.message:"Could not save note.");}
  finally{inFlight.current=false;setBusy(false);}
 }
 return <section className="min-w-0 space-y-2 border-t border-border pt-3">
  <h4 className="font-semibold">Add a note</h4>
  <p className="text-xs text-muted-foreground">Private to the college placement team, appended permanently to each selected student&apos;s history.</p>
  <Textarea aria-label="Internal student note" className="min-h-32 w-full" value={note} rows={3} maxLength={2000}
   onChange={e=>setNote(e.target.value)} onKeyDown={e=>{
    if((e.ctrlKey||e.metaKey)&&e.key==="Enter"){e.preventDefault();void runGuarded(save);}
   }} />
  <Button type="button" disabled={busy||guardedPending||!note.trim()||!membershipIds.length}
   onClick={()=>void runGuarded(save)} >
   {busy?"Saving…":"Add note"+(membershipIds.length>1?" to "+membershipIds.length+" students":"")}</Button>
  <p className="text-xs text-muted-foreground">Ctrl+Enter to save</p>
  {error?<InlineNotice tone="error" message={error}/>:null}
  {message?<InlineNotice tone="success" message={message}/>:null}
 </section>;
}
