import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button-link";
export default function InterviewsNotFound(){return <section className="min-w-0 space-y-4"><PageHeader title="Interview unavailable" /><Alert tone="warning">This interview link is invalid or no longer accessible through your application.</Alert><ButtonLink variant="secondary" href="/learn/my-placements/interviews" className="w-full sm:w-auto">All interviews</ButtonLink></section>;}
