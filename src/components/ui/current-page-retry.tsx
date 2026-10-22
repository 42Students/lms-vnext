"use client";
import {useRouter} from "next/navigation";
import {useTransition} from "react";
import {Button} from "@/components/ui/button";

/** Retry a failed RSC read without changing the selected filters or college.
 * Navigating to an identical href can reuse cached route state instead. */
export function CurrentPageRetry({label="Retry"}:{label?:string}={}){
 const router=useRouter();
 const [pending,start]=useTransition();
 return <Button type="button" variant="secondary" disabled={pending}
  className="min-h-11 w-full sm:w-auto md:min-h-9"
  onClick={()=>start(()=>router.refresh())}>
   {pending?"Refreshing…":label}
 </Button>;
}
