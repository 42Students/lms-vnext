/**
 * Resume upload helpers: URL validation, response normalization, file validation.
 * Used by profile resume card and job apply page.
 */

import { RESUME_URL_ALLOWED_DOMAINS } from "@/config/appConfig";

export const RESUME_MAX_BYTES = 10 * 1024 * 1024; // 10 MB
export const RESUME_ACCEPT_EXTENSIONS = [".pdf", ".doc", ".docx"];
const RESUME_MIME_PATTERNS = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

/**
 * Validates a resume URL: must be HTTPS and from an allowed domain.
 * @param {*} url
 * @returns {boolean}
 */
export function isValidResumeUrl(url) {
  if (url == null || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed || !trimmed.startsWith("https://")) return false;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:") return false;
    const pathname = decodeURIComponent(parsed.pathname || "");
    if (!pathname.includes("/resumes/user-")) return false;
    const domains = RESUME_URL_ALLOWED_DOMAINS || [];
    if (domains.length === 0) return true;
    return domains.some((domain) => {
      const normalizedDomain = String(domain || "").trim().toLowerCase();
      if (!normalizedDomain) return false;
      return parsed.hostname === normalizedDomain || parsed.hostname.endsWith(`.${normalizedDomain}`);
    });
  } catch {
    return false;
  }
}

/**
 * Extract resume URL from upload API response (supports multiple shapes).
 * @param {*} uploadData - Parsed JSON from upload endpoint
 * @returns {string|null}
 */
export function normalizeResumeUploadResponse(uploadData) {
  if (!uploadData || typeof uploadData !== "object") return null;
  const url =
    uploadData.url ??
    uploadData.data?.url ??
    uploadData.fileUrl ??
    uploadData.file_url ??
    null;
  if (url != null && typeof url === "string") return url.trim();
  return null;
}

/**
 * Checks the first 4 bytes of a PDF file for the %PDF magic bytes (25 50 44 46).
 * @param {File} file
 * @returns {Promise<boolean>}
 */
export const validatePdfMagicBytes = (file) => new Promise((resolve) => {
  const reader = new FileReader();
  reader.onloadend = (e) => {
    const arr = new Uint8Array(e.target.result).subarray(0, 4);
    const header = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
    resolve(header.startsWith('25504446')); // %PDF
  };
  reader.readAsArrayBuffer(file.slice(0, 4));
});

/**
 * Validate file before upload: requires BOTH valid extension AND valid MIME type, plus size check.
 * For PDF files also verifies magic bytes asynchronously via validatePdfMagicBytes.
 * @param {File} file
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateResumeFile(file) {
  if (!file || !(file instanceof File)) {
    return { valid: false, error: "Invalid file." };
  }
  const name = (file.name || "").toLowerCase();
  const hasValidExtension = RESUME_ACCEPT_EXTENSIONS.some((ext) => name.endsWith(ext));
  const mime = (file.type || "").toLowerCase();
  const hasValidMime =
    RESUME_MIME_PATTERNS.includes(mime) ||
    mime.startsWith("application/vnd.openxmlformats-officedocument.wordprocessingml");
  if (!hasValidExtension || !hasValidMime) {
    return { valid: false, error: "Resume must be a valid PDF or Word file (.pdf, .doc, .docx). Please check the file is not renamed." };
  }
  if (file.size > RESUME_MAX_BYTES) {
    return { valid: false, error: `Resume must be under ${RESUME_MAX_BYTES / 1024 / 1024} MB.` };
  }
  return { valid: true };
}

/**
 * Full async validation for resume files. For PDFs, also checks magic bytes.
 * Use this instead of validateResumeFile when you need the magic-byte check.
 * @param {File} file
 * @returns {Promise<{ valid: boolean, error?: string }>}
 */
export async function validateResumeFileAsync(file) {
  const syncResult = validateResumeFile(file);
  if (!syncResult.valid) return syncResult;

  const name = (file.name || "").toLowerCase();
  if (name.endsWith(".pdf")) {
    const isPdf = await validatePdfMagicBytes(file);
    if (!isPdf) {
      return { valid: false, error: "The file does not appear to be a valid PDF. Please upload a genuine PDF file." };
    }
  }
  return { valid: true };
}
