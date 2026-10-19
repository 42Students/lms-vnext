import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
export default function HrJobNotFound() {
  return <section className="space-y-5">
    <PageHeader title="We could not find this drive"
      description="It isn&apos;t one of your drives at this college, or it was removed." />
    <Link className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 md:min-h-9 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"
      href="/hr/placements">Back to Drives</Link>
  </section>;
}
