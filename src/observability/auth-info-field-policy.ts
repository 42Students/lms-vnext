/** INFO logs only admit fixed authentication-audit facts after sanitization. */
type SafeField = string | number | boolean | null;
const AUTH_AUDIT_TAG = /^[a-f0-9]{24}$/;
const AUTH_ROUTE = /^(?:[a-z][a-z0-9-]{0,63}|\/api\/auth\/[a-z0-9\-/]{1,96})$/;

export function privacySafeAuthInfoLogFields(
  fields: Record<string, unknown>,
): Record<string, SafeField> {
  if (fields["component"] !== "auth-audit") return {};
  const safe: Record<string, SafeField> = { component: "auth-audit" };
  for (const [key, value] of Object.entries(fields)) {
    switch (key) {
      case "route":
        if (typeof value === "string" && AUTH_ROUTE.test(value) &&
            !value.includes("..")) safe.route = value;
        break;
      case "ipTag":
      case "userTag":
        if (typeof value === "string" &&
            (AUTH_AUDIT_TAG.test(value) || value === "unavailable")) safe[key] = value;
        break;
      case "channel":
        if (value === "PHONE" || value === "EMAIL") safe.channel = value;
        break;
      case "requiresSecondFactor":
      case "isSuperAdmin":
      case "accepted":
        if (typeof value === "boolean") safe[key] = value;
        break;
      case "durationMs":
      case "elapsedMs":
        if (typeof value === "number" && Number.isFinite(value) &&
            value >= 0 && value <= 3_600_000) safe[key] = value;
        break;
      case "requests":
        if (typeof value === "number" && Number.isSafeInteger(value) &&
            value >= 0 && value <= 1_000_000) safe.requests = value;
        break;
      case "requestId":
        if (typeof value === "string" &&
            /^[A-Za-z0-9_.:-]{1,128}$/.test(value)) safe.requestId = value;
        break;
      default:
        break;
    }
  }
  return safe;
}
