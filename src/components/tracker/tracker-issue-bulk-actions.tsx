"use client";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {BUG_STATUSES,type BugStatus} from "@/modules/bug-tracker/workflow";

type Row={publicId:string;version:number;status:string};
export function TrackerIssueBulkActions({rows}:{rows:readonly Row[]}){
  const router=useRouter();
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
    try{
      // Each write still goes through the authorized version-checked single-issue
      // workflow. A failed row does not prevent later rows from being processed.
      for(const id of selected){
        const row=rows.find(item=>item.publicId===id);
        if(!row){failures.push(id);continue;}
        if(row.status===status){completed++;continue;}
        try{
          await apiFetch("/api/tracker/issues/"+encodeURIComponent(id)+"/workflow",{
            method:"PATCH",headers:{"content-type":"application/json"},
            body:JSON.stringify({expectedVersion:row.version,status}),
          });
          completed++;
        }catch{failures.push(id);}
      }
      setFailed(failures);setSuccess(completed);
      if(completed)router.refresh();
      if(failures.length){
        setNotice("Could not update "+failures.length+" issue"+(failures.length===1?"":"s")+
          ". Review the failed IDs and retry after refreshing their details.");
      }else{
        setSelected([]);
        setNotice(completed+" issues updated.");
      }
    }finally{lock.current=false;setBusy(false);setConfirmOpen(false);}
  }
  return <section aria-label="Bulk issue status" className="space-y-3 border-b border-border pb-4">
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="secondary" type="button" disabled={busy} onClick={()=>{setSelecting(v=>!v);setSelected([]);setFailed([]);setNotice("");}}
       >
        {selecting?"Close selection":"Select issues"}
      </Button>
      {selecting?<span role="status" className="text-sm">{selected.length} selected</span>:null}
    </div>
    {selecting?<div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <Button variant="ghost" className="underline text-primary-text" type="button" disabled={busy} onClick={()=>setSelected(rows.map(x=>x.publicId))}
         >Select this page</Button>
        <Button variant="ghost" className="underline text-primary-text" type="button" disabled={busy} onClick={()=>setSelected([])}
         >Clear selection</Button>
      </div>
      <div role="group" aria-label="Issues on this page" className="grid gap-2 sm:grid-cols-2">
        {rows.map(row=><label key={row.publicId} className="flex min-h-9 items-center gap-2 text-sm">
          <Checkbox checked={selected.includes(row.publicId)} disabled={busy}
            onChange={()=>toggle(row.publicId)}/>
          {row.publicId} <span className="text-muted-foreground">({row.status.toLowerCase().replaceAll("_"," ")})</span>
        </label>)}
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-sm font-semibold">Set status to…
          <Select value={status} onChange={event=>setStatus(event.target.value as BugStatus)}
            disabled={busy}>
            {BUG_STATUSES.map(item=><option key={item} value={item}>{item.replaceAll("_"," ")}</option>)}
          </Select>
        </label>
        <Button variant="primary" type="button" disabled={busy||selected.length===0} onClick={()=>void apply()}
         >
          {busy?"Updating…":"Apply to "+selected.length+" selected"}
        </Button>
      </div>
    </div>:null}
    {notice?<p role={failed.length?"alert":"status"} className="text-sm text-body">{notice}</p>:null}
    {failed.length?<p role="alert" className="text-sm text-error">Failed IDs: {failed.join(", ")}. {success} other issues were processed.</p>:null}
    <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen}
      title={"Apply to "+selected.length+" selected"}
      description={"Set status to… "+status.replaceAll("_"," ")}
      confirmLabel={"Apply to "+selected.length+" selected"} confirmVariant="primary" pending={busy}
      onConfirm={()=>void apply(true)}>
      {notice?<p role="alert" className="text-sm text-body">{notice}</p>:null}
    </ConfirmDialog>
  </section>;
}
