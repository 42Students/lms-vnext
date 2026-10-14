"use client";import {Button} from "@/components/ui/button";import {ErrorState} from "@/components/ui/error-state";
export default function Error({reset}:{error:Error&{digest?:string};reset:()=>void}){
 return <ErrorState title="Application detail unavailable" description="The selected-college record could not be loaded." action={<Button onClick={reset}>Retry</Button>}/>;
}