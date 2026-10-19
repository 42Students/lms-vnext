"use client";
import { Button } from "@/components/ui/button";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";

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
 return <span className="inline-flex flex-col gap-1">
  <Button variant="ghost" type="button" disabled={pending} onClick={()=>setConfirming(true)}
   className="min-h-10 text-sm font-semibold text-primary-text underline">Restore</Button>
  <ConfirmDialog open={confirming} onOpenChange={setConfirming}
   title={"Restore "+name+"?"}
   description="Restoring makes the Lesson available in its active Learning Path. Historical progress and submissions are kept."
   confirmLabel="Restore Lesson" pending={pending} onConfirm={()=>void restore()}/>
  {error?<span role="alert" className="text-xs text-error">{error}</span>:null}
 </span>;
}
