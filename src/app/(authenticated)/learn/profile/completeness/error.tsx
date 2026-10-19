"use client";
import { ErrorState } from "@/components/ui/error-state";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function ProfileChecklistError({reset}:{
  error:Error & {digest?:string};reset:()=>void;
}) {
  return (
    <ErrorState title={"Could not load your profile checklist"} description={"We cannot infer profile completion while the read failed."}
      action={<div className="flex flex-wrap items-center gap-3"><Button onClick={reset}>Retry</Button><Link href="/learn/profile" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text sm:min-h-9">Profile</Link></div>} />
  );
}