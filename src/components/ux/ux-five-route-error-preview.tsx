"use client";

import { useState } from "react";
import CollegeDepartmentsError from "@/app/(authenticated)/college-admin/departments/error";
import CollegeProgramsError from "@/app/(authenticated)/college-admin/programs/error";

/** Synthetic recovery preview; parent is gated by an explicit development-only flag. */
export function UXFiveRouteErrorPreview() {
  const [departmentRetries, setDepartmentRetries] = useState(0);
  const [programRetries, setProgramRetries] = useState(0);
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
  </>;
}
