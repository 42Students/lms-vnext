"use client";

import {useEffect, useState, type ReactNode} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Banner} from "@/components/ui/banner";

type ViewSelection = {view:ReactNode;stale:boolean};

/** Reuse a successful view only within the same scope-keyed component.
 * The parent keys by user, college, job and all validated search parameters. */
export function selectApplicationsView(
  current:ReactNode, previous:ReactNode | null, failed:boolean,
):ViewSelection {
  if(failed && previous!==null)return {view:previous,stale:true};
  return {view:current,stale:false};
}

export function AdminDriveApplicationsRetained({
  children,failed=false,
}:{
  children:ReactNode;failed?:boolean;retryHref?:string;
}){
  const router=useRouter();
  const [retrying,setRetrying]=useState(false);
  const [lastSuccess,setLastSuccess]=useState<ReactNode|null>(
    ()=>failed?null:children,
  );
  useEffect(()=>{
    setRetrying(false);
    if(!failed)setLastSuccess(children);
  },[children,failed]);
  const selected=selectApplicationsView(children,lastSuccess,failed);
  return <div className="min-w-0 space-y-4">
    {selected.stale?<Banner tone="warning" role="alert"
      action={<Button type="button" size="sm" variant="secondary"
        className="min-h-11 md:min-h-9" disabled={retrying}
        onClick={()=>{setRetrying(true);router.refresh();}}>
        {retrying?"Refreshing applications…":"Retry applications"}
      </Button>}>
      Applications could not be refreshed. Showing the last successful result for this college and these filters. This snapshot is read-only until a successful refresh.
    </Banner>:null}
    <div inert={selected.stale} aria-disabled={selected.stale||undefined}>
      {selected.view}
    </div>
  </div>;
}
