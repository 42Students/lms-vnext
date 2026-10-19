"use client";
import {useCallback,useState,useSyncExternalStore} from "react";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {parseCompanyShareExpiry} from "@/modules/placements/company-share/remembered-settings-model";
import {companyShareEmptyMessage,shouldDisplayNewCompanyShare,companyShareLifecycleStatus,companyShareLifecycleLabel,type CompanyShareStatus} from "@/modules/placements/company-share/status-model";
import {afterCompanyShareRevocation} from "@/modules/placements/company-share/revoke-ui-model";
import {prependCompanyShareLink} from "@/modules/placements/company-share/link-page-model";
import {companyShareIssueFailureMessage} from "@/modules/placements/company-share/issue-message-model";
import {copyCompanyShareUrl} from "@/modules/placements/company-share/copy-model";
import {Select} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
type LinkFact={id:string;expiresAt:string;revokedAt:string|null;audit:{views:number;exports:number}};
const SHARE_COLUMNS=[
 ["APPLICATION_ID","Applicant ID"],["NAME","Name"],["ROLL_NUMBER","Roll number"],
 ["BRANCH","Branch"],["UG_BAND","UG % band"],["TENTH","10th %"],
 ["TWELFTH","12th % / Diploma"],["EMAIL","Email"],["PHONE","Phone"],
 ["RESUME","Resume link"],["GITHUB","GitHub"],["PORTFOLIO","Portfolio"],["STAGE","Stage"],
] as const;

