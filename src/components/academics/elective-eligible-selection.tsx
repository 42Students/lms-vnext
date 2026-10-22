"use client";
import {useEffect,useMemo,useState} from "react";
import {DataTable} from "@/components/ui/data-table";
import {ScrollCue} from "@/components/ui/scroll-cue";
import {Checkbox} from "@/components/ui/checkbox";
import {Button} from "@/components/ui/button";
import {EmptyState} from "@/components/ui/empty-state";

type Learner={membershipId:string;name:string|null;rollNumber:string|null;
 sectionId:string;sectionName:string;sectionCode:string};
const pageSize=50,selectionLimit=100;
const uuid=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

/** Browser session selections are convenience only. The server revalidates
 * each college membership, academic slot, group and capacity before mutation. */
export function ElectiveEligibleSelection({slotId,students,clearAfterAllocation=false}:{
 slotId:string;students:readonly Learner[];clearAfterAllocation?:boolean;
}){
 const key="elective-selection:"+slotId;
 const [ids,setIds]=useState<string[]>([]);
 const [page,setPage]=useState(1);
 const [ready,setReady]=useState(false);
 const [warning,setWarning]=useState("");
 useEffect(()=>{
  try{
   if(clearAfterAllocation)window.sessionStorage.removeItem(key);
   else{
    const raw=window.sessionStorage.getItem(key);
    const parsed:unknown=raw?JSON.parse(raw):[];
    if(Array.isArray(parsed))
     setIds([...new Set(parsed.filter((id):id is string=>
       typeof id==="string"&&uuid.test(id)))].slice(0,selectionLimit));
   }
  }catch{/* Restricted browser storage: keep an in-memory selection. */}
  setReady(true);
 },[key,clearAfterAllocation]);
 useEffect(()=>{
  if(!ready)return;
  try{window.sessionStorage.setItem(key,JSON.stringify(ids));}
  catch{/* Selection is still usable in this view. */}
 },[key,ids,ready]);
 const pageCount=Math.max(1,Math.ceil(students.length/pageSize));
 const current=Math.min(page,pageCount);
 const visible=useMemo(()=>students.slice((current-1)*pageSize,current*pageSize),[students,current]);
 const chosen=useMemo(()=>new Set(ids),[ids]);
 const pageIds=[...new Set(visible.map(row=>row.membershipId))];
 const wholePage=pageIds.length>0&&pageIds.every(id=>chosen.has(id));
 function toggle(id:string,checked:boolean){
  setWarning("");
  if(!checked){setIds(ids.filter(value=>value!==id));return;}
  if(chosen.has(id))return;
  if(ids.length>=selectionLimit){
   setWarning("A maximum of 100 learners can be allocated at once.");return;
  }
  setIds([...ids,id]);
 }
 function togglePage(){
  setWarning("");
  if(wholePage){
   const remove=new Set(pageIds);
   setIds(ids.filter(id=>!remove.has(id)));return;
  }
  const next=[...new Set([...ids,...pageIds])];
  if(next.length>selectionLimit){
   setWarning("Select at most 100 learners. Unselect some learners first.");return;
  }
  setIds(next);
 }
 return <div className="min-w-0 space-y-3">
  {ids.map(id=><input key={id} type="hidden" name="membershipId" value={id}/>)}
  <div className="flex flex-wrap items-center justify-between gap-3">
   <p role="status" aria-live="polite" className="text-sm">
    <strong>{ids.length}</strong> learner(s) selected across filters and pages · 50 per page
   </p>
   <div className="flex flex-wrap gap-2">
    <Button type="button" variant="secondary" size="sm" disabled={!ready||!pageIds.length}
      onClick={togglePage}>{wholePage?"Unselect this page":"Select this page"}</Button>
    <Button type="button" variant="secondary" size="sm" disabled={!ids.length}
      onClick={()=>{setIds([]);setWarning("");}}>Clear selections</Button>
   </div>
  </div>
  {warning?<p role="alert" className="text-sm text-[var(--lms-error)]">{warning}</p>:null}
  <ScrollCue axis="y" label="Eligible students for allocation" viewportClassName="max-h-[26rem]">
   <DataTable caption="Eligible students for allocation" rows={visible}
    getRowKey={student=>student.membershipId}
    empty={<EmptyState title="No eligible learners" description="No eligible students match these filters."/>}
    columns={[
     {key:"select",header:"Select",mobilePriority:"action" as const,cell:(row:Learner)=>
      <label className="flex min-h-11 min-w-11 items-center justify-center">
       <Checkbox checked={chosen.has(row.membershipId)}
        onChange={event=>toggle(row.membershipId,event.currentTarget.checked)}
        aria-label={"Select "+(row.name??row.rollNumber??"student")+" for allocation"}/>
      </label>},
     {key:"name",header:"Student",mobilePriority:"primary" as const,
      cell:(row:Learner)=>row.name??row.membershipId},
     {key:"roll",header:"Roll No.",mobilePriority:"secondary" as const,
      cell:(row:Learner)=>row.rollNumber??"—"},
     {key:"section",header:"Section",mobilePriority:"secondary" as const,
      cell:(row:Learner)=>row.sectionName},
    ]}/>
  </ScrollCue>
  <nav aria-label="Eligible learner pages" className="flex flex-wrap items-center justify-between gap-2">
   <span role="status" className="text-sm">Showing {students.length?(current-1)*pageSize+1:0}–{Math.min(current*pageSize,students.length)}
    {" "}of {students.length} learners · page {current} of {pageCount}</span>
   <div className="flex gap-2">
    <Button type="button" size="sm" variant="secondary" disabled={current<=1}
      onClick={()=>setPage(current-1)}>Previous</Button>
    <Button type="button" size="sm" variant="secondary" disabled={current>=pageCount}
      onClick={()=>setPage(current+1)}>Next</Button>
   </div>
  </nav>
  <p className="text-xs text-muted-foreground">
   {students.length>=500?"Showing the first 500 matching learners. Search or change section to find others; existing selections persist.":"Selections persist across filters."}
   {" "}The server checks eligibility and capacity again before allocation.
  </p>
 </div>;
}
