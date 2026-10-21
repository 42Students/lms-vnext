const STORAGE_KEY = "tracker_saved_filters";
export const MAX_SAVED_FILTERS = 10;

const FILTER_KEYS = ["status", "environment", "reporter", "search", "sort"];

function sanitizeFilters(filters = {}) {
  const clean = {};
  FILTER_KEYS.forEach((key) => {
    const value = filters[key];
    if (typeof value === "string" && value.trim() !== "") clean[key] = value.trim();
  });
  if (clean.sort === "DESC") delete clean.sort;
  return clean;
}

export function loadSavedFilters() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed)
      ? parsed.filter((item) => item && typeof item.name === "string" && item.filters)
      : [];
  } catch (_) {
    return [];
  }
}

function persist(list) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (_) {
    // Storage blocked or full -- the in-memory list still works for this visit.
  }
  return list;
}

/** Adds or replaces (same name, case-insensitive) a saved view. Returns the new list. */
export function saveFilterPreset(name, filters) {
  const trimmed = String(name || "").trim().slice(0, 40);
  if (!trimmed) return loadSavedFilters();
  const others = loadSavedFilters().filter((item) => item.name.toLowerCase() !== trimmed.toLowerCase());
  return persist([{ name: trimmed, filters: sanitizeFilters(filters) }, ...others].slice(0, MAX_SAVED_FILTERS));
}

export function deleteFilterPreset(name) {
  return persist(loadSavedFilters().filter((item) => item.name !== name));
}

export function hasAnyFilter(filters) {
  return Object.keys(sanitizeFilters(filters)).length > 0;
}
