/** Normalise what a TPO typed into a company email domain: "  @Infosys.COM " -> "infosys.com". Returns null if it is not a plausible domain. */
export function normaliseDomain(input) {
  const v = String(input || "").trim().toLowerCase().replace(/^@/, "").replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  return /^(?=.{4,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/.test(v) ? v : null;
}
