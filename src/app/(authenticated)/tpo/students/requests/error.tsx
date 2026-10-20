"use client";
import {Button} from "@/components/ui/button";
import {ErrorState} from "@/components/ui/error-state";
export default function TpoStudentRequestsError({reset}:{error:Error & {digest?:string};reset:()=>void}){
 return <ErrorState title="Couldn't load Student Requests"
 description="The global placement request queue could not be retrieved. No request status, count or empty result is inferred from this failure."
 action={<Button variant="secondary" onClick={reset}>Retry</Button>}/>;
}
