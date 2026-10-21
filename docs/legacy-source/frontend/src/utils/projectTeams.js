// Splitting a class into project teams (docs/groups/PROJECT-TEAMS.md). Pure functions so the preview
// the admin adjusts is exactly what is sent.

const rollKey = (l) => String(l?.rollNumber ?? l?.roll_number ?? "");

/** Deterministic shuffle (mulberry32) so a preview can be re-rolled but is stable while viewed. */
const seededShuffle = (items, seed) => {
  const out = items.slice();
  let t = seed >>> 0;
  const rand = () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

/**
 * Split learners into teams of about `size`. Teams differ by at most one member: with 23 learners
 * and size 5 you get 5 teams of 5,5,5,4,4 rather than 4 teams of 5 and a lonely team of 3.
 * order: "roll" (roll-number order, numeric-aware) or "random" (seeded).
 */
export function splitIntoTeams(learners, size, { order = "roll", seed = 1 } = {}) {
  const list = (Array.isArray(learners) ? learners : []).filter((l) => l && l.id != null);
  const teamSize = Math.max(1, Math.floor(Number(size) || 1));
  if (!list.length) return [];
  const ordered = order === "random"
    ? seededShuffle(list, seed)
    : list.slice().sort((a, b) => rollKey(a).localeCompare(rollKey(b), undefined, { numeric: true }) || Number(a.id) - Number(b.id));
  const teamCount = Math.max(1, Math.ceil(ordered.length / teamSize));
  const base = Math.floor(ordered.length / teamCount);
  let extra = ordered.length % teamCount;
  const teams = [];
  let cursor = 0;
  for (let t = 0; t < teamCount; t += 1) {
    const take = base + (extra > 0 ? 1 : 0);
    if (extra > 0) extra -= 1;
    teams.push(ordered.slice(cursor, cursor + take));
    cursor += take;
  }
  return teams;
}

/** Move one learner into another team (returns new arrays; never duplicates a learner). */
export function moveLearner(teams, learnerId, toIndex) {
  const id = Number(learnerId);
  let moving = null;
  const without = teams.map((team) => team.filter((l) => {
    if (Number(l.id) === id) { moving = l; return false; }
    return true;
  }));
  if (!moving || toIndex < 0 || toIndex >= without.length) return teams;
  without[toIndex] = [...without[toIndex], moving];
  return without;
}

export const teamTitle = (base, index) => `${String(base || "Project").trim()} - Team ${index + 1}`;
