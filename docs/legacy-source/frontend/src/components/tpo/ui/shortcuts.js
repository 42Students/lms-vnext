// Keyboard shortcuts for the TPO portal: "g" then a letter jumps to a page, "n" then l/d/f starts something new, "?" shows the list.
// Pure helpers so the key handling can be tested without a browser.

export const GO_TO = [
  { key: "h", label: "Home", href: "/tpo/home" },
  { key: "b", label: "Placement eligibility", href: "/tpo/batches" },
  { key: "d", label: "Drives", href: "/tpo/drives" },
  { key: "s", label: "Students", href: "/tpo/students" },
  { key: "e", label: "Engage", href: "/tpo/recruiters" },
  { key: "c", label: "Calendar", href: "/tpo/calendar" },
  { key: "r", label: "Requests", href: "/tpo/requests" },
  { key: "m", label: "Messages", href: "/tpo/messages" },
  { key: "p", label: "Reports", href: "/tpo/reports" },
  { key: "t", label: "Settings", href: "/tpo/settings" },
];
export const CREATE = [
  { key: "l", label: "New recruiter lead", href: "/tpo/recruiters?add=1" },
  { key: "d", label: "New drive", href: "/tpo/drives/new" },
];

/** True when the key event came from somewhere the user is typing: shortcuts must never fire there. */
export function isTypingTarget(target) {
  if (!target) return false;
  const tag = String(target.tagName || "").toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || Boolean(target.isContentEditable);
}

/**
 * Turn a key into an action, given the previous key and when it was pressed.
 * Returns { action: "help" } | { action: "go", href } | { action: "pending", key } | null.
 */
export function resolveShortcut({ key, prevKey, prevAt, now = Date.now(), modifiers = false, typing = false }) {
  if (typing || modifiers) return null;
  const k = String(key || "").toLowerCase();
  if (k === "?") return { action: "help" };
  const fresh = prevKey && now - (prevAt || 0) < 1200;
  if (fresh && prevKey === "g") {
    const hit = GO_TO.find((g) => g.key === k);
    return hit ? { action: "go", href: hit.href } : null;
  }
  if (fresh && prevKey === "n") {
    const hit = CREATE.find((g) => g.key === k);
    return hit ? { action: "go", href: hit.href } : null;
  }
  if (k === "g" || k === "n") return { action: "pending", key: k };
  return null;
}
