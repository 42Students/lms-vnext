import { z } from "zod";

export const teamSplitInputSchema = z.object({
  mode: z.enum(["TEAMS", "WHOLE_CLASS", "INDIVIDUAL"]),
  teamSize: z.number().int().min(1).max(100).default(5),
  order: z.enum(["ROLL", "SHUFFLE"]).default("ROLL"),
  seed: z.string().max(128).default(""),
  students: z.array(z.object({
    membershipId: z.string().uuid(),
    rollNumber: z.string().trim().min(1).max(80),
  }).strict()).min(1).max(2000),
}).strict().superRefine((input, ctx) => {
  if (new Set(input.students.map(s => s.membershipId)).size !== input.students.length) {
    ctx.addIssue({ code: "custom", path: ["students"], message: "Duplicate student membership" });
  }
});

export type TeamSplitInput = z.input<typeof teamSplitInputSchema>;
export type ProjectTeam = { name: string; membershipIds: string[] };

function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash = Math.imul(hash ^ seed.charCodeAt(i), 16777619);
  }
  return hash >>> 0;
}

export function previewClassTeams(raw: TeamSplitInput): ProjectTeam[] {
  const input = teamSplitInputSchema.parse(raw);
  const students = [...input.students].sort((a, b) =>
    a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true }) ||
    a.membershipId.localeCompare(b.membershipId));
  if (input.mode === "INDIVIDUAL") {
    return students.map((student,index)=>({name:"Learner "+(index+1),membershipIds:[student.membershipId]}));
  }
  if (input.mode === "WHOLE_CLASS") {
    return [{ name: "Whole class", membershipIds: students.map(s => s.membershipId) }];
  }
  if (input.order === "SHUFFLE") {
    let state = hashSeed(input.seed);
    const random = () => {
      state += 0x6D2B79F5;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    for (let i = students.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      const left=students[i],right=students[j];
      if(left===undefined||right===undefined)throw new Error("Invalid shuffle position");
      students[i]=right;
      students[j]=left;
    }
  }
  const teamCount = Math.ceil(students.length / input.teamSize);
  const base = Math.floor(students.length / teamCount);
  const extra = students.length % teamCount;
  const groups: ProjectTeam[] = [];
  let offset = 0;
  for (let i = 0; i < teamCount; i++) {
    const count = base + (i < extra ? 1 : 0);
    groups.push({
      name: `Team ${i + 1}`,
      membershipIds: students.slice(offset, offset + count).map(s => s.membershipId),
    });
    offset += count;
  }
  return groups;
}

/** Move one learner in the preview without silently duplicating or dropping them. */
export function movePreviewMember(groups: readonly ProjectTeam[], membershipId: string, targetIndex: number): ProjectTeam[] {
  if (!Number.isInteger(targetIndex) || targetIndex < 0 || targetIndex >= groups.length) {
    throw new Error("Invalid destination team");
  }
  const copies = groups.map(group => ({ name: group.name, membershipIds: [...group.membershipIds] }));
  const origins = copies.filter(group => group.membershipIds.includes(membershipId));
  if (origins.length !== 1) throw new Error("Student must belong to exactly one team");
  const origin = origins[0];
  if(!origin)throw new Error("Student must belong to exactly one team");
  const destination=copies[targetIndex];
  if(!destination)throw new Error("Invalid destination team");
  const sourceIndex = copies.indexOf(origin);
  if(sourceIndex===targetIndex)return copies;
  // A planner must never create an empty team: the server's strict
  // classTeamPreviewSchema rejects empty teams on apply.
  if(origin.membershipIds.length<=1)throw new Error("TEAM_PREVIEW_EMPTY_TEAM");
  origin.membershipIds = origin.membershipIds.filter(id => id !== membershipId);
  destination.membershipIds.push(membershipId);
  return copies;
}
