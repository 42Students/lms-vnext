/** An application lookup is authoritative only when the API supplies a boolean. */
export function classifyApplicationLookup(response) {
  if (response?.data?.status !== "success" ||
      typeof response?.data?.data?.applied !== "boolean") {
    return "unknown";
  }
  return response.data.data.applied ? "applied" : "not-applied";
}

export function requireVerifiedApplicationLookup(response) {
  if (classifyApplicationLookup(response) === "unknown") {
    throw new Error("We couldn't verify whether you already applied. Check the status before submitting.");
  }
  return response;
}
