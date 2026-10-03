export function getYouTubeVideoId(
  value: string,
) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();

    if (host === "youtu.be") {
      return (
        url.pathname
          .split("/")
          .filter(Boolean)[0] ?? null
      );
    }

    if (
      host === "youtube.com" ||
      host.endsWith(".youtube.com")
    ) {
      if (
        url.pathname === "/watch"
      ) {
        return url.searchParams.get("v");
      }

      const parts = url.pathname
        .split("/")
        .filter(Boolean);

      if (
        parts[0] === "embed" ||
        parts[0] === "shorts" ||
        parts[0] === "live"
      ) {
        return parts[1] ?? null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function shouldPersistPlayback(
  lastSavedSeconds: number,
  currentSeconds: number,
  force = false,
) {
  if (
    !Number.isFinite(currentSeconds) ||
    currentSeconds < 0
  ) {
    return false;
  }

  if (force) {
    return (
      Math.floor(currentSeconds) >
      Math.floor(lastSavedSeconds)
    );
  }

  return (
    currentSeconds - lastSavedSeconds >= 5
  );
}
