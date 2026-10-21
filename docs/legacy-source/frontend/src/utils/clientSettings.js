import Api from "@/api/ApiMethod";

/**
 * Part A, "Frontend behaviour": the chat poll interval and progress-save interval were hardcoded
 * 15000ms constants, so changing how hard clients poll the server meant a frontend redeploy.
 *
 * Fetched once per page load and cached in-module — these are slow-moving platform tunables, not
 * per-render state, and every consumer shares the same in-flight promise so N components mounting
 * at once still make exactly one request.
 *
 * Every consumer must pass its own default and keep working if the request fails: this is a
 * performance knob, never a reason to break a page.
 */
const DEFAULTS = {
  chatPollIntervalMs: 15000,
  progressSaveIntervalMs: 15000,
  // Mirrors the backend's own course.watchedThresholdPercent so the video player's optimistic
  // "completed" marker and the server's authoritative isWatched() can't drift apart.
  watchedThresholdPercent: 90,
};

let cache = null;
let inFlight = null;

export function getClientSettingsSync() {
  return cache || DEFAULTS;
}

export async function loadClientSettings() {
  if (cache) return cache;
  if (inFlight) return inFlight;
  inFlight = Api.get("/api/v1/client-settings")
    .then((res) => {
      const data = res?.data?.data ?? res?.data ?? {};
      cache = { ...DEFAULTS, ...(data && typeof data === "object" ? data : {}) };
      return cache;
    })
    .catch(() => {
      // Never let a settings fetch break the feature it configures.
      cache = { ...DEFAULTS };
      return cache;
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}
