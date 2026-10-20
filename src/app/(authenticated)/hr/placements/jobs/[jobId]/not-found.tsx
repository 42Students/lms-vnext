import { PageBackLink } from "@/components/ui/page-back-link";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";

export default function HrJobNotFound() {
  return <div className="min-w-0 max-w-full space-y-4">
    <PageHeader title="We could not find this drive" />
    <div className="min-w-0 max-w-2xl"><ErrorState title="We could not find this drive"
      description="It isn&apos;t one of your drives at this college, or it was removed."
      action={<PageBackLink href="/hr/placements" label="Back to Drives"/>}/></div>
  </div>;
}
