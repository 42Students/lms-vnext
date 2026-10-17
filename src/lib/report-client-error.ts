"use client";

/** Root boundaries call this without awaiting; never interrupts recovery. */
export function reportClientError(error: Error, requestId: string, component = "root") {
  if (typeof window === "undefined") return;
  void fetch("/api/client-errors", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      message: error.message.slice(0, 300),
      name: error.name.slice(0, 80),
      component,
      path: window.location.pathname.slice(0, 255),
      requestId,
    }),
    keepalive: true,
  }).catch(() => undefined);
}
