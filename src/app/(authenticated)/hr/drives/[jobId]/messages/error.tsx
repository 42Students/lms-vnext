"use client";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
export default function ErrorView({reset}:{error:Error&{digest?:string};reset:()=>void}){
 return <div className="min-w-0 max-w-full space-y-4">
  <PageHeader title="Drive messages"/>
  <ErrorState title="Drive messages unavailable" description="Could not load this employer conversation."
   action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}/>
 </div>;
}
