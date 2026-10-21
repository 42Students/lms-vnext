"use client";

import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {Checkbox} from "@/components/ui/checkbox";
import {Alert} from "@/components/ui/alert";
import {apiFetch} from "@/lib/api-fetch";

/** Legacy enabled is not course.status. Hiding a Course never archives its
 * offerings, lessons, assessment attempts or previously uploaded material. */
export function AdminCourseVisibilityControl({course}:{
 course:{id:string;name:string;status:string;enabled:boolean;
  legacyAllowedForDisplay?:number|null;updatedAt:string};
}){
 const router=useRouter(),lock=useRef(false);
 const [enabled,setEnabled]=useState(course.enabled&&course.legacyAllowedForDisplay!==0);
 const [pending,setPending]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 async function toggle(next:boolean){
  if(lock.current||course.status!=="ACTIVE")return;
  lock.current=true;setPending(true);setError("");setNotice("");
  try{
   await apiFetch("/api/courses/"+encodeURIComponent(course.id),{
    method:"PATCH",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({expectedUpdatedAt:course.updatedAt,enabled:next}),
   });
   setEnabled(next);
   setNotice(next?"Course visible to students":"Course hidden from students");
   router.refresh();
  }catch(reason){
   setError("Could not update course visibility. "+
    (reason instanceof Error?reason.message:"Refresh the course and retry."));
  }finally{lock.current=false;setPending(false);}
 }
 return <div className="min-w-0 space-y-1">
  <label className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold md:min-h-9">
   <Checkbox checked={enabled} disabled={pending||course.status!=="ACTIVE"}
    onChange={event=>void toggle(event.target.checked)}/>
   Visible to students
  </label>
  <p className="max-w-48 text-xs text-muted-foreground">
   {enabled?"Students see this Course when its term and lesson access allow it.":
    "Hidden without archiving. Lessons and assessments are retained."}
  </p>
  {error?<Alert tone="error" role="alert">{error}</Alert>:null}
  {notice?<p role="status" className="text-xs text-muted-foreground">{notice}</p>:null}
 </div>;
}
