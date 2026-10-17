import { z } from "zod";
import {publicWorkEmailIssue} from "./public-work-email-policy";

/** Syntax validation only. Never use raw tokens as database IDs or log values. */
export const publicCollegeJoinTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{32,256}$/);
export const publicRecruiterWorkEmailSchema = z.string().trim().toLowerCase().email().max(254)
  .refine((email) => publicWorkEmailIssue(email)===null, "Enter a company work email address.");
export const publicCollegeJoinCodeSchema = z.string().regex(/^[0-9]{6}$/);

export type CollegeJoinViewState = "INVALID_LINK" | "UNAVAILABLE" | "READY" | "ALREADY_JOINED";
export function collegeJoinViewState(input: {
  validToken: boolean;
  invitationAvailable: boolean;
  alreadyJoined: boolean;
}): CollegeJoinViewState {
  if (!input.validToken) return "INVALID_LINK";
  if (!input.invitationAvailable) return "UNAVAILABLE";
  return input.alreadyJoined ? "ALREADY_JOINED" : "READY";
}

/** Domain identifies an email domain, not a verified legal company. */
export function workEmailDomain(email: string): string | null {
  const result = publicRecruiterWorkEmailSchema.safeParse(email);
  return result.success ? result.data.split("@")[1] : null;
}
