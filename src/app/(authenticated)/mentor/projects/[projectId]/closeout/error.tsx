"use client";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
export default function Error({reset}:{error:Error&{digest?:string};reset:()=>void;}){
  return <section role="alert" className="min-w-0 max-w-full space-y-3 border-b border-border pb-4"><PageHeader title={"Closeout could not load"} /><p className="text-sm text-body">The read failed; project status is unknown.</p><Button type="button" variant="secondary" className="min-h-11 md:min-h-9" onClick={reset}>Retry</Button></section>;
}