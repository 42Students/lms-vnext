"use client";
import {Button} from "@/components/ui/button";
import {ErrorState} from "@/components/ui/error-state";
export default function ErrorPage({reset}:{error:Error & {digest?:string};reset:()=>void}){
 return <ErrorState title="Couldn't load Settings · Season"
 description="The requested records could not be retrieved. A load failure does not mean there are no records or that a reported total is zero."
 action={<Button variant="secondary" type="button" className="min-h-11 md:min-h-9" onClick={reset}>Retry</Button>}/>;
}
