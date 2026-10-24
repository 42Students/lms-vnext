"use client";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {apiFetch} from "@/lib/api-fetch";
import {mentorAttentionReceiptKey} from "@/modules/projects/mentor-attention-read-model";
import type {MentorProjectAttention} from "@/modules/projects/mentor-attention";

export function MentorProjectFocusQueue({items,initialLater}:{
 items:readonly MentorProjectAttention[];initialLater:readonly string[];
}){
 const router=useRouter();
 const [later,setLater]=useState<readonly string[]>(initialLater);
 const [busy,setBusy]=useState<string|null>(null);
 const [error,setError]=useState("");
 const actionable=items.filter(item=>!later.includes(mentorAttentionReceiptKey(item)));
 async function postpone(item:MentorProjectAttention){
  const key=mentorAttentionReceiptKey(item);
  if(busy)return;
  setBusy(key);setError("");
  try{
   const result=await apiFetch<{hidden:boolean}>("/api/mentor/attention/later",{
    method:"POST",body:JSON.stringify({key}),
    headers:{"content-type":"application/json"},timeoutMs:12000,
   });
   if(!result.hidden)throw Error("Alert was not postponed");
   setLater(old=>[...new Set([...old,key])]);
   router.refresh();
  }catch(caught){
   setError(caught instanceof Error?caught.message:"Could not save Later");
  }finally{setBusy(null);}
 }
 return <div className="prototype-mentor-overview-actions">
  {error?<p role="alert">{error}</p>:null}
  {actionable.map(item=><div key={mentorAttentionReceiptKey(item)}>
   <strong>{item.title}</strong><p>{item.description}</p>
   <Link href={item.href}>Open related item →</Link>
   <button type="button" disabled={busy!==null}
     onClick={()=>void postpone(item)}>
     {busy===mentorAttentionReceiptKey(item)?"Saving…":"Later"}
   </button>
  </div>)}
  {!actionable.length?<p>No current recorded attention remains for this project.</p>:null}
 </div>;
}
