"use client";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
export function LearnerPlacementPartialAlert({missing}:{missing:readonly string[]}) {
  const router=useRouter();
  if(!missing.length)return null;
  return <aside role="alert" className="min-w-0 border-l-2 border-warning bg-warning-subtle px-4 py-3">
    <Heading level={2} size="sm" className="text-foreground">We could not load your placements</Heading>
    <p className="mt-2 text-sm text-body">
      Your data is safe. Check your connection and try again. Other sections may still show previously saved records.
    </p>
    <p className="mt-2 text-xs text-muted-foreground">Temporarily unavailable: {missing.join(", ")}.</p>
    <Button onClick={()=>router.refresh()} size="sm" className="mt-3 max-md:min-h-11">Retry</Button>
  </aside>;
}
