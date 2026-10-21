import { confirmBugAttachment, uploadBugAttachment } from "@/api/Services/BugTrackerService";

export const RECENT_TRACKER_CONTEXT_KEY = "42tracker_recent_context_v2";

/**
 * Uploads (or, for a previously-failed attempt, confirms) each screenshot entry against an
 * already-created issue. Every entry resolves independently -- one failure never rejects the
 * batch -- so callers can always tell exactly which screenshots still need a retry.
 */
export async function uploadTrackerAttachments(publicId, entries) {
  return Promise.all(entries.map(async (entry) => {
    try {
      const attachment = entry.storageKey
        ? await confirmBugAttachment(publicId, entry.storageKey, entry.file.name)
        : await uploadBugAttachment(publicId, entry.file);
      return { ok: true, file: entry.file, attachment };
    } catch (error) {
      return {
        ok: false,
        file: entry.file,
        storageKey: error?.storageKey || entry.storageKey || null,
        error,
      };
    }
  }));
}
