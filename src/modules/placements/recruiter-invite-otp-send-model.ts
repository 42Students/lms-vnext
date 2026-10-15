import { recruiterOtpSendAllowed } from "./recruiter-invite-otp-policy";

/** Pure public response: no challenge material is returned. */
export function recruiterOtpRequestResult(
  linkSends: number, collegeSends: number,
): "ALLOW"|"DENY" {
  return recruiterOtpSendAllowed(linkSends,collegeSends)?"ALLOW":"DENY";
}
