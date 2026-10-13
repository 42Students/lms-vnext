/**
 * Turns a browser user-agent into a short label for the "your devices" list.
 * Deliberately simple and dependency-free; unknown agents fall back to
 * "Unknown device" rather than echoing raw header text.
 */
export function describeDevice(userAgent: string | null | undefined) {
  if (!userAgent) return "Unknown device";

  const browser = /Edg\//.test(userAgent)
    ? "Edge"
    : /OPR\/|Opera/.test(userAgent)
      ? "Opera"
      : /Firefox\//.test(userAgent)
        ? "Firefox"
        : /Chrome\//.test(userAgent) || /CriOS\//.test(userAgent)
          ? "Chrome"
          : /Safari\//.test(userAgent)
            ? "Safari"
            : null;

  const system = /Windows/.test(userAgent)
    ? "Windows"
    : /Android/.test(userAgent)
      ? "Android"
      : /iPhone|iPad|iPod/.test(userAgent)
        ? "iOS"
        : /Mac OS X|Macintosh/.test(userAgent)
          ? "macOS"
          : /Linux|X11/.test(userAgent)
            ? "Linux"
            : null;

  if (browser && system) return `${browser} on ${system}`;
  return browser ?? system ?? "Unknown device";
}
