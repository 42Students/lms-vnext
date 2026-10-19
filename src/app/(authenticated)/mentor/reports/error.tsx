"use client";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
export default function Error({reset}:{error:Error&{digest?:string};reset:()=>void}){
  return <Alert tone="error" className="space-y-3">
    <h1 className="text-[30px] font-semibold leading-[1.35] tracking-[-0.02em] text-[var(--lms-heading)]">Mentor reports could not load</h1>
    <p className="text-sm text-body">No project summary can be inferred from this failed read.</p>
    <Button type="button" variant="secondary" onClick={reset}>Retry</Button>
  </Alert>;
}
