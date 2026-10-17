"use client";
import Link from "next/link";
import {Button} from "@/components/ui/button";

/** TPO-drives-49: a failed read is not an editable draft or a destructive reset. */
export default function ErrorPage({reset}:{error:Error&{digest?:string};reset:()=>void}){
 return <section role="alert" className="rounded-xl border border-border bg-surface p-6">
  <h1 className="font-semibold text-foreground">Some drive setup data could not be loaded</h1>
  <p className="mt-2 text-sm text-body">No changes were saved. Retry loading this drive, or return to the drive list.</p>
  <div className="mt-4 flex flex-wrap items-center gap-3">
   <Button onClick={reset}>Retry</Button>
   <Link href="/tpo/placements/lifecycle" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline">Back to drives</Link>
  </div>
 </section>;
}
