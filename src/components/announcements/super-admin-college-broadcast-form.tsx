"use client";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Dialog} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Checkbox} from "@/components/ui/checkbox";
import {broadcastConsentSummary} from "@/modules/announcements/super-admin-college-broadcast-model";
import {broadcastLocalTiming} from "@/modules/announcements/super-admin-broadcast-timing-model";
type CollegeTarget={id:string;label:string};
export function SuperAdminCollegeBroadcastForm({colleges}:{colleges:readonly CollegeTarget[]}){
 const router=useRouter();
 const [mode,setMode]=useState<"ALL_COLLEGES"|"SELECTED_COLLEGES">("ALL_COLLEGES");
 const [open,setOpen]=useState(false);
 const [selected,setSelected]=useState<string[]>([]);
 const [title,setTitle]=useState("");
 const [message,setMessage]=useState("");
 const [titleTouched,setTitleTouched]=useState(false);
 const [messageTouched,setMessageTouched]=useState(false);
 const [audienceTouched,setAudienceTouched]=useState(false);
 const [buttonLabel,setButtonLabel]=useState("");
 const [buttonUrl,setButtonUrl]=useState("");
 const [expiresAt,setExpiresAt]=useState("");
 const [pinned,setPinned]=useState(false);
 const [review,setReview]=useState(false);
 const [open,setOpen]=useState(false);
 const [pending,setPending]=useState(false);
 const publishing=useRef(false);
 const [feedback,setFeedback]=useState("");
 const count=mode==="ALL_COLLEGES"?colleges.length:selected.length;
 const timing=broadcastLocalTiming("",expiresAt);
 const buttonError=buttonLabel.trim()&&!buttonUrl.trim()?"Add an HTTPS link to use this button.":buttonUrl.trim()&&!/^https:\/\/[^\s]+$/i.test(buttonUrl.trim())?"The link has to start with https://":null;
 const buttonValid=!buttonError&&buttonLabel.trim().length<=60&&buttonUrl.trim().length<=500;
 const valid=buttonValid&&count>0&&Boolean(title.trim())&&title.length<=200&&Boolean(message.trim())&&message.length<=8000&&timing.valid&&(!timing.expiresAt||new Date(timing.expiresAt).getTime()>=Date.now()-60_000)&&!pending;
 async function submit(){
  if(!valid||publishing.current)return;
  publishing.current=true;
  setPending(true);setFeedback("");
  try{
   const response=await fetch("/api/admin/announcements/broadcast",{
    method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({audienceMode:mode,collegeIds:mode==="ALL_COLLEGES"?[]:selected,
     reviewedCollegeIds:mode==="ALL_COLLEGES"?colleges.map(c=>c.id):selected,
     title,message,buttonLabel:buttonUrl.trim()?(buttonLabel.trim()||"Open"):null,buttonUrl:buttonUrl.trim()||null,scheduledAt:null,expiresAt:timing.expiresAt,
     isPinned:pinned,publishConsent:true}),
   });
   const data:unknown=await response.json().catch(()=>null);
   if(!response.ok){
    const code=data&&typeof data==="object"&&"error" in data&&typeof data.error==="string"?data.error:"";
    setFeedback(response.status===503?"Announcements database is not yet ready.":response.status===409?"The authorized college audience changed since review. Reload and review it again.":response.status===403?"You are not authorized for this audience.":code==="TARGET_NOT_FOUND"?"Pick at least one":code==="INVALID_SCHEDULE"?"The end date has passed":code==="INVALID_REQUEST"?"Couldn't send. Check the title, announcement, placement cells and link.":"Couldn't send");
    if(response.status===400){setTitleTouched(true);setMessageTouched(true);setAudienceTouched(true);}

    return;
   }
   const published=data&&typeof data==="object"&&"result" in data&&data.result&&typeof data.result==="object"&&"count" in data.result?Number(data.result.count):null;
   if(published===null||!Number.isSafeInteger(published)||published<=0){setFeedback("Publication confirmation was incomplete. Check the notice list.");return;}
   setOpen(false);
   setFeedback("Sent to "+published+" placement cell"+(published===1?"":"s"));setTitle("");setMessage("");setButtonLabel("");setButtonUrl("");setSelected([]);setTitleTouched(false);setMessageTouched(false);setAudienceTouched(false);
   setOpen(false);
   router.refresh();
  }catch{setFeedback("Connection failure. Publication could not be confirmed.");}
  finally{publishing.current=false;setPending(false);setReview(false);}
 }
 return <>
  <Button type="button" variant="primary" onClick={()=>setOpen(true)}>New announcement</Button>
  <Dialog open={open} onOpenChange={setOpen} title="New announcement to placement cells" className="max-w-[600px]" dismissible={!pending}
   bodyClassName="space-y-[var(--lms-space-4)]"
   footer={<div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
    <Button type="button" variant="secondary" disabled={pending} onClick={()=>setOpen(false)}>Cancel</Button>
    <Button type="button" disabled={!valid} onClick={()=>setReview(true)}>{mode==="ALL_COLLEGES"?"Send to every placement cell ("+count+")":"Send to the picked placement cells"}</Button>
   </div>}>
  <p className="text-sm text-body">To placement cells. Each one gets a bell and reads it under Announcements &gt; From 42. No SMS or email is sent.</p>
  <fieldset className="min-w-0 space-y-2" disabled={pending}>
   <legend className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">To</legend>
   <div className="flex flex-wrap gap-x-5 gap-y-2">
    <label className="flex min-h-11 items-center gap-2 text-sm text-body md:min-h-9">
     <input type="radio" name="broadcast-audience" value="ALL_COLLEGES" checked={mode==="ALL_COLLEGES"} onChange={()=>{setMode("ALL_COLLEGES");setSelected([]);setAudienceTouched(true);}} className="accent-[var(--lms-primary-text)]"/>
     Every placement cell ({colleges.length})
    </label>
    <label className="flex min-h-11 items-center gap-2 text-sm text-body md:min-h-9">
     <input type="radio" name="broadcast-audience" value="SELECTED_COLLEGES" checked={mode==="SELECTED_COLLEGES"} onChange={()=>{setMode("SELECTED_COLLEGES");setSelected([]);setAudienceTouched(true);}} className="accent-[var(--lms-primary-text)]"/>
     Some placement cells
    </label>
   </div>
  </fieldset>
  {mode==="SELECTED_COLLEGES"?<details className="min-w-0 border-t border-border pt-[var(--lms-space-3)]">
   <summary className="min-h-11 cursor-pointer py-[var(--lms-space-2)] text-[var(--lms-font-sm)] font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Select placement cells</summary>
   <fieldset className="min-w-0 space-y-[var(--lms-space-2)]"><legend className="sr-only">Select placement cells</legend>
   {colleges.map(item=><label key={item.id} className="flex min-h-11 items-center gap-3 text-sm text-body md:min-h-9">
    <Checkbox disabled={pending} checked={selected.includes(item.id)} onChange={e=>{setAudienceTouched(true);setSelected(prev=>e.target.checked?[...prev,item.id]:prev.filter(id=>id!==item.id));}}/>{item.label}
   </label>)}
   </fieldset>
  </details>:null}
  {audienceTouched&&mode==="SELECTED_COLLEGES"&&selected.length===0?<p role="alert" className="text-sm text-danger-text">Pick at least one</p>:null}
  <p className="text-xs text-muted-foreground">Placement-cell messages use the legacy 200-character title and 8,000-character body limits.</p>
  <label className="grid min-w-0 gap-2 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">Title<Input disabled={pending} value={title} maxLength={200} aria-invalid={titleTouched&&!title.trim()} onBlur={()=>setTitleTouched(true)} onChange={e=>setTitle(e.target.value)}/></label>
  {titleTouched&&!title.trim()?<p role="alert" className="text-sm text-danger-text">Give it a title</p>:null}
  <label className="grid min-w-0 gap-2 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">Announcement<Textarea disabled={pending} value={message} maxLength={8000} aria-invalid={messageTouched&&!message.trim()} onBlur={()=>setMessageTouched(true)} onChange={e=>setMessage(e.target.value)} placeholder="Links starting with https:// become clickable."/></label>
  {messageTouched&&!message.trim()?<p role="alert" className="text-sm text-danger-text">Write the announcement</p>:null}
  <p role="status" className="text-xs text-muted-foreground">Title {title.length}/200 · Announcement {message.length}/8000</p>
  <details className="min-w-0 border-t border-border pt-[var(--lms-space-3)]">
   <summary className="min-h-11 cursor-pointer py-[var(--lms-space-2)] text-[var(--lms-font-sm)] font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Button (optional)</summary>
   <fieldset className="min-w-0 space-y-[var(--lms-space-3)]"><legend className="sr-only">Button (optional)</legend>
   <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">Button label
    <Input disabled={pending} value={buttonLabel} maxLength={60} onChange={e=>setButtonLabel(e.target.value)} placeholder="View Details"/>
   </label>
   <label className="grid min-w-0 gap-2 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">HTTPS link
    <Input disabled={pending} type="url" value={buttonUrl} maxLength={500} onChange={e=>setButtonUrl(e.target.value)} placeholder="https://example.com"/>
   </label>
   <p className="text-xs text-muted-foreground">A button link must start with https://. Leave the label blank to use "Open".</p>
   <p role="status" className="text-xs text-muted-foreground">Button label {buttonLabel.length}/60 · HTTPS link {buttonUrl.length}/500</p>
   {buttonError?<p role="alert" className="text-sm text-danger-text">{buttonError}</p>:null}
   </fieldset>
  </details>
  <label className="grid min-w-0 gap-2 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">Show until (local)<Input disabled={pending} type="datetime-local" value={expiresAt} onChange={e=>setExpiresAt(e.target.value)}/></label>
  <label className="flex min-h-11 items-center gap-2 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] md:min-h-9">
   <Checkbox disabled={pending} checked={pinned} onChange={e=>setPinned(e.target.checked)}/> Pin for recipients
  </label>
  {!timing.valid?<p role="alert" className="text-sm text-danger-text">Give a date and time.</p>:null}
  {timing.expiresAt&&new Date(timing.expiresAt).getTime()<Date.now()-60_000?<p role="alert" className="text-sm text-danger-text">The end date has passed</p>:null}
  <p className="border-t border-border pt-[var(--lms-space-3)] text-sm font-semibold text-body">{broadcastConsentSummary(mode,count,false)}</p>
  </Dialog>
  {feedback?<p role={feedback.startsWith("Sent to ")?"status":"alert"} aria-live="polite" className="text-sm text-body">{feedback}</p>:null}
  <ConfirmDialog open={review} onOpenChange={setReview} pending={pending} confirmDisabled={!valid}
   title="Approve announcement to placement cells" description={broadcastConsentSummary(mode,count,false)}
   confirmLabel="Consent and publish" confirmVariant="danger" onConfirm={()=>{void submit();}}>
   <p className="text-sm text-body">Confirm the audience and expiry before immediate delivery. The target set is rechecked at publication.</p>
  </ConfirmDialog>
 </>;
}
