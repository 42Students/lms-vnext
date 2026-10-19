"use client";
import {Button} from "@/components/ui/button";
export default function ErrorPage({reset}:{error:Error&{digest?:string};reset:()=>void}){
 return <section role="alert" className="border-b border-border bg-transparent py-6">
 <h1 className="font-semibold">Couldn&apos;t load drive deadline</h1><p className="mt-2 text-sm text-body">The latest date could not be verified.</p>
 <Button className="mt-4" onClick={reset}>Retry</Button></section>;
}
