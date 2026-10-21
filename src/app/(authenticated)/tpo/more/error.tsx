"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { TpoMoreNavigation } from "@/components/tpo/tpo-more-navigation";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="min-w-0 space-y-4"><PageHeader title="More" /><ErrorState
    title="\n        Unable to load More\n      "
    description="The TPO navigation page could not be loaded.\n        Existing sidebar destinations remain available."
    action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}
  />
  <p role="status" className="text-sm text-muted-foreground">You can still open the tools below. Counts may be unavailable until refresh succeeds.</p>
  <TpoMoreNavigation />
 </div>;
}
