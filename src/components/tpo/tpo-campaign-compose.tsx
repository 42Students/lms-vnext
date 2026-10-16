"use client";
import Link from "next/link";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {CAMPAIGN_DELIVERY_UNAVAILABLE,CAMPAIGN_DRAFT_UNAVAILABLE,
  tpoCampaignDraftSchema,previewTpoCampaignText} from "@/modules/messaging/tpo-campaign-draft-model";
const field="mt-1 min-h-11 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground";
const SEGMENTS=[
 {value:"ALL_ELIGIBLE",label:"All eligible contacts"},
 {value:"NEW",label:"New recruiter leads"},
 {value:"UNASSIGNED",label:"Unassigned recruiter leads"},
] as const;
export function TpoCampaignCompose({deliveryReady=false}:{deliveryReady?:boolean}){
 const router=useRouter();
 const [title,setTitle]=useState(""),[subject,setSubject]=useState("");
 const [body,setBody]=useState(""),[segment,setSegment]=useState<(typeof SEGMENTS)[number]["value"]>("ALL_ELIGIBLE");
 const [templateKey,setTemplateKey]=useState(""),[busy,setBusy]=useState(false);
 const [error,setError]=useState(""),[done,setDone]=useState("");
 async function save(){
  const parsed=tpoCampaignDraftSchema.safeParse({title,subject,body,segment,templateKey});
  if(!parsed.success){
   setError(parsed.error.issues[0]?.message??"Check your campaign fields.");return;
  }
  setBusy(true);setError("");setDone("");
  try{
   const response=await fetch("/api/placements/tpo/campaigns/drafts",{
    method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify(parsed.data),
   });
   const data=await response.json() as {error?:string;campaignId?:string;recipients?:number};
   if(!response.ok)throw new Error(response.status===503?CAMPAIGN_DRAFT_UNAVAILABLE:
    data.error==="NO_RECIPIENTS"?"No eligible email recipients match this audience.":
    "Couldn't save your campaign draft. Please try again.");
   setDone("Draft saved for "+data.recipients+" eligible recruiter contacts.");
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:CAMPAIGN_DRAFT_UNAVAILABLE);}
  finally{setBusy(false);}
 }
 return <section className="space-y-5 rounded-xl border border-border bg-surface p-5" aria-label="Campaign composer">
  <h2 className="text-lg font-semibold text-foreground">Write a campaign</h2>
  <p className="text-sm text-body">Save a draft for your placement cell. No message is sent until a separate, verified dispatch action is enabled.</p>
  <form onSubmit={e=>{e.preventDefault();void save();}} className="space-y-4">
   <label className="block text-sm font-semibold">Campaign name
    <input value={title} maxLength={160} required className={field}
     onChange={e=>setTitle(e.target.value)}/>
   </label>
   <label className="block text-sm font-semibold">To
    <select className={field} value={segment} onChange={e=>setSegment(e.target.value as typeof segment)}>
     {SEGMENTS.map(item=><option key={item.value} value={item.value}>{item.label}</option>)}
    </select>
   </label>
   <label className="block text-sm font-semibold">Subject
    <input value={subject} maxLength={200} required className={field}
     onChange={e=>setSubject(e.target.value)}/>
   </label>
   <label className="block text-sm font-semibold">Message
    <textarea value={body} maxLength={10000} required rows={6}
     className={field} onChange={e=>setBody(e.target.value)}/>
   </label>
   <p className="text-xs text-muted-foreground" aria-live="polite">{body.length} / 10,000 characters</p>
   <p className="text-xs text-muted-foreground">
     Write {`{name}`} or {`{company}`} and each person sees their own. This preview uses example text;
     sending, signature and unsubscribe-link delivery have not been enabled.
   </p>
   <section className="rounded-md border border-border bg-surface p-3" aria-label="Message preview">
     <h3 className="text-sm font-semibold">Preview</h3>
     <p className="mt-1 whitespace-pre-wrap break-words text-sm text-body">
       {previewTpoCampaignText(body,{name:"Sample recruiter",company:"Example company"})}
     </p>
   </section>
   <label className="block text-sm font-semibold">Approved campaign template key
    <input value={templateKey} maxLength={160} required className={field}
     placeholder="tpo-campaign-general" onChange={e=>setTemplateKey(e.target.value)}/>
    <span className="mt-1 block text-xs font-normal text-muted-foreground">
     Authentication or OTP templates cannot be used for recruitment campaigns.
    </span>
   </label>
   <Link href={"/tpo/recruiters/campaigns/preview?segment="+segment}
    className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline">
    Preview audience
   </Link>
   {!deliveryReady?<p role="alert" className="rounded-md border border-border p-3 text-sm text-body"><strong>Campaign email is not set up yet, so nothing can be sent. Ask 42 to switch it on.</strong> {CAMPAIGN_DELIVERY_UNAVAILABLE}</p>:<p role="status" className="text-sm text-body">Save a draft, then review eligible recipients before sending.</p>}
   <button type="submit" disabled={busy} className="block min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50">
    {busy?"Saving…":"Save draft"}
   </button>
  </form>
  {done?<p role="status" className="text-sm text-body">{done}</p>:null}
  {error?<p role="alert" className="text-sm text-body">{error}</p>:null}
 </section>;
}
