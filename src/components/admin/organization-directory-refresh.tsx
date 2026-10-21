"use client";
import {useTransition} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";

export function OrganizationDirectoryRefresh(){
 const router=useRouter();
 const [pending,startTransition]=useTransition();
 return <Button type="button" variant="secondary" disabled={pending} loading={pending}
   onClick={()=>startTransition(()=>router.refresh())} aria-label="Refresh organizations">
   <span aria-hidden="true">↻</span> {pending?"Refreshing…":"Refresh"}
 </Button>;
}
