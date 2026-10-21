/**
 * Legacy public placement-page OTP endpoint. The canonical handler still
 * resolves the college from the verified host, enforces same-origin,
 * bounded payloads, network rate limits and opaque response codes.
 * An HTTP redirect would break POST clients and leak one-time form data.
 */
export { POST } from "@/app/api/public/recruit-from-us/send-code/route";
export const runtime = "nodejs";
