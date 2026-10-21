/** Exact legacy wording of SemesterManagement.js (lms-dev-2026): COL-academic-setup-26. */
export const SEMESTER_COPY = {
  createTitle: "Create New Semester",
  programLabel: "Program",
  numberLabel: "Semester Number",
  numberPlaceholder: "1, 2, 3...",
  nameLabel: "Semester Name",
  namePlaceholder: "e.g., First Year - Term 1",
  createButton: "Create Semester",
  createdMessage: (name: string) => `Created semester “${name}”. Next, map its courses and assign faculty.`,
  createFailed: "Semester was not created",
  editTitle: "Edit Semester",
  promotionNote: "Batches can only be promoted into an active semester.",
  statusLabel: "Status",
  statusActive: "Active",
  statusInactive: "Inactive",
  saveButton: "Save Changes",
  updatedMessage: "Semester updated successfully!",
  updateFailed: "Semester was not updated",
  deleteTitle: "Delete this semester?",
  deleteBlocked: "This is blocked while any courses are mapped to this semester — remove the course mappings first.",
  deletedMessage: "Semester deleted successfully!",
  deleteFailed: "Semester was not deleted",
} as const;

/** UI lifecycle uses toast notifications for create/update/delete, matching
 * the legacy message placement. Inline forms keep validation errors; a
 * second success notice should not duplicate an already shown toast.
 */
/** Only a safe local message is rendered, never raw database relation names,
 * private SQL constraints or college identifiers from a failed mutation. */
export function semesterSafeError(code:string){
 const errors:Record<string,string>={
  SEMESTER_NAME_TAKEN:"A semester with this name already exists. Choose another name.",
  SEMESTER_NOT_FOUND:"This semester is no longer available. Refresh the list.",
  SEMESTER_HAS_MAPPINGS:"Remove linked course mappings before deleting this semester.",
  SEMESTER_HAS_BATCHES:"Move or complete linked batches before deleting this semester.",
 };
 return errors[code]??"Couldn't save the semester. Check the fields and try again.";
}
export const SEMESTER_SUCCESS_FEEDBACK="TOAST" as const;

/** Legacy table shorthand for a numbered semester, for example `Sem 3`. */
export function semesterShortLabel(termNumber: number) {
  return `Sem ${termNumber}`;
}