export function CompanyShareControls({jobId,preferenceKey,ready,initialLinks,status,linkPage}:{
 jobId:string;preferenceKey:string;ready:boolean;initialLinks:LinkFact[];status:CompanyShareStatus;linkPage:number;
}){
 const [links,setLinks]=useState(initialLinks);
 const [asOf] = useState(() => new Date());
 // Restore remembered non-sensitive company preference without losing
 // the newer 14/30/60/90-day share link options.
 const subscribe=useCallback((notify:()=>void)=>{
  const changed=(event:StorageEvent)=>{
   if(event.key===preferenceKey||event.key===null)notify();
  };
  window.addEventListener("storage",changed);
  window.addEventListener("company-share-preference",notify);
  return ()=>{
   window.removeEventListener("storage",changed);
   window.removeEventListener("company-share-preference",notify);
  };
 },[preferenceKey]);
 const snapshot=useCallback(()=>{
  try{
   const raw=window.localStorage.getItem(preferenceKey);
   if(raw!==null&&["14","30","60","90"].includes(raw))return Number(raw);
   return parseCompanyShareExpiry(raw);
  }catch{return 2;}
 },[preferenceKey]);
 const days=useSyncExternalStore(subscribe,snapshot,()=>2);
 function changeExpiry(value:string){
  const safe=["14","30","60","90"].includes(value)
   ?Number(value):parseCompanyShareExpiry(value);
  try{window.localStorage.setItem(preferenceKey,String(safe));}
  catch{/* Storage may be disabled; the action can still proceed. */}
  window.dispatchEvent(new Event("company-share-preference"));
 }
 const [selectedColumns,setSelectedColumns]=useState<string[]>(["APPLICATION_ID","NAME","EMAIL"]);
 const [shortlistBy,setShortlistBy]=useState("");
 const [newCode,setNewCode]=useState<string|null>(null);
 const [pending,setPending]=useState(false);
 const [revokeTarget,setRevokeTarget]=useState<string|null>(null);
 const [error,setError]=useState("");
 const [newUrl,setNewUrl]=useState<string|null>(null);
 const [copyState,setCopyState]=useState<"IDLE"|"COPIED"|"MANUAL_COPY">("IDLE");
 const root="/api/placements/tpo/jobs/"+encodeURIComponent(jobId)+"/company-shares";
 async function createLink(){
  setPending(true);setError("");setNewUrl(null);setNewCode(null);setCopyState("IDLE");
  try{
   const res=await fetch(root,{
    method:"POST",credentials:"same-origin",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({expiresInDays:days,selectedColumns,
      shortlistBy:shortlistBy?new Date(shortlistBy+"T23:59:00+05:30").toISOString():null}),
   });
   if(!res.ok){
    const code=(await res.json().catch(()=>({}))) as {error?:string};
    if(code.error==="ACTIVE_LINK_LIMIT")throw new Error("ACTIVE_LINK_LIMIT");
    throw new Error("CREATE_FAILED");
   }
   const data=await res.json() as {shareId:string;token:string;accessCode:string;expiresAt:string};
   if(linkPage===1&&shouldDisplayNewCompanyShare(status))setLinks(current=>prependCompanyShareLink(current,{id:data.shareId,expiresAt:data.expiresAt,revokedAt:null,audit:{views:0,exports:0}}));
   setNewUrl(new URL("/company-share/"+encodeURIComponent(data.token),window.location.origin).href);
   setNewCode(data.accessCode);
  }catch(error){setError(error instanceof Error&&error.message==="ACTIVE_LINK_LIMIT"?
   companyShareIssueFailureMessage("ACTIVE_LINK_LIMIT"):
   companyShareIssueFailureMessage(undefined));}
  finally{setPending(false);}
 }
 async function copyLink(){
  if(!newUrl)return;
  const state=await copyCompanyShareUrl(newUrl,value=>navigator.clipboard.writeText(value));
  setCopyState(state);
 }
 async function revokeLink(id:string){
  if(pending)return;
  setPending(true);setError("");
  try{
   const res=await fetch(root+"/"+encodeURIComponent(id)+"/revoke",{
    method:"POST",credentials:"same-origin",
   });
   if(!res.ok)throw new Error("Cannot revoke");
   setLinks(current=>afterCompanyShareRevocation(current,id,status,new Date().toISOString()));
   setNewUrl(null);setNewCode(null);
  }catch{setError("Could not revoke link. Refresh before trying again.");}
  finally{setPending(false);setRevokeTarget(null);}
 }
 return <section aria-label="Company applicant sharing"
   className="space-y-3 border-b border-border pb-6">
  <h2 className="text-lg font-semibold text-foreground">Share shortlisted applicants with a company</h2>
  <p className="text-sm text-body">At most 10 live links may exist per drive. Links disclose only the same three fields shown above,
   have a maximum 90-day lifetime, use a separate six-digit code, and may be revoked immediately. Private notes stay excluded.</p>
  {!ready?<p role="status" className="text-sm text-body">
   External sharing is unavailable until its audited database migration is registered.
  </p>:<>
   <div className="flex flex-wrap items-end gap-3">
    <label className="text-sm text-body">Expires in days
     <Select value={days} onChange={event=>changeExpiry(event.target.value)}
      className="ml-2">
      {[1,2,3,4,5,6,7,14,30,60,90].map(day=><option key={day} value={day}>{day}</option>)}
     </Select>
    </label>
    <label className="grid gap-1 text-sm">Please shortlist by
     <Input type="date" value={shortlistBy} onChange={event=>setShortlistBy(event.target.value)}
      />
    </label>
    <fieldset className="w-full rounded-[var(--lms-control-radius)] border border-border p-3">
     <legend className="px-1 text-sm font-semibold">Columns to share ({selectedColumns.length} of 11 maximum)</legend>
     <div className="grid gap-2 sm:grid-cols-3">{SHARE_COLUMNS.map(([key,label])=>
      <label key={key} className="inline-flex min-h-11 items-center gap-2 text-sm">
       <input type="checkbox" checked={selectedColumns.includes(key)}
        disabled={pending||(!selectedColumns.includes(key)&&selectedColumns.length>=11)}
        onChange={event=>setSelectedColumns(current=>event.target.checked?
         [...current,key]:current.filter(col=>col!==key))}/>
       {label}
      </label>)}</div>
    </fieldset>
    <Button type="button" disabled={pending||selectedColumns.length===0} onClick={createLink}
     >
     Create expiring link
    </Button>
   </div>
   {newCode?<p role="status" className="rounded-[var(--lms-control-radius)] border border-border p-3 text-sm">
    Share code: <strong className="font-mono text-lg">{newCode}</strong>.
    Give this six-digit code to the company separately. It cannot be recovered later.
   </p>:null}
   {newUrl?<div className="rounded-[var(--lms-control-radius)] border border-border p-3">
    <p className="text-xs font-semibold text-body">Copy this URL now. The secret cannot be recovered later.</p>
    <Input aria-label="One-time share URL" readOnly value={newUrl} onFocus={event=>event.currentTarget.select()}
     className="mt-2 w-full"/>
    <button type="button" onClick={()=>void copyLink()}
     className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--lms-teal-deep)] underline">Copy URL</button>
    {copyState==="COPIED"?<p role="status" className="mt-2 text-sm text-body">Copied to clipboard.</p>:null}
    {copyState==="MANUAL_COPY"?<p role="status" className="mt-2 text-sm text-body">Clipboard unavailable. Select the URL field above and copy it manually.</p>:null}
   </div>:null}
   {links.length>0?<ul className="space-y-2">{links.map(link=><li key={link.id}
    className="flex flex-wrap items-center justify-between gap-2 border-t border-border py-2 text-sm">
    <span>Link {link.id.slice(0,8)} · Expiry {link.expiresAt.slice(0,10)} ·
     {companyShareLifecycleLabel(companyShareLifecycleStatus(link,asOf))}</span>
    <span className="text-xs text-muted-foreground">
     {link.audit.views} views · {link.audit.exports} CSV downloads
    </span>
    {!link.revokedAt?<button type="button" disabled={pending}
     onClick={()=>setRevokeTarget(link.id)}
     className="inline-flex min-h-11 items-center font-semibold text-[var(--lms-teal-deep)] underline">Revoke</button>:null}
   </li>)}</ul>:<p className="text-sm text-body">{companyShareEmptyMessage(status)}</p>}
  </>}
  <ConfirmDialog open={revokeTarget!==null} onOpenChange={open=>{if(!open)setRevokeTarget(null);}} pending={pending}
    title="Revoke this company applicant link?" description="Anyone using it will immediately lose access."
    confirmLabel="Revoke" onConfirm={()=>{if(revokeTarget)void revokeLink(revokeTarget);}}/>
  {error?<p role="alert" className="text-sm text-body">{error}</p>:null}
 </section>;
}
