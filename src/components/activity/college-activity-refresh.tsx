"use client";

import {useTransition} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";

export function CollegeActivityRefresh(){
  const router=useRouter();
  const [pending,startTransition]=useTransition();
  return <span className="inline-flex items-center gap-2">
    <Button variant="secondary" type="button" disabled={pending}
      onClick={()=>startTransition(()=>router.refresh())}
      className="min-h-11 md:min-h-9">{pending?"Refreshing activity…":"Refresh"}</Button>
    {pending?<span role="status" className="text-xs text-muted-foreground">Refreshing activity…</span>:null}
  </span>;
}
