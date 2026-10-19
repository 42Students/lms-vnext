import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";

export default function NotFound() {
  return <main className="min-w-0 space-y-5">
    <PageHeader title="Page not found" />
    <p className="text-sm text-body">This page may have moved or is no longer available. Please return home.</p>
    <Link href="/recruiter" className="inline-flex min-h-9 items-center rounded-[9px] border border-primary bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
      Go to home
    </Link>
  </main>;
}
