"use client";
import { Button } from "@/components/ui/button";
import {InlineNotice} from "@/components/ui/inline-notice";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {useToast} from "@/components/ui/toast";
import {BUG_STATUSES,type BugStatus} from "@/modules/bug-tracker/workflow";

type Row={publicId:string;version:number;status:string};
export function TrackerIssueBulkActions({rows}:{rows:readonly Row[]}){
  const router=useRouter();
  const {showToast}=useToast();
  const lock=useRef(false);
  const [selecting,setSelecting]=useState(false);
  const [selected,setSelected]=useState<string[]>([]);
  const [status,setStatus]=useState<BugStatus>("CHECKING");
  const [busy,setBusy]=useState(false);
  const [confirmOpen,setConfirmOpen]=useState(false);
  const [failed,setFailed]=useState<string[]>([]);
  const [success,setSuccess]=useState(0);
  const [notice,setNotice]=useState("");
  function toggle(id:string){setSelected(current=>current.includes(id)?
    current.filter(item=>item!==id):[...current,id]);setFailed([]);setSuccess(0);}
  async function apply(confirmed=false){
    if(lock.current||!selected.length)return;
    if(!confirmed){setConfirmOpen(true);return;}
    lock.current=true;setBusy(true);setFailed([]);setSuccess(0);setNotice("");
    const failures:string[]=[];let completed=0;
    const reasons:Record<string,string>={};
    try{
      // Each write still goes through the authorized version-checked single-issue
      // workflow. A failed row does not prevent later rows from being processed.
      // Three independent workers preserve partial successes and CAS guards.
      const remaining=[...selected];
      await Promise.all(Array.from({length:Math.min(3,remaining.length)},async()=>{
      while(remaining.length){
        const id=remaining.shift();
        if(!id)break;
        const row=rows.find(item=>item.publicId===id);
        if(!row){failures.push(id);reasons[id]="This issue is no longer on the current page.";continue;}
        if(row.status===status){completed++;continue;}
        try{
          await apiFetch("/api/tracker/issues/"+encodeURIComponent(id)+"/workflow",{
            method:"PATCH",headers:{"content-type":"application/json"},
            body:JSON.stringify({expectedVersion:row.version,status}),
          });
          completed++;
        }catch(error){
          failures.push(id);
          reasons[id]=error instanceof FriendlyFetchError?error.message:
            "Unable to update this issue.";
        }
      }
      }));
      setFailed(failures);setSuccess(completed);
      // A successful write must never be retried against its stale version.
      setSelected(failures);
      if(completed)router.refresh();
      if(failures.length){
        showToast({tone:"error",title:failures.length+" issue(s) could not be updated."});
        const first=failures[0];
        setNotice(failures.length+" could not be updated ("+failures.join(", ")+"): "+
          (reasons[first]??"Refresh issue details and retry."));
      }else{
        showToast({tone:"success",title:"Updated "+completed+" issue(s)."});
        setSelecting(false);
        setNotice("Updated "+completed+" issue(s).");
      }
    }finally{lock.current=false;setBusy(false);setConfirmOpen(false);}
  }
  return <section aria-label="Bulk issue status" className="min-w-0 space-y-[var(--lms-space-4)] border-b border-border pb-[var(--lms-space-4)]">
    <div className="flex min-w-0 flex-col items-stretch gap-[var(--lms-space-2)] md:flex-row md:items-center">
      <Button variant="secondary" type="button" disabled={busy} className="min-h-11 w-full md:min-h-9 md:w-auto" onClick={()=>{setSelecting(v=>!v);setSelected([]);setFailed([]);setNotice("");}}
       >
        {selecting?"Cancel selection":"Select issues"}
      </Button>
      {selecting?<span role="status" className="text-sm">{selected.length} selected</span>:null}
    </div>
    {selecting?<div className="min-w-0 space-y-[var(--lms-space-4)]">
      <label className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold md:min-h-9">
        <Checkbox disabled={busy||rows.length===0} aria-label="All on this page"
          checked={rows.length>0&&rows.every(row=>selected.includes(row.publicId))}
          indeterminate={rows.some(row=>selected.includes(row.publicId))&&!rows.every(row=>selected.includes(row.publicId))}
          onChange={event=>setSelected(event.target.checked?rows.map(row=>row.publicId):[])} />
        All on this page
      </label>
      <div role="group" aria-label="Issues on this page" className="grid min-w-0 max-h-64 grid-cols-1 gap-0 overflow-y-auto overscroll-contain border-y border-border md:grid-cols-2 md:gap-x-[var(--lms-space-4)]">
        {rows.map(row=><label key={row.publicId} tabIndex={busy?-1:0}
          onKeyDown={event=>{if(event.target===event.currentTarget&&(event.key==="Enter"||event.key===" ")){event.preventDefault();toggle(row.publicId);}}}
          className="flex min-h-11 min-w-0 items-center gap-[var(--lms-space-2)] border-b border-border/50 py-[var(--lms-space-2)] text-sm md:min-h-9">
          <Checkbox aria-label={"Select "+row.publicId} checked={selected.includes(row.publicId)} disabled={busy}
            onChange={()=>toggle(row.publicId)}/>
          {row.publicId} <span className="text-muted-foreground">({row.status.toLowerCase().replaceAll("_"," ")})</span>
        </label>)}
      </div>
      <div className="grid min-w-0 items-end gap-[var(--lms-space-3)] md:grid-cols-[minmax(0,220px)_auto]">
        <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Set status to…
          <Select value={status} onChange={event=>setStatus(event.target.value as BugStatus)}
            disabled={busy} className="min-h-11 md:min-h-9">
            {BUG_STATUSES.map(item=><option key={item} value={item}>{item.replaceAll("_"," ")}</option>)}
          </Select>
        </label>
        <Button variant="primary" type="button" disabled={busy||selected.length===0} loading={busy} className="min-h-11 w-full md:min-h-9 md:w-auto md:justify-self-start" onClick={()=>void apply()}
         >
          {busy?"Updating…":"Apply"}
        </Button>
      </div>
    </div>:null}
    {notice?<InlineNotice tone={failed.length?"error":"success"} message={notice}/>:null}
    {failed.length?<InlineNotice tone="error" message={"Failed IDs: "+failed.join(", ")+". "+success+" other issues were processed."}/>:null}
    <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen}
      title={"Apply to "+selected.length+" selected"}
      description={"Set status to… "+status.replaceAll("_"," ")}
      confirmLabel="Apply" confirmVariant="primary" pending={busy}
      onConfirm={()=>void apply(true)}>
      {notice?<InlineNotice tone={failed.length?"error":"info"} message={notice}/>:null}
    </ConfirmDialog>
  </section>;
}
