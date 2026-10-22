"use client";

import {useEffect,useRef,useState} from "react";
import {Alert} from "@/components/ui/alert";
import {Button} from "@/components/ui/button";
import {Textarea} from "@/components/ui/textarea";

type Message={
 id:string;contentText:string;sequence:number;parentDiscussionId:string|null;
 authorName:string|null;isMine:boolean;createdAt:string;
};
type Cursor={afterSequence:number;afterId:string};
type Thread={messages:Message[];nextCursor:Cursor|null;accessMode:string};
const MAX_LENGTH=5000;

/** A persisted lesson-content thread, not the Section's classroom chat.
 * The server verifies this content is in the authenticated college, the
 * chosen delivery is in its offering, and posting membership remains live.
 * Private content IDs are never treated as permission grants. */
export function LessonContentDiscussion({contentId,deliveryId}:{
 contentId:string;deliveryId:string;
}){
 const root="/api/courses/lesson-contents/"+encodeURIComponent(contentId)+"/discussions";
 const [messages,setMessages]=useState<Message[]>([]);
 const [nextCursor,setNextCursor]=useState<Cursor|null>(null);
 const [draft,setDraft]=useState("");
 const [parentId,setParentId]=useState<string|null>(null);
 const [busy,setBusy]=useState(false);
 const [loading,setLoading]=useState(true);
 const [unavailable,setUnavailable]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const mounted=useRef(true);
 const loadingRef=useRef(false);
 const activeScope=useRef(contentId+":"+deliveryId);
 activeScope.current=contentId+":"+deliveryId;

 async function readPage(cursor:Cursor|null=null,append=false,signal?:AbortSignal){
  if(loadingRef.current&&!signal)return;
  loadingRef.current=true;setLoading(true);setError("");
  const scope=contentId+":"+deliveryId;
  const query=new URLSearchParams({deliveryId,limit:"50"});
  if(cursor){query.set("afterSequence",String(cursor.afterSequence));query.set("afterId",cursor.afterId);}
  try{
   const response=await fetch(root+"?"+query.toString(),{cache:"no-store",...(signal ? {signal} : {})});
   if(response.status===503){
    if(activeScope.current===scope&&mounted.current){
     setUnavailable(true);setMessages([]);setNextCursor(null);
    }
    return;
   }
   if(!response.ok)throw Error(response.status===403||response.status===404
    ?"This lesson discussion is not available in your selected Section.":
    "Could not load this lesson discussion.");
   const result:Thread=await response.json();
   if(!Array.isArray(result.messages)||activeScope.current!==scope||!mounted.current)return;
   setMessages(old=>append?[...old,...result.messages.filter(row=>!old.some(item=>item.id===row.id))]:result.messages);
   setNextCursor(result.nextCursor??null);
   setUnavailable(false);
  }catch(cause){
   if(!signal?.aborted&&mounted.current&&activeScope.current===scope)
    setError(cause instanceof Error?cause.message:"Could not load discussion.");
  }finally{
   loadingRef.current=false;
   if(mounted.current&&activeScope.current===scope)setLoading(false);
  }
 }
 useEffect(()=>{
  mounted.current=true;
  const controller=new AbortController();
  setMessages([]);setNextCursor(null);setParentId(null);
  setDraft("");setNotice("");setUnavailable(false);
  void readPage(null,false,controller.signal);
  return ()=>{controller.abort();mounted.current=false;};
  // The component is mounted with a content/delivery key by its caller.
  // eslint-disable-next-line react-hooks/exhaustive-deps
 },[contentId,deliveryId]);
 async function submit(){
  const value=draft.trim();
  if(busy||unavailable)return;
  if(!value||value.length>MAX_LENGTH){
   setError("Enter a comment of 1–5,000 characters.");return;
  }
  setBusy(true);setError("");setNotice("");
  const scope=contentId+":"+deliveryId;
  try{
   const response=await fetch(root,{
    method:"POST",credentials:"same-origin",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({deliveryId,contentText:value,
      ...(parentId?{parentDiscussionId:parentId}:{})}),
   });
   if(!response.ok)throw Error(response.status===403||response.status===404
    ?"You cannot post to this lesson in the selected Section.":
    "Comment was not saved. Review your access and retry.");
   if(!mounted.current||activeScope.current!==scope)return;
   setDraft("");setParentId(null);setNotice("Comment posted.");
   await readPage(null,false);
  }catch(cause){
   if(mounted.current&&activeScope.current===scope)
    setError(cause instanceof Error?cause.message:"Comment was not saved.");
  }finally{
   if(mounted.current&&activeScope.current===scope)setBusy(false);
  }
 }
 return <section aria-label="Lesson content discussion" className="mt-4 space-y-3 border-t border-border pt-4">
  <h3 className="text-sm font-semibold text-foreground">Discussion on this lesson content</h3>
  <p className="text-xs text-muted-foreground">Comments are attached to this lesson item, not the whole classroom discussion. Only eligible members of this Section can see or post them.</p>
  {unavailable?<Alert tone="info">Lesson discussion is not available until its verified private data store is enabled. Classroom chat remains separate.</Alert>:null}
  {error?<Alert tone="error" role="alert">{error}</Alert>:null}
  {notice?<Alert tone="success" role="status">{notice}</Alert>:null}
  {loading?<p className="text-xs text-muted-foreground" role="status">Loading comments…</p>:null}
  {!unavailable&&!loading&&messages.length===0?<p className="text-xs text-muted-foreground">No comments on this lesson content.</p>:null}
  <ol className="space-y-2" aria-label="Lesson comments in sequence order">
   {messages.map(message=><li key={message.id} className="space-y-1 rounded border border-border bg-surface-subtle p-3">
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
     <span><strong className="font-semibold text-body">{message.authorName??"Class member"}</strong>
      {message.isMine?" (you)":""} · #{message.sequence}</span>
     <time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleString("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"})} IST</time>
    </div>
    {message.parentDiscussionId?<p className="text-xs text-muted-foreground">Reply in this content thread</p>:null}
    <p className="whitespace-pre-wrap break-words text-sm text-body">{message.contentText}</p>
    {!unavailable?<Button variant="ghost" size="sm" type="button" disabled={busy}
     onClick={()=>{setParentId(message.id);setError("");}}>
     Reply to comment #{message.sequence}</Button>:null}
   </li>)}
  </ol>
  {nextCursor&&!unavailable?<Button size="sm" variant="secondary" type="button"
   disabled={loading||busy} onClick={()=>void readPage(nextCursor,true)}>
   Load older comments
  </Button>:null}
  {!unavailable?<div className="space-y-2 rounded border border-border p-3">
   {parentId?<div className="flex flex-wrap items-center justify-between gap-2 text-xs">
    <span>Replying to a comment in this lesson</span>
    <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={()=>setParentId(null)}>Cancel reply</Button>
   </div>:null}
   <label className="grid gap-1 text-sm font-semibold text-body">Comment
    <Textarea rows={3} value={draft} maxLength={MAX_LENGTH} disabled={busy}
     onChange={event=>setDraft(event.target.value)}
     placeholder="Add a comment about this lesson content"/>
   </label>
   <div className="flex flex-wrap items-center justify-between gap-2">
    <span className="text-xs text-muted-foreground" role="status">{draft.trim().length} / {MAX_LENGTH}</span>
    <Button type="button" size="sm" loading={busy}
     disabled={busy||!draft.trim()||draft.trim().length>MAX_LENGTH}
     onClick={()=>void submit()}>Post comment</Button>
   </div>
  </div>:null}
 </section>;
}
