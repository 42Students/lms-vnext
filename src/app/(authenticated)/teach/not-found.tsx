import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";

export default function NotFound() {
  return <section className="min-w-0">
    <PageHeader title="Page not found"
      description="This page may have moved or is no longer available. Please return home."
      actions={<Link href="/teach" className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:w-auto md:min-h-9">Go to home</Link>} />
  </section>;
}
