"use client";

import {useEffect, useState, type ReactNode} from "react";
import Link from "next/link";
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
  children,failed=false,retryHref,
}:{
  children:ReactNode;failed?:boolean;retryHref:string;
}){
  const [lastSuccess,setLastSuccess]=useState<ReactNode|null>(
    ()=>failed?null:children,
  );
  useEffect(()=>{
    if(!failed)setLastSuccess(children);
  },[children,failed]);
  const selected=selectApplicationsView(children,lastSuccess,failed);
  return <div className="min-w-0 space-y-4">
    {selected.stale?<Banner tone="warning" role="alert"
      action={<Link href={retryHref}
        className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 font-semibold text-link underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
        Retry applications
      </Link>}>
      Applications could not be refreshed. Showing the last successful result for this college and these filters. This snapshot is read-only until a successful refresh.
    </Banner>:null}
    <div inert={selected.stale} aria-disabled={selected.stale||undefined}>
      {selected.view}
    </div>
  </div>;
}
