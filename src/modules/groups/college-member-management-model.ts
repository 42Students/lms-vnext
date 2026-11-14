import { z } from "zod";

import { zUuid } from "@/lib/schema-primitives";
export const collegeStudyMemberSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("ADD"),
    membershipId: zUuid,
  }).strict(),
  z.object({
    action: z.literal("REMOVE"),
    membershipId: zUuid,
  }).strict(),
  z.object({
    action: z.literal("REMOVE_AND_LOCK"),
    membershipId: zUuid,
    expectedVersion: z.number().int().min(0),
    confirm: z.literal(true),
  }).strict(),
  z.object({
    action: z.literal("LOCK"),
    membershipId: zUuid,
    locked: z.boolean(),
  }).strict(),
]);

export type CollegeStudyMemberAction = z.infer<typeof collegeStudyMemberSchema>;

export function collegeStudyMemberLabel(action: CollegeStudyMemberAction) {
  if (action.action === "ADD") return "Add learner to study group?";
  if (action.action === "REMOVE") return "Remove this group member?";
  if (action.action === "REMOVE_AND_LOCK") return "Remove and lock this learner?";
  return action.locked ? "Lock group member?" : "Unlock group member?";
}
