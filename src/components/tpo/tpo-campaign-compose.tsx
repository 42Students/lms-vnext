"use client";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { InlineNotice } from "@/components/ui/inline-notice";
import { Disclosure } from "@/components/ui/disclosure";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {CAMPAIGN_DELIVERY_UNAVAILABLE,CAMPAIGN_DRAFT_UNAVAILABLE,
  tpoCampaignDraftSchema,previewTpoCampaignText} from "@/modules/messaging/tpo-campaign-draft-model";
type SelectedAudiencePreview={
 selected:number;eligible:number;leftOut:number;unavailable:number;
 suppressed:{NO_EMAIL:number;UNSUBSCRIBED:number;BOUNCED:number;NOT_NOW:number;DUPLICATE:number};
};
const field="mt-1 min-h-11 w-full min-[768px]:min-h-9";
const SEGMENTS=[
 {value:"ALL_ELIGIBLE",label:"All eligible contacts"},
 {value:"NEW",label:"New recruiter leads"},
 {value:"UNASSIGNED",label:"Unassigned recruiter leads"},
] as const;
export function TpoCampaignCompose({deliveryReady=false,selectedLeadIds=[]}:{deliveryReady?:boolean;selectedLeadIds?:string[]}){
 const router=useRouter();
 const [title,setTitle]=useState(""),[subject,setSubject]=useState("");
 const [body,setBody]=useState(""),[segment,setSegment]=useState<(typeof SEGMENTS)[number]["value"]>("ALL_ELIGIBLE");
 const [templateKey,setTemplateKey]=useState(""),[busy,setBusy]=useState(false);
 const [error,setError]=useState(""),[done,setDone]=useState("");
 const [savedDraftId,setSavedDraftId]=useState<string|null>(null);
 const [audience,setAudience]=useState<SelectedAudiencePreview|null>(null);
 const [audienceStatus,setAudienceStatus]=useState<"idle"|"loading"|"ready"|"error">(selectedLeadIds.length?"loading":"idle");
 const [audienceRetry,setAudienceRetry]=useState(0);
 const selectionKey=selectedLeadIds.join(",");
 const audienceKey=selectionKey+"|"+audienceRetry;
 const [prevAudienceKey,setPrevAudienceKey]=useState(audienceKey);
 if(prevAudienceKey!==audienceKey){
  setPrevAudienceKey(audienceKey);
  setAudience(null);setAudienceStatus(selectionKey?"loading":"idle");
 }
 useEffect(()=>{
  if(!selectionKey)return;
  const controller=new AbortController();
  void fetch("/api/placements/tpo/campaigns/preview-selected",{
   method:"POST",credentials:"same-origin",signal:controller.signal,
   headers:{"Content-Type":"application/json"},
   body:JSON.stringify({selectedLeadIds:selectionKey.split(",")}),
  }).then(async response=>{
   if(!response.ok)throw new Error("Audience preview is unavailable");
   return response.json() as Promise<SelectedAudiencePreview>;
  }).then(value=>{if(!controller.signal.aborted){setAudience(value);setAudienceStatus("ready");}})
    .catch(()=>{if(!controller.signal.aborted)setAudienceStatus("error");});
  return ()=>controller.abort();
 },[selectionKey,audienceRetry]);
 async function save(){
  setError("");
  if(!title.trim()){setError("Give this campaign a title");return;}
  if(!subject.trim()){setError("Give it a subject");return;}
  if(!body.trim()){setError("Write the email");return;}
  if(selectedLeadIds.length&&(!audience||audienceStatus!=="ready"||audience.unavailable>0||audience.eligible===0)){
   setError("Selected recruiters could not be confirmed as eligible. Review the audience before saving.");return;
  }
  const parsed=tpoCampaignDraftSchema.safeParse({title,subject,body,segment:selectedLeadIds.length?"ALL_ELIGIBLE":segment,templateKey,selectedLeadIds:selectedLeadIds.length?selectedLeadIds:undefined});
  if(!parsed.success){
   setError(parsed.error.issues[0]?.message??"Check your campaign fields.");return;
  }
  setBusy(true);setError("");setDone("");setSavedDraftId(null);
  try{
   const response=await fetch("/api/placements/tpo/campaigns/drafts",{
    method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify(parsed.data),
   });
   const data=await response.json() as {error?:string;campaignId?:string;recipients?:number};
   if(!response.ok)throw new Error(response.status===503?CAMPAIGN_DRAFT_UNAVAILABLE:
    data.error==="NO_RECIPIENTS"?"No eligible email recipients match this audience.":
    data.error==="INVALID_SELECTION"?"Some selected recruiters are no longer available in your college. Return to Engage and select again.":
    "Couldn't save your campaign draft. Please try again.");
   setDone("Draft saved for "+data.recipients+" eligible recruiter contacts. No email was sent.");
   setSavedDraftId(data.campaignId??null);
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:CAMPAIGN_DRAFT_UNAVAILABLE);}
  finally{setBusy(false);}
 }
 return <section className="min-w-0 space-y-4 border-t border-border pt-4" aria-label="Campaign composer">
  <h2 className="text-lg font-semibold text-foreground">{selectedLeadIds.length?"Email "+selectedLeadIds.length+" recruiters":"Write a campaign"}</h2>
  <p className="text-sm text-body">Step 1 of 2 · Write the email and review its eligible recipients. Save a draft, then open it to confirm sending. Nothing is sent from this form.</p>
  <form onSubmit={e=>{e.preventDefault();void save();}} className="space-y-4">
   <label className="block text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Campaign name
    <Input value={title} maxLength={160} required className={field}
     onChange={e=>setTitle(e.target.value)}/>
   </label>
   {selectedLeadIds.length?<p role="status" className="text-sm font-semibold">Draft for {selectedLeadIds.length} specifically selected recruiter contacts. Eligibility and suppression rules still apply; no email will be sent when saving.</p>:null}
   {selectedLeadIds.length?<section aria-label="Selected recruiter audience review" className="min-w-0 space-y-2 border-y border-border py-3 text-sm">
    <h3 className="font-semibold">Selected recruiter audience</h3>
    {audienceStatus==="loading"?<p role="status">Checking selected contacts and suppression rules…</p>:null}
    {audienceStatus==="error"?<Alert tone="error"><p>Could not check selected contacts. No emails have been sent.</p>
      <Button variant="ghost" type="button" className="mt-2 min-h-11 min-[768px]:min-h-9 underline" onClick={()=>setAudienceRetry(value=>value+1)}>Retry audience check</Button>
    </Alert>:null}
    {audienceStatus==="ready"&&audience?<div role="status" className="mt-2 space-y-1">
      <p><strong>{audience.eligible} potential recipients</strong> out of {audience.selected} selected · {audience.leftOut} left out.</p>
      <p>No email: {audience.suppressed.NO_EMAIL} · Opted out: {audience.suppressed.UNSUBSCRIBED} · Bounced: {audience.suppressed.BOUNCED}</p>
      <p>Not now: {audience.suppressed.NOT_NOW} · Duplicate email: {audience.suppressed.DUPLICATE} · No longer available: {audience.unavailable}</p>
      {audience.unavailable>0?<Alert tone="warning">Some selected recruiters changed or are no longer in this college. Return to Engage to select again.</Alert>:null}
      {audience.eligible===0?<Alert tone="warning">None of the selected recruiters are eligible for this draft.</Alert>:null}
    </div>:null}
    <p className="mt-2 text-xs text-muted-foreground">This is a preview, not a send. Recipient eligibility is checked again when saving the draft.</p>
   </section>:null}
   <label className="block text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">To
    <Select className={field} value={selectedLeadIds.length?"ALL_ELIGIBLE":segment} disabled={selectedLeadIds.length>0} onChange={e=>setSegment(e.target.value as typeof segment)}>
     {SEGMENTS.map(item=><option key={item.value} value={item.value}>{item.label}</option>)}
    </Select>
   </label>
   {selectedLeadIds.length?<p className="text-xs text-muted-foreground">Audience is fixed to the selected leads from Engage. Return there to change the selection.</p>:null}
   <label className="block text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Subject
    <Input value={subject} maxLength={200} aria-required="true" className={field}
     onChange={e=>setSubject(e.target.value)}/>
   </label>
   <label className="block text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Message
    <Textarea value={body} maxLength={10000} aria-required="true" rows={6}
     className={field} onChange={e=>setBody(e.target.value)}/>
   </label>
   <p className="text-xs text-muted-foreground" aria-live="polite">{body.length} / 10,000 characters</p>
   <p className="text-xs text-muted-foreground">
     Write {`{name}`} or {`{company}`} and each person sees their own. This preview uses example text;
     sending, signature and unsubscribe-link delivery have not been enabled.
   </p>
   <Disclosure title="Preview" ariaLabel="Message preview" className="border-y border-border py-2">
     <div className="min-w-0 py-2">
     <p className="mt-1 whitespace-pre-wrap break-words text-sm text-body">
       {previewTpoCampaignText(body,{name:"Sample recruiter",company:"Example company"})}
     </p>
     </div>
   </Disclosure>
   <label className="block text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Approved campaign template key
    <Input value={templateKey} maxLength={160} required className={field}
     placeholder="tpo-campaign-general" onChange={e=>setTemplateKey(e.target.value)}/>
    <span className="mt-1 block text-xs font-normal text-muted-foreground">
     Authentication or OTP templates cannot be used for recruitment campaigns.
    </span>
   </label>
   {!selectedLeadIds.length?<Link href={"/tpo/recruiters/campaigns/preview?segment="+segment}
    className="inline-flex min-h-11 min-[768px]:min-h-9 items-center text-sm font-semibold text-[var(--lms-link-text)] underline">
    Preview audience
   </Link>:<Link href="/tpo/recruiters"
    className="inline-flex min-h-11 min-[768px]:min-h-9 items-center text-sm font-semibold text-[var(--lms-link-text)] underline">
    Change selected recruiters in Engage
   </Link>}
   {!deliveryReady?<Alert tone="warning"><strong>Campaign email is not set up yet, so nothing can be sent. Ask 42 to switch it on.</strong> {CAMPAIGN_DELIVERY_UNAVAILABLE}</Alert>:<p role="status" className="text-sm text-body">Save a draft, then review eligible recipients before sending.</p>}
   <Button variant="primary" type="submit" disabled={busy||(selectedLeadIds.length>0&&(audienceStatus!=="ready"||!audience||audience.unavailable>0||audience.eligible===0))} className="min-h-11 w-full md:min-h-9 sm:w-auto print:hidden">
    {busy?"Saving…":"Save draft"}
   </Button>
  </form>
  {done?<div className="space-y-2">
    <InlineNotice tone="success" message={done}/>
    {savedDraftId?<Link href={"/tpo/recruiters/campaigns/drafts/"+encodeURIComponent(savedDraftId)}
      className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">
      Step 2 · Review draft and confirm recipients
    </Link>:<Link href="/tpo/recruiters/campaigns" className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">
      Open email campaigns
    </Link>}
  </div>:null}
  {error?<InlineNotice tone="error" message={error}/>:null}
 </section>;
}
