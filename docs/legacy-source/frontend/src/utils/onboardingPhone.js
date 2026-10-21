/** Shared 10-digit Indian login identifier; malformed values never become account IDs. */
export function normalizeIndianMobile(raw) {
  if (raw == null || !String(raw).trim()) return null;
  const value = String(raw).trim();
  if (!/^[+0-9() .-]+$/.test(value)) return null;
  let digits = value.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^\d{10}$/.test(digits) ? digits : null;
}
