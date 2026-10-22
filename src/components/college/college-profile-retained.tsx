"use client";

import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {useEffect,useState,useTransition,type ComponentProps} from "react";
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
 const router=useRouter();
 const [refreshPending,startRefresh]=useTransition();
 const retry=()=>startRefresh(()=>router.refresh());
 const [remembered,setRemembered]=useState<ProfileSnapshot|null>(current);
 useEffect(()=>{if(current)setRemembered(current)},[current]);
 const snapshot=current??remembered;
 return <div className="min-w-0 space-y-4" aria-busy={refreshPending}>
  {failed&&snapshot?<Alert tone="warning" role="alert" title="Couldn't refresh profile">
   <div className="flex min-w-0 flex-wrap items-center gap-3">
    <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none"
     stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
     <path d="M12 3 2 21h20L12 3Z"/><path d="M12 9v5M12 18h.01"/>
    </svg>
    <p className="min-w-0 flex-1">Showing the last profile we loaded.</p>
    <Button type="button" variant="secondary" size="sm"
     className="min-h-11 md:min-h-9" disabled={refreshPending} onClick={retry}>
     {refreshPending?"Refreshing profile…":"Retry"}
    </Button>
   </div>
  </Alert>:null}
  {failed&&!snapshot?<ErrorState title="Failed to load profile."
   description="Your profile could not be loaded. Try again."
   action={<Button type="button" variant="secondary" size="sm"
    className="min-h-11 md:min-h-9" disabled={refreshPending} onClick={retry}>
     {refreshPending?"Refreshing profile…":"Retry"}
    </Button>}/>:null}
  {snapshot?<CollegeAdminProfileEditor readOnly={failed} initial={snapshot.profile}
    email={snapshot.email} phone={snapshot.phone} college={snapshot.college}/>:null}
 </div>;
}
