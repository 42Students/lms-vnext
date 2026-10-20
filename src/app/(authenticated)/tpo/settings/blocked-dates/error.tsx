"use client";
import {Button} from "@/components/ui/button";
import {ErrorState} from "@/components/ui/error-state";export default function Error({reset}:{reset:()=>void}){return <section role="alert"><ErrorState title="Blocked dates could not be loaded." action={<Button variant="secondary" type="button" className="min-h-11 md:min-h-9" onClick={reset}>Retry</Button>}/></section>;}