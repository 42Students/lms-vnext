import {Button} from "@/components/ui/button";
"use client";
export default function Error({reset}:{error:Error&{digest?:string};reset:()=>void}){
  return <section role="alert" className="space-y-3 rounded-xl border border-border p-5">
    <h1 className="text-[30px] font-semibold text-[var(--lms-heading)]">Attendance session coverage could not load</h1><p>The read failed. Missing results are not assumed to be zero.</p>
    <Button variant="secondary" type="button" onClick={reset} >Retry</Button>
  </section>;
}
