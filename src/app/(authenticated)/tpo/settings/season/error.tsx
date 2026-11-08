"use client";
import {Button} from "@/components/ui/button";
import {ErrorState} from "@/components/ui/error-state";
import {TextLink} from "@/components/ui/text-link";
export default function ErrorPage({reset}:{error:Error & {digest?:string};reset:()=>void}){
 return <ErrorState title="Couldn't load Settings · Season"
 description="The requested records could not be retrieved. A load failure does not mean there are no records or that a reported total is zero."
 action={<div className="flex min-w-0 flex-wrap items-center gap-3"><Button variant="secondary" type="button" className="min-h-11 md:min-h-9" onClick={reset}>Retry</Button><TextLink href="/tpo/settings" className="inline-flex min-h-11 items-center md:min-h-9">Back to settings</TextLink></div>}/>;
}
