"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  shouldPersistPlayback,
} from "./course-media-model";
import { courseApiError } from "./learner-course-api";

function formatClock(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const remainder = safe % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

export function LearnerVideoPlayer({
  contentId,
  deliveryId,
  initialPositionSeconds,
  authoredDurationSeconds,
  completed,
  readOnly = false,
}: {
  contentId: string;
  deliveryId: string;
  initialPositionSeconds: number;
  authoredDurationSeconds: number;
  completed: boolean;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastSavedRef = useRef(initialPositionSeconds);
  const savingRef = useRef(false);
  const completedRef = useRef(completed);
  const [savedSeconds, setSavedSeconds] =
    useState(initialPositionSeconds);
  const [isCompleted, setIsCompleted] =
    useState(completed);
  const [saveError, setSaveError] =
    useState<string | null>(null);
  const [mediaError, setMediaError] =
    useState(false);

  const mediaUrl =
    `/api/courses/deliveries/${encodeURIComponent(deliveryId)}/contents/${encodeURIComponent(contentId)}/file`;

  const persist = useCallback(
    async (
      force: boolean,
      keepalive = false,
    ) => {
      const video = videoRef.current;
      if (
        !video ||
        readOnly ||
        savingRef.current ||
        completedRef.current
      ) {
        return;
      }

      const current = video.currentTime;
      if (
        !shouldPersistPlayback(
          lastSavedRef.current,
          current,
          force,
        )
      ) {
        return;
      }

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
              positionSeconds:
                Math.max(
                  0,
                  Math.floor(current),
                ),
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
          payload.progress.lastPositionSeconds;
        setSavedSeconds(
          payload.progress.lastPositionSeconds,
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
      } catch {
        if (!keepalive) {
          setSaveError(
            "Video is continuing, but progress could not be saved.",
          );
        }
      } finally {
        savingRef.current = false;
      }
    },
    [
      contentId,
      deliveryId,
      readOnly,
      router,
    ],
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLoadedMetadata = () => {
      const maxSeek =
        Number.isFinite(video.duration) &&
        video.duration > 1
          ? video.duration - 1
          : initialPositionSeconds;
      video.currentTime = Math.min(
        Math.max(0, initialPositionSeconds),
        Math.max(0, maxSeek),
      );
    };
    const onTimeUpdate = () => {
      void persist(false);
    };
    const onPause = () => {
      void persist(true);
    };
    const onEnded = () => {
      void persist(true);
    };
    const onError = () => setMediaError(true);

    video.addEventListener(
      "loadedmetadata",
      onLoadedMetadata,
    );
    video.addEventListener(
      "timeupdate",
      onTimeUpdate,
    );
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);
    video.addEventListener("error", onError);

    const onPageHide = () => {
      void persist(true, true);
    };
    window.addEventListener(
      "pagehide",
      onPageHide,
    );

    return () => {
      video.removeEventListener(
        "loadedmetadata",
        onLoadedMetadata,
      );
      video.removeEventListener(
        "timeupdate",
        onTimeUpdate,
      );
      video.removeEventListener(
        "pause",
        onPause,
      );
      video.removeEventListener(
        "ended",
        onEnded,
      );
      video.removeEventListener(
        "error",
        onError,
      );
      window.removeEventListener(
        "pagehide",
        onPageHide,
      );
    };
  }, [initialPositionSeconds, persist]);

  return (
    <div className="mt-4">
      <video
        ref={videoRef}
        controls
        preload="metadata"
        src={mediaUrl}
        className="aspect-video w-full rounded-xl border border-border bg-foreground"
      >
        Your browser does not support HTML video.
      </video>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {mediaError
            ? "Video could not be loaded"
            : readOnly
              ? "Past semester · progress is read only"
              : isCompleted
                ? "Completed"
                : "Progress saves automatically"}
        </span>
        <span>
          Saved at {formatClock(savedSeconds)} /{" "}
          {formatClock(authoredDurationSeconds)}
        </span>
      </div>
      {mediaError ? (
        <a
          href={mediaUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex text-sm font-semibold text-primary-text hover:text-primary-hover"
        >
          Open video ↗
        </a>
      ) : null}
      {saveError ? (
        <p
          role="alert"
          className="mt-2 text-sm font-semibold text-error"
        >
          {saveError}
        </p>
      ) : null}
    </div>
  );
}
