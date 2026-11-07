"use client";
import { TextLink } from "@/components/ui/text-link";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
export default function ErrorView({reset}:{error:Error&{digest?:string};reset:()=>void}){
 return <div className="min-w-0 max-w-full space-y-4">
  <PageHeader title="Drive messages"/>
  <ErrorState title="Drive messages unavailable" description="Could not load this employer conversation."
   action={<span className="inline-flex min-w-0 flex-wrap items-center gap-3"><Button type="button" variant="secondary" onClick={reset} className="min-h-11 md:min-h-9">Retry</Button><TextLink href="/hr/drives" className="inline-flex min-h-11 items-center justify-center px-3 text-sm md:min-h-9">Back to drives</TextLink></span>}/>
 </div>;
}
