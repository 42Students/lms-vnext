import { getStoredUserData } from "@/utils/authUtils";

/**
 * A TPO browser-memory key for the signed-in person at their college ("tpo.shareMemory.v1:26:6"). The keys used to be shared by
 * everyone on the browser, so the next account (even another college's) got the last one's recents, saved report filters and
 * share recipients (BE-0107). Logout also clears every "tpo." key (utils/authUtils clearAllTokens).
 */
export function tpoMemoryKey(base) {
  let user = null;
  try { user = getStoredUserData(); } catch (_) { user = null; }
  const id = user?.id ?? user?.userId ?? "anon";
  const college = user?.collegeId ?? user?.currentCollegeId ?? "none";
  return `${base}:${id}:${college}`;
}
