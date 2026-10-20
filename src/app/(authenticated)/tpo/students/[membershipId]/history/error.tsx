"use client";
import {Button} from "@/components/ui/button";
import {ErrorState} from "@/components/ui/error-state";
export default function ErrorView({reset}:{error:Error & {digest?:string};reset:()=>void}){
 return <ErrorState title="Couldn't load student placement history"
 description="The records could not be retrieved. No missing record or zero count is inferred."
 action={<Button variant="secondary" onClick={reset}>Retry</Button>}/>;
}
