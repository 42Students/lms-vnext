/**
 * COL-academic-setup-12: Academic Setup mutation failures show the legacy
 * sentences, never raw machine codes.
 * Legacy sources: NewProgramServiceImpl (program name conflict), BatchServiceImpl
 * (batch delete blocked) and LFE/utils/formErrors.js (generic form failure).
 */
export const ACADEMIC_SETUP_GENERIC_ERROR = "The form could not be saved. Please review it and try again.";

const KNOWN_ERROR_COPY: Readonly<Record<string, string>> = {
  PROGRAM_NAME_CONFLICT: "Program name already exists in this department",
  BATCH_HAS_DEPENDENCIES: "Cannot delete batch: it has classes. Delete/move the classes first.",
};

const MACHINE_CODE = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+$/;

/** True for strings such as `PROMOTION_FAILED` that must not be shown to people. */
export function isMachineErrorCode(value: string) {
  return MACHINE_CODE.test(value.trim());
}

/** Maps an API error code (or an Error thrown with that code) to a sentence for the admin. */
export function academicSetupErrorMessage(error: unknown, fallback: string = ACADEMIC_SETUP_GENERIC_ERROR) {
  const raw = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  const trimmed = raw.trim();
  if (!trimmed) return fallback;
  const known = KNOWN_ERROR_COPY[trimmed];
  if (known) return known;
  return isMachineErrorCode(trimmed) ? fallback : trimmed;
}
