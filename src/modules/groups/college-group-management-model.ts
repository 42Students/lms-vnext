import { z } from "zod";

const uuid = z.string().uuid();
const groupName = z.string().trim().min(1).max(150);
const description = z.string().trim().max(1000);
const capacity = z.number().int().min(1).max(10000).nullable();
const version = z.number().int().min(0);

export const collegeStudyGroupCreateSchema = z.object({
  name: groupName,
  description,
  capacity,
}).strict();

export const collegeStudyGroupChangeSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("EDIT"),
    expectedVersion: version,
    name: groupName,
    description,
    capacity,
  }).strict(),
  z.object({
    action: z.literal("STATUS"),
    expectedVersion: version,
    transition: z.enum(["ACTIVATE", "CLOSE", "ARCHIVE"]),
  }).strict(),
]);

export const collegeGroupIdSchema = uuid;
export type CollegeStudyGroupCreate = z.infer<typeof collegeStudyGroupCreateSchema>;
export type CollegeStudyGroupChange = z.infer<typeof collegeStudyGroupChangeSchema>;

export function studyGroupNextStatus(status: string, transition: "ACTIVATE" | "CLOSE" | "ARCHIVE", activeCount: number, openMembers: number) {
  if (transition === "ACTIVATE" && (status === "DRAFT" || status === "CLOSED")) return "ACTIVE";
  if (transition === "CLOSE" && status === "ACTIVE") return "CLOSED";
  if (transition === "ARCHIVE" && (status === "DRAFT" || status === "CLOSED") && activeCount === 0 && openMembers === 0) return "ARCHIVED";
  return null;
}

export function studyGroupConflictMessage(code: string): string {
  switch (code) {
    case "GROUP_NAME_TAKEN": return "Another study group already uses that name in this college.";
    case "GROUP_STALE": return "This group changed in another session. Refresh the page before retrying.";
    case "GROUP_HAS_MEMBERS": return "The new capacity is below the current active member count.";
    case "GROUP_TRANSITION_INVALID": return "This transition is not allowed while the group has members or is in this state.";
    case "GROUP_NOT_MANAGEABLE": return "Only college-owned study groups can be managed here.";
    case "GROUP_NOT_FOUND": return "This group no longer exists in this college.";
    default: return "Unable to save this group. Review the details or refresh the list.";
  }
}
