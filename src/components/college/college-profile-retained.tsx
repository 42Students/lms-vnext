"use client";

import Link from "next/link";
import {useEffect,useState,type ComponentProps} from "react";
import {CollegeAdminProfileEditor} from "./college-admin-profile-editor";
import {ErrorState} from "@/components/ui/error-state";
import {Alert} from "@/components/ui/alert";

type ProfileSnapshot={
 profile:ComponentProps<typeof CollegeAdminProfileEditor>["initial"];
 email:string|null;phone:string|null;college:string|null;
};

/** Keep the last successful snapshot *in memory only* through a failed
 * router.refresh(). The parent keys this component by active membership:
 * another user or college never inherits the previous profile or its PII.
 * A direct page reload with no snapshot correctly reports no cached data.
 */
export function CollegeProfileRetained({current,failed}:{
 current:ProfileSnapshot|null;failed:boolean;
}){
 const [remembered,setRemembered]=useState<ProfileSnapshot|null>(current);
 useEffect(()=>{if(current)setRemembered(current)},[current]);
 const snapshot=current??remembered;
 return <div className="min-w-0 space-y-4">
  {failed&&snapshot?<Alert tone="warning" role="alert" title="Couldn't refresh profile">
   <div className="flex min-w-0 flex-wrap items-center gap-3">
    <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none"
     stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
     <path d="M12 3 2 21h20L12 3Z"/><path d="M12 9v5M12 18h.01"/>
    </svg>
    <p className="min-w-0 flex-1">Showing the last profile we loaded.</p>
    <Link href="/college/profile" prefetch={false}
     className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3 text-sm font-semibold text-link underline underline-offset-2 hover:bg-[var(--lms-primary-subtle)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Retry</Link>
   </div>
  </Alert>:null}
  {failed&&!snapshot?<ErrorState title="Failed to load profile."
   description="Your profile could not be loaded. Try again."
   action={<Link href="/college/profile" prefetch={false}
    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-4 font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Retry</Link>}/>:null}
  {snapshot?<CollegeAdminProfileEditor readOnly={failed} initial={snapshot.profile}
    email={snapshot.email} phone={snapshot.phone} college={snapshot.college}/>:null}
 </div>;
}
