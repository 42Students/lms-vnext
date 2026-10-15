/** Primary mentor continuity must survive all mutations on an active project. */
export function mayRemovePrimaryProjectMentor(projectStatus: string, role: string, isPrimary: boolean): boolean {
  return !(projectStatus === "ACTIVE" && role === "MENTOR" && isPrimary);
}
