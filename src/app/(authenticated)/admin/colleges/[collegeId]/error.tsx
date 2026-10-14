"use client";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
export default function TenantDetailError({ reset }: { reset: () => void }) {
  return <ErrorState title="Tenant details could not be loaded" description="Retry to load the authorized tenant details."
    action={<Button onClick={reset}>Retry</Button>} />;
}
