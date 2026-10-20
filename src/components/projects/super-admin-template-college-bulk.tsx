"use client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/ui/status-badge";
import { Banner } from "@/components/ui/banner";
import { EmptyState } from "@/components/ui/empty-state";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Disclosure} from "@/components/ui/disclosure";

type College={id:string;name:string;assigned:boolean;canAssign:boolean};
type BulkOperation="assign"|"remove";

export function SuperAdminTemplateCollegeBulk({templateId,colleges,published}:{
 templateId:string;colleges:readonly College[];published:boolean;
}){
 const router=useRouter();
 const [selected,setSelected]=useState<string[]>([]);
 const [operation,setOperation]=useState<BulkOperation|null>(null);
 const [pending,setPending]=useState(false);
 const [progress,setProgress]=useState<{done:number;total:number}|null>(null);
 const inFlight=useRef(false);
 const [notice,setNotice]=useState("");
 const [noticeTone,setNoticeTone]=useState<"success"|"warning">("success");
 const allowed=colleges.filter(row=>row.canAssign);
 const selectedItems=allowed.filter(row=>selected.includes(row.id));
 const actionable=selectedItems.filter(row=>operation==="assign"?!row.assigned:row.assigned);
 const targets=operation==="assign"?selectedItems.filter(row=>!row.assigned):selectedItems.filter(row=>row.assigned);

 async function apply(){
  if(inFlight.current||!operation||!targets.length)return;
  const currentOperation=operation;
  inFlight.current=true;setPending(true);setNotice("");
  setProgress({done:0,total:targets.length});
  const failed:string[]=[];
  let successful=0;
  for(const [index,college] of targets.entries()){
   try{
    await apiFetch("/api/projects/templates/"+encodeURIComponent(templateId)+"/assignments",{
     method:currentOperation==="assign"?"POST":"DELETE",
     headers:{"Content-Type":"application/json"},
     body:JSON.stringify({collegeId:college.id}),
    });
    successful++;
   }catch{failed.push(college.id);}
   setProgress({done:index+1,total:targets.length});
  }
  setOperation(null);
  setSelected(failed);
  setNoticeTone(failed.length?"warning":"success");
  setNotice(failed.length?
   successful+" succeeded; "+failed.length+" college assignment(s) failed. Failed colleges remain selected for retry.":
   currentOperation==="assign"?"Selected colleges assigned":"Selected colleges removed");
  inFlight.current=false;setPending(false);setProgress(null);router.refresh();
 }
 return (
  <Disclosure
   title="College availability"
   ariaLabel="Template college bulk assignment"
   className="min-w-0 border-b border-border pb-[var(--lms-space-4)]"
   contentClassName="min-w-0 space-y-[var(--lms-space-4)] pt-[var(--lms-space-3)]"
  >
   <p className="m-0 max-w-prose text-[13px] leading-5 text-muted-foreground">
    Select colleges on this page to update availability; existing workspaces remain unchanged.
   </p>
   {!published ? (
    <Banner tone="info">Publish this template before assigning it to colleges.</Banner>
   ) : null}
   {colleges.length===0 ? (
    <EmptyState
     title="No colleges available"
     description="There are no college assignments to manage on this page."
    />
   ) : (
    <>
     <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <span role="status" aria-live="polite" className="text-[13px] font-semibold leading-5 text-body">
       {selectedItems.length} selected
      </span>
      <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
       <Button type="button" variant="ghost" size="sm"
        className="min-h-11 w-full md:min-h-9 sm:w-auto"
        disabled={pending||!allowed.length||selectedItems.length===allowed.length}
        onClick={()=>setSelected(allowed.map(row=>row.id))}>
        Select all on page
       </Button>
       <Button type="button" variant="ghost" size="sm"
        className="min-h-11 w-full md:min-h-9 sm:w-auto"
        disabled={pending||!selected.length}
        onClick={()=>setSelected([])}>
        Clear selection
       </Button>
      </div>
     </div>
     <ul className="grid min-w-0 grid-cols-1 gap-x-[var(--lms-space-4)] lg:grid-cols-2">
      {colleges.map(college=>(
       <li key={college.id} className="min-w-0">
        <label className={"flex min-h-11 min-w-0 items-start gap-[var(--lms-space-3)] border-b border-border px-2 py-[var(--lms-space-3)] text-sm leading-5 text-body transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary md:min-h-9 "+(college.canAssign?"cursor-pointer hover:bg-primary-subtle":"cursor-not-allowed")}>
         <Checkbox
          checked={selected.includes(college.id)}
          disabled={pending||!college.canAssign}
          className="mt-0.5"
          onChange={event=>setSelected(current=>
           event.target.checked?(current.includes(college.id)?current:[...current,college.id]):current.filter(id=>id!==college.id)
          )}
         />
         <span className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <span className="min-w-0 flex-1 break-words [overflow-wrap:anywhere]">
           {college.name}
          </span>
          <StatusBadge tone={college.assigned?"success":"neutral"} className="self-start sm:shrink-0">
           {college.assigned?"Assigned":"Not assigned"}
          </StatusBadge>
         </span>
        </label>
       </li>
      ))}
     </ul>
     <div className="flex min-w-0 flex-col gap-2 border-t border-border pt-[var(--lms-space-4)] sm:flex-row sm:items-center">
      <Button type="button" variant="primary"
       className="w-full sm:w-auto"
       loading={pending&&operation==="assign"}
       disabled={pending||!published||!selectedItems.some(row=>!row.assigned)}
       onClick={()=>setOperation("assign")}>
       Assign selected
      </Button>
      <Button type="button" variant="secondary"
       className="w-full sm:w-auto"
       loading={pending&&operation==="remove"}
       disabled={pending||!selectedItems.some(row=>row.assigned)}
       onClick={()=>setOperation("remove")}>
       Remove selected
      </Button>
     </div>
    </>
   )}
   {pending&&progress ? (
    <p role="status" aria-live="polite" className="text-xs leading-5 text-muted-foreground">
     Updating {progress.done} of {progress.total} college assignments…
    </p>
   ) : null}
   {notice ? <Banner tone={noticeTone}>{notice}</Banner> : null}
   <ConfirmDialog
    open={operation!==null}
    onOpenChange={open=>{if(!open&&!pending)setOperation(null);}}
    title={operation==="remove"
     ?"Remove this template from "+actionable.length+" selected colleges?"
     :"Assign template to "+actionable.length+" selected colleges?"}
    description="Existing workspaces remain unchanged."
    confirmLabel={operation==="remove"?"Remove selected":"Assign selected"}
    confirmVariant={operation==="remove"?"danger":"primary"}
    confirmDisabled={!targets.length}
    pending={pending}
    onConfirm={()=>{void apply();}}
   >
    <div className="min-w-0 space-y-2 text-sm leading-5 text-body">
     <p className="m-0 font-semibold">
      {targets.length} {targets.length===1?"college":"colleges"} will be updated.
     </p>
     <ul className="min-w-0 list-disc space-y-1 pl-5">
      {targets.slice(0,5).map(college=>(
       <li key={college.id} className="min-w-0 break-words [overflow-wrap:anywhere]">
        {college.name}
       </li>
      ))}
     </ul>
     {targets.length>5 ? (
      <p className="m-0 text-xs text-muted-foreground">
       And {targets.length-5} more.
      </p>
     ) : null}
    </div>
   </ConfirmDialog>
  </Disclosure>
 );
}
