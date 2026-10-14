"use client";
import {Button} from "@/components/ui/button";
export default function ErrorPage({reset}:{error:Error&{digest?:string};reset:()=>void}){
 return <section role="alert" className="rounded-xl border border-border bg-surface p-6">
 <h1 className="font-semibold">Couldn&apos;t load round results</h1>
 <p className="mt-2 text-sm text-body">A failed read does not mean a learner has no results.</p>
 <Button onClick={reset} className="mt-4">Retry</Button></section>;
}
