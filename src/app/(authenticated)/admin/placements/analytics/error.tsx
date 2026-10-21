"use client";

import { GracefulErrorBoundary } from "@/components/public/graceful-error-boundary";
import { Banner } from "@/components/ui/banner";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import {useState} from "react";

/** GR-20: route-specific fallback that keeps a retry visible. */
export default function RouteError({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [warningDismissed,setWarningDismissed]=useState(false);
  return <div className="min-w-0 space-y-4">
    <PageHeader title="Placement Analytics"/>
    {!warningDismissed?<Banner tone="warning" role="alert">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p>Couldn&apos;t refresh hiring metrics. The requested hiring data could not be verified.
        This fallback does not display stale or zero-filled figures from another scope.</p>
        <Button type="button" variant="ghost" size="sm" onClick={()=>setWarningDismissed(true)}>Dismiss</Button>
      </div>
    </Banner>:null}
    <GracefulErrorBoundary error={error} reset={reset}/>
  </div>;
}
