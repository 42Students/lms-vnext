"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { CollegeTermMappingManager } from "./college-term-mapping-manager";

type MappingRead = Parameters<typeof CollegeTermMappingManager>[0]["data"];

/** Preserve the last *same-college* semester mapping during a failed refresh.
 * Never accept an empty/incomplete response as a fresh snapshot, and never
 * allow writes based on potentially stale term/course authorization data.
 * The parent keys this component by the live college membership scope. */
export function CollegeTermMappingRetained({ data }: { data: MappingRead | null }) {
  const router = useRouter();
  const [lastGood, setLastGood] = useState<MappingRead | null>(data);
  useEffect(() => {
    if (data) setLastGood(data);
  }, [data]);
  const mapped = data ?? lastGood;
  if (!mapped) {
    return <ErrorState title="Semester–course mappings could not be loaded"
      description="The college curriculum could not be refreshed. No mappings were changed."
      action={<Button type="button" variant="secondary" onClick={() => router.refresh()}>
        Retry curriculum
      </Button>} />;
  }
  return <div className="min-w-0 space-y-4">
    {!data ? <Alert role="alert" tone="warning" title="Couldn't refresh semester course mapping">
      Last loaded mappings for this college are shown for reference. Saving or deleting
      mappings is paused until a fresh same-college read succeeds.
      {" "}<Button type="button" size="sm" variant="secondary"
        onClick={() => router.refresh()}>Retry curriculum</Button>
    </Alert> : null}
    <fieldset disabled={!data} className="min-w-0 border-0 p-0">
      <CollegeTermMappingManager data={mapped} readOnly={!data} />
    </fieldset>
  </div>;
}
