"use client";
import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function ProfileChecklistError({reset}:{
  error:Error & {digest?:string};reset:()=>void;
}) {
  return <div className="py-6 text-center">
    <PageHeader title={"Could not load your profile checklist"} />
    <p className="mt-2 text-sm text-body">We cannot infer profile completion while the read failed.</p>
    <div className="mt-4 flex flex-wrap justify-center gap-3">
      <Button onClick={reset}>Retry</Button>
      <Link href="/learn/profile" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text min-[768px]:min-h-9">Profile</Link>
    </div>
  </div>;
}