"use client";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
export default function Error({reset}:{error:Error&{digest?:string};reset:()=>void;}){
  return <section role="alert" className="space-y-3"><PageHeader title={"Closeout could not load"} /><p className="text-sm text-body">The read failed; project status is unknown.</p><Button type="button" variant="secondary" onClick={reset}>Retry</Button></section>;
}