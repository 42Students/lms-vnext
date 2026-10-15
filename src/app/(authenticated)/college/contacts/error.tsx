"use client";
import Link from "next/link";
import {ErrorState} from "@/components/ui/error-state";
export default function Error({reset}:{error:Error&{digest?:string};reset:()=>void}){
 return <ErrorState title="Contact directory unavailable" description="No contact records could be loaded. Retry safely or reset filters."
 action={<div className="flex flex-wrap gap-2"><button type="button" onClick={reset} className="rounded-md border px-4 py-2">Retry</button>
 <Link href="/college/contacts" className="rounded-md border px-4 py-2">Clear filters</Link></div>}/>;
}