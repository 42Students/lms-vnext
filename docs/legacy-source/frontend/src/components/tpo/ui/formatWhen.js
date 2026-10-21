import { dj } from "../dj";

/** The one date format for the TPO portal. Goes through dj() so a stored UTC time is shown in the viewer's own time zone. */
export function formatWhen(value, { date = true, time = true } = {}) {
  if (value === null || value === undefined || value === "") return "";
  const d = dj(value);
  if (!d.isValid()) return "";
  if (date && time) return d.format("D MMM, h:mm A");
  return d.format(date ? "D MMM YYYY" : "h:mm A");
}
