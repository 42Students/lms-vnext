/** User-facing academic status words from the legacy Super Admin directory. */
export function legacyAcademicStatus(status: string, forBatch = false): string {
  if (forBatch && (status === "PLANNED" || status === "ARCHIVED")) return "Inactive";
  if (status === "INACTIVE") return "Inactive";
  if (status === "ACTIVE") return "Active";
  if (status === "COMPLETED") return "Completed";
  if (status === "PLANNED") return "Planned";
  if (status === "ARCHIVED") return "Archived";
  return status.toLocaleLowerCase("en-IN").replaceAll("_", " ").replace(/^./, char => char.toUpperCase());
}
