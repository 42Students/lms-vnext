"use client";
import {Checkbox} from "@/components/ui/checkbox";
import { Disclosure } from "@/components/ui/disclosure";

import {useRouter,usePathname,useSearchParams} from "next/navigation";
import {ScrollCue} from "@/components/ui/scroll-cue";
import {Button} from "@/components/ui/button";
import {FilterChip} from "@/components/ui/filter-chip";
import {Alert} from "@/components/ui/alert";
import {StatusBadge} from "@/components/ui/status-badge";
import {useState,useTransition,useEffect,useMemo} from "react";
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
  <FilterChip type="button" className="min-h-11 md:min-h-9" disabled={pending} onClick={change}
   aria-pressed={visible}>
   {pending?"Saving…":label}
  </FilterChip>
  {error?<Alert tone="error">{error}</Alert>:null}
 </div>;
}

/** Page-scoped selection with explicit per-record failure reporting and retry. */
export function CollegeLessonBulkVisibility({items}:{items:Item[]}){
 const router=useRouter();
 const pathname=usePathname(),searchParams=useSearchParams();
 const selectionScope=useMemo(()=>{
  const stable=new URLSearchParams(searchParams.toString());
  stable.delete("page");stable.delete("pageSize");
  stable.sort();
  return "college-lesson-selection:"+pathname+"?"+stable.toString();
 },[pathname,searchParams]);
 const [selectedRows,setSelectedRows]=useState<Item[]>([]);
 const selected=selectedRows.map(item=>item.id);
 useEffect(()=>{
  try{
   const stored=window.sessionStorage.getItem(selectionScope);
   const parsed:unknown=stored?JSON.parse(stored):[];
   if(Array.isArray(parsed)){
    const entries=parsed.filter((value):value is Item=>
     Boolean(value)&&typeof value==="object"&&typeof value.id==="string"&&
     typeof value.name==="string"&&typeof value.updatedAt==="string"&&
     typeof value.visibleToStudents==="boolean").slice(0,100);
    setSelectedRows(entries);
   }else setSelectedRows([]);
  }catch{setSelectedRows([]);}
 },[selectionScope]);
 function selectRows(rows:Item[]){
  const unique=[...new Map(rows.map(item=>[item.id,item])).values()].slice(0,100);
  setSelectedRows(unique);
  try{window.sessionStorage.setItem(selectionScope,JSON.stringify(unique));}catch{
   // Selection still works on the current page when storage is blocked.
  }
 }
 const [failed,setFailed]=useState<string[]>([]);
 const [retryTarget,setRetryTarget]=useState<boolean|null>(null);
 const [message,setMessage]=useState("");
 const [messageTone,setMessageTone]=useState<"success"|"warning"|"error">("success");
 const [pending,start]=useTransition();
 const [versions,setVersions]=useState<Record<string,string>>({});
 const [latestVisible,setLatestVisible]=useState<Record<string,boolean>>({});
 const allChecked=items.length>0&&items.every(item=>selected.includes(item.id));
 const selectedRecords=selectedRows.map(row=>items.find(item=>item.id===row.id)??row);
 function toggle(id:string){
  const row=items.find(item=>item.id===id);
  if(!row)return;
  selectRows(selected.includes(id)?selectedRows.filter(item=>item.id!==id):[...selectedRows,row]);
  setFailed([]);setMessage("");
 }
 function apply(next:boolean,ids=selected){
  if(pending||ids.length===0)return;
  const action=next?"Show to students":"Hide from students";
  if(!window.confirm(action+" for "+ids.length+" selected Lessons?"))return;
  setRetryTarget(next);
  start(async()=>{
   try{
    const chosen=selectedRecords.filter(item=>ids.includes(item.id));
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
    setFailed(failures);selectRows(selectedRecords.filter(item=>failures.includes(item.id)));
    const detail=failedRows.slice(0,5).map(item=>
     (items.find(row=>row.id===item.lessonId)?.name??"Lesson")+": "+item.reason).join("; ");
    setMessageTone(failures.length?"warning":"success");
    setMessage(changed.length+" Lessons updated. "+failures.length+
     " failed."+ (detail?" "+detail:""));
    router.refresh();
   }catch(error){setMessageTone("error");setMessage(error instanceof Error?error.message:friendlyApiError({}));}
  });
 }
 return <Disclosure title="Show to students / Hide from students" className="border-y border-border py-3 text-sm text-body">
  
  <p className="mt-2 text-xs text-muted-foreground">
   Select Lessons across pages of the same Course/search filter (up to 100). Changing Course or search clears this selection. Saved visibility does not delete student progress.
  </p>
  <label className="mt-2 flex min-h-11 items-center gap-2">
   <Checkbox disabled={pending} checked={allChecked}
    onChange={event=>{
     selectRows(event.target.checked
       ?[...selectedRows,...items.filter(item=>!selected.includes(item.id))]
       :selectedRows.filter(item=>!items.some(current=>current.id===item.id)));
     setFailed([]);setMessage("");
    }}/>
   Select all on this page ({selected.length} selected across pages)
  </label>
  <ScrollCue axis="y" label="Lessons available for bulk visibility" className="mt-2" viewportClassName="max-h-48"><div className="grid gap-2 md:grid-cols-2">
   {items.map(item=><label key={item.id} className="flex min-h-11 min-w-0 items-center gap-2">
    <Checkbox checked={selected.includes(item.id)} disabled={pending}
     onChange={()=>toggle(item.id)}/>
    <span className="truncate" title={item.name}>{item.name}</span>
    <StatusBadge tone={(latestVisible[item.id]??item.visibleToStudents)?"success":"neutral"}>
     {(latestVisible[item.id]??item.visibleToStudents)?"Visible":"Hidden"}
    </StatusBadge>
   </label>)}
  </div></ScrollCue>
  <div className="mt-3 flex flex-wrap gap-2">
   <Button type="button" variant="primary" className="min-h-11 md:min-h-9" loading={pending} disabled={pending||!selected.length}
    onClick={()=>apply(true)}>
    Show to students
   </Button>
   <Button type="button" variant="secondary" className="min-h-11 md:min-h-9" loading={pending} disabled={pending||!selected.length}
    onClick={()=>apply(false)}>
    Hide from students
   </Button>
   {failed.length?<Button type="button" variant="secondary" className="min-h-11 md:min-h-9" disabled={pending} onClick={()=>{
    if(retryTarget!==null)apply(retryTarget,failed);
   }}>
    Retry failed
   </Button>:null}
  </div>
  {message?<Alert tone={messageTone} role="status" className="mt-2">{message}</Alert>:null}
 </Disclosure>;
}
