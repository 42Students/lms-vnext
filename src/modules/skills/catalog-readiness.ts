/** W06 read-side consumers remain off until W01 migration registration and replay. */
export function skillsCatalogRuntimeEnabled() {
  return process.env.DB10_SKILLS_READY === "DB10_VERIFIED";
}
