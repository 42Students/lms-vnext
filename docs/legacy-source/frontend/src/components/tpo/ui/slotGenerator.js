// Interview/test slot generator. A TPO planning a 40-student interview day used to add slots one at a time; this turns
// "9:00 to 1:00, 20 minutes each, two panels, a break after every 6" into the full list in one step.

const pad = (n) => String(n).padStart(2, "0");
export const MAX_SLOTS = 400;

/** "09:30" -> minutes since midnight, or null if it is not a valid HH:mm. */
export function toMinutes(hhmm) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || "").trim());
  if (!m) return null;
  const h = Number(m[1]); const min = Number(m[2]);
  return h > 23 || min > 59 ? null : h * 60 + min;
}

const stamp = (date, minutes) => `${date}T${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}:00`;

/**
 * generateSlots({ date, start, end, lengthMin, gapMin, breakEvery, breakMin, rooms, capacity })
 *  - every room/panel gets the same time grid (parallel panels run side by side)
 *  - a slot that would run past `end` is not created
 *  - after every `breakEvery` slots (per panel) a `breakMin` minute break is left
 * Returns { slots, error }. `error` is a plain sentence for the form; `slots` is [] when there is one.
 */
export function generateSlots({ date, start, end, lengthMin, gapMin = 0, breakEvery = 0, breakMin = 0, rooms = [], capacity = 1 }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ""))) return { slots: [], error: "Pick the date." };
  const s = toMinutes(start); const e = toMinutes(end);
  if (s === null || e === null) return { slots: [], error: "Enter the start and end time, like 09:00." };
  if (e <= s) return { slots: [], error: "The end time must be after the start time." };
  const len = Number(lengthMin);
  if (!Number.isFinite(len) || len < 5 || len > 480) return { slots: [], error: "A slot must be between 5 and 480 minutes." };
  const gap = Math.max(0, Number(gapMin) || 0);
  const every = Math.max(0, Math.floor(Number(breakEvery) || 0));
  const brk = Math.max(0, Number(breakMin) || 0);
  const names = (rooms || []).map((r) => String(r || "").trim()).filter(Boolean);
  const places = names.length ? names : [""];

  const times = [];
  let t = s; let count = 0;
  while (t + len <= e) {
    times.push([t, t + len]);
    count += 1;
    t += len + gap;
    if (every > 0 && brk > 0 && count % every === 0) t += brk;
    if (times.length * places.length > MAX_SLOTS) return { slots: [], error: `That makes more than ${MAX_SLOTS} slots. Use a longer slot or a shorter window.` };
  }
  if (times.length === 0) return { slots: [], error: "No slot fits in that window. Make the window longer or the slot shorter." };

  const cap = Math.max(1, Math.floor(Number(capacity) || 1));
  const slots = [];
  times.forEach(([a, b]) => places.forEach((room) => {
    slots.push({ startsAt: stamp(date, a), endsAt: stamp(date, b), room: room || undefined, panel: room || undefined, capacity: cap });
  }));
  return { slots, error: null };
}
