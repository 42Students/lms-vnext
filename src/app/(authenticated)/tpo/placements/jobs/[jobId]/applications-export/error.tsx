"use client";
import {Button} from "@/components/ui/button";
export default function ErrorPage({reset}:{error:Error&{digest?:string};reset:()=>void}){
 return <section role="alert" className="rounded-xl border border-border bg-surface p-6">
  <h1 className="font-semibold">Couldn&apos;t load applicant export</h1>
  <p className="mt-2 text-sm text-body">No report can be inferred from an unavailable data source.</p>
  <Button className="mt-4" onClick={reset}>Retry</Button></section>;
}
