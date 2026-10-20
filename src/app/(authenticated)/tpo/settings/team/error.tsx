"use client";
import {Button} from "@/components/ui/button";
import {ErrorState} from "@/components/ui/error-state";
export default function TpoPlacementTeamError({reset}:{error:Error & {digest?:string};reset:()=>void}){
 return <ErrorState title="Couldn't load Placement Team"
  description="College membership and coordinator records could not be retrieved. This failure is not interpreted as an empty team or zero coordinator assignments."
  action={<Button variant="secondary" type="button" className="min-h-11 md:min-h-9" onClick={reset}>Retry</Button>}/>;
}
