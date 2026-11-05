import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button-link";
export default function NotFound() {
 return <section className="min-w-0 space-y-4"><PageHeader title="Profile details unavailable" /><p className="max-w-prose text-sm leading-6 text-body">This page is no longer available to this account.</p><ButtonLink variant="secondary" href="/teacher/profile" className="w-full sm:w-auto">Profile</ButtonLink></section>;
}
