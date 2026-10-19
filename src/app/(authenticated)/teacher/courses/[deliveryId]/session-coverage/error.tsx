"use client";
import { PageHeader } from "@/components/ui/page-header";
import {Button} from "@/components/ui/button";
export default function Error({reset}:{error:Error&{digest?:string};reset:()=>void}){
  return <section role="alert" className="space-y-3 rounded-xl border border-border p-5">
    <PageHeader title={"Attendance session coverage could not load"} /><p>The read failed. Missing results are not assumed to be zero.</p>
    <Button variant="secondary" type="button" onClick={reset} >Retry</Button>
  </section>;
}
