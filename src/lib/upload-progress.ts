/**
 * GR-40: browser upload with progress. The caller owns the selected File and
 * keeps it on failure; this helper never clears input state.
 * Usage: await uploadWithProgress(url, file, percent => setProgress(percent)).
 */
import { FRIENDLY_MESSAGES } from "@/lib/friendly-error";
export function uploadWithProgress(url: string, file: File,
  onProgress: (percentage: number) => void, field = "file"): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.timeout = 30_000;
    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && event.total > 0)
        onProgress(Math.min(100, Math.round((100 * event.loaded) / event.total)));
    });
    const fail = () => reject(new Error(FRIENDLY_MESSAGES.unexpected));
    xhr.addEventListener("error", fail);
    xhr.addEventListener("timeout", () => reject(new Error(FRIENDLY_MESSAGES.timeout)));
    xhr.addEventListener("abort", () => reject(new Error(FRIENDLY_MESSAGES.offline)));
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(xhr.status === 413 ? FRIENDLY_MESSAGES.tooLarge :
        xhr.status === 415 ? FRIENDLY_MESSAGES.fileType :
        xhr.status === 503 ? FRIENDLY_MESSAGES.maintenance :
        FRIENDLY_MESSAGES.unexpected));
    });
    const payload = new FormData();
    payload.append(field, file);
    xhr.send(payload);
  });
}
