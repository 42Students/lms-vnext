/**
 * GR-39: a safe, wrapping text primitive for large names and provider labels.
 * Usage: <LongText value={name} /> inside a min-w-0 flex or table cell.
 */
import { safeDisplayText } from "@/lib/safe-format";

export function LongText({ value }: { value: unknown }) {
  const label = safeDisplayText(value);
  return <span className="block min-w-0 max-w-full break-words text-foreground" title={label}>{label}</span>;
}
