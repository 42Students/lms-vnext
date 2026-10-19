"use client";
import {Checkbox} from "@/components/ui/checkbox";

import {useRouter} from "next/navigation";
import {ScrollCue} from "@/components/ui/scroll-cue";
import {Button} from "@/components/ui/button";
import {useState,useTransition} from "react";
import {apiFetch} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";

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
    const saved=await apiFetch<{visibleToStudents:boolean;updatedAt:string}>(
     "/api/courses/college-lesson-visibility",{
      method:"PATCH",headers:{"content-type":"application/json"},
      body:JSON.stringify({lessonId:lesson.id,expectedUpdatedAt:version,
       visibleToStudents:!visible,confirmed:true}),
     });
    setVisible(saved.visibleToStudents);setVersion(saved.updatedAt);
    router.refresh();
   }catch(reason){setError(reason instanceof Error?reason.message:friendlyApiError({}));}
  });
 }
 return <div className="space-y-1">
  <Button type="button" size="sm" variant="secondary" disabled={pending} onClick={change}
   aria-pressed={visible}>
   {pending?"Saving…":label}
  </Button>
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
     try{
      const result=await apiFetch<Result>("/api/courses/college-lesson-visibility",{
       method:"POST",headers:{"content-type":"application/json"},
       body:JSON.stringify({items:batch.map(item=>({
        lessonId:item.id,expectedUpdatedAt:versions[item.id]??item.updatedAt,
       })),visibleToStudents:next,confirmed:true}),
      });
      changed.push(...result.changed);
      failedRows.push(...result.failed.map(item=>({...item,
       reason:"This Lesson could not be updated. Refresh and retry."})));
     }catch{
      failedRows.push(...batch.map(item=>({lessonId:item.id,
       reason:"Could not update this batch. Retry after checking the latest Lesson state."})));
     }
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
   }catch(error){setMessage(error instanceof Error?error.message:friendlyApiError({}));}
  });
 }
 return <details className="border-y border-border py-3 text-sm text-body">
  <summary className="cursor-pointer font-semibold">Show to students / Hide from students</summary>
  <p className="mt-2 text-xs text-muted-foreground">
   Select Lessons on this page. Saved visibility does not delete student progress.
  </p>
  <label className="mt-2 flex items-center gap-2">
   <Checkbox disabled={pending} checked={allChecked}
    onChange={event=>{setSelected(event.target.checked?items.map(item=>item.id):[]);setFailed([]);setMessage("");}}/>
   Select all on this page
  </label>
  <ScrollCue axis="y" label="Lessons available for bulk visibility" className="mt-2" viewportClassName="max-h-48"><div className="grid gap-2 sm:grid-cols-2">
   {items.map(item=><label key={item.id} className="flex min-w-0 items-center gap-2">
    <Checkbox checked={selected.includes(item.id)} disabled={pending}
     onChange={()=>toggle(item.id)}/>
    <span className="truncate" title={item.name}>{item.name}</span>
    <span className="text-xs text-muted-foreground">
     {(latestVisible[item.id]??item.visibleToStudents)?"Visible":"Hidden"}
    </span>
   </label>)}
  </div></ScrollCue>
  <div className="mt-3 flex flex-wrap gap-2">
   <Button type="button" variant="secondary" disabled={pending||!selected.length}
    onClick={()=>apply(true)}>
    Show to students
   </Button>
   <Button type="button" variant="secondary" disabled={pending||!selected.length}
    onClick={()=>apply(false)}>
    Hide from students
   </Button>
   {failed.length?<Button type="button" variant="secondary" disabled={pending} onClick={()=>{
    if(retryTarget!==null)apply(retryTarget,failed);
   }}>
    Retry failed
   </Button>:null}
  </div>
  {message?<p role="status" className="mt-2 text-xs">{message}</p>:null}
 </details>;
}
