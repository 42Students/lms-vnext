"use client";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
export function LearnerPlacementPartialAlert({missing}:{missing:readonly string[]}) {
  const router=useRouter();
  if(!missing.length)return null;
  return <aside role="alert" className="rounded-xl border border-warning bg-surface p-4 sm:p-5">
    <h2 className="text-sm font-semibold text-foreground">Some placement information did not load</h2>
    <p className="mt-2 text-sm text-body">
      Other sections are from your saved college records. Unavailable data is not zero, and
      you should not rely on this page as a complete placement summary until retry succeeds.
    </p>
    <p className="mt-2 text-xs text-muted-foreground">Temporarily unavailable: {missing.join(", ")}.</p>
    <Button onClick={()=>router.refresh()} size="sm">Retry unavailable information</Button>
  </aside>;
}
