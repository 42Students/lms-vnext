import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
export default function HrJobNotFound() {
  return <section className="space-y-5">
    <PageHeader eyebrow="Employer Recruiter" title="Job unavailable"
      description="This hiring opportunity was not found or is not accessible with your current employer and college permissions." />
    <Link className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text"
      href="/hr/placements">Back to Hiring Workspace</Link>
  </section>;
}
