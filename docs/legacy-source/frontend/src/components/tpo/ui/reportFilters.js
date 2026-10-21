import { tpoMemoryKey } from "./memoryKey";
// Saved report filters: the batch/branch/company a TPO asks for every week, one click away. Browser-local and fully guarded,
// because the report works fine without them.
const BASE = "tpo.reportFilters.v1";
// Per person and college (BE-0107): the bare key used to be shared by every account on the browser.
const storageKey = () => tpoMemoryKey(BASE);
const MAX_PER_REPORT = 12;

function readAll() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey()) || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (_) { return {}; }
}

const clean = (f) => Object.fromEntries(Object.entries(f || {}).filter(([, v]) => v !== null && v !== undefined && v !== ""));

export function listSavedFilters(report) {
  const list = readAll()[report];
  return Array.isArray(list) ? list.filter((x) => x && typeof x.name === "string" && x.filters && typeof x.filters === "object") : [];
}

/** Save (or replace, by name) the filters for a report. Returns the new list. Empty filters are not worth saving. */
export function saveFilters(report, name, filters) {
  const label = String(name || "").trim().slice(0, 60);
  const values = clean(filters);
  if (!label || Object.keys(values).length === 0) return listSavedFilters(report);
  const next = [...listSavedFilters(report).filter((x) => x.name.toLowerCase() !== label.toLowerCase()), { name: label, filters: values }].slice(-MAX_PER_REPORT);
  try {
    const all = readAll();
    all[report] = next;
    window.localStorage.setItem(storageKey(), JSON.stringify(all));
  } catch (_) { /* storage blocked: the report still works */ }
  return next;
}

export function deleteFilters(report, name) {
  const next = listSavedFilters(report).filter((x) => x.name !== name);
  try {
    const all = readAll();
    all[report] = next;
    window.localStorage.setItem(storageKey(), JSON.stringify(all));
  } catch (_) { /* nothing to do */ }
  return next;
}
