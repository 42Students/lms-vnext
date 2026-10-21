// One filter foundation for every TPO list page (docs/tpo-ux/BATCHES-AND-ELIGIBILITY-DESIGN.md §6a).
// A page declares its filters as a list of definitions; the side panel, the chips, the counts and the URL all come from it.
//
// Definition: { key, label, type, get(row), options?, format? }
//   - type "checklist": get(row) returns a value or an array of values; options [{ value, label }] (or derived from the rows)
//   - type "range":     get(row) returns a number (or null); state { min, max }
//   - type "yesno":     get(row) returns a boolean; state "yes" | "no"
// State: { [key]: string[] | { min, max } | "yes" | "no" }. A missing key means "no filter".

const asArray = (v) => (Array.isArray(v) ? v : v === null || v === undefined || v === "" ? [] : [v]);
const str = (v) => String(v);

export const isActive = (def, value) => {
  if (value === undefined || value === null) return false;
  if (def.type === "checklist") return Array.isArray(value) && value.length > 0;
  if (def.type === "range") return value.min !== undefined && value.min !== null && value.min !== "" || value.max !== undefined && value.max !== null && value.max !== "";
  if (def.type === "yesno") return value === "yes" || value === "no";
  return false;
};

/** Does one row pass one filter? */
export function passes(def, value, row) {
  if (!isActive(def, value)) return true;
  const got = def.get(row);
  if (def.type === "checklist") {
    const wanted = new Set(value.map(str));
    return asArray(got).some((g) => wanted.has(str(g)));
  }
  if (def.type === "range") {
    if (got === null || got === undefined || got === "" || Number.isNaN(Number(got))) return false;
    const n = Number(got);
    if (value.min !== undefined && value.min !== null && value.min !== "" && n < Number(value.min)) return false;
    if (value.max !== undefined && value.max !== null && value.max !== "" && n > Number(value.max)) return false;
    return true;
  }
  if (def.type === "yesno") return Boolean(got) === (value === "yes");
  return true;
}

/** Rows that pass every active filter (optionally leaving one filter out, for that filter's own counts). */
export function applyFilters(rows, defs, state, exceptKey) {
  const active = defs.filter((d) => d.key !== exceptKey && isActive(d, state?.[d.key]));
  if (active.length === 0) return rows || [];
  return (rows || []).filter((row) => active.every((d) => passes(d, state[d.key], row)));
}

/**
 * Options of a checklist with counts that follow the other filters (shopping-app behaviour): each option says how many rows
 * would show if it were picked, given everything else that is picked.
 */
export function optionCounts(rows, defs, state, def) {
  const base = applyFilters(rows, defs, state, def.key);
  const counts = new Map();
  base.forEach((row) => asArray(def.get(row)).forEach((v) => counts.set(str(v), (counts.get(str(v)) || 0) + 1)));
  let options = def.options;
  if (!options) {
    const seen = new Set();
    options = [];
    (rows || []).forEach((row) => asArray(def.get(row)).forEach((v) => {
      if (seen.has(str(v))) return;
      seen.add(str(v));
      options.push({ value: str(v), label: def.format ? def.format(v) : str(v) });
    }));
    options.sort((a, b) => String(a.label).localeCompare(String(b.label), undefined, { numeric: true }));
  }
  return options.map((o) => ({ ...o, value: str(o.value), count: counts.get(str(o.value)) || 0 }));
}

export const activeCount = (defs, state) => defs.filter((d) => isActive(d, state?.[d.key])).length;

/** Applied filters as removable chips: [{ key, value?, label }]. One chip per picked checklist option. */
export function chipsFor(defs, state, rows) {
  const out = [];
  defs.forEach((d) => {
    const v = state?.[d.key];
    if (!isActive(d, v)) return;
    if (d.type === "checklist") {
      const labels = new Map((d.options || optionCounts(rows || [], [], {}, d)).map((o) => [str(o.value), o.label]));
      v.forEach((x) => out.push({ key: d.key, value: str(x), label: `${d.label}: ${labels.get(str(x)) ?? x}` }));
    } else if (d.type === "range") {
      const unit = d.unit ? ` ${d.unit}` : "";
      const lo = v.min !== undefined && v.min !== null && v.min !== "";
      const hi = v.max !== undefined && v.max !== null && v.max !== "";
      out.push({ key: d.key, label: `${d.label}: ${lo && hi ? `${v.min}–${v.max}` : lo ? `${v.min}+` : `up to ${v.max}`}${unit}` });
    } else if (d.type === "yesno") {
      out.push({ key: d.key, label: d.chip ? d.chip(v) : `${d.label}: ${v === "yes" ? d.yes || "Yes" : d.no || "No"}` });
    }
  });
  return out;
}

/** State without one chip. */
export function removeChip(state, chip) {
  const next = { ...(state || {}) };
  if (chip.value !== undefined && Array.isArray(next[chip.key])) {
    next[chip.key] = next[chip.key].filter((x) => str(x) !== chip.value);
    if (next[chip.key].length === 0) delete next[chip.key];
  } else {
    delete next[chip.key];
  }
  return next;
}

// ---- URL ----------------------------------------------------------------------------------------
// checklist: key=a,b   range: key=min~max   yesno: key=yes. Values are URI-encoded one by one, so commas inside values survive.

export function toQuery(defs, state) {
  const q = {};
  defs.forEach((d) => {
    const v = state?.[d.key];
    if (!isActive(d, v)) return;
    const k = `f_${d.key}`;
    if (d.type === "checklist") q[k] = v.map((x) => encodeURIComponent(str(x))).join(",");
    else if (d.type === "range") q[k] = `${v.min ?? ""}~${v.max ?? ""}`;
    else q[k] = v;
  });
  return q;
}

export function fromQuery(defs, query) {
  const state = {};
  defs.forEach((d) => {
    const raw = query?.[`f_${d.key}`];
    if (raw === undefined || raw === null || raw === "") return;
    const text = Array.isArray(raw) ? raw[0] : String(raw);
    if (d.type === "checklist") {
      const values = text.split(",").filter(Boolean).map((x) => { try { return decodeURIComponent(x); } catch { return x; } });
      if (values.length) state[d.key] = values;
    } else if (d.type === "range") {
      const [min, max] = text.split("~");
      const v = { min: min === "" || min === undefined ? undefined : Number(min), max: max === "" || max === undefined ? undefined : Number(max) };
      if (isActive(d, v)) state[d.key] = v;
    } else if (d.type === "yesno" && (text === "yes" || text === "no")) {
      state[d.key] = text;
    }
  });
  return state;
}

/** The router query with this page's filters replaced (other query keys kept). */
export function mergeQuery(query, defs, state) {
  const next = {};
  Object.entries(query || {}).forEach(([k, v]) => { if (!k.startsWith("f_")) next[k] = v; });
  return { ...next, ...toQuery(defs, state) };
}
