"use client";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
export default function ErrorView({reset}:{error:Error&{digest?:string};reset:()=>void}){
 return <>
  <PageHeader title="Drive messages"/>
  <ErrorState title="Drive messages unavailable" description="Could not load this employer conversation."
   action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}/>
 </>;
}
