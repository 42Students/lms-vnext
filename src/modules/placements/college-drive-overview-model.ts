export function displayDriveMetric(value: number | null) {
  return value === null ? "Not available" : value.toLocaleString("en-IN");
}
export function describeDriveMetric(name: "applications" | "shortlisted" | "selected" | "offered") {
  const descriptions = {
    applications: "Persisted application records, including withdrawn",
    shortlisted: "Currently submitted applications with SHORTLISTED screening",
    selected: "No authoritative selected outcome exists in the registered source",
    offered: "Distinct applications with one or more issued offer records",
  };
  return descriptions[name];
}
