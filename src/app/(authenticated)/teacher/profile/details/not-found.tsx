import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
export default function NotFound() {
 return <section className="min-w-0 space-y-4"><PageHeader title="Profile details unavailable" /><p className="max-w-prose text-sm leading-6 text-body">This page is no longer available to this account.</p><Link href="/teacher/profile" className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary-text)] sm:w-auto md:min-h-9">Profile</Link></section>;
}
