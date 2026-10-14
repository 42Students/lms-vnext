"use client";
import {Button} from "@/components/ui/button";
export default function ErrorPage({reset}:{error:Error&{digest?:string};reset:()=>void}){
 return <section role="alert" className="rounded-xl border border-border bg-surface p-6">
 <h1 className="font-semibold">Couldn&apos;t load drive edit</h1><p className="mt-2 text-sm text-body">A failed read did not save any changes.</p>
 <Button onClick={reset} className="mt-4">Retry</Button></section>;
}
