"use client";
import { Button } from "@/components/ui/button";
import {useRouter} from "next/navigation";
/** Retry only the optional course state; keep the visible lesson list mounted. */
export function LearnerCourseStateRetry(){
 const router=useRouter();
 return <Button variant="secondary" type="button" onClick={()=>router.refresh()}
  className="mt-3 min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:bg-primary-subtle sm:min-h-9">
  Retry state
 </Button>;
}
