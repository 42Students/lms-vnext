"use client";import {Button} from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";import {ErrorState} from "@/components/ui/error-state";
export default function Error({reset}:{error:Error&{digest?:string};reset:()=>void}){
 return <ErrorState title="Interview detail unavailable" description="The selected college interview could not be loaded." action={<div className="flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center"><Button onClick={reset} className="w-full md:w-auto">Retry</Button><ButtonLink variant="secondary" href="/admin/placements/interviews" className="min-h-11 w-full sm:w-auto">Back to interviews</ButtonLink></div>}/>;
}