/**
 * GR-64: only download successful file responses, never HTML/JSON errors.
 * Usage: const blob = await fetchDownload("/api/export"); downloadBlob(blob, "export.csv");
 * Errors are already friendly and may be shown in an inline notice.
 */
import { FriendlyFetchError } from "@/lib/api-fetch";
import { friendlyApiError } from "@/lib/friendly-error";

export async function fetchDownload(url: string, init?: RequestInit): Promise<Blob> {
  try {
    const response = await fetch(url, init);
    const type = response.headers.get("content-type")?.toLowerCase() ?? "";
    if (!response.ok || type.includes("application/json") || type.includes("text/html")) {
      throw new FriendlyFetchError(friendlyApiError({ status: response.ok ? 502 : response.status }),
        response.ok ? 502 : response.status);
    }
    return await response.blob();
  } catch (error) {
    if (error instanceof FriendlyFetchError) throw error;
    throw new FriendlyFetchError(friendlyApiError({ network: true }), 0);
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
