"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import {useToast} from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { InlineNotice } from "@/components/ui/inline-notice";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-fetch";
import {beginDriveMutation,endDriveMutation} from "@/modules/placements/drive-mutation-client-lock";
type Drive = {id: string; title: string; status: string; companyName: string};
type Preview = {eligible: number; ignored: number; excluded: number; pendingLettersWithdrawn: number;
 recordedApplications?:number;recordedInterviews?:number;actionDescription?:string};
type Result = {updated: number; skipped: number;
  results: {jobId: string; status: "UPDATED" | "SKIPPED"; reason: string}[]};

export function SuperAdminBulkDriveActions({drives}: {drives: Drive[]}) {
  const router = useRouter();
  const {showToast}=useToast();
  const [action, setAction] = useState<"OPEN" | "CLOSE">("CLOSE");
  const [selected, setSelected] = useState<string[]>([]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmOpen,setConfirmOpen]=useState(false);
  const inFlightRef=useRef(false);
  const eligible = drives.filter(d => action === "CLOSE"
    ? d.status === "PUBLISHED" : d.status === "CLOSED");
  function toggle(id: string) {
    setSelected(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);
    setPreview(null); setResult(null);
  }
  async function send(confirm: boolean) {
    if (busy || inFlightRef.current || !selected.length || selected.length > 25) return;
    inFlightRef.current=true;
    setBusy(true); setError("");
    try {
      const payload = await apiFetch<Preview | Result>("/api/admin/placements/drives/bulk", {
        method: "POST", headers: {"content-type": "application/json"},
        body: JSON.stringify({action, jobIds: selected,
          ...(confirm ? {confirmed: true} : {confirmStage: "PREVIEW"})}),
      });
      if (confirm) {
        const response = payload as Result;
        setResult(response); setPreview(null); setConfirmOpen(false);
        setSelected(response.results.filter(r => r.status === "SKIPPED").map(r => r.jobId));
        if(response.updated>0)showToast({
          tone:"success",
          title:response.updated+" drive(s) "+(action==="OPEN"?"opened":"closed"),
          description:response.skipped>0?response.skipped+" failed. Retry only those drives.":undefined,
        });
        if(response.skipped>0)showToast({
          tone:"error",title:response.skipped+" drive(s) could not be updated",
          description:"Review the failed items and retry them without reapplying completed actions.",
        });
        router.refresh();
      } else {setPreview(payload as Preview); setResult(null);}
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update drives. Please try again.");
    } finally {inFlightRef.current=false;setBusy(false);}
  }
  return <section className="min-w-0 border-b border-border pb-[var(--lms-space-4)]"
    aria-label="Super Admin bulk drive actions">
    <details className="group min-w-0">
      <summary className="flex min-h-11 w-full cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] [&::-webkit-details-marker]:hidden">Bulk Open / Close <span aria-hidden="true" className="text-muted-foreground group-open:rotate-180">⌄</span></summary>
      <div className="min-w-0 space-y-[var(--lms-space-3)] pt-[var(--lms-space-2)]">
       <div className="flex min-w-0 flex-col items-stretch gap-[var(--lms-space-3)] sm:flex-row sm:flex-wrap sm:items-center">
      <label className="flex min-h-11 items-center gap-2 text-sm text-body">
        <Checkbox disabled={busy || !eligible.length}
          checked={eligible.length>0 && eligible.slice(0,25).every(d=>selected.includes(d.id))}
          onChange={e=>{setSelected(e.target.checked?eligible.slice(0,25).map(d=>d.id):[]);
            setPreview(null);setResult(null);}}/>
        Select up to 25 eligible drives ({eligible.length} available)
      </label>
      <label className="flex min-w-0 flex-col items-start gap-[6px] text-[13px]">Action
        <Select value={action} aria-label="Bulk action" disabled={busy} onChange={e=>{
          setAction(e.target.value as "OPEN" | "CLOSE");setSelected([]);
          setPreview(null);setResult(null);}}
          className="min-h-11 w-full min-w-0 md:min-h-9">
          <option value="CLOSE">Close selected</option>
          <option value="OPEN">Open closed drives</option>
        </Select>
      </label>
      <Button type="button" disabled={busy || !selected.length || selected.length>25}
        onClick={()=>void send(false)} className="min-h-11 w-full px-4 sm:w-auto md:min-h-9">
        Preview {selected.length} drive(s)
      </Button>
    </div>
    {eligible.length>3?<p id="bulk-drive-scroll-cue" className="text-xs text-muted-foreground">More drives below ↓ · Scroll to review the eligible drives.</p>:null}
    <div tabIndex={0} role="region" aria-label="Eligible drive list" aria-describedby={eligible.length>3?"bulk-drive-scroll-cue":undefined}
      className="grid max-h-56 min-w-0 gap-2 overflow-y-auto overscroll-contain border-y border-border py-2 sm:grid-cols-2 xl:grid-cols-3">
      {eligible.map(d=><div key={d.id} className="min-w-0 border-b border-border py-2">
        <label className="flex min-h-11 min-w-0 items-start gap-2 text-sm">
          <Checkbox disabled={busy || (!selected.includes(d.id) && selected.length>=25)} checked={selected.includes(d.id)}
            onChange={()=>toggle(d.id)}/>
          <span className="min-w-0 break-words"><strong>{d.title}</strong><span className="block break-words text-muted-foreground">
            {d.companyName} · {d.status}</span></span>
        </label>
        <div className="flex flex-wrap items-center gap-3 pl-6 text-xs">
          <Link href={"/admin/placements/jobs/"+encodeURIComponent(d.id)+"/settings"}
            className="min-h-9 py-2 font-semibold text-link underline">Edit drive</Link>
          <Link href={"/admin/placements/jobs/"+encodeURIComponent(d.id)+"/applications"}
            className="min-h-9 py-2 font-semibold text-link underline">View applications</Link>
          <Button type="button" size="sm" variant="link" disabled={busy}
            onClick={()=>{setSelected([d.id]);setPreview(null);setResult(null);}}>
            Select only this drive
          </Button>
        </div>
      </div>)}
    </div>
    <p className="text-xs text-muted-foreground">
      Opening applies to closed drives only; draft publication requires the workspace preflight.
      Closing prevents further applications and may withdraw issued offers.
      Learner notifications and historical application records follow the existing audited close workflow.
    </p>
    {preview?<div role="group" aria-label="Bulk action impact"
      className="min-w-0 space-y-3 border-y border-border py-3 text-sm">
      <p>{preview.eligible} eligible, {preview.ignored+preview.excluded} skipped.</p>
      <p>{preview.actionDescription??"The selected drives will be updated according to the placement policy."}</p>
      {action==="CLOSE"?<p>{preview.recordedApplications??0} historical applications and {preview.recordedInterviews??0} interview records are retained; learners can no longer apply. Notices follow the audited close workflow.</p>:null}
      <p>{action==="CLOSE"?
        `${preview.pendingLettersWithdrawn} issued offers may be withdrawn when these drives close.`:
        "Previously withdrawn offers will not be reissued."}</p>
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
      <Button type="button" disabled={busy || !preview.eligible} className="min-h-11 w-full px-4 sm:w-auto md:min-h-9" onClick={()=>setConfirmOpen(true)}>
        Confirm {action.toLowerCase()}
      </Button>
      <Button variant="secondary" type="button" disabled={busy} onClick={()=>setPreview(null)}
        className="min-h-11 w-full px-4 sm:w-auto md:min-h-9">Cancel</Button>
      </div>
    </div>:null}
    {result?<div role="status" className="space-y-2 text-sm">
      <p>{result.updated} updated, {result.skipped} failed. Retry will target only failed drives.</p>
      {result.results.filter(x=>x.status==="SKIPPED").map(x=>
        <p key={x.jobId}>{drives.find(d=>d.id===x.jobId)?.title??"Drive"}: {x.reason}</p>)}
      {result.skipped>0?<Button type="button" variant="link" onClick={()=>void send(false)}
        className="!min-h-11 !px-0 !text-primary-text">Preview failed drives for retry</Button>:null}
    </div>:null}
    {error?<div className="space-y-2" role="alert">
      <InlineNotice tone="error" message={error}/>
      <Button type="button" variant="link" disabled={busy||selected.length===0}
        onClick={()=>void send(false)}>Retry impact preview</Button>
    </div>:null}
      </div>
    </details>
    <ConfirmDialog open={confirmOpen&&preview!==null} pending={busy}
      onOpenChange={next=>{if(!next&&!busy)setConfirmOpen(false);}}
      title={"Confirm "+action.toLowerCase()+" for "+(preview?.eligible??0)+" drives?"}
      description={action==="CLOSE"?
       "Closing prevents new applications and may withdraw issued offers. Applicant history is retained; notices follow the audited close workflow.":
       "Opening applies to closed drives only; draft publication requires the workspace preflight."}
      confirmLabel={"Confirm "+action.toLowerCase()}
      confirmVariant={action==="CLOSE"?"danger":"primary"}
      onConfirm={()=>void send(true)}/>
  </section>;
}

