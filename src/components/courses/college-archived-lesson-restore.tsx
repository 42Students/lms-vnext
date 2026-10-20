"use client";
import {Button} from "@/components/ui/button";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Alert} from "@/components/ui/alert";

/** COL-course-tabs-15: archived lessons remain visible and recoverable. */
export function CollegeArchivedLessonRestore({id,name}:{id:string;name:string}){
 const router=useRouter();
 const [confirming,setConfirming]=useState(false);
 const [pending,setPending]=useState(false);
 const [error,setError]=useState("");
 async function restore(){
  if(pending)return;
  setPending(true);setError("");
  try{
   await apiFetch("/api/courses/lessons/"+encodeURIComponent(id)+"/restore",{method:"POST"});
   setConfirming(false);
   router.refresh();
  }catch{
   setError("Lesson could not be restored. Check for a conflicting active lesson and try again.");
  }finally{setPending(false);}
 }
 return <div className="flex max-w-full flex-col items-stretch gap-1 sm:items-start">
  <Button variant="ghost" type="button" disabled={pending} onClick={()=>{setError("");setConfirming(true);}}
   className="min-h-11 w-full !text-[var(--lms-primary-text)] underline sm:w-auto md:min-h-9">Restore</Button>
  <ConfirmDialog open={confirming} onOpenChange={value=>{if(!pending){setError("");setConfirming(value);}}}
   title={"Restore "+name+"?"}
   description="Restoring makes the Lesson available in its active Learning Path. Historical progress and submissions are kept."
   confirmLabel="Restore Lesson" confirmVariant="primary" pending={pending} onConfirm={()=>void restore()}>
    {error?<Alert tone="error" role="alert">{error}</Alert>:null}
  </ConfirmDialog>
 </div>;
}
