"use client";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";

/** Returns to the actual report origin (Assignments, Blueprint or Courses).
 * A direct bookmark has a stable scoped fallback.
 */
export function FacultyReportBackAction({fallback}:{fallback:string}){
 const router=useRouter();
 return <Button type="button" variant="secondary"
  className="min-h-11 gap-2 md:min-h-9" onClick={()=>{
   if(typeof window!=="undefined"&&window.history.length>1)router.back();
   else router.push(fallback);
  }}>
   <svg viewBox="0 0 16 16" className="inline-block size-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M13 8H3m5-5L3 8l5 5" strokeLinecap="round" strokeLinejoin="round"/></svg>
   Back
  </Button>;
}
