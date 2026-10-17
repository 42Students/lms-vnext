/**
 * GR-40: validate a selected file before starting a transfer.
 * Usage: const check = validateUpload(file, { maxBytes: 5_000_000,
 *   allowedTypes: ["application/pdf"], available: storageReady });
 * On failure keep the File in component state so the user may retry.
 */
import { FRIENDLY_MESSAGES } from "@/lib/friendly-error";
export type UploadRules = { maxBytes: number; allowedTypes: readonly string[]; available?: boolean };
export type UploadValidation = { ok: true } | { ok: false; message: string };

export function validateUpload(file: Pick<File, "size" | "type"> | null, rules: UploadRules): UploadValidation {
  if (rules.available === false)
    return { ok: false, message: "Uploads are not available right now. Please try again later." };
  if (!file) return { ok: false, message: "Please choose a file and try again." };
  if (file.size > rules.maxBytes) return { ok: false, message: FRIENDLY_MESSAGES.tooLarge };
  if (!rules.allowedTypes.includes(file.type))
    return { ok: false, message: FRIENDLY_MESSAGES.fileType };
  return { ok: true };
}
