"use client";

import {useMemo,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Checkbox} from "@/components/ui/checkbox";
import {Alert} from "@/components/ui/alert";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {apiFetch} from "@/lib/api-fetch";

type Course={id:string;name:string;enabled:boolean;updatedAt:string};
export function CollegeCourseBulkVisibility({courses,collegeName="this college"}:{
 courses:readonly Course[];collegeName?:string;
}){
 const router=useRouter(),lock=useRef(false);
 const [selected,setSelected]=useState<string[]>([]);
 const [confirmTarget,setConfirmTarget]=useState<boolean|null>(null);
 const [failedIds,setFailedIds]=useState<string[]>([]);
 const [retryOnly,setRetryOnly]=useState(false);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const [warning,setWarning]=useState(false);
 const selectedSet=useMemo(()=>new Set(selected),[selected]);
 const candidates=(retryOnly?failedIds:selected).filter(id=>courses.some(course=>course.id===id));
 const selectedNames=candidates.map(id=>courses.find(course=>course.id===id)?.name??"Unknown Course");
 async function apply(){
  if(lock.current||confirmTarget===null)return;
  lock.current=true;setBusy(true);setWarning(false);setMessage("");
  const target=confirmTarget;
  const failed:string[]=[];
  let updated=0;
  for(const id of candidates){
   const course=courses.find(course=>course.id===id);
   if(!course){failed.push(id);continue;}
   if(course.enabled===target){updated++;continue;}
   try{
    await apiFetch("/api/courses/"+encodeURIComponent(id),{
     method:"PATCH",headers:{"Content-Type":"application/json"},
     body:JSON.stringify({expectedUpdatedAt:course.updatedAt,enabled:target}),
    });
    updated++;
   }catch{failed.push(id);}
  }
  setFailedIds(failed);
  setSelected(failed);
  setWarning(failed.length>0);
  setMessage(updated+" of "+candidates.length+" updated. "+
   (failed.length?"Retry will target only failed courses.":"All selected courses updated."));
  setConfirmTarget(null);setRetryOnly(false);setBusy(false);lock.current=false;
  router.refresh();
 }
 if(!courses.length)return null;
 return <div className="space-y-2 border-y border-border py-3">
  <div className="flex flex-wrap items-center justify-between gap-2">
   <h3 className="text-sm font-semibold">Bulk student visibility</h3>
   <div className="flex flex-wrap gap-2">
    <Button type="button" variant="secondary" size="sm" disabled={busy||!selected.length}
     onClick={()=>{setRetryOnly(false);setConfirmTarget(false);}}>Hide selected</Button>
    <Button type="button" variant="secondary" size="sm" disabled={busy||!selected.length}
     onClick={()=>{setRetryOnly(false);setConfirmTarget(true);}}>Show selected</Button>
    {failedIds.length?<Button type="button" size="sm" variant="secondary" disabled={busy}
     onClick={()=>{setRetryOnly(true);setConfirmTarget(courses.some(course=>failedIds.includes(course.id)&&!course.enabled));}}>
      Retry failed
     </Button>:null}
   </div>
  </div>
  <p className="text-xs text-muted-foreground">Select Courses within {collegeName}; visibility changes retain lessons, assessments and file history.</p>
  <div role="group" aria-label="Select courses for bulk visibility" className="grid max-h-40 grid-cols-1 gap-1 overflow-y-auto sm:grid-cols-2 md:grid-cols-3">
   {courses.map(course=><label key={course.id} className="flex min-h-9 items-center gap-2 text-xs">
    <Checkbox checked={selectedSet.has(course.id)} disabled={busy}
     onChange={event=>setSelected(rows=>event.target.checked?[...rows,course.id]:rows.filter(id=>id!==course.id))}/>
    <span className="min-w-0 truncate" title={course.name}>{course.name}</span>
   </label>)}
  </div>
  {message?<Alert tone={warning?"warning":"success"} role="status">{message}</Alert>:null}
  <ConfirmDialog open={confirmTarget!==null} onOpenChange={open=>{if(!busy&&!open)setConfirmTarget(null);}}
   title={confirmTarget?"Show selected Courses?":"Hide selected Courses?"}
   description={(retryOnly?"Retry "+candidates.length+" failed courses in ":"Update "+candidates.length+" selected courses in ")+
    collegeName+". Preview: "+selectedNames.slice(0,5).join(", ")+
    (selectedNames.length>5?" and "+(selectedNames.length-5)+" more.":".")+
    " This does not delete or archive the course or its child content."}
   confirmLabel={confirmTarget?"Show Courses":"Hide Courses"}
   pending={busy} confirmDisabled={!candidates.length}
   onConfirm={()=>void apply()}/>
 </div>;
}
