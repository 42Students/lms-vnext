"use client";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
export default function ErrorPage({reset}:{error:Error & {digest?:string};reset:()=>void}) {
 return <div className="min-w-0 space-y-4"><PageHeader title="Semesters" /><ErrorState title="Could not load directory" description="Selected-college read is unavailable. Your scope was not changed." action={<Button className="min-h-11 w-full sm:min-h-9 sm:w-auto" onClick={reset}>Retry</Button>}/></div>;
}