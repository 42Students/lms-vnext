import "server-only";

import { resolveTxt } from "node:dns/promises";
import {
  verificationDnsName,
  verificationDnsValue,
  type TenantDomainVerifier,
} from "./service";

function dnsErrorCode(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
  ) {
    return (error as { code: string }).code;
  }
  return null;
}

export const dnsTenantDomainVerifier: TenantDomainVerifier = {
  async verify(host, token) {
    try {
      const records = await resolveTxt(verificationDnsName(host));
      const expected = verificationDnsValue(token);
      const values = records.map((chunks) => chunks.join(""));

      return values.includes(expected)
        ? { verified: true, result: "VERIFIED" }
        : { verified: false, result: values.length ? "TXT_VALUE_MISMATCH" : "TXT_RECORD_MISSING" };
    } catch (error) {
      const code = dnsErrorCode(error);
      if (code === "ENODATA" || code === "ENOTFOUND") {
        return {
          verified: false,
          result: "TXT_RECORD_MISSING",
        };
      }

      return {
        verified: false,
        result: "DNS_LOOKUP_FAILED",
      };
    }
  },
};
