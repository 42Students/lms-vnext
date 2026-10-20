"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function TeamError({reset}:{error:Error&{digest?:string};reset:()=>void}) {
 return <ErrorState title="Placement team unavailable"
  description="Team membership could not be loaded. This does not mean the team is empty."
  action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>} />;
}
