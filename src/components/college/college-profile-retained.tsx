"use client";

import Link from "next/link";
import {useEffect,useState,type ComponentProps} from "react";
import {CollegeAdminProfileEditor} from "./college-admin-profile-editor";
import {ErrorState} from "@/components/ui/error-state";

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
  {failed?<ErrorState title="Couldn't refresh profile"
   description={snapshot?"Showing the last profile we loaded.":"No saved profile is available yet. Retry to load your profile."}
   action={<Link href="/college/profile" prefetch={false}
    className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 font-semibold text-link hover:bg-surface-subtle md:min-h-9">Retry</Link>}/>:null}
  {snapshot?<CollegeAdminProfileEditor initial={snapshot.profile}
    email={snapshot.email} phone={snapshot.phone} college={snapshot.college}/>:null}
 </div>;
}
