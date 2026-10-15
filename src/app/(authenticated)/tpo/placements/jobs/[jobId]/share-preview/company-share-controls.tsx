"use client";
import {useState} from "react";
import {companyShareEmptyMessage,shouldDisplayNewCompanyShare,type CompanyShareStatus} from "@/modules/placements/company-share/status-model";
import {afterCompanyShareRevocation} from "@/modules/placements/company-share/revoke-ui-model";
type LinkFact={id:string;expiresAt:string;revokedAt:string|null;audit:{views:number;exports:number}};
export function CompanyShareControls({jobId,ready,initialLinks,status}:{
 jobId:string;ready:boolean;initialLinks:LinkFact[];status:CompanyShareStatus;
}){
 const [links,setLinks]=useState(initialLinks);
 const [days,setDays]=useState(2);
 const [pending,setPending]=useState(false);
 const [error,setError]=useState("");
 const [newUrl,setNewUrl]=useState<string|null>(null);
 const root="/api/placements/tpo/jobs/"+encodeURIComponent(jobId)+"/company-shares";
 async function createLink(){
  setPending(true);setError("");setNewUrl(null);
  try{
   const res=await fetch(root,{
    method:"POST",credentials:"same-origin",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({expiresInDays:days}),
   });
   if(!res.ok)throw new Error("Cannot issue share link");
   const data=await res.json() as {shareId:string;token:string;expiresAt:string};
   if(shouldDisplayNewCompanyShare(status))setLinks(current=>[{id:data.shareId,expiresAt:data.expiresAt,revokedAt:null,audit:{views:0,exports:0}},...current]);
   setNewUrl(new URL("/company-share/"+encodeURIComponent(data.token),window.location.origin).href);
  }catch{setError("Link could not be created. Confirm access and try again.");}
  finally{setPending(false);}
 }
 async function revokeLink(id:string){
  if(!window.confirm("Revoke this company applicant link? Anyone using it will immediately lose access."))return;
  setPending(true);setError("");
  try{
   const res=await fetch(root+"/"+encodeURIComponent(id)+"/revoke",{
    method:"POST",credentials:"same-origin",
   });
   if(!res.ok)throw new Error("Cannot revoke");
   setLinks(current=>afterCompanyShareRevocation(current,id,status,new Date().toISOString()));
   setNewUrl(null);
  }catch{setError("Could not revoke link. Refresh before trying again.");}
  finally{setPending(false);}
 }
 return <section aria-label="Company applicant sharing"
   className="space-y-3 rounded-xl border border-border bg-surface p-5">
  <h2 className="text-lg font-semibold text-foreground">Share shortlisted applicants with a company</h2>
  <p className="text-sm text-body">Links disclose only the same three fields shown above,
   have a maximum seven-day lifetime, and may be revoked immediately. Resume downloads
   and private learner details are excluded.</p>
  {!ready?<p role="status" className="text-sm text-body">
   External sharing is unavailable until its audited database migration is registered.
  </p>:<>
   <div className="flex flex-wrap items-end gap-3">
    <label className="text-sm text-body">Expires in days
     <select value={days} onChange={event=>setDays(Number(event.target.value))}
      className="ml-2 rounded border border-border bg-surface px-2 py-2">
      {[1,2,3,4,5,6,7].map(day=><option key={day} value={day}>{day}</option>)}
     </select>
    </label>
    <button type="button" disabled={pending} onClick={createLink}
     className="min-h-10 rounded bg-primary px-4 font-semibold text-on-primary">
     Create expiring link
    </button>
   </div>
   {newUrl?<div className="rounded border border-border p-3">
    <p className="text-xs font-semibold text-body">Copy this URL now. The secret cannot be recovered later.</p>
    <input aria-label="One-time share URL" readOnly value={newUrl}
     className="mt-2 w-full rounded border border-border bg-surface p-2 text-xs"/>
    <button type="button" onClick={()=>void navigator.clipboard.writeText(newUrl)}
     className="mt-2 text-sm font-semibold text-primary-text underline">Copy URL</button>
   </div>:null}
   {links.length>0?<ul className="space-y-2">{links.map(link=><li key={link.id}
    className="flex flex-wrap items-center justify-between gap-2 border-t border-border py-2 text-sm">
    <span>Link {link.id.slice(0,8)} · Expiry {link.expiresAt.slice(0,10)} ·
     {link.revokedAt?" Revoked":" Not revoked (validity checked when opened)"}</span>
    <span className="text-xs text-muted-foreground">
     {link.audit.views} views · {link.audit.exports} CSV downloads
    </span>
    {!link.revokedAt?<button type="button" disabled={pending}
     onClick={()=>void revokeLink(link.id)}
     className="font-semibold text-primary-text underline">Revoke</button>:null}
   </li>)}</ul>:<p className="text-sm text-body">{companyShareEmptyMessage(status)}</p>}
  </>}
  {error?<p role="alert" className="text-sm text-body">{error}</p>:null}
 </section>;
}
