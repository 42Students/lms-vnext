import Api from "../ApiMethod";

/**
 * Trades a password (no reporter identity) for a real super-admin session -- the same one the
 * phone+OTP "Vasan" login produces. See PublicTrackerLogsAccessController on the backend.
 */
export async function verifyTrackerLogsPassword(password, signal) {
  const response = await Api.post("/api/v1/public/bug-tracker/logs-access/verify", { password }, { signal });
  return response.data;
}
