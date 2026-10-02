export type SessionVerificationErrorCode =
  | "SESSION_INVALID"
  | "SESSION_EXPIRED"
  | "SESSION_REVOKED";

function errorCode(error: unknown) {
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

export function classifySessionVerificationError(
  error: unknown,
): SessionVerificationErrorCode {
  const code = errorCode(error);

  if (
    code === "auth/session-cookie-expired" ||
    code === "session-cookie-expired"
  ) {
    return "SESSION_EXPIRED";
  }

  if (
    code === "auth/session-cookie-revoked" ||
    code === "session-cookie-revoked"
  ) {
    return "SESSION_REVOKED";
  }

  return "SESSION_INVALID";
}
