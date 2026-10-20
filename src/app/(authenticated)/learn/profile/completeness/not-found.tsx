import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
export default function ProfileCompletenessNotFound(){return <section className="min-w-0 space-y-4"><PageHeader title="Profile checklist filter unavailable"/><Alert tone="warning">The requested checklist filter is invalid.</Alert><Link href="/learn/profile/completeness" className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle sm:w-auto md:min-h-9">View all sections</Link></section>;}
