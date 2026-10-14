import { authoringDueInstant } from "./faculty-authoring-datetime-model";
export type EditableContent = "RESOURCE" | "YOUTUBE" | "LIVE_CLASS";
export function facultyContentPatch(input: {
  kind: EditableContent;
  title: string;
  notes: string;
  url: string;
  duration?: string;
  starts?: string;
  ends?: string;
  hasStoredResource?: boolean;
}) {
  const title = input.title.trim();
  const notes = input.notes.trim();
  const url = input.url.trim();
  if (!title || title.length > 255) throw new Error("Title must have 1-255 characters.");
  if (notes.length > 5000) throw new Error("Notes cannot exceed 5000 characters.");
  if (input.kind !== "RESOURCE" && !url) throw new Error("An HTTPS URL is required.");
  if (url) {
    let parsed: URL;
    try { parsed = new URL(url); } catch { throw new Error("Enter a valid HTTPS URL."); }
    if (parsed.protocol !== "https:") throw new Error("Only HTTPS URLs are allowed.");
    if (input.kind === "YOUTUBE") {
      const host = parsed.hostname.toLowerCase();
      if (host !== "youtube.com" && !host.endsWith(".youtube.com") && host !== "youtu.be")
        throw new Error("Use a youtube.com or youtu.be link.");
    }
  }
  const base = { title, notes: notes || null, externalUrl: url || null };
  if (input.kind === "RESOURCE") {
    if (!notes && !url && !input.hasStoredResource) throw new Error("Add notes or a resource link.");
    return base;
  }
  if (input.kind === "YOUTUBE") {
    const seconds = Number(input.duration);
    if (!Number.isInteger(seconds) || seconds < 1 || seconds > 86400)
      throw new Error("Duration must be 1-86400 seconds.");
    return { ...base, durationSeconds: seconds };
  }
  const startIso = authoringDueInstant(input.starts ?? "");
  const endIso = authoringDueInstant(input.ends ?? "");
  const start = new Date(startIso ?? "");
  const end = new Date(endIso ?? "");
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start)
    throw new Error("End time must be after a valid start time.");
  return { ...base, startsAt: start.toISOString(), endsAt: end.toISOString() };
}
