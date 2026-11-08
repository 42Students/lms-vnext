"use client";
import { useState, type ComponentType } from "react";
import { Heading } from "@/components/ui/heading";
import G098 from "@/app/(authenticated)/tpo/batches/error";
import G099 from "@/app/(authenticated)/tpo/batches/[batchId]/history/error";
import G100 from "@/app/(authenticated)/tpo/calendar/error";
import G101 from "@/app/(authenticated)/tpo/calendar/interviews/error";
import G102 from "@/app/(authenticated)/tpo/companies/[companyId]/people/error";
import G104 from "@/app/(authenticated)/tpo/messages/error";
import G105 from "@/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants-pipeline/error";
import G106 from "@/app/(authenticated)/tpo/placements/jobs/[jobId]/close-preview/error";
import G107 from "@/app/(authenticated)/tpo/placements/jobs/[jobId]/joining/error";
import G108 from "@/app/(authenticated)/tpo/placements/jobs/[jobId]/offers/[offerId]/error";

export const UX_TPO_TEN_GROUPS = ["UX-G098","UX-G099","UX-G100","UX-G101","UX-G102","UX-G104","UX-G105","UX-G106","UX-G107","UX-G108"] as const;
type RecoveryProps = { error: Error & { digest?: string }; reset: () => void };
const errorViews: Record<typeof UX_TPO_TEN_GROUPS[number],ComponentType<RecoveryProps>> = {
  "UX-G098":G098,"UX-G099":G099,"UX-G100":G100,"UX-G101":G101,
  "UX-G102":G102,"UX-G104":G104,"UX-G105":G105,"UX-G106":G106,
  "UX-G107":G107,"UX-G108":G108,
};

/** Renders production recovery components with an inert client-only error, never user data. */
export function TpoTenRecoveryHarness({group}:{group:string}) {
  const [retries,setRetries] = useState(0);
  if (!UX_TPO_TEN_GROUPS.includes(group as typeof UX_TPO_TEN_GROUPS[number])) return null;
  const Selected = errorViews[group as typeof UX_TPO_TEN_GROUPS[number]];
  return <section aria-label={group+" recovery"} className="min-w-0 space-y-5">
    <Heading level={1}>{group} recovery acceptance</Heading>
    <Selected error={new Error("fixture-private-tenant-token")} reset={() => setRetries(count=>count+1)} />
    <p role="status" aria-live="polite">Retry count: {retries}</p>
  </section>;
}
