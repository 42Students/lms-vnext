"use client";
import {usePathname} from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { TextLink } from "@/components/ui/text-link";
import { SkeletonBlock } from "@/components/ui/skeleton-block";
const names:Record<string,string>={home:"Course overview",lessons:"Lessons",content:"Content",
 assignments:"Assignments",quizzes:"Quizzes",attendance:"Attendance",progress:"Progress",
 resources:"Resources",live:"Live classes",roadmap:"Learning Path"};
export default function Loading(){
 const path=usePathname();
 const key=path.split("/").filter(Boolean).at(-1)??"home";
 const label=names[key]??"Course workspace";
 return <div role="status" aria-live="polite" aria-busy="true"
   aria-label={"Loading "+label} className="min-w-0 space-y-4">
  <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
   <PageHeader title={`Loading ${label}`} />
   <TextLink href="/learn/courses" className="inline-flex min-h-11 items-center text-sm md:min-h-9">All courses</TextLink>
  </div>
  <div className="space-y-4" aria-hidden="true">
   {key==="home"?<span className="sr-only">Loading recent updates</span>:null}
   <SkeletonBlock className="h-10 max-w-[700px]" />
   <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
    {Array.from({length:4},(_,i)=><div key={i} className="rounded border border-border p-4">
     <SkeletonBlock className="h-3 w-20" /><SkeletonBlock className="mt-3 h-6 w-14" />
    </div>)}
   </div>
   {Array.from({length:key==="home"||key==="lessons"||key==="roadmap"?5:3},(_,i)=>
    <div key={i} className="flex min-h-16 items-center gap-4 rounded border border-border px-4 py-3">
     <SkeletonBlock className="size-9 shrink-0" /><div className="flex-1 space-y-2">
      <SkeletonBlock className="h-4 w-1/2" /><SkeletonBlock className="h-3 w-3/4" />
     </div></div>)}
  </div>
 </div>;
}
