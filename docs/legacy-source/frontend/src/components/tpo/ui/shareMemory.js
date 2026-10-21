import { tpoMemoryKey } from "./memoryKey";
// "Share remembers": the second time a TPO shares applicants with the same company, the contact and the
// columns are already filled in. Stored per company name in this browser only; every access is guarded,
// because storage can be blocked or full and sharing must still work.
const BASE = "tpo.shareMemory.v1";
// Per person and college (BE-0107): the bare key used to be shared by every account on the browser.
const storageKey = () => tpoMemoryKey(BASE);
const norm = (name) => String(name || "").trim().toLowerCase();

function readAll() {
  try {
    const raw = window.localStorage.getItem(storageKey());
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (_) { return {}; }
}

export function readShareMemory(company) {
  const m = readAll()[norm(company)];
  if (!m || typeof m !== "object") return null;
  return {
    recipientEmail: typeof m.recipientEmail === "string" ? m.recipientEmail : undefined,
    columns: Array.isArray(m.columns) ? m.columns.filter((c) => typeof c === "string") : undefined,
    maxStage: typeof m.maxStage === "string" ? m.maxStage : undefined,
  };
}

export function writeShareMemory(company, { recipientEmail, columns, maxStage }) {
  const key = norm(company);
  if (!key) return;
  try {
    const all = readAll();
    all[key] = { recipientEmail, columns, maxStage: maxStage || "" };
    // Keep the store small: only the 50 most recently used companies.
    const keys = Object.keys(all);
    if (keys.length > 50) delete all[keys[0]];
    window.localStorage.setItem(storageKey(), JSON.stringify(all));
  } catch (_) { /* storage blocked or full: nothing to remember, sharing still works */ }
}
