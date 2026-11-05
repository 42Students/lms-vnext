"use client";
import {PageHeader} from "@/components/ui/page-header";
import {Button} from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";

export default function Error({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <section className="min-w-0 space-y-4">
    <PageHeader title={"Unable to load Faculty contact detail"} />
    <p role="alert" className="mt-2 text-sm text-body">
      This request failed. The absence of results is not assumed.
    </p>
    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
      <Button type="button" onClick={reset}>Retry</Button>
      <ButtonLink variant="secondary" href="/teacher/contacts">
        Back to Contacts
      </ButtonLink>
    </div>
  </section>;
}
