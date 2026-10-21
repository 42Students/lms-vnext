import { tpoMemoryKey } from "./memoryKey";
// Command palette "Recent": the last few places the TPO jumped to, so the usual drive or student is two keystrokes away.
// Browser-local; every access is guarded because storage can be blocked.
const BASE = "tpo.recents.v1";
// Per person and college (BE-0107): the bare key used to be shared by every account on the browser.
const storageKey = () => tpoMemoryKey(BASE);
const MAX = 5;

export function readRecents() {
  try {
    const list = JSON.parse(window.localStorage.getItem(storageKey()) || "[]");
    return Array.isArray(list) ? list.filter((r) => r && typeof r.href === "string" && typeof r.label === "string").slice(0, MAX) : [];
  } catch (_) { return []; }
}

/** Remember a destination (most recent first, no duplicates). Pure navigation items like "Go to Home" are not worth remembering. */
export function rememberRecent(item) {
  if (!item || !item.href || !item.label || /^Go to /.test(item.label) || /^New /.test(item.label)) return;
  if (/^\/tpo\/students/.test(item.href)) return; // students are people: their names are not kept in browser storage
  try {
    const next = [{ key: item.key, label: item.label, href: item.href }, ...readRecents().filter((r) => r.href !== item.href)].slice(0, MAX);
    window.localStorage.setItem(storageKey(), JSON.stringify(next));
  } catch (_) { /* nothing to remember, navigation still works */ }
}
