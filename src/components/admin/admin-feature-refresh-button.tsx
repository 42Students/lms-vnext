"use client";
import {useRouter} from "next/navigation";
import {useTransition} from "react";
import {Button} from "@/components/ui/button";
export function AdminFeatureRefreshButton(){
 const router=useRouter();
 const [pending,startTransition]=useTransition();
 return <Button type="button" size="sm" variant="secondary" disabled={pending}
  aria-label="Refresh feature controls" className="min-h-11 w-full sm:w-auto md:min-h-9"
  onClick={()=>startTransition(()=>router.refresh())}>
  {pending?"Refreshing…":"Refresh"}
 </Button>;
}
