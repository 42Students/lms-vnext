"use client";

import { GracefulErrorBoundary } from "@/components/public/graceful-error-boundary";

/**
 * UX-G186: this can render after the root layout and global stylesheet fail.
 * Keep its *minimal, static* CSS self-contained; never interpolate the thrown
 * error, its digest, request data, routes or session state into HTML.
 *
 * GR-11: global-error must render html/body in the App Router. The normal
 * authenticated child error boundary retains its role shell; this one cannot.
 */
const fallbackCss = `
  html[data-lms-global-error] { color-scheme: light; }
  html[data-lms-global-error] body {
    margin: 0; background: #f8fafc; color: #172236;
    font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
  html[data-lms-global-error] [data-root-error="true"] {
    box-sizing: border-box; display: flex; flex-direction: column;
    align-items: center; justify-content: center; min-height: 100dvh;
    width: 100%; padding: 32px 20px; text-align: center; background: #f8fafc;
  }
  html[data-lms-global-error] [data-root-error="true"] h1 {
    margin: 0; color: #2754a6; font-size: 64px; font-weight: 700; line-height: 1;
  }
  html[data-lms-global-error] [data-root-error="true"] h2 {
    margin: 16px 0 8px; color: #172236; font-size: 24px; line-height: 1.35;
  }
  html[data-lms-global-error] [data-root-error="true"] p {
    max-width: 420px; color: #4b5563; line-height: 1.5;
  }
  html[data-lms-global-error] [data-root-error="true"] a,
  html[data-lms-global-error] [data-root-error="true"] button {
    box-sizing: border-box; min-height: 44px; cursor: pointer;
  }
  html[data-lms-global-error] [data-root-error="true"] :focus-visible {
    outline: 3px solid #2754a6; outline-offset: 3px;
  }
  @media (max-width: 480px) {
    html[data-lms-global-error] [data-root-error="true"] {
      padding: 24px 16px;
    }
    html[data-lms-global-error] [data-root-error="true"] h2 { font-size: 22px; }
  }
`;

export default function GlobalError({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" data-lms-global-error="true">
      <head>
        <title>Page unavailable · 42LMS</title>
        <meta name="robots" content="noindex,nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{fallbackCss}</style>
      </head>
      <body>
        <GracefulErrorBoundary error={error} reset={reset} homeHref="/" />
      </body>
    </html>
  );
}
