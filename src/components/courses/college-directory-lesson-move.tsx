"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {InlineNotice} from "@/components/ui/inline-notice";
type Destination={learningPathId:string;label:string};
export function CollegeDirectoryLessonMove({lesson,destinations}:{
 lesson:{id:string;name:string;learningPathId:string;updatedAt:string};
 destinations:readonly Destination[];
}){
 const router=useRouter();
 const options=destinations.filter(item=>item.learningPathId!==lesson.learningPathId);
 const [target,setTarget]=useState("");
 const [confirm,setConfirm]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 async function save(){
  if(!target||busy||!options.some(item=>item.learningPathId===target))return;
  setBusy(true);setError("");
  try{
   const response=await fetch("/api/courses/lessons/"+encodeURIComponent(lesson.id),{
    method:"PATCH",credentials:"same-origin",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({targetLearningPathId:target,
      expectedUpdatedAt:lesson.updatedAt}),
   });
   if(!response.ok)throw new Error(response.status===409?
    "The destination or lesson changed, or delivered content prevents moving it. Reload and review.":
    "Could not move this lesson. Verify the target learning path and course permissions.");
   setConfirm(false);setTarget("");router.refresh();
  }catch(caught){setError(caught instanceof Error?caught.message:"Move failed.");}
  finally{setBusy(false);}
 }
 if(!options.length)return <p className="text-xs text-muted-foreground">
  To move this lesson, include a different offering in your current directory filters.
 </p>;
 return <div className="min-w-0 space-y-1.5">
  <label className="grid gap-1 text-xs font-semibold text-body">Move to another course or learning path
   <Select aria-label={"New learning path for "+lesson.name}
    value={target} disabled={busy} onChange={e=>setTarget(e.currentTarget.value)}>
    <option value="">Choose an eligible destination</option>
    {options.map(item=><option key={item.learningPathId} value={item.learningPathId}>{item.label}</option>)}
   </Select>
  </label>
  <Button type="button" variant="secondary" size="sm" disabled={busy||!target}
   onClick={()=>{setError("");setConfirm(true);}}>
   Move lesson
  </Button>
  <ConfirmDialog open={confirm} onOpenChange={value=>{if(!busy)setConfirm(value);}}
   title={"Move lesson “"+lesson.name+"”?"}
   description="This changes the learning path and course membership only after server checks the destination and all delivery/progress dependencies. Existing learner progress will never be silently moved."
   confirmLabel="Confirm move" pending={busy} onConfirm={()=>void save()}>
   <p className="text-sm text-body">{options.find(item=>item.learningPathId===target)?.label??"No destination selected"}</p>
   {error?<InlineNotice tone="error" message={error}/>:null}
  </ConfirmDialog>
  {error&&!confirm?<InlineNotice tone="error" message={error}/>:null}
 </div>;
}
