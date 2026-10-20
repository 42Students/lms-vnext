import { PageBackLink } from "@/components/ui/page-back-link";
import { PageHeader } from "@/components/ui/page-header";
export default function HrJobNotFound() {
  return <section className="space-y-5">
    <PageHeader title="We could not find this drive"
      description="It isn&apos;t one of your drives at this college, or it was removed." />
    <PageBackLink href="/hr/placements" label="Back to Drives"/>
  </section>;
}
