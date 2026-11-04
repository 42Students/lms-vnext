/**
 * OAuth callbacks carry one-time authorization codes in the incoming URL.
 * Prevent all redirect responses, including failures, from being cached or
 * forwarding the callback URL as a Referer to the next navigation.
 */
export const MENTOR_GOOGLE_OAUTH_RESPONSE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow",
  "Pragma": "no-cache",
} as const;
