"use client";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
export default function Error({reset}:{error:Error&{digest?:string};reset:()=>void}){
 return <section role="alert" className="min-w-0 max-w-full space-y-3 border-b border-border pb-4">
  <PageHeader title={"Resource directory could not load"} />
  <p className="text-sm text-body">A failed read does not mean no resources are registered.</p>
  <Button type="button" variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={reset}>Retry</Button>
 </section>;
}
