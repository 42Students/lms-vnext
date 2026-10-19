"use client";

import { Button } from "@/components/ui/button";

export default function TpoPlacementBrandingError({
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
        Couldn&apos;t load placement branding
      </h1>

      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-body">
        The college&apos;s branding records could
        not be retrieved. No logo, colour, or
        fallback value has been inferred from
        this error.
      </p>

      <Button
        className="mt-5"
        onClick={reset}
      >
        Retry
      </Button>
    </section>
  );
}
