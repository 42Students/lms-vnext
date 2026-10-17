import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
export default function HrJobNotFound() {
  return <section className="space-y-5">
    <PageHeader title="We could not find this drive"
      description="It isn\u0027t one of your drives at this college, or it was removed." />
    <Link className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text"
      href="/hr/placements">Back to Drives</Link>
  </section>;
}
