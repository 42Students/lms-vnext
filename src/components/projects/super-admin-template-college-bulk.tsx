"use client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/ui/status-badge";
import { Banner } from "@/components/ui/banner";
import { EmptyState } from "@/components/ui/empty-state";
import {useEffect,useMemo,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Disclosure} from "@/components/ui/disclosure";
import {PopoverPanel} from "@/components/ui/popover";
import {Input} from "@/components/ui/input";

type College={
 id:string;name:string;code?:string;location?:string|null;
 assigned:boolean;canAssign:boolean;
};
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
 const [filter,setFilter]=useState("");
 const [operation,setOperation]=useState<BulkOperation|null>(null);
 const [pending,setPending]=useState(false);
 const [progress,setProgress]=useState<{done:number;total:number}|null>(null);
 const inFlight=useRef(false);
 const [notice,setNotice]=useState("");
 const [noticeTone,setNoticeTone]=useState<"success"|"warning">("success");

 const shown=useMemo(()=>colleges.filter(row=>{
   const query=filter.trim().toLocaleLowerCase("en-IN");
   return !query||[row.name,row.code??"",row.location??""].some(value=>
     value.toLocaleLowerCase("en-IN").includes(query));
 }),[colleges,filter]);
 const allowed=shown.filter(row=>row.canAssign);
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
   defaultOpen
   className="min-w-0 rounded-[var(--lms-control-radius)] border border-border bg-surface p-4"
   contentClassName="min-w-0 space-y-[var(--lms-space-4)] pt-[var(--lms-space-3)]"
  >
   <p className="m-0 max-w-prose text-[13px] leading-5 text-muted-foreground">
    Select colleges across pages to update availability. The full assignment set
    is compared and saved atomically; existing workspaces remain unchanged.
   </p>
   {!published ? (
    <Banner tone="info">Publish this template before assigning it to colleges.</Banner>
   ) : null}
   <div className="flex min-w-0 flex-wrap items-end gap-2">
    <label className="w-full text-[13px] font-semibold text-body sm:w-[240px]">
      Search college
      <Input type="search" value={filter}
       placeholder="Search colleges..."
       aria-label="Search colleges"
       className="mt-1 w-full"
       onChange={event=>setFilter(event.target.value)}/>
    </label>
    {filter?<Button type="button" size="sm" variant="secondary"
      onClick={()=>setFilter("")}>Clear search</Button>:null}
    <span role="status" className="text-xs text-body">
      {shown.length} of {colleges.length} colleges on this page
    </span>
   </div>
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
       <label className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold md:min-h-9">
        <Checkbox disabled={pending||!allowed.length}
         checked={allowed.length>0&&allowed.every(row=>selected.includes(row.id))}
         onChange={event=>{
          setSelected(current=>event.target.checked
           ?[...new Set([...current,...allowed.map(row=>row.id)])].slice(0,500)
           :current.filter(id=>!allowed.some(row=>row.id===id)));
          setSavedSelection(current=>event.target.checked
           ?[...new Map([...current,...allowed].map(row=>[row.id,row] as const)).values()].slice(0,500)
           :current.filter(row=>!allowed.some(candidate=>candidate.id===row.id)));
         }}/>
        Select all on page
       </label>
       <Button type="button" variant="ghost" size="sm"
        className="min-h-11 w-full sm:w-auto md:min-h-9"
        disabled={pending||!selected.length}
        onClick={()=>{setSelected([]);setSavedSelection([]);}}>
        Clear selection
       </Button>
      </div>
     </div>
     <div className="min-w-0 overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-left text-sm">
       <caption className="sr-only">Select colleges for template availability</caption>
       <thead><tr className="border-b border-border bg-muted/20">
        <th scope="col" className="w-12 px-3 py-2">Select</th>
        <th scope="col" className="px-3 py-2">College</th>
        <th scope="col" className="px-3 py-2">Availability</th>
       </tr></thead>
       <tbody>
      {shown.map(college=>(
       <tr key={college.id} className="border-b border-border">
        <td className="px-3 py-2 align-middle">
         <Checkbox aria-label={"Select "+college.name}

          checked={selected.includes(college.id)}
          disabled={pending||!college.canAssign}
          onChange={event=>{
           setSelected(current=>event.target.checked?
            (current.includes(college.id)?current:[...current,college.id]):
            current.filter(id=>id!==college.id));
           setSavedSelection(current=>event.target.checked?
            [...current.filter(row=>row.id!==college.id),college]:
            current.filter(row=>row.id!==college.id));
          }}
         />
        </td>
        <th scope="row" className="min-w-0 px-3 py-2 font-semibold">
         <span className="block break-words">{college.name}</span>
         <span className="block text-xs font-normal text-muted-foreground">
           {[college.code,college.location].filter(Boolean).join(" · ")||"—"}
         </span>
        </th>
        <td className="px-3 py-2">
          <StatusBadge tone={college.assigned?"success":"neutral"}>
           {college.assigned?"Assigned":"Not assigned"}
          </StatusBadge>
        </td>
       </tr>
      ))}
       </tbody>
      </table>
     </div>
     {!shown.length?<EmptyState title="No matching colleges"
       description="No colleges match this search on the current page. Clear the search or browse another page."/>:null}
     <div className="flex min-w-0 flex-col gap-2 border-t border-border pt-[var(--lms-space-4)] sm:flex-row sm:items-center">
      <Button type="button" variant="primary"
       className="w-full sm:w-auto"
       loading={pending&&operation==="assign"}
       disabled={pending||!published||!selected.length}
       onClick={()=>setOperation("assign")}>
       Assign selected ({selected.length})
      </Button>
      <div className="relative w-full sm:w-auto">
       <Button type="button" variant="secondary" className="w-full sm:w-auto"
        disabled={pending||!selected.length} aria-expanded={operation==="remove"}
        onClick={()=>setOperation("remove")}>
        Remove selected ({selected.length})
       </Button>
       {operation==="remove"?<PopoverPanel label="Confirm removal of template assignments"
        onDismiss={()=>{if(!pending)setOperation(null);}}
        className="absolute bottom-full right-0 z-40 mb-2 w-[320px] max-w-[calc(100vw_-_2rem)] space-y-3">
        <p className="m-0 text-sm font-semibold text-[var(--lms-heading)]">
         Remove this template from {selected.length} selected colleges?
        </p>
        <p className="m-0 text-xs text-muted-foreground">
         Existing workspaces remain unchanged.
        </p>
        <div className="flex justify-end gap-2">
         <Button size="sm" variant="secondary" type="button" disabled={pending}
          onClick={()=>setOperation(null)}>Cancel</Button>
         <Button size="sm" variant="danger" type="button" loading={pending} disabled={pending}
          onClick={()=>{void apply();}}>Remove selected</Button>
        </div>
       </PopoverPanel>:null}
      </div>
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
    open={operation==="assign"}
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
