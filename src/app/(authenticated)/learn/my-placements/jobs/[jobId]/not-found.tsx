import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button-link";
export default function DriveNotFound(){return <section className="min-w-0 space-y-4"><PageHeader title="Placement drive unavailable"/><Alert tone="warning">This drive is unavailable or has no recorded history for your account.</Alert><ButtonLink variant="secondary" href="/learn/my-placements/jobs" className="w-full sm:w-auto">Back to Drives</ButtonLink></section>;}
