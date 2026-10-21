import { getPresignUpload, uploadFileViaBackend } from "@/api/Services/AdminService";
import { reportFileUploadFailure } from "@/utils/clientErrorReporting";

/** Derive an R2 key from a bare key or URL (for best-effort cleanup only). */
export function extractR2KeyFromUrl(url) {
  if (!url) return null;
  try {
    const raw = String(url).trim();
    if (!raw) return null;
    if (!raw.includes("://")) return raw.startsWith("/") ? raw.substring(1) : raw;
    const urlObj = new URL(raw);
    return urlObj.pathname.startsWith("/") ? urlObj.pathname.substring(1) : urlObj.pathname;
  } catch {
    const key = String(url).trim();
    if (!key) return null;
    return key.startsWith("/") ? key.substring(1) : key;
  }
}

const EXT_TO_MIME = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  txt: "text/plain",
  csv: "text/csv",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

export function getContentTypeFromFile(file) {
  if (file.type && file.type !== "application/octet-stream") return file.type;
  const name = (file.name || "").toLowerCase();
  const ext = name.includes(".") ? name.slice(name.lastIndexOf(".") + 1) : "";
  return EXT_TO_MIME[ext] || "application/octet-stream";
}

/**
 * Direct presigned upload with backend-proxy fallback. Returns metadata for content APIs.
 * Options: folder, type, userId, courseId, classId, lessonContentId, projectId, collegeId.
 */
export async function uploadFileViaPresign(file, options = {}) {
  try {
    return await uploadFileViaPresignInternal(file, options);
  } catch (e) {
    reportFileUploadFailure({ fileName: file?.name, endpoint: "presign-upload", statusCode: e?.status || e?.response?.status, message: e?.message });
    throw e;
  }
}

async function uploadFileViaPresignInternal(file, options = {}) {
  if (!file || typeof file.size !== "number" || file.size <= 0) {
    throw new Error("Invalid file: size must be a positive number");
  }
  const { folder, type = "generic", userId, courseId, classId, lessonContentId, projectId, collegeId } = options;
  const contentType = getContentTypeFromFile(file);
  const payload = {
    fileName: file.name || "upload",
    contentType,
    contentLength: file.size,
    folder: folder || undefined,
    type: type === "generic" ? "generic" : type,
    ...(userId != null && { userId }),
    ...(courseId != null && { courseId }),
    ...(classId != null && { classId }),
    ...(lessonContentId != null && { lessonContentId }),
    ...(projectId != null && { projectId: String(projectId) }),
    ...(collegeId != null && { collegeId }),
  };

  let res;
  try {
    res = await getPresignUpload(payload);
  } catch (e) {
    const status = e?.response?.status;
    const msg = (e && e.message ? String(e.message) : "").toLowerCase();
    const shouldFallback = status >= 500 || msg.includes("network") || msg.includes("failed to fetch")
      || msg.includes("bad gateway") || msg.includes("cors");
    if (!shouldFallback) throw e;
    const backendRes = await uploadFileViaBackend(file, { folder, type, userId, courseId, classId, lessonContentId, projectId, collegeId });
    if (!backendRes?.publicUrl || !backendRes?.key) {
      throw new Error("Backend upload failed: missing publicUrl/key");
    }
    return { ...backendRes, mimetype: backendRes.mimetype || contentType };
  }
  const { uploadUrl, key, publicUrl, uploadReceiptId } = res || {};
  if (!uploadUrl || !key) {
    throw new Error("Invalid presign response: missing uploadUrl or key");
  }
  const isVideo = (type || "").toString().toLowerCase() === "video";
  if (!isVideo && !publicUrl) {
    throw new Error("Invalid presign response: missing publicUrl for non-video upload");
  }

  try {
    const putResponse = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": contentType },
    });
    if (!putResponse.ok) {
      const text = await putResponse.text();
      const err = new Error(
        `Upload failed: ${putResponse.status} ${putResponse.statusText}${text ? ` - ${text.slice(0, 200)}` : ""}`
      );
      err.status = putResponse.status;
      err.statusText = putResponse.statusText;
      throw err;
    }
  } catch (e) {
    const msg = (e && e.message ? String(e.message) : "").toLowerCase();
    const isCorsLike = msg.includes("failed to fetch") || msg.includes("cors")
      || msg.includes("networkerror") || msg.includes("load failed");
    if (!isCorsLike) throw e;
    const backendRes = await uploadFileViaBackend(file, { folder, type, userId, courseId, classId, lessonContentId, projectId, collegeId });
    if (!backendRes?.publicUrl || !backendRes?.key) {
      throw new Error("Backend upload failed: missing publicUrl/key");
    }
    return { ...backendRes, mimetype: backendRes.mimetype || contentType };
  }

  return {
    publicUrl: publicUrl ?? "",
    key,
    originalName: file.name || "upload",
    size: file.size,
    mimetype: contentType,
    uploadReceiptId,
  };
}
