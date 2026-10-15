import { z } from "zod";
/** Redirect only the legacy invitation GET to the existing public recruiter invite. */
const tokenSchema = z.string().min(8).max(512).regex(/^[a-zA-Z0-9._~-]+$/);
export function recruiterInviteHref(token: unknown) {
  const value = tokenSchema.parse(token);
  return "/recruiter-invite/" + encodeURIComponent(value);
}
