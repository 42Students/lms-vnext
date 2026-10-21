// Drive-day field mode: the small decisions behind "type a roll number", "paste a list" and "call next". Pure so they can be tested.

const norm = (v) => String(v || "").trim().toUpperCase();

/**
 * Find the student for a typed roll number: an exact match wins; otherwise a prefix or suffix that matches exactly one student
 * ("007" on a gate with 40 students) is accepted; fewer than 3 characters never is. Anything ambiguous returns { ambiguous: [...] } instead of guessing.
 */
export function findByRoll(students, query) {
  const q = norm(query);
  if (!q) return { student: null };
  const list = students || [];
  const exact = list.filter((s) => norm(s.rollNumber) === q);
  if (exact.length === 1) return { student: exact[0] };
  if (exact.length > 1) return { student: null, ambiguous: exact };
  if (q.length < 3) return { student: null }; // one or two characters would match the wrong student too easily
  const partial = list.filter((s) => norm(s.rollNumber).endsWith(q) || norm(s.rollNumber).startsWith(q));
  if (partial.length === 1) return { student: partial[0] };
  if (partial.length > 1) return { student: null, ambiguous: partial.slice(0, 5) };
  return { student: null };
}

/**
 * Who is next for a panel/room: students who have checked in (PRESENT) and are not yet with a panel, earliest slot first, then roll number.
 * A student assigned to this room goes before one with no room; a student assigned to a different room is never called here.
 */
export function nextInQueue(students, room) {
  const wanted = norm(room);
  const waiting = (students || []).filter((s) => s.attendance === "PRESENT");
  const eligible = waiting.filter((s) => {
    const assigned = norm(s.room || s.assignedRoom);
    return !wanted || !assigned || assigned === wanted;
  });
  const at = (s) => (s.startsAt ? String(s.startsAt) : "9999");
  eligible.sort((a, b) => {
    const aRoom = norm(a.room || a.assignedRoom) === wanted ? 0 : 1;
    const bRoom = norm(b.room || b.assignedRoom) === wanted ? 0 : 1;
    return aRoom - bRoom || at(a).localeCompare(at(b)) || norm(a.rollNumber).localeCompare(norm(b.rollNumber));
  });
  return eligible[0] || null;
}

/** The rooms on the roster with how many are waiting for them and how many are inside, for the "Call next" row. */
export function roomSummary(students) {
  const map = new Map();
  (students || []).forEach((s) => {
    const name = s.room || s.assignedRoom;
    if (!name) return;
    const row = map.get(name) || { name, waiting: 0, inside: 0, done: 0 };
    if (s.attendance === "PRESENT") row.waiting += 1;
    if (s.attendance === "IN_INTERVIEW") row.inside += 1;
    if (s.attendance === "DONE") row.done += 1;
    map.set(name, row);
  });
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}
