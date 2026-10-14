/** Flatten a validated reply onto the existing messageText column (no reply FK is migrated). */
export function formatDiscussionReply(body: string, parentId: string | null) {
  return parentId ? "↳ Reply to " + parentId.slice(0, 8) + ": " + body : body;
}