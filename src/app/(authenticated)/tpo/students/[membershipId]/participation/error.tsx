"use client";
import {Button} from "@/components/ui/button";
import {ErrorState} from "@/components/ui/error-state";
export default function TpoParticipationError({reset}:{error:Error & {digest?:string};reset:()=>void}){
 return <ErrorState title="Could not load participation decision"
 description="The learner may be outside your college, inactive or missing an unambiguous current enrollment. No decision was changed."
 action={<Button variant="secondary" className="min-h-11 w-full md:min-h-9 md:w-auto" onClick={reset}>Retry</Button>}/>;
}
