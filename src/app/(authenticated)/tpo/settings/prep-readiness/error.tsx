"use client";
import {Button} from "@/components/ui/button";
import {ErrorState} from "@/components/ui/error-state";
export default function Error({reset}:{reset:()=>void}){
 return <ErrorState title="Prep readiness could not be loaded." action={<Button variant="secondary" onClick={reset}>Retry</Button>}/>;
}
