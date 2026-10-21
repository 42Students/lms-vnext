"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {StatusBadge} from "@/components/ui/status-badge";
import { courseApiError } from "./learner-course-api";
import {
  getYouTubeVideoId,
  shouldPersistPlayback,
} from "./course-media-model";

type YouTubePlayer = {
  destroy: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  seekTo: (
    seconds: number,
    allowSeekAhead: boolean,
  ) => void;
};

type YouTubePlayerEvent = {
  target: YouTubePlayer;
  data?: number;
};

type YouTubeNamespace = {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string;
      host?: string;
      width?: string;
      height?: string;
      playerVars?: Record<
        string,
        string | number
      >;
      events?: {
        onReady?: (
          event: YouTubePlayerEvent,
        ) => void;
        onStateChange?: (
          event: YouTubePlayerEvent,
        ) => void;
        onError?: (
          event: YouTubePlayerEvent,
        ) => void;
      };
    },
  ) => YouTubePlayer;
  PlayerState: {
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
  };
};

declare global {
  interface Window {
    YT?: YouTubeNamespace;
  }
}

let iframeApiRequested = false;

function ensureYouTubeIframeApi() {
  if (
    typeof window === "undefined" ||
    window.YT?.Player
  ) {
    return;
  }

  if (iframeApiRequested) {
    return;
  }

  iframeApiRequested = true;
  const script =
    document.createElement("script");
  script.src =
    "https://www.youtube.com/iframe_api";
  script.async = true;
  script.dataset.courseYoutubeApi =
    "true";
  script.onerror = () => {
    iframeApiRequested = false;
  };
  document.head.appendChild(script);
}

function formatClock(seconds: number) {
  const safe = Math.max(
    0,
    Math.floor(seconds),
  );
  const minutes = Math.floor(safe / 60);
  const remainder = safe % 60;
  return (
    minutes +
    ":" +
    String(remainder).padStart(2, "0")
  );
}

