import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button-link";

export default function NotFound() {
  return <section className="min-w-0 space-y-4">
    <PageHeader title="Contact not found" />
    <p className="max-w-xl text-sm leading-6 text-body">
      This contact is not available in your current college directory.
    </p>
    <ButtonLink variant="secondary" href="/teacher/contacts" className="w-full sm:w-auto">
      Back to Contacts
    </ButtonLink>
  </section>;
}
