"use client";import {Button} from "@/components/ui/button";import {ButtonLink} from "@/components/ui/button-link";import {ErrorState} from "@/components/ui/error-state";
export default function Error({reset}:{error:Error&{digest?:string};reset:()=>void}){
 return <ErrorState title="Application detail unavailable" description="The selected-college record could not be loaded." action={<div className="flex min-w-0 flex-col gap-2 sm:flex-row">
  <Button type="button" onClick={reset} className="min-h-11 w-full sm:w-auto">Retry application</Button>
  <ButtonLink variant="secondary" href="/admin/placements/drives" className="min-h-11 w-full sm:w-auto">Back to drives</ButtonLink>
 </div>}/>;
}