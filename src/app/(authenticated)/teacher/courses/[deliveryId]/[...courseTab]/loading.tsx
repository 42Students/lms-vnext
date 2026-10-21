"use client";
import {usePathname} from "next/navigation";
import {GracefulPageLoading} from "@/components/ui/graceful-page-loading";

/** The legacy CourseTabSkeleton changed with the active tab. Keep these
 * purely decorative shapes stable while data and membership scope load. */
export default function Loading(){
 const path=usePathname()??"";
 const section=path.split("/").filter(Boolean).slice(3).join("/").toLowerCase();
 const roster=/students|roster|learners/.test(section);
 const attendance=/attendance|schedule/.test(section);
 const chat=/chat|messages|discussion/.test(section);
 const tree=/content|lesson|resource|assignment|quiz/.test(section);
 const label=roster?"Loading class roster…":attendance?"Loading attendance…":
  chat?"Loading course chat…":tree?"Loading course content…":"Loading course workspace…";
 return <div className="min-w-0 space-y-3">
  <GracefulPageLoading label={label} shape={roster||attendance?"directory":"faculty-course"}/>
  <div aria-hidden="true" className="space-y-3 border-t border-border pt-4">
   {chat?
    <div className="space-y-3">
     {Array.from({length:3},(_,i)=><div key={i}
       className={"h-12 animate-pulse rounded-[var(--lms-control-radius)] bg-muted "+(i%2?"ml-16 w-2/3":"mr-16 w-2/3")}/>)}
    </div>:
    roster||attendance?
    <div className="space-y-2">
     <div className="h-9 animate-pulse rounded bg-muted"/>
     {Array.from({length:5},(_,i)=><div key={i} className="h-10 animate-pulse rounded bg-muted/70"/>)}
    </div>:
    tree?<div className="space-y-2">
     {Array.from({length:4},(_,i)=><div key={i} className="flex gap-3">
       <div className="h-9 w-9 shrink-0 animate-pulse rounded bg-muted"/>
       <div className="h-9 flex-1 animate-pulse rounded bg-muted/70"/>
      </div>)}
    </div>:null}
  </div>
 </div>;
}
