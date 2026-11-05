import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button-link";

export default function NotFound() {
  return <section className="min-w-0">
    <PageHeader title="Page not found"
      description="This page may have moved or is no longer available. Please return home."
      actions={<ButtonLink variant="primary" href="/teach/courses" className="w-full sm:w-auto">Go to home</ButtonLink>} />
  </section>;
}
