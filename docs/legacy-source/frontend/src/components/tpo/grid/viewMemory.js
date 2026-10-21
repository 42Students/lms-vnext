// What a saved view remembers, in words a TPO can read months later (GridWorkspace save dialog, Manage views, the Views menu
// tooltip, the Excel note line), and whether a new view would only repeat one that exists.
//
// The words are captured when the view is saved (filters and page filters as people read them, sort, whether the columns
// were changed) and kept with the view, so they stay right even after a batch finishes, a filter's options change, or a
// column hides itself under other filters. Views saved before that are described from their filters as well as possible.
import { chipsFor } from "@/components/tpo/filters/filterModel";

/** The page's top pickers, in the order people think of them: who, then how they are narrowed. */
const WHO_KEYS = ["batch", "program", "branch"];
/** Facts shown as their values only ("B.Tech CSE", "2026-2027 Batch"): their names add nothing. */
const VALUE_ONLY = ["batch", "program"];

/** The body a view keeps: { panel, q, columns, extra, note?, savedCount?, savedAt?, memory? }. Old views kept a page's own
 *  filters at the top level; they are read as { extra: thatObject, q }. */
export function bodyOf(v) {
  let f;
  try { f = typeof v?.filters === "string" ? JSON.parse(v.filters) : v?.filters || {}; } catch (_) { f = {}; }
  if (!f || typeof f !== "object") return { panel: {}, q: "", extra: {} };
  if (f.panel || f.columns || f.extra || f.memory) return f;
  const { q, ...rest } = f;
  return { panel: {}, q: q || "", extra: rest };
}

const humanize = (k) => String(k).replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/^./, (c) => c.toUpperCase());
const isEmpty = (v) => v === null || v === undefined || v === "" || v === false
  || (Array.isArray(v) && v.length === 0) || (typeof v === "object" && !Array.isArray(v) && Object.values(v).every(isEmpty));
const plainOf = (v) => (Array.isArray(v) ? v.map(plainOf).join(", ") : v && typeof v === "object"
  ? Object.entries(v).filter(([, x]) => !isEmpty(x)).map(([k, x]) => `${humanize(k)} ${plainOf(x)}`).join(", ") : v === true ? "Yes" : String(v));

/**
 * Applied filters as facts: [{ key, label, values, text }]. chipsFor makes one chip per picked option ("Branch: CSE", "Branch:
 * ECE"); a person reads them as one fact. Batch drops its program prefix when Program is a fact too, so nothing repeats. A page's
 * own filters (extra) become facts as well, so a narrowed list is never described as "Everyone".
 */
export function factsOf(defs, panel, rows, extra) {
  const groups = new Map();
  chipsFor(defs || [], panel || {}, rows || []).forEach((c) => {
    const at = c.label.indexOf(": ");
    const label = at > 0 ? c.label.slice(0, at) : c.label;
    const value = at > 0 ? c.label.slice(at + 2) : "";
    const g = groups.get(c.key) || { key: c.key, label, values: [] };
    if (value) g.values.push(value);
    groups.set(c.key, g);
  });
  const programs = groups.get("program")?.values || [];
  const batch = groups.get("batch");
  if (batch && programs.length) {
    batch.values = batch.values.map((b) => {
      const p = programs.find((x) => b.startsWith(`${x} · `));
      return p ? b.slice(p.length + 3) : b;
    });
  }
  const pageFacts = Object.entries(extra || {}).filter(([, v]) => !isEmpty(v))
    .map(([k, v]) => ({ key: `extra:${k}`, label: humanize(k), values: [plainOf(v)] }));
  const facts = [...groups.values(), ...pageFacts].map((g) => ({
    ...g, text: VALUE_ONLY.includes(g.key) ? g.values.join(", ") : g.values.length ? `${g.label} ${g.values.join(", ")}` : g.label,
  }));
  return [...facts.filter((f) => WHO_KEYS.includes(f.key)).sort((a, b) => WHO_KEYS.indexOf(a.key) - WHO_KEYS.indexOf(b.key)),
    ...facts.filter((f) => !WHO_KEYS.includes(f.key))];
}

const idOf = (c) => c.colId || c.field;

/**
 * Whether the columns were changed by the person (moved, or shown/hidden by hand), against the table's own layout at that
 * moment. Columns kept only for exports, and ones the page hides by itself under the current filters, are not a change.
 */
export function hasCustomColumns(columns, state) {
  if (!Array.isArray(state) || !state.length || !Array.isArray(columns) || !columns.length) return false;
  const own = columns.filter((c) => idOf(c) && !c.context?.exportOnly);
  const ids = own.map(idOf);
  const order = state.map((s) => s.colId).filter((id) => ids.includes(id));
  if (order.join("|") !== ids.filter((id) => order.includes(id)).join("|")) return true;
  return state.some((s) => {
    const c = own.find((x) => idOf(x) === s.colId);
    return c && Boolean(s.hide) !== Boolean(c.hide || c.defaultHidden);
  });
}

