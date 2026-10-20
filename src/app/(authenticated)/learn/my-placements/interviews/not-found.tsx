import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
export default function InterviewsNotFound(){return <section className="min-w-0 space-y-4"><PageHeader title="Interview unavailable" /><Alert tone="warning">This interview link is invalid or no longer accessible through your application.</Alert><Link href="/learn/my-placements/interviews" className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:w-auto md:min-h-9">All interviews</Link></section>;}
