"use client";
import { PageHeader } from "@/components/ui/page-header";

import { Button } from "@/components/ui/button";

export default function TpoTrustedCompaniesError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section
      role="alert"
      className="border-t border-border pt-5 text-center"
    >
      <PageHeader title={"Couldn't load Trusted Companies"} />
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-body">
        Company relationships and trusted-domain records could
        not be retrieved. No trust state or empty allowlist
        is inferred from this failure.
      </p>
      <Button className="mt-5" onClick={reset}>
        Retry
      </Button>
    </section>
  );
}
