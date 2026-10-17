"use client";
import {useRouter} from "next/navigation";
/** Retry only the optional course state; keep the visible lesson list mounted. */
export function LearnerCourseStateRetry(){
 const router=useRouter();
 return <button type="button" onClick={()=>router.refresh()}
  className="mt-3 min-h-10 rounded-md border border-border px-3 font-semibold text-primary-text">
  Retry state
 </button>;
}
