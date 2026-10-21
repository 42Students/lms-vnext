// One parser for every place a faculty member pastes a YouTube link. The forms used to understand
// only watch?v= and youtu.be, while their validation accepted Shorts/embed/mobile links -- so a
// Shorts link "validated" but stored no video (or silently kept a previously typed link).
const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com"]);
const SHORT_HOSTS = new Set(["youtu.be", "www.youtu.be"]);
const VIDEO_ID = /^[\w-]{11}$/;

export function extractYouTubeId(value) {
  let url;
  try {
    url = new URL(String(value || "").trim());
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  const parts = url.pathname.split("/").filter(Boolean);
  let id = null;
  if (SHORT_HOSTS.has(host)) {
    id = parts[0];
  } else if (YOUTUBE_HOSTS.has(host)) {
    if (parts[0] === "watch") id = url.searchParams.get("v");
    else if (["shorts", "embed", "live", "v"].includes(parts[0])) id = parts[1];
  }
  return id && VIDEO_ID.test(id) ? id : null;
}

export function toYouTubeEmbedUrl(value) {
  const id = extractYouTubeId(value);
  return id ? `https://www.youtube.com/embed/${id}` : "";
}
