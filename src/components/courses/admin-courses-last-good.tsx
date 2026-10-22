"use client";

import Link from "next/link";
import {useEffect,useState,type ReactNode} from "react";
import {Banner} from "@/components/ui/banner";
import {ErrorState} from "@/components/ui/error-state";

/** Retain only this mounted, authorized page's last successful React tree.
 * Never persist private directory content in browser storage or serve a cache
 * across a college/user switch. The stale tree is inert until a fresh read
 * revalidates college access, so stale forms and mutation controls cannot run.
 */
export function AdminCoursesLastGood({available,children,retryHref}:{
 available:boolean;children:ReactNode;retryHref:string;
}){
 const [lastGood,setLastGood]=useState<ReactNode>(()=>available?children:null);
 useEffect(()=>{if(available)setLastGood(children);},[available,children]);
 if(available)return <>{children}</>;
 return <section aria-label="Courses refresh recovery" className="min-w-0 space-y-4">
  {lastGood?<>
   <Banner tone="warning" role="alert">
    The course directory could not be refreshed. Previously loaded rows are shown for reference only;
    editing is disabled until the selected college is revalidated.
    <Link href={retryHref} className="ml-2 inline-flex min-h-11 items-center font-semibold underline md:min-h-9">Retry loading courses</Link>
   </Banner>
   <div inert aria-label="Previously loaded courses; controls disabled" className="min-w-0 opacity-70">
    {lastGood}
   </div>
  </>:<ErrorState title="Could not load courses"
   description="The courses for this college could not be loaded. Your existing changes were not affected."
   action={<Link href={retryHref} className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Retry loading courses</Link>}/>}
 </section>;
}
