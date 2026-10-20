"use client";
import { Button } from "@/components/ui/button";
import { InlineNotice } from "@/components/ui/inline-notice";
import {useId,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {Textarea} from "@/components/ui/textarea";
import {Dialog} from "@/components/ui/dialog";
type Props={threadId:string;messageId:string;body:string;expectedBodyHash:string;canEdit:boolean};
export function TpoTeamMessageActions({threadId,messageId,body,expectedBodyHash,canEdit}:Props){
 const router=useRouter(),pending=useRef(false);
 const editFormId=useId();
 const [mode,setMode]=useState<"EDIT"|"DELETE"|null>(null);
 const [draft,setDraft]=useState(body),[error,setError]=useState(""),[busy,setBusy]=useState(false);
 async function submit(action:"EDIT"|"DELETE"){
  if(pending.current||action==="EDIT"&&(!draft.trim()||draft.trim().length>4000))return;
  pending.current=true;setBusy(true);setError("");
  try{
   await apiFetch("/api/placements/tpo/team/threads/"+encodeURIComponent(threadId)+
    "/messages/"+encodeURIComponent(messageId)+"/change",{
    method:"POST",credentials:"same-origin",timeoutMs:12000,
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({action,expectedBodyHash,...(action==="EDIT"?{body:draft.trim()}:{})}),
   });
   setMode(null);router.refresh();
  }catch(reason){setError(reason instanceof Error?reason.message:"Could not save the message. Try again.");}
  finally{pending.current=false;setBusy(false);}
 }
 return <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2">
  {canEdit?<Button variant="ghost" className="min-h-11 md:min-h-9" type="button" disabled={busy}
   onClick={()=>{setDraft(body);setMode("EDIT");setError("");}}>Edit</Button>:null}
  <Button variant="ghost" className="min-h-11 md:min-h-9" type="button" disabled={busy}
   onClick={()=>{setMode("DELETE");setError("");}}>Delete</Button>
  <Dialog open={mode==="EDIT"} onOpenChange={next=>{if(!next&&!busy)setMode(null);}} dismissible={!busy}
   title="Edit message" className="max-w-md"
   footer={<div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
    <Button variant="secondary" type="button" className="min-h-11 w-full sm:w-auto md:min-h-9" disabled={busy} onClick={()=>setMode(null)}>Cancel</Button>
    <Button variant="primary" type="submit" form={editFormId} className="min-h-11 w-full sm:w-auto md:min-h-9" loading={busy} disabled={busy||!draft.trim()}>
     {busy?"Saving…":"Save edit"}
    </Button>
   </div>}>
   <form id={editFormId} onSubmit={event=>{event.preventDefault();void submit("EDIT");}} className="min-w-0 space-y-2">
    <label className="block min-w-0 text-sm">Edit message
     <Textarea value={draft} maxLength={4000} required rows={3} disabled={busy}
      onChange={event=>setDraft(event.target.value)} className="mt-1 w-full min-w-0"/>
    </label>
    {error?<InlineNotice tone="error" message={error}/>:null}
   </form>
  </Dialog>
  <Dialog open={mode==="DELETE"} onOpenChange={next=>{if(!next&&!busy)setMode(null);}} dismissible={!busy} role="alertdialog"
    title="Delete this message?" description="Other team members will see Message removed." className="max-w-md"
    bodyClassName="!p-0"
    footer={<div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
     <Button variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" type="button" disabled={busy} onClick={()=>{setMode(null);setError("");}}>Cancel</Button>
     <Button variant="danger" className="min-h-11 w-full sm:w-auto md:min-h-9" type="button" loading={busy} disabled={busy}
      onClick={()=>void submit("DELETE")}>{busy?"Removing…":"Delete message"}</Button>
    </div>}>
    {error?<InlineNotice tone="error" message={error}/>:null}
  </Dialog>
 </div>;
}
