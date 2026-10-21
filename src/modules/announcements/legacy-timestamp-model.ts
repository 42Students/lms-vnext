/**
 * Historical MySQL Announcement.createdAt is a zone-less LocalDateTime.
 * The old LMS authored these wall-clock values in Asia/Kolkata; the vNext
 * timestamptz stores UTC instants and displays them back in IST.
 *
 * This is an explicit migration conversion, never a browser-local Date
 * parser. India has no DST transition for modern LMS-era timestamps.
 * Invalid/out-of-range source rows must be quarantined by the importer,
 * rather than silently shifted or replaced with the import clock.
 */
export function legacyAnnouncementIstWallTimeToUtc(
  source: string,
): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,6}))?$/.exec(source);
  if (!match) return null;
  const [, yearText, monthText, dayText, hourText, minuteText, secondText,
    fractional = ""] = match;
  const [year, month, day, hour, minute, second] =
    [yearText, monthText, dayText, hourText, minuteText, secondText].map(Number);
  if (year < 1970 || year > 2100 || month < 1 || month > 12 ||
      day < 1 || day > 31 || hour > 23 || minute > 59 || second > 59)
    return null;
  const milliseconds = Number(fractional.padEnd(3, "0").slice(0, 3));
  const naiveUtc = Date.UTC(year, month - 1, day, hour, minute, second,
    milliseconds);
  const validation = new Date(naiveUtc);
  if (validation.getUTCFullYear() !== year ||
      validation.getUTCMonth() + 1 !== month ||
      validation.getUTCDate() !== day ||
      validation.getUTCHours() !== hour ||
      validation.getUTCMinutes() !== minute ||
      validation.getUTCSeconds() !== second)
    return null;
  return new Date(naiveUtc - (5 * 60 + 30) * 60_000);
}
