import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button-link";
export default function LearnerAssessmentNotFound(){ return <section className="min-w-0 space-y-4"><PageHeader title="Assessment unavailable" /><Alert tone="warning">This assessment or its search link is not available to your membership.</Alert><ButtonLink variant="secondary" href="/learn/my-placements/assessments" className="w-full sm:w-auto">Back to assessments</ButtonLink></section>; }
