"use client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";

type College={id:string;name:string;assigned:boolean;canAssign:boolean};
type BulkOperation="assign"|"remove";

export function SuperAdminTemplateCollegeBulk({templateId,colleges,published}:{
 templateId:string;colleges:readonly College[];published:boolean;
}){
 const router=useRouter();
 const [selected,setSelected]=useState<string[]>([]);
 const [operation,setOperation]=useState<BulkOperation|null>(null);
 const [pending,setPending]=useState(false);
 const inFlight=useRef(false);
 const [notice,setNotice]=useState("");
 const allowed=colleges.filter(row=>row.canAssign);
 const selectedItems=allowed.filter(row=>selected.includes(row.id));
 const actionable=selectedItems.filter(row=>operation==="assign"?!row.assigned:row.assigned);
 const targets=operation==="assign"?selectedItems.filter(row=>!row.assigned):selectedItems.filter(row=>row.assigned);

 async function apply(){
  if(inFlight.current||!operation||!targets.length)return;
  const currentOperation=operation;
  inFlight.current=true;setPending(true);setNotice("");
  const failed:string[]=[];
  let successful=0;
  for(const college of targets){
   try{
    await apiFetch("/api/projects/templates/"+encodeURIComponent(templateId)+"/assignments",{
     method:currentOperation==="assign"?"POST":"DELETE",
     headers:{"Content-Type":"application/json"},
     body:JSON.stringify({collegeId:college.id}),
    });
    successful++;
   }catch{failed.push(college.id);}
  }
  setOperation(null);
  setSelected(failed);
  setNotice(failed.length?
   successful+" succeeded; "+failed.length+" college assignment(s) failed. Failed colleges remain selected for retry.":
   currentOperation==="assign"?"Selected colleges assigned":"Selected colleges removed");
  inFlight.current=false;setPending(false);router.refresh();
 }
 return <section aria-label="Template college bulk assignment" className="space-y-3 border-b border-border pb-5">
  <h2 className="text-base font-semibold text-foreground">College availability</h2>
  <p className="text-xs text-muted-foreground">Select colleges on this page to update availability; existing workspaces remain unchanged.</p>
  <div className="flex flex-wrap gap-3 text-sm">
   <Button type="button" variant="secondary" disabled={pending||!allowed.length}
    onClick={()=>setSelected(allowed.map(row=>row.id))}
    >Select all on page</Button>
   <Button type="button" variant="secondary" disabled={pending||!selected.length} onClick={()=>setSelected([])}
    >Clear selection</Button>
   <span className="self-center">{selectedItems.length} selected</span>
  </div>
  <ul className="grid min-w-0 gap-x-4 md:grid-cols-2">
   {colleges.map(college=><li key={college.id}>
    <label className="flex min-h-11 items-center gap-2 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 py-2 text-sm text-body transition-colors hover:border-primary hover:bg-primary-subtle focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary min-[768px]:min-h-9">
     <Checkbox checked={selected.includes(college.id)} disabled={pending||!college.canAssign}
      onChange={e=>setSelected(current=>e.target.checked?[...current,college.id]:current.filter(id=>id!==college.id))}/>
     <span className="min-w-0 flex-1 break-words">{college.name}</span>
     <span className="text-xs text-muted-foreground">{college.assigned?"Assigned":"Not assigned"}</span>
    </label>
   </li>)}
  </ul>
  <div className="flex flex-wrap gap-2">
   <Button type="button" variant="primary" disabled={pending||!published||!selectedItems.some(row=>!row.assigned)}
    onClick={()=>setOperation("assign")} >Assign selected</Button>
   <Button type="button" variant="secondary" disabled={pending||!selectedItems.some(row=>row.assigned)}
    onClick={()=>setOperation("remove")} >Remove selected</Button>
  </div>
  {notice?<p role="status" className="text-sm text-body">{notice}</p>:null}
  <ConfirmDialog open={operation!==null} onOpenChange={open=>{if(!open)setOperation(null)}}
   title={operation==="remove"?"Remove this template from "+actionable.length+" selected colleges?":"Assign template to "+actionable.length+" selected colleges?"}
   description="Existing workspaces remain unchanged."
   confirmLabel={operation==="remove"?"Remove selected":"Assign selected"}
   confirmVariant={operation==="remove"?"danger":"primary"} pending={pending}
   onConfirm={()=>{void apply();}}/>
 </section>;
}
