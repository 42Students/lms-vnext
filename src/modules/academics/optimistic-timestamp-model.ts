/** PostgreSQL timestamptz stores microseconds while JS Date exposes milliseconds.
 * Only compare the millisecond-truncated DB value against this validated ISO token. */
export function timestampTokenIso(value: Date) {
  if (!Number.isFinite(value.getTime())) throw new Error("Invalid concurrency timestamp");
  return value.toISOString();
}
