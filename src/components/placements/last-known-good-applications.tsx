"use client";
import {useEffect,useState,type ReactNode} from "react";
import Link from "next/link";

/** Keep the last successful *page-local* view when a refresh fails.
 * The server supplies a scope-specific React key (college, drive, filters),
 * so a different tenant or changed query can never inherit stale rows.
 * Snapshot content is inert: no stage mutation/export from unverified data.
 */
export function LastKnownGoodApplications({valid,retryHref,children}:{
 valid:boolean;retryHref:string;children:ReactNode;
}){
 const [snapshot,setSnapshot]=useState<ReactNode|null>(()=>valid?children:null);
 useEffect(()=>{if(valid)setSnapshot(children);},[valid,children]);
 if(valid||!snapshot)return <>{children}</>;
 return <section className="min-w-0 space-y-4" aria-label="Applications refresh failed">
  <div role="alert" className="flex flex-wrap items-center gap-3 border-l-4 border-warning bg-warning-subtle px-4 py-3 text-sm text-body">
   <span>Unable to refresh applications. The previous page is shown below as outdated,
    read-only data and may have changed. Try again before taking any action.</span>
   <Link href={retryHref}
    className="inline-flex min-h-11 items-center font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2">
    Retry applications
   </Link>
  </div>
  <div inert className="min-w-0 opacity-75" aria-label="Outdated application snapshot">
   {snapshot}
  </div>
 </section>;
}
