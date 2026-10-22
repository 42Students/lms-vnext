"use client";
import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import {Checkbox} from "@/components/ui/checkbox";
import {StatusBadge} from "@/components/ui/status-badge";
import {Dialog} from "@/components/ui/dialog";
type Student={membershipId:string;name:string;active:boolean};
type Preview={membershipId:string;name:string;effective:boolean;
 winnerLevel:string;winnerLocked:boolean;
 stored:{enabled:boolean;locked:boolean}|null};
type Module="projects"|"electives";
type Operation="ENABLE"|"DISABLE"|"INHERIT";
const endpoint="/api/college/students/module-access/bulk";
export function CollegeStudentBulkModuleAccess({students}:{
 students:readonly Student[];
}){
 const router=useRouter();
 const [selected,setSelected]=useState<string[]>([]);
 const [module,setModule]=useState<Module>("projects");
 const [operation,setOperation]=useState<Operation>("ENABLE");
 const [preview,setPreview]=useState<Preview[]>([]);
 const [error,setError]=useState("");
 const [receipt,setReceipt]=useState("");
 const [busy,setBusy]=useState(false);
 const [review,setReview]=useState<{
   ids:string[];snapshot:Preview[];selectedModule:Module;next:Operation;
 }|null>(null);
 const serial=useRef(0);
 const active=students.filter(row=>row.active);
 useEffect(()=>{setPreview([]);setError("");serial.current++;},[selected,module]);
 function setChecked(id:string,checked:boolean){
   setSelected(curr=>checked?[...new Set([...curr,id])]:curr.filter(row=>row!==id));
 }
 async function call<T>(payload:unknown):Promise<T>{
   const response=await fetch(endpoint,{
     method:"POST",headers:{"content-type":"application/json"},
     body:JSON.stringify(payload),
   });
   if(!response.ok)throw Error(response.status===403?
     "This college administrator is not authorized to change learner modules.":
     response.status===409?"Selected learner rules changed. Preview again.":
     "The module update could not be completed. No partial group was saved.");
   return response.json() as Promise<T>;
 }
 async function loadPreview(){
   if(!selected.length||busy)return;
   const token=++serial.current,ids=[...selected],selectedModule=module;
   setBusy(true);setError("");setReceipt("");
   try{
     const data=await call<{items:Preview[]}>({
       action:"PREVIEW",module:selectedModule,membershipIds:ids});
     if(serial.current===token)setPreview(data.items);
   }catch{if(serial.current===token)setError("Preview unavailable. No changes were saved.");}
   finally{setBusy(false);}
 }
 function requestSave(){
   if(busy||!preview.length||preview.length!==selected.length)return;
   setReview({ids:[...selected],snapshot:[...preview],selectedModule:module,next:operation});
 }
 async function save(){
   if(!review||busy)return;
   const {ids,snapshot,selectedModule,next}=review;
   setReview(null);
   setBusy(true);setError("");setReceipt("");
   try{
     const result=await call<{applied:number;changed:number;unchanged:number}>({
       action:"APPLY",module:selectedModule,operation:next,membershipIds:ids,
       expected:snapshot.map(row=>({membershipId:row.membershipId,
          enabled:row.stored?.enabled??null,locked:row.stored?.locked??false})),
       confirmed:true,
     });
     setReceipt(result.changed+" updated, "+result.unchanged+
       " unchanged out of "+result.applied+" selected students.");
     setSelected([]);setPreview([]);router.refresh();
   }catch{setError("Bulk change was not saved. Check permissions and locked/stale rules, then preview again.");setPreview([]);}
   finally{setBusy(false);}
 }
 const all=active.length>0&&active.every(row=>selected.includes(row.membershipId));
 return <section aria-label="Bulk student module access" className="space-y-3 border-b border-border pb-4">
   <h2 className="text-base font-semibold text-[var(--lms-heading)]">Bulk module access</h2>
   <p className="text-xs leading-5 text-muted-foreground">Choose students on this college roster page, preview effective access, then Enable, Disable or Clear override / Inherit. Projects and Electives can be overridden per learner; Placements access remains a college-level policy.</p>
   <label className="flex min-h-11 items-center gap-2 text-sm">
     <Checkbox checked={all} disabled={busy} onChange={event=>
       setSelected(event.target.checked?active.map(row=>row.membershipId):[])} />
     {all?"Clear selection":"Select all visible active students"} ({active.length})
   </label>
   <div className="grid max-h-44 gap-2 overflow-auto sm:grid-cols-2">
     {active.map(row=><label key={row.membershipId} className="flex min-h-11 items-center gap-2 rounded border border-border px-2 text-sm">
       <Checkbox disabled={busy} checked={selected.includes(row.membershipId)}
         aria-label={"Select "+row.name} onChange={event=>
           setChecked(row.membershipId,event.target.checked)} />
       <span className="min-w-0 truncate" title={row.name}>{row.name}</span>
     </label>)}
   </div>
   <div className="flex flex-wrap items-end gap-3">
     <label className="grid gap-1 text-xs font-semibold">Module
       <Select disabled={busy} value={module} onChange={e=>setModule(e.target.value as Module)}>
         <option value="projects">Projects</option><option value="electives">Electives</option>
       </Select>
     </label>
     <label className="grid gap-1 text-xs font-semibold">Access
       <Select disabled={busy} value={operation} onChange={e=>setOperation(e.target.value as Operation)}>
         <option value="ENABLE">Enable</option><option value="DISABLE">Disable</option>
         <option value="INHERIT">Clear override / Inherit</option>
       </Select>
     </label>
     <Button variant="secondary" disabled={busy||selected.length===0} type="button"
       onClick={()=>void loadPreview()}>Preview effective access</Button>
     <Button variant="primary" disabled={busy||selected.length===0||
       preview.length!==selected.length} type="button" onClick={requestSave}>
       {busy?"Saving…":"Apply to selected"}
     </Button>
   </div>
   {preview.length?<div className="overflow-x-auto rounded border border-border">
     <table className="w-full min-w-[500px] text-left text-xs">
       <thead><tr className="border-b border-border">
         <th className="p-2">Student</th><th className="p-2">Override</th>
         <th className="p-2">Effective</th><th className="p-2">Source</th>
       </tr></thead>
       <tbody>{preview.map(row=><tr key={row.membershipId} className="border-b border-border">
         <td className="p-2">{row.name}</td>
         <td className="p-2">{row.stored===null?"Inherit":row.stored.enabled?"Enabled":"Disabled"}
           {row.stored?.locked?" (locked)":""}</td>
         <td className="p-2"><StatusBadge tone={row.effective?"success":"warning"}>
           {row.effective?"On":"Off"}</StatusBadge></td>
         <td className="p-2">{row.winnerLevel}{row.winnerLocked?" · Locked":""}</td>
       </tr>)}</tbody>
     </table>
   </div>:null}
   <Dialog open={review!==null} role="alertdialog" title="Apply bulk module access?"
     {...(review ? {description:"Apply "+review.next+" to "+review.selectedModule+" for "+review.ids.length+
       " students? Inherit removes the individual override and uses college/ancestor settings."} : {})}
     onOpenChange={next=>{if(!next&&!busy)setReview(null);}}
     dismissible={!busy}
     footer={<>
       <Button type="button" variant="secondary" disabled={busy} onClick={()=>setReview(null)}>Keep editing</Button>
       <Button type="button" variant="primary" disabled={busy} onClick={()=>void save()}>Confirm changes</Button>
     </>}>
     <p className="text-sm text-[var(--lms-body-text)]">Review the selected students and effective permissions before applying the change. Locked rules are not overridden.</p>
   </Dialog>
   {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
   {receipt?<p role="status" className="text-sm">{receipt}</p>:null}
 </section>;
}
