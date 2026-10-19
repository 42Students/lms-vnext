"use client";
import { Button } from "@/components/ui/button";
import {useRouter} from "next/navigation";
/** Retry only the optional course state; keep the visible lesson list mounted. */
export function LearnerCourseStateRetry(){
 const router=useRouter();
 return <Button type="button" variant="secondary" onClick={()=>router.refresh()}
  className="mt-3 min-h-11">
  Retry state
 </Button>;
}