/** An accessible direct row action: preview the one selected drive and guard
 * the same job's deadline, edit and archive changes. The server revalidates
 * status, college membership and downstream offers at commit time.
 */
export function SuperAdminDriveRowStatusAction({jobId,title,status}:{
 jobId:string;title:string;status:string;
}){
 const router=useRouter(),{showToast}=useToast();
 const [preview,setPreview]=useState<Preview|null>(null);
 const [error,setError]=useState("");
 const [busy,setBusy]=useState(false);
 const lock=useRef(false);
 const action=status==="PUBLISHED"?"CLOSE":status==="CLOSED"?"OPEN":null;
 async function inspect(){
  if(!action||lock.current)return;
  if(!beginDriveMutation(jobId)){
   setError("Another action is updating this drive. Retry after it finishes.");return;
  }
  lock.current=true;setBusy(true);setError("");
  try{
   const response=await apiFetch<Preview>("/api/admin/placements/drives/bulk",{
    method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({action,jobIds:[jobId],confirmStage:"PREVIEW"}),
   });
   if(response.eligible!==1){
    setError("This drive is no longer in the required status. Refresh and retry.");return;
   }
   setPreview(response);
  }catch(error){
   setError(error instanceof Error?error.message:"Could not preview this drive status. Nothing was changed.");
  }finally{lock.current=false;setBusy(false);endDriveMutation(jobId);}
 }
 async function submit(){
  if(!action||lock.current||!preview)return;
  if(!beginDriveMutation(jobId)){
   setError("Another action is updating this drive. Retry after it finishes.");return;
  }
  lock.current=true;setBusy(true);setError("");
  try{
   const response=await apiFetch<Result>("/api/admin/placements/drives/bulk",{
    method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({action,jobIds:[jobId],confirmed:true}),
   });
   setPreview(null);
   if(response.updated===1){
    showToast({tone:"success",title:"Job "+(action==="OPEN"?"opened":"closed")+" successfully"});
    router.refresh();
   }else{
    setError(response.results[0]?.reason??"Drive status changed. Refresh and retry.");
   }
  }catch(error){
   setPreview(null);
   setError(error instanceof Error?error.message:"Unable to update drive status. Refresh and retry.");
  }finally{lock.current=false;setBusy(false);endDriveMutation(jobId);}
 }
 if(!action)return null;
 return <div className="min-w-0 space-y-2">
  <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={()=>void inspect()}>
   {busy?"Checking…":action==="CLOSE"?"Close drive":"Open drive"}
  </Button>
  {error?<div role="alert" className="space-y-1 text-sm text-error">
   <p>{error}</p>
   <Button size="sm" variant="link" disabled={busy} onClick={()=>void inspect()}>Retry status preview</Button>
  </div>:null}
  <ConfirmDialog open={preview!==null} pending={busy} onOpenChange={next=>{
   if(!next&&!busy)setPreview(null);
  }} title={(action==="CLOSE"?"Close ":"Open ")+title+"?"}
   description={action==="CLOSE"?
    "Closing prevents further learner applications. Existing application and interview history remains retained. Issued offers may be withdrawn and affected learners notified according to the audited close workflow. This is not a delete.":
    "Opening restores the drive to its published state if the season and company are still active. Withdrawn offers are not reissued."}
   confirmLabel={action==="CLOSE"?"Close drive":"Open drive"}
   confirmVariant={action==="CLOSE"?"danger":"primary"}
   onConfirm={()=>void submit()}/>
 </div>;
}
