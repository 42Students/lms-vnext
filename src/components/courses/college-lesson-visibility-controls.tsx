"use client";

import {useRouter} from "next/navigation";
import {useState,useTransition} from "react";

type Item={id:string;name:string;visibleToStudents:boolean;updatedAt:string};
type Result={changed:{id:string;visibleToStudents:boolean;updatedAt:string}[];
 failed:{lessonId:string;reason:string}[]};

export function CollegeLessonVisibilityControl({lesson}: {lesson:Item}){
 const router=useRouter();
 const [pending,start]=useTransition();
 const [error,setError]=useState("");
 const [visible,setVisible]=useState(lesson.visibleToStudents);
 const [version,setVersion]=useState(lesson.updatedAt);
 const label=visible?"Hide from students":"Show to students";
 function change(){
  if(!window.confirm(label+"?"))return;
  setError("");
  start(async()=>{
   try{
    const response=await fetch("/api/courses/college-lesson-visibility",{
     method:"PATCH",headers:{"content-type":"application/json"},
     body:JSON.stringify({lessonId:lesson.id,expectedUpdatedAt:version,
      visibleToStudents:!visible,confirmed:true}),
    });
    if(!response.ok)throw Error("This Lesson could not be updated. Refresh and try again.");
    const saved=await response.json() as {visibleToStudents:boolean;updatedAt:string};
    setVisible(saved.visibleToStudents);setVersion(saved.updatedAt);
    router.refresh();
   }catch(reason){setError(reason instanceof Error?reason.message:"Unable to update Lesson.");}
  });
 }
 return <div className="space-y-1">
  <button type="button" disabled={pending} onClick={change}
   aria-pressed={visible} className="min-h-10 rounded-md border border-border px-3 text-xs font-semibold text-primary-text disabled:opacity-50">
   {pending?"Saving…":label}
  </button>
  {error?<p role="alert" className="text-xs text-error">{error}</p>:null}
 </div>;
}

/** Page-scoped selection with explicit per-record failure reporting and retry. */
export function CollegeLessonBulkVisibility({items}:{items:Item[]}){
 const router=useRouter();
 const [selected,setSelected]=useState<string[]>([]);
 const [failed,setFailed]=useState<string[]>([]);
 const [retryTarget,setRetryTarget]=useState<boolean|null>(null);
 const [message,setMessage]=useState("");
 const [pending,start]=useTransition();
 const [versions,setVersions]=useState<Record<string,string>>({});
 const [latestVisible,setLatestVisible]=useState<Record<string,boolean>>({});
 const allChecked=items.length>0&&items.every(item=>selected.includes(item.id));
 function toggle(id:string){
  setSelected(old=>old.includes(id)?old.filter(value=>value!==id):[...old,id]);
  setFailed([]);setMessage("");
 }
 function apply(next:boolean,ids=selected){
  if(pending||ids.length===0)return;
  const action=next?"Show to students":"Hide from students";
  if(!window.confirm(action+" for "+ids.length+" selected Lessons?"))return;
  setRetryTarget(next);
  start(async()=>{
   try{
    const chosen=items.filter(item=>ids.includes(item.id));
    const changed:Result["changed"]=[];
    const failedRows:Result["failed"]=[];
    // The endpoint caps each transaction group at 25; batch a full 100-row page safely.
    for(let from=0;from<chosen.length;from+=25){
     const batch=chosen.slice(from,from+25);
     const response=await fetch("/api/courses/college-lesson-visibility",{
      method:"POST",headers:{"content-type":"application/json"},
      body:JSON.stringify({items:batch.map(item=>({
       lessonId:item.id,expectedUpdatedAt:versions[item.id]??item.updatedAt,
      })),visibleToStudents:next,confirmed:true}),
     });
     if(!response.ok){
      failedRows.push(...batch.map(item=>({lessonId:item.id,reason:"Unable to update this batch."})));
      continue;
     }
     const result=await response.json() as Result;
     changed.push(...result.changed);failedRows.push(...result.failed);
    }
    setVersions(old=>({...old,...Object.fromEntries(changed.map(item=>[item.id,item.updatedAt]))}));
    setLatestVisible(old=>({...old,...Object.fromEntries(changed.map(item=>[item.id,item.visibleToStudents]))}));
    const failures=failedRows.map(item=>item.lessonId);
    setFailed(failures);setSelected(failures);
    const detail=failedRows.slice(0,5).map(item=>
     (items.find(row=>row.id===item.lessonId)?.name??"Lesson")+": "+item.reason).join("; ");
    setMessage(changed.length+" Lessons updated. "+failures.length+
     " failed."+ (detail?" "+detail:""));
    router.refresh();
   }catch(error){setMessage(error instanceof Error?error.message:"Unable to save visibility.");}
  });
 }
 return <details className="rounded-lg border border-border p-3 text-sm text-body">
  <summary className="cursor-pointer font-semibold">Show to students / Hide from students</summary>
  <p className="mt-2 text-xs text-muted-foreground">
   Select Lessons on this page. Saved visibility does not delete student progress.
  </p>
  <label className="mt-2 flex items-center gap-2">
   <input type="checkbox" disabled={pending} checked={allChecked}
    onChange={event=>{setSelected(event.target.checked?items.map(item=>item.id):[]);setFailed([]);setMessage("");}}/>
   Select all on this page
  </label>
  <div className="mt-2 grid max-h-48 gap-2 overflow-y-auto sm:grid-cols-2">
   {items.map(item=><label key={item.id} className="flex min-w-0 items-center gap-2">
    <input type="checkbox" checked={selected.includes(item.id)} disabled={pending}
     onChange={()=>toggle(item.id)}/>
    <span className="truncate" title={item.name}>{item.name}</span>
    <span className="text-xs text-muted-foreground">
     {(latestVisible[item.id]??item.visibleToStudents)?"Visible":"Hidden"}
    </span>
   </label>)}
  </div>
  <div className="mt-3 flex flex-wrap gap-2">
   <button type="button" disabled={pending||!selected.length}
    onClick={()=>apply(true)} className="min-h-10 rounded border border-border px-3 font-semibold text-primary-text disabled:opacity-50">
    Show to students
   </button>
   <button type="button" disabled={pending||!selected.length}
    onClick={()=>apply(false)} className="min-h-10 rounded border border-border px-3 font-semibold text-primary-text disabled:opacity-50">
    Hide from students
   </button>
   {failed.length?<button type="button" disabled={pending} onClick={()=>{
    if(retryTarget!==null)apply(retryTarget,failed);
   }} className="min-h-10 rounded border border-border px-3 font-semibold text-primary-text">
    Retry failed
   </button>:null}
  </div>
  {message?<p role="status" className="mt-2 text-xs">{message}</p>:null}
 </details>;
}
