"use client";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
export default function Error({reset}:{error:Error&{digest?:string};reset:()=>void}){
 return <section role="alert" className="space-y-3 border-b border-border pb-4">
  <PageHeader title={"Resource directory could not load"} />
  <p className="text-sm text-body">A failed read does not mean no resources are registered.</p>
  <Button type="button" variant="secondary" onClick={reset}>Retry</Button>
 </section>;
}
