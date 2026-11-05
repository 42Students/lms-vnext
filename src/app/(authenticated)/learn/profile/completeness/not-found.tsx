import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button-link";
export default function ProfileCompletenessNotFound(){return <section className="min-w-0 space-y-4"><PageHeader title="Profile checklist filter unavailable"/><Alert tone="warning">The requested checklist filter is invalid.</Alert><ButtonLink variant="secondary" href="/learn/profile/completeness" className="w-full sm:w-auto">View all sections</ButtonLink></section>;}
