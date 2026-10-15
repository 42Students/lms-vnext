import {
  guessContentTypeFromName, validateStorageDeclaration,
} from "@/modules/storage/ui-models";
import {
  parseStagedUploadGrant, submissionFileSchema, storageApiError, type SubmissionFile,
} from "@/modules/courses/learner-storage-ui-model";

export function checkedAssignmentFileDeclaration(file: File, deliveryId: string) {
  const declaration = validateStorageDeclaration("assignment-submission", {
    originalName: file.name, sizeBytes: file.size,
    contentType: file.type || guessContentTypeFromName("assignment-submission", file.name) || "",
  });
  if (!declaration.ok) return { ok: false as const, error: declaration.code };
  return { ok: true as const, value: { ...declaration.value, deliveryId } };
}

/** Browser-to-private-storage PUT: only the signed headers, never app cookies. */
export function putStagedAssignmentBytes(
  url: string, headers: Record<string, string>, file: File,
  signal: AbortSignal, onProgress: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(new DOMException("Upload cancelled", "AbortError")); return; }
    const request = new XMLHttpRequest();
    request.open("PUT", url);
    request.withCredentials = false;
    for (const [key, value] of Object.entries(headers)) request.setRequestHeader(key, value);
    const abort = () => request.abort();
    const cleanup = () => signal.removeEventListener("abort", abort);
    request.upload.onprogress = event => {
      if (event.lengthComputable && event.total > 0) {
        onProgress(Math.min(100, Math.round(100 * event.loaded / event.total)));
      }
    };
    request.onload = () => {
      cleanup();
      if (request.status >= 200 && request.status < 300) { onProgress(100); resolve(); }
      else reject(new Error("The file could not be uploaded. Your assignment has not been submitted."));
    };
    request.onerror = () => { cleanup(); reject(new Error("The file could not be uploaded. Check your connection and try again.")); };
    request.onabort = () => { cleanup(); reject(new DOMException("Upload cancelled", "AbortError")); };
    signal.addEventListener("abort", abort, { once: true });
    request.send(file);
  });
}

async function complete(
  assignmentId: string, fileId: string, signal: AbortSignal, fetcher: typeof fetch,
): Promise<SubmissionFile> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const result = await fetcher(
      `/api/courses/assignments/${encodeURIComponent(assignmentId)}/submission-files/${encodeURIComponent(fileId)}/complete`,
      { method: "POST", credentials: "same-origin", cache: "no-store", signal },
    );
    if (result.ok) return submissionFileSchema.parse((await result.json()).file);
    if (result.status !== 409 || attempt === 2) throw new Error(await storageApiError(result));
    const body = await result.json() as { error?: string };
    if (body.error !== "STORAGE_UPLOAD_NOT_FOUND") throw new Error("The uploaded file could not be verified.");
    await new Promise<void>((resolve, reject) => {
      if (signal.aborted) { reject(new DOMException("Upload cancelled", "AbortError")); return; }
      const abort = () => { clearTimeout(timer); reject(new DOMException("Upload cancelled", "AbortError")); };
      const timer = setTimeout(() => { signal.removeEventListener("abort", abort); resolve(); }, 600);
      signal.addEventListener("abort", abort, { once: true });
    });
  }
  throw new Error("The file could not be verified.");
}

export async function uploadStagedAssignmentFile(
  assignmentId: string, deliveryId: string, file: File, signal: AbortSignal,
  onProgress: (percent: number) => void, fetcher: typeof fetch = fetch,
  putBytes: typeof putStagedAssignmentBytes = putStagedAssignmentBytes,
): Promise<SubmissionFile> {
  const declaration = checkedAssignmentFileDeclaration(file, deliveryId);
  if (!declaration.ok) throw new Error("The selected file type or size is not allowed.");
  const grantResponse = await fetcher(
    `/api/courses/assignments/${encodeURIComponent(assignmentId)}/submission-files`,
    {
      method: "POST", credentials: "same-origin", cache: "no-store", signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(declaration.value),
    },
  );
  if (!grantResponse.ok) throw new Error(await storageApiError(grantResponse));
  const { file: record, grant } = parseStagedUploadGrant(await grantResponse.json(), Date.now());
  if (record.assignmentId !== assignmentId || record.deliveryId !== deliveryId ||
      record.originalName !== declaration.value.originalName ||
      record.contentType !== declaration.value.contentType || record.sizeBytes !== file.size) {
    throw new Error("The upload permission did not match the selected file.");
  }
  await putBytes(grant.uploadUrl, grant.requiredHeaders, file, signal, onProgress);
  return complete(assignmentId, record.id, signal, fetcher);
}

export async function refreshStagedAssignmentFile(
  assignmentId: string, fileId: string, signal: AbortSignal, fetcher: typeof fetch = fetch,
) { return complete(assignmentId, fileId, signal, fetcher); }
