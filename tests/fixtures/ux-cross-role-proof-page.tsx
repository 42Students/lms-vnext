"use client";

import {useState} from "react";
import CollegeStudentImportError from "@/app/(authenticated)/college/students/import/error";
import CollegeStudentImportLoading from "@/app/(authenticated)/college/students/import/loading";
import LearnerVerificationError from "@/app/(authenticated)/learn/profile/verification/error";
import LearnerVerificationLoading from "@/app/(authenticated)/learn/profile/verification/loading";
import FacultyProfileError from "@/app/(authenticated)/teacher/profile/error";
import FacultyProfileLoading from "@/app/(authenticated)/teacher/profile/loading";

/** CI-only preview: exact route error/loading components with a synthetic reset.
 * Copied into the app route by the workflow only; never deployed on main. */
export default function CrossRoleUxPreview(){
 const [group,setGroup]=useState<"college"|"learner"|"faculty">("college");
 const [mode,setMode]=useState<"error"|"loading">("error");
 const [retried,setRetried]=useState(0);
 const error=new Error("Synthetic CI recovery test");
 const reset=()=>setRetried(value=>value+1);
 return <main className="mx-auto min-h-dvh w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6">
  <h1 className="text-xl font-semibold">Role-based recovery acceptance</h1>
  <p className="text-sm text-body">Temporary component preview. No authenticated data is loaded or modified.</p>
  <nav aria-label="Select acceptance surface" className="flex flex-wrap gap-2">
   <button type="button" aria-pressed={group==="college"} onClick={()=>{setGroup("college");setRetried(0);}}
    className="min-h-11 rounded border border-border bg-surface px-4 focus-ring">College onboarding</button>
   <button type="button" aria-pressed={group==="learner"} onClick={()=>{setGroup("learner");setRetried(0);}}
    className="min-h-11 rounded border border-border bg-surface px-4 focus-ring">Learner verification</button>
   <button type="button" aria-pressed={group==="faculty"} onClick={()=>{setGroup("faculty");setRetried(0);}}
    className="min-h-11 rounded border border-border bg-surface px-4 focus-ring">Faculty profile</button>
  </nav>
  <div className="flex flex-wrap gap-2">
   <button type="button" aria-pressed={mode==="error"} onClick={()=>setMode("error")}
    className="min-h-11 rounded border border-border bg-surface px-4 focus-ring">Show error recovery</button>
   <button type="button" aria-pressed={mode==="loading"} onClick={()=>setMode("loading")}
    className="min-h-11 rounded border border-border bg-surface px-4 focus-ring">Show loading</button>
  </div>
  <output role="status" aria-label="Retry result" className="block text-sm">Retry invoked: {retried}</output>
  <div className="min-w-0 border-t border-border pt-5">
   {group==="college"
    ? mode==="error"?<CollegeStudentImportError error={error} reset={reset}/>:<CollegeStudentImportLoading/>
    :group==="learner"
    ? mode==="error"?<LearnerVerificationError error={error} reset={reset}/>:<LearnerVerificationLoading/>
    :mode==="error"?<FacultyProfileError error={error} reset={reset}/>:<FacultyProfileLoading/>}
  </div>
 </main>;
}
