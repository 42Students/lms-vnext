"use client";
import {useState} from "react";
import {bulkInviteDisposition,type TpoBulkInviteCandidate} from "@/modules/placements/tpo-bulk-invite-preview-model";
type Entry={id:string;name:string;email:string;url:string|null;reason:string|null;emailed:boolean};
export function RecruiterBulkInviteControls({collegeId,rows,onUpdated}:{
 collegeId:string;rows:readonly TpoBulkInviteCandidate[];onUpdated:()=>void;
}){
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false);
 const [results,setResults]=useState<Entry[]>([]);
 const [notice,setNotice]=useState("");
 const eligible=rows.filter(row=>!bulkInviteDisposition(row));
 async function createLinks(target:readonly TpoBulkInviteCandidate[]){
  if(busy||target.length===0||target.length>100)return;
  setBusy(true);setResults([]);setNotice("");
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
  setResults(outcome);setBusy(false);onUpdated();
 }
 async function copy(value:string){
  try{await navigator.clipboard.writeText(value);setNotice("Copied. Invitation tokens are shown only in this session.");}
  catch{setNotice("Could not copy. Select the text and copy it manually.");}
 }
 const failed=results.filter(row=>!row.url&&!row.emailed);
 const linkLines=results.filter(row=>row.url).map(row=>row.name+" ("+row.email+")\t"+row.url).join("\n");
 return <section className="rounded-lg border border-border bg-surface p-4" aria-label="Invite selected recruiters">
  <button type="button" className="min-h-10 rounded-md border border-border px-4 text-sm font-semibold"
   disabled={busy||rows.length===0} onClick={()=>setOpen(value=>!value)}>
   Invite selected recruiters ({rows.length})
  </button>
  {open?<div className="mt-3 space-y-3">
   <p className="text-sm text-body">Review recipients before issuing new invites. Email sending requires the approved delivery configuration and is restricted to allowlisted addresses outside production.</p>
   <p className="text-xs text-muted-foreground">
    The configured email provider does not currently confirm delivery of recruiter invitations.
    Create one-time links only, then share them directly. This will not send any email.
   </p>
   <p className="text-sm">{eligible.length} eligible · {rows.length-eligible.length} left out</p>
   <ul className="max-h-40 space-y-1 overflow-auto text-sm">
    {rows.map(row=><li key={row.id}>{row.name} · {bulkInviteDisposition(row)??"Ready"}</li>)}
   </ul>
   <button type="button" disabled={busy||eligible.length===0||eligible.length>100}
    className="min-h-10 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50"
    onClick={()=>void createLinks(eligible)}>{busy?"Working…":"Create "+eligible.length+" invite links"}</button>
   {eligible.length>100?<p role="alert" className="text-sm">Select at most 100 eligible recruiters.</p>:null}
   {results.length>0?<div aria-live="polite" className="space-y-2">
    <p className="text-sm">{results.filter(item=>item.url).length} links · No invitation emails sent · {failed.length} failed</p>
    {linkLines?<><label className="block text-sm">Fresh links
      <textarea readOnly value={linkLines} rows={5} className="mt-1 w-full rounded border border-border p-2 text-xs"
       onFocus={event=>event.currentTarget.select()}/>
     </label><button type="button" className="min-h-10 rounded border border-border px-3 text-sm"
      onClick={()=>void copy(linkLines)}>Copy invite links</button></>:null}
    {failed.length?<><ul>{failed.map(item=><li key={item.id} className="text-sm">{item.name}: {item.reason}</li>)}</ul>
     <button type="button" className="min-h-10 rounded border border-border px-3 text-sm"
      onClick={()=>void createLinks(rows.filter(row=>failed.some(item=>item.id===row.id)))}>Retry failed</button></>:null}
    <button type="button" className="min-h-10 rounded border border-border px-3 text-sm"
      onClick={()=>{setResults([]);setOpen(false);}}>Close results</button>
   </div>:null}
   {notice?<p role="status" className="text-sm">{notice}</p>:null}
  </div>:null}
 </section>;
}
