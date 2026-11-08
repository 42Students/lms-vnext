"use client";

import { useMemo, useState } from "react";
import AdminError from "@/app/(authenticated)/admin/error";
import AdminLoading from "@/app/(authenticated)/admin/loading";
import AdminMissing from "@/app/(authenticated)/admin/not-found";
import CollegeMissing from "@/app/(authenticated)/college-admin/not-found";
import HrError from "@/app/(authenticated)/hr/error";
import HrLoading from "@/app/(authenticated)/hr/loading";
import HrMissing from "@/app/(authenticated)/hr/not-found";
import TeachError from "@/app/(authenticated)/teach/error";
import TeachLoading from "@/app/(authenticated)/teach/loading";
import TeachMissing from "@/app/(authenticated)/teach/not-found";
import TeacherError from "@/app/(authenticated)/teacher/error";
import TeacherLoading from "@/app/(authenticated)/teacher/loading";
import TeacherMissing from "@/app/(authenticated)/teacher/not-found";

export type G184Role = "admin"|"college-admin"|"hr"|"teach"|"teacher";
export type G184State = "error"|"loading"|"not-found";

const errors={admin:AdminError,hr:HrError,teach:TeachError,teacher:TeacherError} as const;
const loading={admin:AdminLoading,hr:HrLoading,teach:TeachLoading,teacher:TeacherLoading} as const;
const missing={admin:AdminMissing,"college-admin":CollegeMissing,hr:HrMissing,teach:TeachMissing,teacher:TeacherMissing} as const;

/** Development-only preview caller; renders real registered route-state components, not screenshots. */
export function UXG184AuthenticatedStatesPreview({role,state}:{role:G184Role;state:G184State}) {
  const [retries,setRetries]=useState(0);
  const sentinel=useMemo(()=>Object.assign(new Error("PRIVATE_SENTINEL_DONT_RENDER"),{digest:"SECRET_NEXT_DIGEST"}),[]);
  if(state==="not-found") {
    const Missing=missing[role];
    return <section aria-label={role+" not-found preview"} className="min-w-0 space-y-3">
      <Missing/>
    </section>;
  }
  if(role==="college-admin")return null;
  if(state==="loading") {
    const Loading=loading[role];
    return <section aria-label={role+" loading preview"} className="min-w-0 space-y-3">
      <Loading/>
    </section>;
  }
  const ErrorComponent=errors[role];
  return <section aria-label={role+" error preview"} className="min-w-0 space-y-3">
    <ErrorComponent error={sentinel} reset={()=>setRetries(value=>value+1)}/>
    <p role="status">Safe retry count: {retries}</p>
  </section>;
}