export function LearnerYouTubePlayer({
  contentId,
  deliveryId,
  externalUrl,
  legacyFileUrl,
  contentTitle,
  contentAddedAt,
  onEdit,
  onDelete,
  onProgressUpdate,
  initialPositionSeconds,
  authoredDurationSeconds,
  completed,
  readOnly = false,
  saveIntervalMs = 15000,
}: {
  contentId: string;
  deliveryId: string;
  externalUrl: string;
  /** Legacy contentDataDTO.link falls back to file_dto.cloud_storage_object. */
  legacyFileUrl?: string | null;
  contentTitle?: string | null;
  contentAddedAt?: string | Date | null;
  onEdit?: () => void;
  onDelete?: () => void;
  onProgressUpdate?: (progress: { status:"NOT_STARTED"|"IN_PROGRESS"|"COMPLETED";lastPositionSeconds:number }) => void;
  initialPositionSeconds: number;
  authoredDurationSeconds: number;
  completed: boolean;
  readOnly?: boolean;
  saveIntervalMs?:number;
}) {
  const router = useRouter();
  const hostRef =
    useRef<HTMLDivElement | null>(null);
  const playerRef =
    useRef<YouTubePlayer | null>(null);
  const lastSavedRef = useRef(
    initialPositionSeconds,
  );
  const savingRef = useRef(false);
  const lastAttemptAtRef=useRef(0);
  const onProgressUpdateRef=useRef(onProgressUpdate);
  onProgressUpdateRef.current=onProgressUpdate;
  const playingRef = useRef(false);
  const mountedRef = useRef(true);
  const completedRef = useRef(completed);

  const [ready, setReady] =
    useState(false);
  const [loadFailed, setLoadFailed] =
    useState(false);
  const [saveError, setSaveError] =
    useState<string | null>(null);
  const [savedSeconds, setSavedSeconds] =
    useState(initialPositionSeconds);
  const [isCompleted, setIsCompleted] =
    useState(completed);
  const [observedDuration,setObservedDuration]=useState(0);

  const videoUrl=externalUrl.trim()||legacyFileUrl?.trim()||"";
  const videoId=getYouTubeVideoId(videoUrl);
  const missingResource=!videoUrl;
  // Legacy lessonContentId -> UUID contentId; WATCHED -> COMPLETED.
  // Teacher authoring lives in the faculty workspace, not in learner progress.
  const saveThrottleMs=Math.max(5000,Math.min(120000,saveIntervalMs));

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!videoId || !hostRef.current) {
      setLoadFailed(true);
      return;
    }

    ensureYouTubeIframeApi();

    let cancelled = false;
    let waitCount = 0;
    const host = hostRef.current;

    const interval =
      window.setInterval(() => {
        if (cancelled) return;

        const YT = window.YT;
        if (!YT?.Player) {
          waitCount += 1;
          if (waitCount >= 100) {
            window.clearInterval(
              interval,
            );
            setLoadFailed(true);
          }
          return;
        }

        window.clearInterval(interval);

        try {
          playerRef.current =
            new YT.Player(host, {
              videoId,
              host: "https://www.youtube-nocookie.com",
              width: "100%",
              height: "100%",
              playerVars: {
                rel: 0,
                modestbranding: 1,
                playsinline: 1,
                origin:
                  window.location.origin,
              },
              events: {
                onReady: (event) => {
                  const duration =
                    event.target.getDuration();
                  if(Number.isFinite(duration)&&duration>0)setObservedDuration(duration);
                  const resumeAt = Math.min(
                    Math.max(
                      0,
                      completed || initialPositionSeconds<=5 ? 0 : initialPositionSeconds,
                    ),
                    duration > 1
                      ? duration - 1
                      : initialPositionSeconds,
                  );

                  if (resumeAt > 5) {
                    event.target.seekTo(
                      resumeAt,
                      true,
                    );
                  }

                  if (!cancelled) {
                    setReady(true);
                  }
                },
                onStateChange: (event) => {
                  playingRef.current =
                    event.data ===
                    YT.PlayerState.PLAYING;

                  if (
                    event.data ===
                      YT.PlayerState.PAUSED ||
                    event.data ===
                      YT.PlayerState.ENDED
                  ) {
                    void persistProgress(
                      true,
                    );
                  }
                },
                onError: () => {
                  if (!cancelled) {
                    setLoadFailed(true);
                  }
                },
              },
            });
        } catch {
          setLoadFailed(true);
        }
      }, 100);

    const progressInterval =
      window.setInterval(() => {
        if (playingRef.current) {
          void persistProgress(false);
        }
      }, 5000);

    function pageHide() {
      void persistProgress(true, true);
    }

    window.addEventListener(
      "pagehide",
      pageHide,
    );

    async function persistProgress(
      force: boolean,
      keepalive = false,
    ) {
      const player = playerRef.current;
      if (
        !player ||
        readOnly ||
        savingRef.current ||
        completedRef.current
      ) {
        return;
      }

      const current =
        player.getCurrentTime();

      if (
        !shouldPersistPlayback(
          lastSavedRef.current,
          current,
          force,
        )
      ) {
        return;
      }

      const positionSeconds = Math.max(
        0,
        Math.floor(current),
      );
      // Poll at five seconds, persist only after the configured (default 15s)
      // interval, except for pause/end/navigation checkpoints.
      const now=Date.now();
      if(!force&&now-lastAttemptAtRef.current<saveThrottleMs)return;
      lastAttemptAtRef.current=now;
      savingRef.current = true;
      try {
        const response = await fetch(
          "/api/courses/progress/" +
            contentId,
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              deliveryId,
              positionSeconds,
            }),
            keepalive,
          },
        );

        if (!response.ok) {
          if (!keepalive) {
            setSaveError(
              await courseApiError(response),
            );
          }
          return;
        }

        const payload =
          (await response.json()) as {
            progress: {
              status:
                | "NOT_STARTED"
                | "IN_PROGRESS"
                | "COMPLETED";
              lastPositionSeconds: number;
            };
          };

        lastSavedRef.current =
          payload.progress
            .lastPositionSeconds;
        onProgressUpdateRef.current?.(payload.progress);

        if (mountedRef.current) {
          setSavedSeconds(
            payload.progress
              .lastPositionSeconds,
          );
          setSaveError(null);

          if (
            payload.progress.status ===
            "COMPLETED"
          ) {
            completedRef.current = true;
            setIsCompleted(true);
            router.refresh();
          }
        }
      } catch {
        if (
          !keepalive &&
          mountedRef.current
        ) {
          setSaveError(
            "Playback is continuing, but progress could not be saved. Check your connection.",
          );
        }
      } finally {
        savingRef.current = false;
      }
    }

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.clearInterval(
        progressInterval,
      );
      window.removeEventListener(
        "pagehide",
        pageHide,
      );

      try {
        const current =
          playerRef.current?.getCurrentTime();
        if (
          !readOnly &&
          current !== undefined &&
          shouldPersistPlayback(
            lastSavedRef.current,
            current,
            true,
          )
        ) {
          void fetch(
            "/api/courses/progress/" +
              contentId,
            {
              method: "PUT",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                deliveryId,
                positionSeconds:
                  Math.floor(current),
              }),
              keepalive: true,
            },
          );
        }
      } catch {
        // Navigation cleanup should never block.
      }

      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [
    authoredDurationSeconds,
    contentId,
    deliveryId,
    initialPositionSeconds,
    router,
    videoId,
    readOnly,
    saveThrottleMs,
  ]);

  // An unpublished legacy content row with no URL has nothing to embed.
  if(missingResource)return null;
  if (!videoId) {
    return (
      <div className="mt-4 space-y-2">
        <Alert tone="error">Video unavailable. It may be region-blocked or removed.</Alert>
        <a
          href={videoUrl}
          
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9"
        >
          Open on YouTube
        </a>
      </div>
    );
  }

  return (
    <div className="ln-syllabus-video-wrap mt-4">
      <header className="mb-3 flex min-w-0 flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-muted-foreground">YouTube Video</p>
          <h3 className="break-words text-base font-semibold text-foreground">{contentTitle?.trim()||"Embedded YouTube video"}</h3>
          {contentAddedAt?<p className="mt-1 text-xs text-muted-foreground">Added {new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium"}).format(new Date(contentAddedAt))}</p>:null}
        </div>
        {(onEdit||onDelete)?<div className="flex flex-wrap items-center gap-2">
          {onEdit?<Button type="button" variant="secondary" onClick={onEdit}>Edit</Button>:null}
          {onDelete?<Button type="button" variant="danger" onClick={onDelete}>Delete</Button>:null}
        </div>:null}
      </header>
      <div className="overflow-hidden rounded-lg border border-border bg-foreground">
        <div
          ref={hostRef}
          className="aspect-video w-full"
          aria-label={contentTitle?.trim()||"Embedded YouTube video"}
        />
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={isCompleted?"success":savedSeconds>0?"info":"neutral"}>
            {isCompleted?"Completed":savedSeconds>0?"In progress":"Not started"}
          </StatusBadge>
          {readOnly?"Past semester · progress is read only":
           ready?"Resume saved automatically":
           loadFailed?"Video unavailable. It may be region-blocked or removed.":"Loading player…"}
        </span>
        <span>
          Saved at{" "}
          {formatClock(savedSeconds)} /{" "}
          {formatClock(
            authoredDurationSeconds>0?authoredDurationSeconds:observedDuration,
          )}
        </span>
      </div>

      {loadFailed ? (
        <Alert tone="warning" className="mt-2">Video unavailable. It may be region-blocked or removed.</Alert>
      ) : null}
      {loadFailed ? (
        <a
          href={videoUrl}
          
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9"
        >
          Open on YouTube
        </a>
      ) : null}

      {saveError ? <Alert tone="error" className="mt-2">{saveError}</Alert> : null}
    </div>
  );
}
