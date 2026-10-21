/** Student-facing action guards shared by the job and assessment screens. */
export function isSupportedAssessmentUrl(raw) {
  if (typeof raw !== "string" || !raw.trim()) return false;
  try {
    const parsed = new URL(raw.trim());
    return (parsed.protocol === "https:" || parsed.protocol === "http:") &&
      Boolean(parsed.hostname) && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
}

// Never turn a failed/invalid lookup into an authoritative "not applied".
export function classifyApplicationLookup(response) {
  if (response?.data?.status !== "success" ||
      typeof response?.data?.data?.applied !== "boolean") return "unknown";
  return response.data.data.applied ? "applied" : "not-applied";
}
