"use client";
import {useEffect,useState,type ComponentProps} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {CollegeContentAggregate} from "@/components/courses/college-content-aggregate";

type ContentPage=ComponentProps<typeof CollegeContentAggregate>["data"];

/** Retain same-scope rows across a failed server refresh, never across colleges or filters. */
export function CollegeResourceLastGood({data}:{data:ContentPage|null}) {
  const router=useRouter();
  const [lastGood,setLastGood]=useState<ContentPage|null>(data);
  useEffect(()=>{if(data)setLastGood(data);},[data]);
  const displayed=data??lastGood;
  return <section className="min-w-0 space-y-3" aria-label="Resource catalogue">
    {!data?<div className="flex flex-wrap items-center gap-3 rounded-lg border border-border px-4 py-3" role="alert">
      <p className="flex-1 text-sm text-body">
        Couldn't refresh resources. {displayed?"Showing the last loaded results for these filters.":"No saved results are available for these filters."}
      </p>
      <Button type="button" variant="secondary" onClick={()=>router.refresh()}>Retry</Button>
    </div>:null}
    {displayed?<CollegeContentAggregate showHeader={false} data={displayed}/>:null}
  </section>;
}
