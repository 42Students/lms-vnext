"use client";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
export default function UnassignedUsersError({ reset }: { reset: () => void }) {
  return <ErrorState title="Global identities could not be loaded" description="The directory is unavailable. Retry to load an authorized view."
    action={<Button onClick={reset}>Retry</Button>} />;
}
