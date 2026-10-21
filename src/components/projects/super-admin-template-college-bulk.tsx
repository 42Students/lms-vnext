"use client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/ui/status-badge";
import { Banner } from "@/components/ui/banner";
import { EmptyState } from "@/components/ui/empty-state";
import {useEffect,useRef,useState} from "react";
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
 const [savedSelection,setSavedSelection]=useState<College[]>([]);
 const [selectionLoaded,setSelectionLoaded]=useState(false);
 const selectionKey="template-college-selection:"+templateId;
 useEffect(()=>{
  try{
   const raw=sessionStorage.getItem(selectionKey);
   const stored=raw?JSON.parse(raw) as unknown:null;
   if(Array.isArray(stored)){
    const valid=stored.filter((row):row is College=>
     row!==null&&typeof row==="object"&&typeof row.id==="string"&&
     typeof row.name==="string"&&typeof row.assigned==="boolean"&&
     row.canAssign===true&&/^[0-9a-f-]{36}$/i.test(row.id)).slice(0,500);
    setSavedSelection(valid);
    setSelected(valid.map(row=>row.id));
   }
  }catch{/* Corrupt selection must not override server authorization. */}
  setSelectionLoaded(true);
 },[selectionKey]);
 useEffect(()=>{
  if(!selectionLoaded)return;
  try{sessionStorage.setItem(selectionKey,JSON.stringify(
   savedSelection.filter(row=>selected.includes(row.id))
  ));}catch{/* optional */}
 },[selectionKey,selectionLoaded,selected,savedSelection]);
 const [operation,setOperation]=useState<BulkOperation|null>(null);
 const [pending,setPending]=useState(false);
 const [progress,setProgress]=useState<{done:number;total:number}|null>(null);
 const inFlight=useRef(false);
 const [notice,setNotice]=useState("");
 const [noticeTone,setNoticeTone]=useState<"success"|"warning">("success");
 const storageKey="project-template-bulk:"+templateId;
 useEffect(()=>{
  try{
   const stored=sessionStorage.getItem(storageKey);
   const parsed=stored?JSON.parse(stored):null;
   if(Array.isArray(parsed))setSelected(parsed.filter((id):id is string=>
     typeof id==="string"&&/^[a-f0-9-]{36}$/i.test(id)).slice(0,500));
  }catch{setSelected([]);}
 },[storageKey]);
 useEffect(()=>{
  try{sessionStorage.setItem(storageKey,JSON.stringify(selected));}catch{
   // A blocked storage API affects convenience only; server CAS still applies.
  }
 },[selected,storageKey]);
 const allowed=colleges.filter(row=>row.canAssign);
 const selectedItems=allowed.filter(row=>selected.includes(row.id));
 const actionable=selected.filter(id=>{
  const row=colleges.find(item=>item.id===id);
  return !row||operation==="assign"?!row?.assigned:row?.assigned;
 });
 const targets=selected.map(id=>colleges.find(row=>row.id===id)??{
   id,name:"Selected college "+id.slice(0,8),assigned:false,canAssign:true,
 }).filter(row=>operation==="assign"?!row.assigned:row.assigned||!colleges.some(college=>college.id===row.id));


 async function apply(){
  if(inFlight.current||!operation||!selected.length)return;
  const currentOperation=operation;
  inFlight.current=true;setPending(true);setNotice("");
  setProgress({done:0,total:selected.length});
  try{
   const path="/api/projects/templates/"+encodeURIComponent(templateId)+"/assignments";
   // Fresh read + single CAS transaction: never loop through partial writes.
   const baseline=await apiFetch<{collegeIds:string[]}>(path,{
     method:"GET",cache:"no-store",
   });
   const current=new Set(baseline.collegeIds);
   const allowedSelection=new Set(selected);
   const desired=currentOperation==="assign"?
     [...new Set([...current,...allowedSelection])]:
     [...current].filter(id=>!allowedSelection.has(id));
   const changed=desired.length!==current.size||
     desired.some(id=>!current.has(id));
   if(!changed){
    setSelected([]);setNoticeTone("success");
    setNotice("No college assignments needed changes.");
    setOperation(null);return;
   }
   const result=await apiFetch<{addedCount:number;removedCount:number}>(path,{
    method:"PUT",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
     collegeIds:desired.sort(),
     expectedCollegeIds:[...current].sort(),
    }),
   });
   setProgress({done:selected.length,total:selected.length});
   setNoticeTone("success");setSelected([]);
   setNotice(currentOperation==="assign"?"Selected colleges assigned":
     "Selected college assignments removed");
   setOperation(null);
   router.refresh();
   void result;
  }catch(caught){
   setNoticeTone("warning");
   setNotice((caught instanceof Error?caught.message:"College assignments could not be updated.")+
     " No partial changes were saved by this request. Refresh assignments and retry.");
   setOperation(null);
  }finally{
   inFlight.current=false;setPending(false);setProgress(null);
  }
 }

 return (
  <Disclosure
   title="College availability"
   ariaLabel="Template college bulk assignment"
   className="min-w-0 border-b border-border pb-[var(--lms-space-4)]"
   contentClassName="min-w-0 space-y-[var(--lms-space-4)] pt-[var(--lms-space-3)]"
  >
   <p className="m-0 max-w-prose text-[13px] leading-5 text-muted-foreground">
    Select colleges across pages to update availability. The full assignment set
    is compared and saved atomically; existing workspaces remain unchanged.
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
      <span role="status" aria-live="polite" aria-atomic="true" className="text-[13px] font-semibold leading-5 text-body">
       {selected.length} selected across pages
      </span>
      <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row">
       <Button type="button" variant="ghost" size="sm"
        className="min-h-11 w-full sm:w-auto md:min-h-9"
        disabled={pending||!allowed.length||allowed.every(row=>selected.includes(row.id))}
        onClick={()=>setSelected(current=>[...new Set([...current,...allowed.map(row=>row.id)])].slice(0,500))}>
        Select all on page
       </Button>
       <Button type="button" variant="ghost" size="sm"
        className="min-h-11 w-full sm:w-auto md:min-h-9"
        disabled={pending||!selected.length}
        onClick={()=>{setSelected([]);setSavedSelection([]);}}>
        Clear selection
       </Button>
      </div>
     </div>
     <ul className="grid min-w-0 grid-cols-1 gap-x-[var(--lms-space-4)] lg:grid-cols-2">
      {colleges.map(college=>(
       <li key={college.id} className="min-w-0">
        <label className={"flex min-h-11 min-w-0 items-start gap-[var(--lms-space-3)] border-b border-border px-2 py-[var(--lms-space-3)] text-sm leading-5 text-body transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary md:min-h-9 "+(college.canAssign?"cursor-pointer hover:bg-primary-subtle":"cursor-not-allowed opacity-60")} aria-disabled={!college.canAssign}>
         <Checkbox
          checked={selected.includes(college.id)}
          disabled={pending||!college.canAssign}
          className="mt-0.5"
          onChange={event=>{
           setSelected(current=>event.target.checked?
            (current.includes(college.id)?current:[...current,college.id]):
            current.filter(id=>id!==college.id));
           setSavedSelection(current=>event.target.checked?
            [...current.filter(row=>row.id!==college.id),college]:
            current.filter(row=>row.id!==college.id));
          }}
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
       disabled={pending||!published||!selected.length}
       onClick={()=>setOperation("assign")}>
       Assign selected
      </Button>
      <Button type="button" variant="secondary"
       className="w-full sm:w-auto"
       loading={pending&&operation==="remove"}
       disabled={pending||!selected.length}
       onClick={()=>setOperation("remove")}>
       Remove selected
      </Button>
     </div>
    </>
   )}
   {pending&&progress ? (
    <p role="status" aria-live="polite" className="text-xs text-muted-foreground leading-[20px]">
     Comparing and saving {progress.total} selected college assignments atomically…
    </p>
   ) : null}
   {notice ? <Banner tone={noticeTone}>{notice}</Banner> : null}
   <ConfirmDialog
    open={operation!==null}
    onOpenChange={open=>{if(!open&&!pending)setOperation(null);}}
    title={operation==="remove"
     ?"Remove this template from "+selected.length+" selected colleges?"
     :"Assign template to "+selected.length+" selected colleges?"}
    description="Existing workspaces remain unchanged."
    confirmLabel={operation==="remove"?"Remove selected":"Assign selected"}
    confirmVariant={operation==="remove"?"danger":"primary"}
    confirmDisabled={!selected.length}
    pending={pending}
    onConfirm={()=>{void apply();}}
   >
    <div className="min-w-0 space-y-2 text-sm leading-5 text-body">
     <p className="m-0 font-semibold">
      {selected.length} selected {selected.length===1?"college":"colleges"} will be compared
      against the latest assigned set before saving.
     </p>
     <ul className="min-w-0 list-disc space-y-1 pl-5">
      {targets.slice(0,5).map(college=>(
       <li key={college.id} className="min-w-0 break-words [overflow-wrap:anywhere]">
        {college.name}
       </li>
      ))}
     </ul>
     {targets.length>5 ? (
      <p className="m-0 text-xs text-muted-foreground leading-[20px]">
       And {selected.length-5} more selected.
      </p>
     ) : null}
    </div>
   </ConfirmDialog>
  </Disclosure>
 );
}
