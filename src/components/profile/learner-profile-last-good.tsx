"use client";
import {useEffect,useState,type ReactNode} from "react";
import Link from "next/link";

/** Retain only the last successfully server-authorized view in this mounted
 * tab. No browser storage, global cache or cross-membership snapshot.
 * Stale content is read-only so profile writes cannot use old revisions.
 */
export function LearnerProfileLastGood({failed,scopeKey,children}:{
 failed:boolean;scopeKey:string;children:ReactNode;
}){
 const [saved,setSaved]=useState<{scope:string;view:ReactNode}|null>(null);
 useEffect(()=>{
  if(!failed)setSaved({scope:scopeKey,view:children});
 },[failed,scopeKey,children]);
 const last=failed&&saved?.scope===scopeKey?saved.view:null;
 if(!last)return <>{children}</>;
 return <div className="min-w-0 space-y-4">
  <section role="alert" className="flex min-w-0 flex-wrap items-center gap-3 rounded-lg border border-warning-border bg-warning-subtle px-4 py-3 text-sm">
   <span aria-hidden="true">⚠</span>
   <div className="min-w-0 flex-1 text-body"><strong className="block font-semibold">Couldn&apos;t refresh profile</strong>
    <p>Showing the last profile we loaded.</p>
    <p className="text-xs">This saved view may be out of date and cannot be edited until refresh succeeds.</p>
   </div>
   <Link href="/learn/profile" className="inline-flex min-h-11 items-center rounded-lg border border-border bg-surface px-3 font-semibold text-link underline md:min-h-9">Retry</Link>
  </section>
  <div inert aria-label="Last successfully loaded profile (read-only)">
   {last}
  </div>
 </div>;
}
