"use client";
import {useState,type MouseEvent} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Select} from "@/components/ui/select";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {driveDeadlineIstToIso} from "@/modules/placements/tpo-drive-deadline-ist";
type Row={id:string;title:string;updatedAt:string;applicationDeadline:string|null;extendable:boolean;reason:string};
export function TpoBulkDriveDeadline({totalMatching}:{totalMatching:number}){
 const router=useRouter(),[scope,setScope]=useState<"SELECTED"|"PAGE">("SELECTED");
 const [deadline,setDeadline]=useState(""),[reason,setReason]=useState("");
 const [rows,setRows]=useState<Row[]>([]),[busy,setBusy]=useState(false);
 const [confirm,setConfirm]=useState(false),[message,setMessage]=useState("");
 async function preview(event:MouseEvent<HTMLButtonElement>){
  if(busy)return;
  const form=event.currentTarget.form;
  if(!form)return;
  const ids=[...new Set([...form.querySelectorAll<HTMLInputElement>('input[name="ids"]')]
   .filter(item=>scope==="PAGE"||item.checked).map(item=>item.value))].slice(0,25);
  if(!ids.length){setMessage("Select at least one visible drive.");return;}
  if(reason.trim().length<10){setMessage("Explain the change in at least 10 characters.");return;}
  let iso:string;
  try{iso=driveDeadlineIstToIso(deadline);}
  catch{setMessage("Enter a valid IST deadline.");return;}
  if(!Number.isFinite(Date.parse(iso))||Date.parse(iso)<=Date.now()){
   setMessage("Choose a future application deadline.");return;
  }
  setBusy(true);setMessage("");setRows([]);
  const next:Row[]=[];
  for(const id of ids){
   try{
    const response=await fetch("/api/placements/tpo/jobs/"+encodeURIComponent(id)+"/extend-deadline",
     {cache:"no-store",credentials:"same-origin"});
    if(!response.ok)throw Error();
    const row=await response.json() as Omit<Row,"reason">;
    const tooEarly=!!row.applicationDeadline&&Date.parse(iso)<=Date.parse(row.applicationDeadline);
    next.push({...row,extendable:row.extendable&&!tooEarly,
     reason:!row.extendable?"Inactive season or unpublished":tooEarly?"Must exceed current deadline":"Ready"});
   }catch{next.push({id,title:"Drive",updatedAt:"",applicationDeadline:null,
    extendable:false,reason:"Could not verify this drive"});}
  }
  setRows(next);setConfirm(true);setBusy(false);
 }
 async function apply(){
  if(busy)return;
  setBusy(true);setConfirm(false);let saved=0,failed=0,skipped=0;
  const newDeadlineIso=driveDeadlineIstToIso(deadline);
  for(const row of rows){
   if(!row.extendable){skipped++;continue;}
   try{
    const response=await fetch("/api/placements/tpo/jobs/"+encodeURIComponent(row.id)+"/extend-deadline",{
     method:"POST",headers:{"content-type":"application/json"},credentials:"same-origin",
     body:JSON.stringify({confirmed:true,expectedUpdatedAt:row.updatedAt,
      newDeadlineIso,reason:reason.trim()}),
    });
    if(!response.ok)throw Error();
    saved++;
   }catch{failed++;}
  }
  setMessage(saved+" extended; "+skipped+" skipped; "+failed+" failed. Recheck failed drives individually.");
  setBusy(false);router.refresh();
 }
 return <section aria-label="Bulk deadline extension" className="min-w-0 space-y-3 border-t border-border pt-3">
  <p className="text-sm font-semibold">Set or extend deadlines for selected drives</p>
  <div className="grid min-w-0 gap-2 sm:grid-cols-3">
   <label className="grid gap-1 text-xs">Scope<Select value={scope} onChange={e=>setScope(e.target.value as "SELECTED"|"PAGE")}>
    <option value="SELECTED">Selected drives</option><option value="PAGE">All visible on this page</option>
   </Select></label>
   <label className="grid gap-1 text-xs">Deadline (IST)<Input type="datetime-local" value={deadline}
    onChange={e=>setDeadline(e.target.value)}/></label>
   <Button type="button" disabled={busy||!deadline||reason.trim().length<10}
    onClick={event=>void preview(event)}>{busy?"Checking…":"Preview deadline changes"}</Button>
  </div>
  <label className="grid gap-1 text-xs">Audit reason
   <Textarea maxLength={1000} rows={2} value={reason} onChange={e=>setReason(e.target.value)}/>
  </label>
  {totalMatching>25?<p className="text-xs text-muted-foreground">All-visible scope is limited to this page (maximum 25 drives), not all {totalMatching} matches.</p>:null}
  {message?<p role="status" className="text-sm text-body">{message}</p>:null}
  <ConfirmDialog open={confirm} onOpenChange={next=>{if(!busy)setConfirm(next);}}
   title="Extend application deadlines?"
   description={rows.filter(row=>row.extendable).length+" eligible of "+rows.length+
    " selected drives. Each version and deadline is rechecked before saving. "+
    rows.filter(row=>!row.extendable).map(row=>row.title+": "+row.reason).join("; ")}
   confirmLabel="Apply to eligible drives" pending={busy}
   confirmDisabled={!rows.some(row=>row.extendable)} onConfirm={()=>void apply()}/>
 </section>;
}
