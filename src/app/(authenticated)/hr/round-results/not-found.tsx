import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { TextLink } from "@/components/ui/text-link";

export default function RoundResultsNotFound() {
  return <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
    <PageHeader title="Round Results" />
    <ErrorState title="Round not found" description="Choose a valid hiring drive and round."
      action={<TextLink href="/hr/round-results" className="inline-flex min-h-11 items-center md:min-h-9">Choose another drive</TextLink>}/>
  </div>;
}
