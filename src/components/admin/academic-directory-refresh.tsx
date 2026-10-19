"use client";
import {useTransition} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
export function AcademicDirectoryRefresh(){
 const router=useRouter(),[pending,start]=useTransition();
 return <Button type="button" variant="secondary" disabled={pending} onClick={()=>start(()=>router.refresh())}
  className="min-h-[var(--lms-control-height)] sm:min-h-[var(--lms-control-height)]"
  aria-busy={pending}>{pending?"Refreshing…":"Refresh"}</Button>;
}
