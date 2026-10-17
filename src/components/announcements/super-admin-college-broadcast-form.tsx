"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {broadcastConsentSummary} from "@/modules/announcements/super-admin-college-broadcast-model";
import {broadcastLocalTiming} from "@/modules/announcements/super-admin-broadcast-timing-model";
type CollegeTarget={id:string;label:string};
export function SuperAdminCollegeBroadcastForm({colleges}:{colleges:readonly CollegeTarget[]}){
 const router=useRouter();
 const [mode,setMode]=useState<"ALL_COLLEGES"|"SELECTED_COLLEGES">("SELECTED_COLLEGES");
 const [selected,setSelected]=useState<string[]>([]);
 const [title,setTitle]=useState("");
 const [message,setMessage]=useState("");
 const [buttonLabel,setButtonLabel]=useState("");
 const [buttonUrl,setButtonUrl]=useState("");
 const [scheduledAt,setScheduledAt]=useState("");
 const [expiresAt,setExpiresAt]=useState("");
 const [pinned,setPinned]=useState(false);
 const [review,setReview]=useState(false);
 const [pending,setPending]=useState(false);
 const [feedback,setFeedback]=useState("");
 const count=mode==="ALL_COLLEGES"?colleges.length:selected.length;
 const timing=broadcastLocalTiming(scheduledAt,expiresAt);
 const buttonValid=(!buttonLabel.trim()&&!buttonUrl.trim())||(buttonLabel.trim().length>0&&buttonLabel.length<=60&&/^https:\/\/[^\s]+$/i.test(buttonUrl));
 const valid=buttonValid&&count>0&&Boolean(title.trim())&&title.length<=200&&Boolean(message.trim())&&message.length<=8000&&timing.valid&&!pending;
 async function submit(){
  if(!valid)return;
  setPending(true);setFeedback("");
  try{
   const response=await fetch("/api/admin/announcements/broadcast",{
    method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({audienceMode:mode,collegeIds:mode==="ALL_COLLEGES"?[]:selected,
     reviewedCollegeIds:mode==="ALL_COLLEGES"?colleges.map(c=>c.id):selected,
     title,message,buttonLabel:buttonLabel.trim()||null,buttonUrl:buttonUrl.trim()||null,scheduledAt:timing.scheduledAt,expiresAt:timing.expiresAt,
     isPinned:pinned,publishConsent:true}),
   });
   const data:unknown=await response.json().catch(()=>null);
   if(!response.ok){
    setFeedback(response.status===503?"Announcements database is not yet ready.":response.status===409?"The authorized college audience changed since review. Reload and review it again.":response.status===403?"You are not authorized for this audience.":"Publication failed. Review the audience, timing and permissions.");
    return;
   }
   const published=data&&typeof data==="object"&&"result" in data&&data.result&&typeof data.result==="object"&&"count" in data.result?Number(data.result.count):null;
   if(published===null||!Number.isSafeInteger(published)||published<=0){setFeedback("Publication confirmation was incomplete. Check the notice list.");return;}
   setFeedback("Sent to "+published+" placement cell(s). "+(scheduledAt?"Scheduled announcements will be visible at their planned time.":"Active placement-cell users receive a bell notice."));setTitle("");setMessage("");setButtonLabel("");setButtonUrl("");setSelected([]);
   router.refresh();
  }catch{setFeedback("Connection failure. Publication could not be confirmed.");}
  finally{setPending(false);setReview(false);}
 }
 return <section className="space-y-4 rounded-xl border border-border bg-surface p-5">
  <h2 className="m-0 text-lg font-semibold text-foreground">New announcement to placement cells</h2>
  <p className="text-sm text-body">Send an in-app announcement from 42 to selected placement cells. Immediate announcements also create a bell for active TPO members; scheduled announcements appear at their planned time. No SMS or email is sent.</p>
  <label className="grid gap-1 text-sm font-semibold text-body">Audience
   <select value={mode} onChange={e=>{setMode(e.target.value as typeof mode);setSelected([]);}} className="min-h-11 rounded-md border border-border bg-surface px-3">
    <option value="SELECTED_COLLEGES">Selected placement cells</option>
    <option value="ALL_COLLEGES">Every placement cell in current scope ({colleges.length})</option>
   </select>
  </label>
  {mode==="SELECTED_COLLEGES"?<fieldset className="space-y-2 rounded-md border border-border p-3">
   <legend className="text-sm font-semibold">Select placement cells</legend>
   {colleges.map(item=><label key={item.id} className="flex min-h-10 items-center gap-3 text-sm text-body">
    <input type="checkbox" checked={selected.includes(item.id)} onChange={e=>setSelected(prev=>e.target.checked?[...prev,item.id]:prev.filter(id=>id!==item.id))}/>{item.label}
   </label>)}
  </fieldset>:null}
  <p className="text-xs text-muted-foreground">Placement-cell messages use the legacy 200-character title and 8,000-character body limits.</p>
  <label className="grid gap-1 text-sm font-semibold text-body">Title<Input value={title} maxLength={200} onChange={e=>setTitle(e.target.value)}/></label>
  <label className="grid gap-1 text-sm font-semibold text-body">Message<Textarea value={message} maxLength={8000} onChange={e=>setMessage(e.target.value)}/></label>
  <p role="status" className="text-xs text-muted-foreground">Title {title.length}/200 · Message {message.length}/8000</p>
  <fieldset className="space-y-2 rounded-md border border-border p-3">
   <legend className="text-sm font-semibold">Button (optional)</legend>
   <label className="grid gap-1 text-sm font-semibold text-body">Button label
    <Input value={buttonLabel} maxLength={60} onChange={e=>setButtonLabel(e.target.value)} placeholder="View details"/>
   </label>
   <label className="grid gap-1 text-sm font-semibold text-body">HTTPS link
    <Input type="url" value={buttonUrl} maxLength={500} onChange={e=>setButtonUrl(e.target.value)} placeholder="https://example.com"/>
   </label>
   <p className="text-xs text-muted-foreground">Provide both fields or leave both blank. Label must be 60 characters or fewer.</p>
   <p role="status" className="text-xs text-muted-foreground">Button label {buttonLabel.length}/60 · HTTPS link {buttonUrl.length}/500</p>
   {!buttonValid?<p role="alert" className="text-sm text-danger-text">Provide a button label and a valid HTTPS link.</p>:null}
  </fieldset>
  <div className="grid gap-3 sm:grid-cols-2">
   <label className="grid gap-1 text-sm font-semibold text-body">Schedule (local)<Input type="datetime-local" value={scheduledAt} onChange={e=>setScheduledAt(e.target.value)}/></label>
   <label className="grid gap-1 text-sm font-semibold text-body">Show until (local)<Input type="datetime-local" value={expiresAt} onChange={e=>setExpiresAt(e.target.value)}/></label>
  </div>
  <label className="flex items-center gap-2 text-sm font-semibold text-body">
   <input type="checkbox" checked={pinned} onChange={e=>setPinned(e.target.checked)}/> Pin for recipients
  </label>
  {!timing.valid?<p role="alert" className="text-sm text-danger-text">Enter valid local schedule and expiry values; expiry must follow the schedule.</p>:null}
  <p className="text-sm font-semibold text-body">{broadcastConsentSummary(mode,count,Boolean(scheduledAt))}</p>
  <Button disabled={!valid} onClick={()=>setReview(true)}>Review placement-cell announcement</Button>
  {feedback?<p role="status" className="text-sm text-body">{feedback}</p>:null}
  <ConfirmDialog open={review} onOpenChange={setReview} pending={pending} confirmDisabled={!valid}
   title="Approve announcement to placement cells" description={broadcastConsentSummary(mode,count,Boolean(scheduledAt))}
   confirmLabel="Consent and publish" confirmVariant="danger" onConfirm={()=>{void submit();}}>
   <p className="text-sm text-body">Confirm that this notice, its audience and expiry are correct. Once approved, recipient rows are persisted atomically and become visible according to their schedule.</p>
  </ConfirmDialog>
 </section>;
}
