"use client";

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
      <h1 className="m-0 text-[26px] font-semibold leading-[1.35] tracking-[-0.02em] text-[#172033] sm:text-[30px]">
        Couldn&apos;t load Trusted Companies
      </h1>
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
