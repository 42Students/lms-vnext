"use client";
import {useState} from "react";
import Link from "next/link";
import {Alert} from "@/components/ui/alert";
import {Button} from "@/components/ui/button";

/** Keep the authorized live panel visible while allowing a stale-data warning
 * to be dismissed. Retry is an explicit fresh server read, not fake zeros. */
export function TpoDriveDayLoadWarning(){
 const [dismissed,setDismissed]=useState(false);
 if(dismissed)return null;
 return <Alert tone="error" title="Couldn't load live attendance">
  <p>Today's live attendance totals may be stale or unavailable. No missing check-ins have been counted as zero.</p>
  <div className="mt-2 flex flex-wrap items-center gap-3">
   <Link href="/tpo/drive-day" className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Retry</Link>
   <Button type="button" size="sm" variant="secondary" onClick={()=>setDismissed(true)}>Dismiss</Button>
  </div>
 </Alert>;
}
