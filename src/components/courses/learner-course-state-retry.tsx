"use client";
import { Button } from "@/components/ui/button";
import {useRouter} from "next/navigation";
import {useTransition} from "react";
/** Retry only the optional course state; keep the visible lesson list mounted. */
export function LearnerCourseStateRetry(){
 const router=useRouter();
 const [pending,start]=useTransition();
 return <Button type="button" variant="secondary" disabled={pending} onClick={()=>start(()=>router.refresh())}
  className="mt-3 min-h-11 md:min-h-9">
  {pending?"Refreshing…":"Retry state"}
 </Button>;
}
