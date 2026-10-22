"use client";

import Link from "next/link";
import {useEffect,useState,type ReactNode} from "react";
import {Banner} from "@/components/ui/banner";
import {ErrorState} from "@/components/ui/error-state";

/** Per-mounted user/college/drive snapshot; never cache candidate names or
 * emails on disk, and never let stale pipeline mutation controls stay active.
 * The stable key on the server page ensures role and drive switches remount. */
export function CollegeShortlistedLastGood({available,children,retryHref,closeHref}:{
 available:boolean;children:ReactNode;retryHref:string;closeHref:string;
}){
 const [lastGood,setLastGood]=useState<ReactNode>(()=>available?children:null);
 useEffect(()=>{if(available)setLastGood(children);},[available,children]);
 if(available)return <>{children}</>;
 const actions=<nav aria-label="Shortlisted refresh recovery" className="flex flex-wrap gap-4">
  <Link href={retryHref} className="inline-flex min-h-11 items-center font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Retry</Link>
  <Link href={closeHref} className="inline-flex min-h-11 items-center font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Close</Link>
 </nav>;
 return <section aria-label="Shortlisted data refresh" className="min-w-0 space-y-4">
  <ErrorState title="Could not refresh shortlisted applications"
   description="The latest applications could not be verified for this drive. No stage changes were made."
   action={actions}/>
  {lastGood?<>
   <Banner tone="warning" role="alert">
    Previous shortlisted results are visible for reference only. The list and stage controls
    are disabled until a fresh college-scoped response succeeds.
   </Banner>
   <div inert aria-label="Previous shortlisted results; actions disabled" className="min-w-0 opacity-70">
    {lastGood}
   </div>
  </>:null}
 </section>;
}
