"use client";
import {useRouter} from "next/navigation";
import {useTransition} from "react";
import {Button} from "@/components/ui/button";
/** Reloads this URL and its active college scope without leaking prior rows. */
export function ProjectWorkspaceRefreshButton(){
 const router=useRouter();
 const [pending,startTransition]=useTransition();
 return <Button type="button" variant="secondary" size="sm" disabled={pending}
  aria-label="Refresh project workspaces"
  className="min-h-11 w-full md:min-h-9 md:w-auto"
  onClick={()=>startTransition(()=>router.refresh())}>
  {pending?"Refreshing…":"Refresh"}
 </Button>;
}
