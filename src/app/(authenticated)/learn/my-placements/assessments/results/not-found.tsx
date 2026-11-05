import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button-link";
export default function AssessmentResultsNotFound(){return <section className="min-w-0 space-y-4"><PageHeader title="Assessment results unavailable"/><Alert tone="warning">The requested assessment results link is invalid or unavailable.</Alert><ButtonLink variant="secondary" href="/learn/my-placements/assessments/results" className="w-full sm:w-auto">View official assessment results</ButtonLink></section>;}
