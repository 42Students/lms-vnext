"use client";
import { Button } from "@/components/ui/button";
import { Disclosure } from "@/components/ui/disclosure";
import {Dialog} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {TPO_MESSAGE_TEMPLATE_LIBRARY,searchTpoMessageTemplates} from "@/modules/placements/tpo-message-template-library";
import { InlineNotice } from "@/components/ui/inline-notice";
import {useEffect,useId,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {TPO_QUICK_REPLIES,recruiterMessageDraftKey} from "@/modules/placements/tpo-message-draft-model";
import {apiFetch} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";
import {Textarea} from "@/components/ui/textarea";
export function TpoRecruiterMessageReply({threadId,unread,actorUserId,accessEnded=false,quote}:{
 threadId:string;unread:boolean;actorUserId:string;accessEnded?:boolean;quote?:string;
}){
 const router=useRouter();
 const draftHintId=useId();
 const textareaRef=useRef<HTMLTextAreaElement>(null);
 const [body,setBody]=useState(""),[busy,setBusy]=useState(false);
 const [error,setError]=useState(""),[success,setSuccess]=useState("");
 const draftKey=recruiterMessageDraftKey(actorUserId,threadId);
 const markedOnOpen=useRef<string|null>(null);
 const pending=useRef(false);
 const [discardReview,setDiscardReview]=useState(false);
 const [templateOpen,setTemplateOpen]=useState(false);
 const [templateQuery,setTemplateQuery]=useState("");
 const [templateId,setTemplateId]=useState<string>(TPO_MESSAGE_TEMPLATE_LIBRARY[0].id);
 const template=TPO_MESSAGE_TEMPLATE_LIBRARY.find(item=>item.id===templateId)??TPO_MESSAGE_TEMPLATE_LIBRARY[0];
 useEffect(()=>{
  if(!unread||markedOnOpen.current===threadId)return;
  markedOnOpen.current=threadId;
  void apiFetch("/api/placements/tpo/messages/threads/"+encodeURIComponent(threadId)+"/read",{
    method:"POST",credentials:"same-origin",timeoutMs:12000,
    headers:{"Content-Type":"application/json"},body:JSON.stringify({confirmed:true}),
  }).then(()=>router.refresh()).catch(reason=>{
    setError(reason instanceof Error?reason.message:friendlyApiError({network:true}));
  });
 },[threadId,unread,router]);

 useEffect(()=>{
  if(!body.trim())return;
  const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};
  window.addEventListener("beforeunload",warn);
  return ()=>window.removeEventListener("beforeunload",warn);
 },[body]);
 function persistDraft(value:string){
  setDiscardReview(false);setBody(value);
  try{if(value)sessionStorage.setItem(draftKey,value);else sessionStorage.removeItem(draftKey);}catch{/* Storage is optional. */}
 }
 function addQuickReply(value:string){
  const text=body?body+" "+value:value;
  if(text.length>4000){
   setError("Message must be 4000 characters or fewer.");
   return;
  }
  setError("");
  persistDraft(text);
  textareaRef.current?.focus();
 }
 function restoreDraft(){
  if(body)return;
  try{const saved=sessionStorage.getItem(draftKey);
   if(saved&&saved.length<=4000)setBody(saved);}catch{/* Storage is optional. */}
 }
 function discardDraft(){
  if(!body.trim())return;
  if(!discardReview){setDiscardReview(true);return;}
  persistDraft("");setDiscardReview(false);
 }
 async function post(mode:"messages"|"read"){
  if(pending.current||busy||(mode==="messages"&&(!body.trim()||accessEnded)))return;
  pending.current=true;setBusy(true);setError("");setSuccess("");
  try{
   await apiFetch("/api/placements/tpo/messages/threads/"+
    encodeURIComponent(threadId)+"/"+mode,{
     method:"POST",credentials:"same-origin",timeoutMs:15000,
     headers:{"Content-Type":"application/json"},
     body:JSON.stringify(mode==="messages"?{body:body.trim()}:{confirmed:true}),
   });
   if(mode==="messages"){persistDraft("");setSuccess("Message sent");}
   else setSuccess("Messages marked read");
   router.refresh();
  }catch(reason){
   setError(reason instanceof Error?reason.message:friendlyApiError({network:true}));
  }finally{pending.current=false;setBusy(false);}
 }
 return <section className="space-y-3 border-t border-border pt-4" aria-label="Reply to recruiter">
  {accessEnded?<p role="status" className="text-sm text-warning">Recruiter access ended. Sending is unavailable until access is restored.</p>:null}
  <h2 className="font-semibold text-[var(--lms-heading)] text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px]">Reply</h2>
  {quote?<Button type="button" variant="secondary" disabled={busy||accessEnded}
    className="min-h-11 md:min-h-9" onClick={()=>addQuickReply(quote)}>Quote change request</Button>:null}
  <Button type="button" variant="secondary" disabled={busy||accessEnded} className="min-h-11 md:min-h-9"
   onClick={()=>setTemplateOpen(true)}>+ Templates</Button>
  <Disclosure title="Quick replies" className="min-w-0" contentClassName="pt-2">
  <div role="group" aria-label="Quick replies" className="flex min-w-0 flex-wrap gap-2">
    {TPO_QUICK_REPLIES.map(reply=><Button variant="secondary" key={reply} type="button" disabled={busy||accessEnded}
      className="min-h-11 md:min-h-9 shrink-0 rounded-[var(--lms-control-radius)] px-3 text-sm font-[650]"
      onClick={()=>addQuickReply(reply)}>{reply}</Button>)}
   </div>
  </Disclosure>
  <form aria-busy={busy} onSubmit={event=>{event.preventDefault();void post("messages");}} className="space-y-3">
   <label className="block text-[13px] text-[var(--lms-neutral-400)] font-semibold leading-4">Message
    <Textarea ref={textareaRef} aria-describedby={draftHintId} className="mt-1 min-h-28 w-full"
      maxLength={4000} required disabled={accessEnded} aria-label="Message" placeholder="Write a message" value={body}
      onFocus={restoreDraft} onChange={e=>persistDraft(e.target.value)}
      onKeyDown={e=>{if(e.key==="Enter"&&(e.ctrlKey||e.metaKey)&&!e.nativeEvent.isComposing){
       e.preventDefault();if(body.trim()&&!busy&&!accessEnded)void post("messages");}}}/>
   </label>
   <p id={draftHintId} className="text-xs text-muted-foreground leading-[20px]" aria-live="polite">Ctrl/Cmd + Enter to send · Enter for a new line · {body.length}/4000</p>
   <div className="flex min-w-0 flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:items-center">
    <Button variant="secondary" type="button" disabled={busy||accessEnded||!body.trim()} onClick={discardDraft}
     className="min-h-11 w-full px-4 sm:w-auto md:min-h-9">Discard draft</Button>
    <Button variant="primary" type="submit" disabled={busy||accessEnded||!body.trim()}
     className="min-h-11 w-full px-4 sm:w-auto md:min-h-9">
      Send message
    </Button>
    {discardReview?<p role="status" className="w-full text-sm leading-[22px]">Discard your unsent message? Select Discard draft again to confirm, or keep typing to cancel.</p>:null}
    {unread?<Button variant="secondary" type="button" disabled={busy} onClick={()=>void post("read")}
     className="min-h-11 w-full px-4 sm:w-auto md:min-h-9">
      Mark as read
    </Button>:null}
   </div>
  </form>
  <Dialog title="Message templates" open={templateOpen} onOpenChange={setTemplateOpen}
   dismissible={!busy}
   footer={<div className="flex flex-wrap justify-end gap-2">
    <Button variant="secondary" type="button" className="min-h-11 md:min-h-9"
     onClick={()=>setTemplateOpen(false)}>Cancel</Button>
    <Button variant="primary" type="button" className="min-h-11 md:min-h-9"
     disabled={!template||busy||accessEnded||(body?body.length+1:0)+(template?.text.length??0)>4000}
     onClick={()=>{if(!template)return;addQuickReply(template.text);setTemplateOpen(false);}}>Insert</Button>
   </div>}>
   <div className="grid min-w-0 gap-4 md:grid-cols-[minmax(170px,230px)_minmax(0,1fr)]">
    <div className="min-w-0 space-y-2">
     <label className="sr-only" htmlFor="tpo-message-template-search">Search message templates</label>
     <Input id="tpo-message-template-search" type="search" value={templateQuery}
      onChange={event=>setTemplateQuery(event.target.value)}
      placeholder="Search message templates" className="min-h-11 w-full md:min-h-9"/>
     <div className="max-h-72 min-w-0 overflow-y-auto" role="group" aria-label="Available message templates">
      {searchTpoMessageTemplates(templateQuery).map(item=>
       <button key={item.id} type="button" aria-pressed={templateId===item.id}
        onClick={()=>setTemplateId(item.id)}
        className={"block min-h-11 w-full rounded-md px-3 py-2 text-left text-sm "+
          (templateId===item.id?"bg-primary-subtle font-semibold text-primary-text":"text-body hover:bg-surface-secondary")}>
        <span className="block text-xs text-muted-foreground">{item.group}</span>
        <span className="block">{item.title}</span>
       </button>)}
      {searchTpoMessageTemplates(templateQuery).length===0?
       <p role="status" className="p-3 text-xs text-muted-foreground">No templates match this search.</p>:null}
     </div>
    </div>
    <section aria-label="Template preview" className="min-w-0 space-y-3">
     <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{template?.group??"Draft wording"}</p>
     <h3 className="font-semibold text-foreground">{template?.title??"Choose a template"}</h3>
     <p className="min-h-48 whitespace-pre-wrap rounded-lg bg-surface-secondary p-4 text-sm leading-6 text-foreground">
      {template?.text??"Select a template to preview it."}
     </p>
     <p className="text-xs text-muted-foreground">Suggested text only. Verify relevant facts before sending. Insert adds this text to your unsent draft.</p>
    </section>
   </div>
  </Dialog>
  {error?<InlineNotice tone="error" role="alert" message={error}/>:null}
  {success?<InlineNotice tone="success" message={success}/>:null}
 </section>;
}
