"use client";
import {useTransition} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
export function CollegeDrivesRefreshButton(){
 const router=useRouter();
 const [pending,start]=useTransition();
 return <Button type="button" variant="secondary" size="sm" disabled={pending}
  aria-label="Refresh drives" className="min-h-11 md:min-h-9"
  onClick={()=>start(()=>router.refresh())}>
  {pending?"Refreshing drives…":"Refresh"}
 </Button>;
}
