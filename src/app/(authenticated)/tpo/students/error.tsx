"use client";
import {Button} from "@/components/ui/button";
import {ErrorState} from "@/components/ui/error-state";
export default function TpoStudentsError({reset}:{error:Error & {digest?:string};reset:()=>void}){
 return <ErrorState title="Could not load students"
 description="College-wide learner and placement data could not be retrieved. This failure is not interpreted as zero registrations, applications or placements."
 action={<Button variant="secondary" onClick={reset}>Retry</Button>}/>;
}
