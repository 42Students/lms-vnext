"use client";

import {useEffect,useMemo,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Checkbox} from "@/components/ui/checkbox";
import {Alert} from "@/components/ui/alert";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {apiFetch} from "@/lib/api-fetch";

type Course={id:string;name:string;enabled:boolean;updatedAt:string};
const MAX_SELECTED=100;

/** The selection survives server-driven catalogue pagination but never crosses
 * an acting-college boundary or a browser session. The server still checks
 * college membership, permissions and each optimistic version on PATCH. */
export function CollegeCourseBulkVisibility({courses,collegeId,collegeName="this college"}:{
 courses:readonly Course[];collegeId:string;collegeName?:string;
}){
 const router=useRouter(),lock=useRef(false);
 const key="course-bulk-visibility:"+collegeId;
 const [selectedRows,setSelectedRows]=useState<Course[]>([]);
 const [loaded,setLoaded]=useState(false);
 const [confirmTarget,setConfirmTarget]=useState<boolean|null>(null);
 const [failedIds,setFailedIds]=useState<string[]>([]);
 const [retryOnly,setRetryOnly]=useState(false);
 const [lastTarget,setLastTarget]=useState<boolean|null>(null);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const [warning,setWarning]=useState(false);
 useEffect(()=>{
  try{
   const saved=sessionStorage.getItem(key);
   const value:unknown=saved?JSON.parse(saved):[];
   if(Array.isArray(value)){
    const valid=value.filter((item):item is Course=>
      item!==null&&typeof item==="object"&&
      typeof (item as Course).id==="string"&&
      typeof (item as Course).name==="string"&&
      typeof (item as Course).updatedAt==="string"&&
      typeof (item as Course).enabled==="boolean");
    setSelectedRows(valid.slice(0,MAX_SELECTED));
   }
  }catch{/* No persisted selection: storage can be disabled. */}
  setLoaded(true);
 },[key]);
 useEffect(()=>{
  if(!loaded)return;
  try{sessionStorage.setItem(key,JSON.stringify(selectedRows));}
  catch{/* The current session can still edit without persistence. */}
 },[key,loaded,selectedRows]);
 const selectedSet=useMemo(()=>new Set(selectedRows.map(course=>course.id)),[selectedRows]);
 const candidates=(retryOnly?selectedRows.filter(course=>failedIds.includes(course.id)):selectedRows);
 const selectedNames=candidates.map(course=>course.name);
 const visibleSelected=courses.filter(course=>selectedSet.has(course.id)).length;
 const toggle=(course:Course,checked:boolean)=>{
  setMessage("");
  setFailedIds([]);
  setSelectedRows(rows=>checked
   ? rows.some(item=>item.id===course.id)?rows:rows.length>=MAX_SELECTED?rows:[...rows,course]
   : rows.filter(item=>item.id!==course.id));
 };
 async function apply(){
  if(lock.current||confirmTarget===null||!candidates.length)return;
  lock.current=true;setBusy(true);setWarning(false);setMessage("");
  const target=confirmTarget;
  setLastTarget(target);
  const failed:string[]=[];
  let updated=0;
  for(const selected of candidates){
   // Prefer the current page's optimistic token, but retain the selected
   // snapshot for records on other pages. Never silently drop those records.
   const course=courses.find(item=>item.id===selected.id)??selected;
   if(course.enabled===target){updated++;continue;}
   try{
    await apiFetch("/api/courses/"+encodeURIComponent(course.id),{
     method:"PATCH",headers:{"Content-Type":"application/json"},
     body:JSON.stringify({expectedUpdatedAt:course.updatedAt,enabled:target}),
    });
    updated++;
   }catch{failed.push(course.id);}
  }
  setFailedIds(failed);
  setSelectedRows(candidates.filter(row=>failed.includes(row.id)));
  setWarning(failed.length>0);
  setMessage(updated+" of "+candidates.length+" updated. "+
   (failed.length?"Retry will target only failed courses. Refresh the original page if a course was changed by someone else.":"All selected courses updated."));
  setConfirmTarget(null);setRetryOnly(false);setBusy(false);lock.current=false;
  router.refresh();
 }
 return <div className="space-y-2 border-y border-border py-3">
  <div className="flex flex-wrap items-center justify-between gap-2">
   <h3 className="text-sm font-semibold">Bulk student visibility</h3>
   <div className="flex flex-wrap gap-2">
    <Button type="button" variant="secondary" size="sm" disabled={busy||!selectedRows.length}
     onClick={()=>{setRetryOnly(false);setConfirmTarget(false);}}>Hide from students</Button>
    <Button type="button" variant="secondary" size="sm" disabled={busy||!selectedRows.length}
     onClick={()=>{setRetryOnly(false);setConfirmTarget(true);}}>Show to students</Button>
    {failedIds.length?<Button type="button" size="sm" variant="secondary" disabled={busy}
     onClick={()=>{setRetryOnly(true);setConfirmTarget(lastTarget);}}>
      Retry failed
     </Button>:null}
   </div>
  </div>
  <p className="text-xs text-muted-foreground" role="status">
   {selectedRows.length} selected across catalogue pages · {visibleSelected} on this page · maximum {MAX_SELECTED}.
  </p>
  <div className="flex flex-wrap gap-2">
   <Button type="button" size="sm" variant="secondary" disabled={busy||!courses.some(course=>!selectedSet.has(course.id))||selectedRows.length>=MAX_SELECTED}
    onClick={()=>setSelectedRows(rows=>{
      const selected=new Set(rows.map(item=>item.id));
      return [...rows,...courses.filter(item=>!selected.has(item.id)).slice(0,MAX_SELECTED-rows.length)];
    })}>Select visible page</Button>
   <Button type="button" size="sm" variant="secondary" disabled={busy||!visibleSelected}
    onClick={()=>setSelectedRows(rows=>rows.filter(item=>!courses.some(course=>course.id===item.id)))}>
    Deselect visible page</Button>
   <Button type="button" size="sm" variant="ghost" disabled={busy||!selectedRows.length}
    onClick={()=>{setSelectedRows([]);setFailedIds([]);setMessage("");}}>Clear all selections</Button>
  </div>
  <p className="text-xs text-muted-foreground">Selection persists while browsing {collegeName} pages in this session. Only authorised Courses can be changed; historical lessons and assessments are retained.</p>
  <div role="group" aria-label="Select courses for bulk visibility" className="grid max-h-40 grid-cols-1 gap-1 overflow-y-auto sm:grid-cols-2 md:grid-cols-3">
   {courses.map(course=><label key={course.id} className="flex min-h-9 items-center gap-2 text-xs">
    <Checkbox checked={selectedSet.has(course.id)} disabled={busy||(!selectedSet.has(course.id)&&selectedRows.length>=MAX_SELECTED)}
     onChange={event=>toggle(course,event.target.checked)}/>
    <span className="min-w-0 truncate" title={course.name}>{course.name}</span>
   </label>)}
  </div>
  {message?<Alert tone={warning?"warning":"success"} role="status">{message}</Alert>:null}
  <ConfirmDialog open={confirmTarget!==null} onOpenChange={open=>{if(!busy&&!open)setConfirmTarget(null);}}
   title={confirmTarget?"Show selected Courses?":"Hide selected Courses?"}
   description={(retryOnly?"Retry "+candidates.length+" failed Courses in ":"Update "+candidates.length+" selected Courses in ")+
    collegeName+". Preview: "+selectedNames.slice(0,5).join(", ")+
    (selectedNames.length>5?" and "+(selectedNames.length-5)+" more.":".")+
    " This does not delete or archive the Course or its child content."}
   confirmLabel={confirmTarget?"Show Courses":"Hide Courses"}
   pending={busy} confirmDisabled={!candidates.length}
   onConfirm={()=>void apply()}/>
 </div>;
}
