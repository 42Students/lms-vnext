// Only normalize exact PostgreSQL spelling aliases. Never erase varchar
// lengths, numeric precision, time zones or domain-specific enum identity.
export function canonicalPgTypeLabel(value) {
  return String(value??"").trim().toLowerCase()
    .replace(/\s+/g," ")
    .replace(/^character varying(?=\(|$)/,"varchar");
}
