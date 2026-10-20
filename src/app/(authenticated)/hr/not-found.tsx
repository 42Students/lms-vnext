import { PageBackLink } from "@/components/ui/page-back-link";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";

export default function NotFound() {
  return <>
    <PageHeader title="Page not found" />
    <ErrorState title="Page not found"
      description="This page may have moved or is no longer available. Please return home."
      action={<PageBackLink href="/hr" label="Go to home"/>}/>
  </>;
}
