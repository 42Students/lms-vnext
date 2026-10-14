"use client";
import {Button} from "@/components/ui/button";
export default function ErrorPage({reset}:{error:Error&{digest?:string};reset:()=>void}){
return <section role="alert" className="rounded-xl border border-border bg-surface p-6">
<h1 className="font-semibold text-foreground">Couldn&apos;t load applicant pipeline</h1>
<p className="mt-2 text-sm text-body">Failed retrieval does not mean no applicants exist.</p>
<Button onClick={reset} className="mt-4">Retry</Button></section>;
}
