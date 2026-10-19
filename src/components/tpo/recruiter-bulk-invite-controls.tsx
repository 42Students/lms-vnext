"use client";
import {useState} from "react";
import {bulkInviteDisposition,type TpoBulkInviteCandidate} from "@/modules/placements/tpo-bulk-invite-preview-model";
import {Button} from "@/components/ui/button";
import {Textarea} from "@/components/ui/textarea";
type Entry={id:string;name:string;email:string;url:string|null;reason:string|null;emailed:boolean};
export function RecruiterBulkInviteControls({collegeId,rows,onUpdated}:{
 collegeId:string;rows:readonly TpoBulkInviteCandidate[];onUpdated:()=>void;
}){
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false);
 const [results,setResults]=useState<Entry[]>([]);
 const [notice,setNotice]=useState("");
 const [reviewSnapshot,setReviewSnapshot]=useState<string|null>(null);
 const eligible=rows.filter(row=>!bulkInviteDisposition(row));
 const eligibleSnapshot=eligible.map(row=>[row.id,row.emailNorm??"",row.manualStage,row.inviteSentAt??""].join(":")).sort().join("|");
 async function createLinks(target:readonly TpoBulkInviteCandidate[],retryOnly=false){
  if(busy||target.length===0||target.length>100)return;
  if(retryOnly&&target.some(row=>bulkInviteDisposition(row))){
   setNotice("A failed recruiter is no longer eligible. Refresh the roster and review before issuing another link.");return;
  }
  if(!retryOnly&&reviewSnapshot!==eligibleSnapshot){
    setReviewSnapshot(eligibleSnapshot);
    setNotice("Review the recipients and confirm. Existing invitation links for these recruiters will be replaced.");
    return;
  }
  setBusy(true);if(!retryOnly)setResults([]);setNotice("");
  const outcome:Entry[]=[];
  for(const lead of target){
   try{
    const response=await fetch("/api/placements/tpo/leads/"+encodeURIComponent(lead.id)+"/invite",{
     method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
     body:JSON.stringify({collegeId,sendEmail:false}),
    });
    if(!response.ok)throw new Error(response.status===503?"Invite storage unavailable":
     response.status===409?"Contact is no longer eligible":"Link creation failed");
    const payload=await response.json() as {invite?:{token?:string;emailed?:boolean}};
    if(!payload.invite?.token)throw new Error("No invite token returned");
    outcome.push({id:lead.id,name:lead.name,email:lead.emailNorm??"",
     url:window.location.origin+"/recruiter-invite/"+encodeURIComponent(payload.invite.token),reason:null,emailed:false});
   }catch(e){outcome.push({id:lead.id,name:lead.name,email:lead.emailNorm??"",
    url:null,reason:e instanceof Error?e.message:"Could not create link",emailed:false});}
  }
  if(!retryOnly)setReviewSnapshot(null);
  setResults(previous=>retryOnly?[
    ...previous.filter(item=>!target.some(lead=>lead.id===item.id)),
    ...outcome,
  ]:outcome);setBusy(false);onUpdated();
 }
 async function copy(value:string){
  try{await navigator.clipboard.writeText(value);setNotice("Copied. Invitation tokens are shown only in this session.");}
  catch{setNotice("Could not copy. Select the text and copy it manually.");}
 }
 const failed=results.filter(row=>!row.url&&!row.emailed);
 const retryableFailed=failed.filter(item=>rows.some(row=>row.id===item.id&&!bulkInviteDisposition(row)));
 const linkLines=results.filter(row=>row.url).map(row=>row.name+" ("+row.email+")\t"+row.url).join("\n");
 return <section className="rounded-lg border border-border bg-surface p-4" aria-label="Invite selected recruiters">
  <Button variant="secondary" type="button" 
   disabled={busy||rows.length===0} onClick={()=>{setReviewSnapshot(null);setNotice("");setOpen(value=>!value);}}>
   Invite selected recruiters ({rows.length})
  </Button>
  {open?<div className="mt-3 space-y-3">
   <p className="text-sm text-body">Review recipients before issuing new invites. Email sending requires the approved delivery configuration and is restricted to allowlisted addresses outside production.</p>
   <p className="text-xs text-muted-foreground">
    The configured email provider does not currently confirm delivery of recruiter invitations.
    Create one-time links only, then share them directly. This will not send any email. Retrying failed rows leaves previously created links unchanged.
   </p>
   <p className="text-sm">{eligible.length} eligible · {rows.length-eligible.length} left out</p>
   <p className="text-xs text-muted-foreground">{eligible.filter(row=>Boolean(row.inviteSentAt)).length} eligible recruiters have an earlier invite. Issuing a new link invalidates their previous link.</p>
   <ul className="max-h-40 space-y-1 overflow-auto text-sm">
    {rows.map(row=><li key={row.id}>{row.name} · {bulkInviteDisposition(row)??"Ready"}</li>)}
   </ul>
   {reviewSnapshot===eligibleSnapshot&&eligible.length>0?<div role="status" className="rounded-md border border-border bg-surface-secondary p-3 text-sm">
      Confirm issuing {eligible.length} new one-time invitation links. {eligible.filter(row=>Boolean(row.inviteSentAt)).length} previous link(s) will stop working.
      <button type="button" className="ml-3 underline" onClick={()=>{setReviewSnapshot(null);setNotice("");}}>Cancel</button>
    </div>:null}
   <Button type="button" disabled={busy||eligible.length===0||eligible.length>100}
    
    onClick={()=>void createLinks(eligible)}>{busy?"Working…":reviewSnapshot===eligibleSnapshot?"Confirm "+eligible.length+" new invite links":"Review "+eligible.length+" invite links"}</Button>
   {eligible.length===0&&rows.length>0?<p role="status" className="text-sm">No selected recruiters can receive an invite link. The reasons are shown above.</p>:null}
   {eligible.length>100?<p role="alert" className="text-sm">Select at most 100 eligible recruiters.</p>:null}
   {results.length>0?<div aria-live="polite" className="space-y-2">
    <p className="text-sm">{results.filter(item=>item.url).length} links · No invitation emails sent · {failed.length} failed</p>
    {linkLines?<><label className="block text-sm">Fresh links
      <Textarea readOnly value={linkLines} rows={5} className="mt-1 w-full"
       onFocus={event=>event.currentTarget.select()}/>
     </label><Button variant="secondary" type="button" 
      onClick={()=>void copy(linkLines)}>Copy invite links</Button></>:null}
    {failed.length?<><ul>{failed.map(item=><li key={item.id} className="text-sm">{item.name}: {item.reason}</li>)}</ul>
     {retryableFailed.length?<Button variant="secondary" type="button" disabled={busy} 
      onClick={()=>void createLinks(rows.filter(row=>retryableFailed.some(item=>item.id===row.id)),true)}>Retry eligible failures ({retryableFailed.length})</Button>:null}
     {retryableFailed.length!==failed.length?<p role="status" className="text-xs">Some failed contacts are no longer eligible. They will not be retried.</p>:null}</>:null}
    <Button variant="secondary" type="button" 
      onClick={()=>{setResults([]);setOpen(false);}}>Close results</Button>
   </div>:null}
   {notice?<p role="status" className="text-sm">{notice}</p>:null}
  </div>:null}
 </section>;
}
