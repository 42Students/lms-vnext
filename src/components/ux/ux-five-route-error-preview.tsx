"use client";

import { useState } from "react";
import CollegeDepartmentsError from "@/app/(authenticated)/college-admin/departments/error";
import CollegeProgramsError from "@/app/(authenticated)/college-admin/programs/error";
import TenantSetupError from "@/app/(authenticated)/admin/tenants/setup/error";
import VideosError from "@/app/(authenticated)/admin/videos/error";
import CollegeDrivesError from "@/app/(authenticated)/college/placements/drives/error";

/** Synthetic recovery preview; parent is gated by an explicit development-only flag. */
export function UXFiveRouteErrorPreview() {
  const [departmentRetries, setDepartmentRetries] = useState(0);
  const [programRetries, setProgramRetries] = useState(0);
  const [tenantRetries,setTenantRetries] = useState(0);
  const [videosRetries,setVideosRetries] = useState(0);
  const [drivesRetries,setDrivesRetries] = useState(0);
  return <>
    <section aria-label="College Admin department recovery" className="min-w-0 space-y-2 border-b border-border pb-6">
      <h2 className="text-lg font-semibold">Department recovery</h2>
      <CollegeDepartmentsError error={new Error("synthetic browser fixture")}
        reset={() => setDepartmentRetries(value => value + 1)} />
      <p role="status">Department retry count: {departmentRetries}</p>
    </section>
    <section aria-label="College Admin program recovery" className="min-w-0 space-y-2 border-b border-border pb-6">
      <h2 className="text-lg font-semibold">Program recovery</h2>
      <CollegeProgramsError error={new Error("synthetic browser fixture")}
        reset={() => setProgramRetries(value => value + 1)} />
      <p role="status">Program retry count: {programRetries}</p>
    </section>
    <section aria-label="Tenant Setup recovery" className="min-w-0 space-y-2 border-b border-border pb-6">
      <h2 className="text-lg font-semibold">Tenant Setup recovery</h2>
      <TenantSetupError error={new Error("synthetic browser fixture")}
        reset={() => setTenantRetries(value => value + 1)} />
      <p role="status">Tenant retry count: {tenantRetries}</p>
    </section>
    <section aria-label="Video directory recovery" className="min-w-0 space-y-2 border-b border-border pb-6">
      <h2 className="text-lg font-semibold">Video directory recovery</h2>
      <VideosError error={new Error("synthetic browser fixture")}
        reset={() => setVideosRetries(value => value + 1)} />
      <p role="status">Video retry count: {videosRetries}</p>
    </section>
    <section aria-label="College drives recovery" className="min-w-0 space-y-2 border-b border-border pb-6">
      <h2 className="text-lg font-semibold">College drives recovery</h2>
      <CollegeDrivesError error={new Error("synthetic browser fixture")}
        reset={() => setDrivesRetries(value => value + 1)} />
      <p role="status">Drives retry count: {drivesRetries}</p>
    </section>
  </>;
}
