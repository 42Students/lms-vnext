import Api from "@/api/ApiMethod";
import { getContentTypeFromFile } from "@/utils/uploadToR2";
import { reportFileUploadFailure } from "@/utils/clientErrorReporting";

export { getContentTypeFromFile } from "@/utils/uploadToR2";

/**
 * Canonical Resources use their own presign endpoint. Never fall back to generic
 * uploads: a generic tenant-wide key cannot prove uploader/class ownership and
 * would fail when the Resource is saved, leaving an orphaned object in R2.
 */
export async function uploadResourceFile(file, { folder = "lesson-content", courseId, classId } = {}) {
  if (!file || !Number.isFinite(file.size) || file.size <= 0) {
    throw new Error("Choose a non-empty Resource file");
  }
  if (folder !== "lesson-content") throw new Error("Invalid Resource upload folder");
  if (!(Number(courseId) > 0)) {
    throw new Error("Select a course before uploading a Resource, including class-specific files");
  }
  const contentType = getContentTypeFromFile(file);
  const payload = {
    fileName: file.name,
    contentType,
    contentLength: file.size,
    folder: "lesson-content",
    type: "resource",
    ...(Number(courseId) > 0 ? { courseId: Number(courseId) } : {}),
    ...(Number(classId) > 0 ? { classId: Number(classId) } : {}),
  };
  try {
    const response = await Api.post("/api/v1/resource-uploads/presign", payload);
    const { uploadUrl, key, publicUrl } = response?.data ?? {};
    if (!uploadUrl || !key || !publicUrl) throw new Error("Resource upload authorization did not return a usable URL");
    const result = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": contentType },
    });
    if (!result.ok) throw new Error(`Resource upload failed (HTTP ${result.status})`);
    return {
      key,
      publicUrl,
      originalName: file.name,
      mimetype: contentType,
      size: file.size,
    };
  } catch (e) {
    reportFileUploadFailure({ fileName: file.name, endpoint: "resource-uploads/presign", statusCode: e?.response?.status, message: e?.message });
    throw e;
  }
}
