"use client";

import {useRouter} from "next/navigation";
import {useTransition} from "react";
import {Button} from "@/components/ui/button";

/** Refresh the currently selected college and filter scope without a full reload. */
export function CollegeInterviewRefresh(){
 const router=useRouter();
 const [refreshing,startRefresh]=useTransition();
 return <Button type="button" variant="secondary" loading={refreshing}
  onClick={()=>startRefresh(()=>router.refresh())}
  aria-label={refreshing?"Refreshing interviews":"Refresh interviews"}>
  {refreshing?"Refreshing…":"Refresh"}
 </Button>;
}
