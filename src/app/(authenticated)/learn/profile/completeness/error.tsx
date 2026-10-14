"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function ProfileChecklistError({reset}:{
  error:Error & {digest?:string};reset:()=>void;
}) {
  return <div className="rounded-xl border border-border bg-surface p-6 text-center">
    <h1 className="text-lg font-semibold text-foreground">Could not load your profile checklist</h1>
    <p className="mt-2 text-sm text-body">We cannot infer profile completion while the read failed.</p>
    <div className="mt-4 flex flex-wrap justify-center gap-3">
      <Button onClick={reset}>Retry</Button>
      <Link href="/learn/profile" className="inline-flex min-h-10 items-center text-primary-text">Profile</Link>
    </div>
  </div>;
}