"use client";
import {useState} from "react";
import {Button} from "@/components/ui/button";
import {Dialog} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Alert} from "@/components/ui/alert";

type Preview={jobTitle:string;companyName:string;verifiedDomain:string|null;canInvite:boolean;
 publicLinkAvailable:boolean};
type Result={issued:boolean;emailed:boolean;email:string;name:string;
 secureInvitePath:string;manualLetter:string;manualSubject:string;
 publicLinkIncluded:boolean;publicLinkUnavailable:boolean;emailDeliveryAvailable:boolean};
export function TpoDriveRecruiterReviewInvite({jobId}:{jobId:string}){
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false);
 const [preview,setPreview]=useState<Preview|null>(null);
 const [result,setResult]=useState<Result|null>(null);
 const [name,setName]=useState(""),[email,setEmail]=useState("");
 const [note,setNote]=useState(""),[publicLink,setPublicLink]=useState(false);
 const [sendEmail,setSendEmail]=useState(true),[error,setError]=useState("");
 const endpoint="/api/placements/tpo/jobs/"+encodeURIComponent(jobId)+"/recruiter-review-invite";
 async function show(){
  setOpen(true);setResult(null);setError("");setBusy(true);
  try{
   const r=await fetch(endpoint,{credentials:"same-origin",cache:"no-store"});
   if(!r.ok)throw Error("Unable to check the company reviewer details.");
   const data=await r.json() as Preview;
   setPreview(data);
  }catch(cause){setError(cause instanceof Error?cause.message:"Preview unavailable.");}
  finally{setBusy(false);}
 }
 async function send(){
  if(busy||!preview?.canInvite)return;
  setBusy(true);setError("");
  try{
   const r=await fetch(endpoint,{method:"POST",credentials:"same-origin",
    headers:{"content-type":"application/json"},
    body:JSON.stringify({confirmed:true,name,email,note,includePublicLink:publicLink,sendEmail}),
   });
   const data=await r.json() as Result&{message?:string;error?:string};
   if(!r.ok||!data.issued)
    throw Error(data.message||"Could not verify the recruiter invitation.");
   setResult(data);
  }catch(cause){setError(cause instanceof Error?cause.message:"Invite unavailable.");}
  finally{setBusy(false);}
 }
 function manualEmail(){
  if(!result)return;
  const body=result.manualLetter.replace(result.secureInvitePath,
   new URL(result.secureInvitePath,window.location.origin).toString());
  window.location.href="mailto:"+encodeURIComponent(result.email)+
   "?subject="+encodeURIComponent(result.manualSubject)+
   "&body="+encodeURIComponent(body);
 }
 return <section className="space-y-3 border-b border-border pb-4">
  <div className="flex flex-wrap items-center justify-between gap-3">
   <div><h2 className="text-base font-semibold text-foreground">Recruiter review</h2>
    <p className="text-sm text-body">Invite the company's reviewer before resolving requested drive changes.</p>
   </div>
   <Button type="button" variant="secondary" onClick={()=>void show()}>Invite the recruiter to review</Button>
  </div>
  <Dialog open={open} onOpenChange={next=>{if(!busy)setOpen(next);}}
   title={result?"Recruiter review invitation":"Invite the recruiter to review"}
   description={preview?"Company: "+preview.companyName:"Verifying this drive's company…"}
   footer={<Button type="button" variant="secondary" disabled={busy} onClick={()=>setOpen(false)}>Close</Button>}>
   {error?<Alert tone="error">{error}</Alert>:null}
   {!result?<div className="space-y-3">
    {preview?.verifiedDomain?<p className="text-xs text-body">Verified work domain: @{preview.verifiedDomain}</p>:
     <Alert tone="warning">This company has no verified work domain. The reviewer cannot be invited until it is verified.</Alert>}
    <label className="grid gap-1 text-sm font-semibold">Reviewer name
     <Input value={name} maxLength={150} onChange={e=>setName(e.target.value)} disabled={busy}/></label>
    <label className="grid gap-1 text-sm font-semibold">Company work email
     <Input type="email" value={email} maxLength={150} onChange={e=>setEmail(e.target.value)} disabled={busy}/></label>
    <label className="grid gap-1 text-sm font-semibold">Message (optional)
     <Textarea value={note} maxLength={1000} rows={3} onChange={e=>setNote(e.target.value)} disabled={busy}/></label>
    <label className="flex gap-2 text-sm"><input type="checkbox" checked={publicLink}
     onChange={e=>setPublicLink(e.target.checked)} disabled={busy}/>
     Include public drive link</label>
    {publicLink&&!preview?.publicLinkAvailable?
     <p className="text-xs text-muted-foreground">No authorized public link exists for this drive. A secure reviewer invitation will be included instead.</p>:null}
    <label className="flex gap-2 text-sm"><input type="checkbox" checked={sendEmail}
     onChange={e=>setSendEmail(e.target.checked)} disabled={busy}/>
     Send invitation email where delivery is configured</label>
    <Button type="button" disabled={busy||!preview?.canInvite||name.trim().length<2||!email.includes("@")}
     onClick={()=>void send()}>{busy?"Issuing…":"Invite reviewer"}</Button>
   </div>:<div className="space-y-3 text-sm" role="status">
    <Alert tone={result.emailed?"success":"info"}>{result.emailed?
      "Recruiter invitation email accepted by the provider.":
      "Secure invitation created. Copy the email below and send it manually."}</Alert>
    {result.publicLinkUnavailable?<p className="text-xs text-muted-foreground">Public link not included because none is available for this drive.</p>:null}
    <p className="font-semibold">{result.email}</p>
    <label className="grid gap-1 font-semibold">Invitation message
     <Textarea readOnly value={result.manualLetter} rows={9}/></label>
    <div className="flex flex-wrap gap-2">
     <Button type="button" variant="secondary" onClick={()=>navigator.clipboard?.writeText(
      result.manualLetter.replace(result.secureInvitePath,
       new URL(result.secureInvitePath,window.location.origin).toString()))}>Copy invitation</Button>
     <Button type="button" variant="secondary" onClick={manualEmail}>Open in email app</Button>
    </div>
   </div>}
  </Dialog>
 </section>;
}
