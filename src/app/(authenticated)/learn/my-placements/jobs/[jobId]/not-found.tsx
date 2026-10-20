import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
export default function DriveNotFound(){return <section className="min-w-0 space-y-4"><PageHeader title="Placement drive unavailable"/><Alert tone="warning">This drive is unavailable or has no recorded history for your account.</Alert><Link href="/learn/my-placements/jobs" className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:w-auto md:min-h-9">Back to Drives</Link></section>;}