/** "CGPA, high to low" from the saved column state, or "" when not sorted. */
export function sortOf(columns, state) {
  const sorted = (Array.isArray(state) ? state : []).filter((s) => s.sort).sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0));
  if (!sorted.length) return "";
  return sorted.map((s) => {
    const c = (columns || []).find((x) => idOf(x) === s.colId);
    const name = c?.headerName || c?.title || humanize(s.colId);
    return `${name}, ${s.sort === "desc" ? "high to low" : "low to high"}`;
  }).join(" then ");
}

/**
 * The words kept with a view when it is saved: { facts: [text], q, sort, customColumns }. Kept, not worked out later, so a
 * finished batch, a renamed option or a column the page hides under other filters never changes what the view says it holds.
 */
export function memoryOf({ defs, panel, rows, extra, q, columns, columnState }) {
  return {
    facts: factsOf(defs, panel, rows, extra).map((f) => f.text),
    q: String(q || "").trim(),
    sort: sortOf(columns, columnState),
    customColumns: hasCustomColumns(columns, columnState),
  };
}

/** One line: "B.Tech CSE · 2026-2027 Batch · Department CSE, ECE · CGPA 7+ · Search "reddy" · sorted by CGPA, high to low". */
export function rulesLine(memory) {
  const parts = [...(memory?.facts || [])];
  if (memory?.q) parts.push(`Search "${memory.q}"`);
  if (memory?.sort) parts.push(`sorted by ${memory.sort}`);
  if (memory?.customColumns) parts.push("custom columns");
  return parts.length ? parts.join(" · ") : "Everyone, no filters";
}

/**
 * A short suggested name from the two or three most specific facts: what narrows the list beats who it is, picked values
 * without their filter names ("CSE, ECE · CGPA 7+"). One specific fact alone leads with who it is ("B.Tech CSE · CSE").
 * taken: names already used here; the suggestion never repeats one ("CSE 2").
 */
export function suggestName(facts, q, taken = []) {
  const specific = facts.filter((f) => !VALUE_ONLY.includes(f.key));
  const pick = (specific.length >= 2 ? specific
    : [...facts.filter((f) => VALUE_ONLY.includes(f.key)).slice(0, 3 - specific.length), ...specific]).slice(0, 3);
  const short = (f) => {
    if (!f.values.length) return f.label;
    const vals = f.values.length > 2 ? `${f.values.slice(0, 2).join(", ")} +${f.values.length - 2}` : f.values.join(", ");
    // A range or a yes/no reads with its name ("CGPA 7+"); a pick list reads as its values ("CSE, ECE").
    return /^[\d<>≥≤+–-]|^up to|^Yes$|^No$/i.test(f.values[0]) ? `${f.label} ${vals}` : vals;
  };
  let name = [...pick.map(short), q ? `"${q}"` : null].filter(Boolean).join(" · ");
  if (name.length > 80) name = `${name.slice(0, 77)}…`;
  if (!name) name = "My view";
  const used = new Set(taken.map((t) => String(t).trim().toLowerCase()));
  if (!used.has(name.toLowerCase())) return name;
  for (let i = 2; i < 100; i += 1) if (!used.has(`${name} ${i}`.toLowerCase())) return `${name} ${i}`;
  return name;
}

/** A filter body reduced to what decides the list, in one order: lists sorted, numbers as text, empties dropped. */
function canonical(v) {
  if (Array.isArray(v)) {
    const items = v.map(canonical).filter((x) => x !== undefined);
    if (!items.length) return undefined;
    return items.every((x) => typeof x === "string") ? [...items].sort() : items;
  }
  if (v && typeof v === "object") {
    const out = {};
    Object.keys(v).sort().forEach((k) => { const c = canonical(v[k]); if (c !== undefined) out[k] = c; });
    return Object.keys(out).length ? out : undefined;
  }
  if (v === null || v === undefined || v === "" || v === false) return undefined;
  return String(v).trim();
}
const listKey = (body) => JSON.stringify({
  panel: canonical(body?.panel) || null,
  q: String(body?.q || "").trim().replace(/\s+/g, " ").toLowerCase() || null,
  extra: canonical(body?.extra) || null,
});
const columnsKey = (state) => JSON.stringify((Array.isArray(state) ? state : []).map((s) => [s.colId, Boolean(s.hide), s.sort || null]));

/** Two bodies keep the same list: same filters, search and page filters (columns, sort, names and notes aside). */
export const sameList = (a, b) => listKey(a) === listKey(b);
/** Same list and the same columns, order, hidden ones and sort: nothing at all would differ. */
export const sameEverything = (a, b) => sameList(a, b) && columnsKey(a?.columns) === columnsKey(b?.columns);
