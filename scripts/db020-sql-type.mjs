// Only normalize exact PostgreSQL spelling aliases. Never erase varchar
// lengths, numeric precision, time zones or domain-specific enum identity.
export function canonicalPgTypeLabel(value) {
  return String(value??"").trim().toLowerCase()
    .replace(/\s+/g," ")
    .replace(/^character varying(?=\(|$)/,"varchar")
    // PostgreSQL's unqualified TIMESTAMP is without time zone.
    .replace(/^timestamp without time zone$/,"timestamp")
    // Whitespace after NUMERIC's precision comma is cosmetic, but the
    // actual precision and scale numbers remain security/finance relevant.
    .replace(/^(numeric\(\d+),\s*(\d+\))$/,"$1,$2");
}
