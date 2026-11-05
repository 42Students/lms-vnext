import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { TextLink } from "@/components/ui/text-link";

export default function ActivityEventNotFound() {
  return <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
    <PageHeader title="Activity Log" />
    <ErrorState title="Activity event not found" description="This event is no longer available in your permitted activity scope."
      action={<TextLink href="/activity" className="inline-flex min-h-11 items-center md:min-h-9">Back to activity</TextLink>}/>
  </div>;
}
