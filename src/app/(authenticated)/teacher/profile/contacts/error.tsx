"use client";
import { PageHeader } from "@/components/ui/page-header";
import {Button} from "@/components/ui/button";
export default function Error({reset}:{error:Error&{digest?:string};reset:()=>void}){
return <section role="alert" className="border-b border-border bg-transparent py-6"><PageHeader title={"Unable to load contact details"} /><p className="mt-2 text-sm text-body">The read failed; this does not mean contact fields are empty.</p><Button variant="secondary" onClick={reset} className="mt-4">Retry</Button></section>;
}
