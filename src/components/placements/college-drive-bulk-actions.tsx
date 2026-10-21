"use client";
import {useState} from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {useRouter} from "next/navigation";
type Drive={id:string;title:string;status:string;companyName:string};
type Preview={eligible:number;ignored:number;excluded:number;pendingLettersWithdrawn:number};
type Result={updated:number;skipped:number;results:{jobId:string;status:string;reason:string}[]};
export function CollegeDriveBulkActions({drives}:{drives:Drive[]}){
 const router=useRouter();
 const [selected,setSelected]=useState<string[]>([]);
 const [action,setAction]=useState<"OPEN"|"CLOSE">("CLOSE");
 const [preview,setPreview]=useState<Preview|null>(null);
 const [result,setResult]=useState<Result|null>(null);
 const [error,setError]=useState("");
 const [busy,setBusy]=useState(false);
 const eligible=drives.filter(row=>action==="CLOSE"?row.status==="PUBLISHED":row.status==="CLOSED");
 const eligibleIds=new Set(eligible.map(row=>row.id));
 const whyDisabled=(row:Drive)=>row.status==="DRAFT"
  ?"Draft drives must be published before bulk actions":action==="CLOSE"
  ?"Only published drives can be closed":"Only closed drives can be reopened";
 function toggle(id:string){setSelected(ids=>ids.includes(id)?ids.filter(x=>x!==id):[...ids,id]);setPreview(null);setResult(null);}
 async function send(stage:"PREVIEW"|"CONFIRM"){
  if(busy||selected.length===0)return;
  setBusy(true);setError("");
  try{
   const response=await fetch("/api/placements/college/drives/bulk",{
    method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({confirmStage:stage==="PREVIEW"?"PREVIEW":undefined,
      confirmed:stage==="CONFIRM"?true:undefined,action,jobIds:selected}),
   });
   const body=await response.json().catch(()=>null);
   if(!response.ok)throw Error(body?.error??"Bulk drive operation failed");
   if(stage==="PREVIEW"){setPreview(body as Preview);setResult(null);}
   else{setResult(body as Result);setPreview(null);
    setSelected((body as Result).results.filter(row=>row.status==="SKIPPED").map(row=>row.jobId));
    router.refresh();}
  }catch(e){setError(e instanceof Error?e.message:"Bulk drive operation failed");}
  finally{setBusy(false);}
 }
 const canProcess=selected.length>0&&selected.length<=25&&!busy;
 return <section className="space-y-3 border-t border-border pt-4" aria-label="Bulk drive actions">
  <div className="flex min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
   <h2 className="sr-only">Bulk drives</h2>
   <label className="flex min-h-11 items-center gap-[6px] text-sm">
    <Checkbox disabled={!eligible.length||busy}
     checked={eligible.length>0&&eligible.every(row=>selected.includes(row.id))}
     onChange={e=>{setSelected(e.target.checked?eligible.map(row=>row.id).slice(0,25):[]);
      setPreview(null);setResult(null);}}/>
    Select all eligible on this page ({eligible.length})
   </label>
   <span role="status" className="text-sm">{selected.length} selected</span>
   <Select aria-label="Drive bulk action" value={action} onChange={e=>{setAction(e.target.value as "OPEN"|"CLOSE");setSelected([]);setPreview(null);setResult(null);setError("");}}
    className="w-full sm:w-auto">
    <option value="CLOSE">Close selected</option><option value="OPEN">Open closed drives</option>
   </Select>
   <Button variant="primary" type="button" disabled={!canProcess} className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={()=>void send("PREVIEW")}>Preview change</Button>
  </div>
  {selected.length>0?<div role="status" className="flex flex-wrap items-center gap-2 border border-[var(--lms-primary)] bg-[var(--lms-primary-subtle)] px-3 py-2 text-sm text-[var(--lms-primary-text)]">
   <strong>{selected.length} selected on this page</strong>
   <span>Preview impact before changing drives</span>
   <Button variant="secondary" size="sm" type="button"
     onClick={()=>{setSelected([]);setPreview(null);setResult(null);}}>Clear selection</Button>
  </div>:null}
  <div className="grid max-h-52 min-w-0 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
   {drives.map(row=><label key={row.id} title={!eligibleIds.has(row.id)?whyDisabled(row):undefined} className="flex min-h-11 min-w-0 items-center gap-[6px] rounded-[var(--lms-control-radius)] border border-border p-2 text-xs">
     <Checkbox checked={selected.includes(row.id)}
      disabled={busy||!eligibleIds.has(row.id)||(!selected.includes(row.id)&&selected.length>=25)}
      aria-label={"Select "+row.title+" ("+row.companyName+")"}
      aria-describedby={!eligibleIds.has(row.id)?"drive-bulk-disabled-"+row.id:undefined}
      onChange={()=>toggle(row.id)}/>
     <span className="min-w-0 break-words"><strong>{row.title}</strong><span className="block text-muted-foreground">
      {row.companyName} · {row.status}</span>
      {!eligibleIds.has(row.id)?<span id={"drive-bulk-disabled-"+row.id}
       className="block text-muted-foreground">{whyDisabled(row)}</span>:null}</span>
    </label>)}
  </div>
  <p className="text-xs text-muted-foreground">Select up to 25 eligible drives on the current page. For more, change pages and repeat. Open is available for closed drives; drafts must pass publish preflight in the drive workspace. Closing stops scheduled rounds and withdraws still-issued offers. It does not archive or delete a drive; archive requires a separate impact preview.</p>
  {preview?<div className="space-y-3 rounded border border-border p-4 text-sm" role="group" aria-label="Bulk action impact">
   <p className="font-semibold">Review impact: {preview.eligible} eligible, {preview.ignored+preview.excluded} skipped.</p>
   {action==="CLOSE"?<p>{preview.pendingLettersWithdrawn} issued offers will be withdrawn across these drives. Closing removes these drives from live learner applications without deleting existing application history.</p>:
    <p>Previously withdrawn offers will not be reissued when a drive is reopened.</p>}
   <p>Confirm {action.toLowerCase()} for these {preview.eligible} eligible drives?</p>
   <Button variant="primary" type="button" disabled={busy||!preview.eligible} className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={()=>void send("CONFIRM")}>
     {busy?"Processing…":"Confirm "+action.toLowerCase()}</Button>
  </div>:null}
  {result?<div role="status" className="space-y-2 text-sm">
   <p>{result.updated===1&&result.skipped===0
     ? action==="OPEN"?"Job opened successfully":"Job closed successfully"
     : result.updated+" drive(s) "+(action==="OPEN"?"opened":"closed")+"; "+result.skipped+" skipped or failed."}</p>
   {result.results.filter(row=>row.status==="SKIPPED").map(row=><p key={row.jobId} className="text-warning-text">
    {drives.find(d=>d.id===row.jobId)?.title??row.jobId}: {row.reason}</p>)}
   {result.skipped>0?<Button variant="ghost" type="button" onClick={()=>void send("PREVIEW")} className="underline">
    Retry failed</Button>:null}
  </div>:null}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
 </section>;
}
