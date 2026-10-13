"use client";

import { ErrorPageView } from "@/components/public/error-page-view";

/** The root fatal boundary must render html/body itself in Next.js App Router. */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <ErrorPageView
          code="500"
          title="Server Error"
          message="Something went wrong on our side. Please try again in a moment."
          retry={reset}
        />
      </body>
    </html>
  );
}
