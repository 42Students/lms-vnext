"use client";
import {useTransition} from "react";
import {useRouter} from "next/navigation";
export function AcademicDirectoryRefresh(){
 const router=useRouter(),[pending,start]=useTransition();
 return <button type="button" disabled={pending} onClick={()=>start(()=>router.refresh())}
  className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text disabled:opacity-50"
  aria-busy={pending}>{pending?"Refreshing…":"Refresh"}</button>;
}
