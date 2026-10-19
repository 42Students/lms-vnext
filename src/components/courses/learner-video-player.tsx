"use client";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { shouldPersistPlayback } from "./course-media-model";
import { courseApiError } from "./learner-course-api";
import {
  parseLearnerPlaybackGrant, parseLearnerVideos, storageApiError,
  videoForContent,
} from "@/modules/courses/learner-storage-ui-model";
import { formatDuration } from "@/modules/storage/ui-models";
import { playbackGrantRefreshDelay, resumePositionForGrant } from "@/modules/courses/learner-video-grant-model";

/**
 * The private media URL is never saved in component state or storage.
 * It exists only as the current video element src for its short grant lifetime.
 */
export function LearnerVideoPlayer({
  lessonId, contentId, storageKey, deliveryId, initialPositionSeconds,
  authoredDurationSeconds, completed, readOnly = false, saveIntervalMs = 5000,
}: {
  lessonId: string; contentId: string; storageKey: string | null; deliveryId: string;
  initialPositionSeconds: number; authoredDurationSeconds: number;
  completed: boolean; readOnly?: boolean; saveIntervalMs?:number;
}) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playbackRateRef=useRef(1);
  const activeRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedId = useRef<string | null>(null);
  const seekRef = useRef(completed ? 0 : initialPositionSeconds);
  const shouldPlayRef = useRef(false);
  const failureRefreshRef = useRef(0);
  const hasPlaybackGrantRef = useRef(false);
  const lastSavedRef = useRef(initialPositionSeconds);
  const savingRef = useRef(false);
  const lastSaveAttemptMs=useRef(0);
  const completedRef = useRef(completed);
  const [savedSeconds, setSavedSeconds] = useState(initialPositionSeconds);
  const [isCompleted, setIsCompleted] = useState(completed);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [observedDuration,setObservedDuration] = useState(0);

  const persist = useCallback(async (force: boolean, keepalive = false) => {
    const video = videoRef.current;
    if (!video || readOnly || savingRef.current || completedRef.current) return;
    const attemptAt=Date.now();
    if(!force&&attemptAt-lastSaveAttemptMs.current<saveIntervalMs)return;
    const current = video.currentTime;
    if (!Number.isFinite(current) || !shouldPersistPlayback(lastSavedRef.current, current, force)) return;
    savingRef.current = true;
    lastSaveAttemptMs.current=attemptAt;
    try {
      const response = await fetch(`/api/courses/progress/${encodeURIComponent(contentId)}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        credentials: "same-origin", body: JSON.stringify({
          deliveryId, positionSeconds: Math.max(0, Math.floor(current)),
        }), keepalive,
      });
      if (!response.ok) {
        if (!keepalive) setSaveError(await courseApiError(response));
        return;
      }
      const payload = await response.json() as {
        progress: { status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED"; lastPositionSeconds: number };
      };
      lastSavedRef.current = payload.progress.lastPositionSeconds;
      setSavedSeconds(payload.progress.lastPositionSeconds);
      setSaveError(null);
      if (payload.progress.status === "COMPLETED") {
        completedRef.current = true; setIsCompleted(true); router.refresh();
      }
    } catch {
      if (!keepalive) setSaveError("Video is continuing, but progress could not be saved.");
    } finally {
      savingRef.current = false;
    }
  }, [contentId, deliveryId, readOnly, router, saveIntervalMs]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }, []);

  const loadGrant = useCallback(async function requestPlaybackGrant(videoId: string, controller: AbortController): Promise<void> {
    const video = videoRef.current;
    if (!video) return;
    const previousPosition = Number.isFinite(video.currentTime) && video.currentTime > 0
      ? video.currentTime : Math.max(0, initialPositionSeconds);
    shouldPlayRef.current = !video.paused && video.currentSrc !== "";
    const response = await fetch(`/api/courses/videos/${encodeURIComponent(videoId)}/playback-grant`, {
      method: "POST", credentials: "same-origin", cache: "no-store", signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deliveryId }),
    });
    if (!response.ok) throw new Error(await storageApiError(response));
    const grant = parseLearnerPlaybackGrant(await response.json(), videoId, Date.now());
    if (controller.signal.aborted) return;
    clearTimer();
    seekRef.current = resumePositionForGrant(previousPosition, grant.resumePositionSeconds, initialPositionSeconds, hasPlaybackGrantRef.current);
    hasPlaybackGrantRef.current = true;
    video.src = grant.url;
    if (grant.thumbnailUrl) video.poster = grant.thumbnailUrl;
    else video.removeAttribute("poster");
    video.load();
    setMediaError(null); setLoading(false);
    // Swap before expiry, preserving playback time; no signed URL in timers.
    timerRef.current = setTimeout(() => {
      if (controller.signal.aborted) return;
      const renewal = new AbortController();
      activeRef.current = renewal;
      void requestPlaybackGrant(videoId, renewal).catch(error => {
        if (!renewal.signal.aborted) setMediaError(error instanceof Error ? error.message : "Video could not be loaded");
      });
    }, playbackGrantRefreshDelay(grant.expiresAt, Date.now()));
  }, [deliveryId, initialPositionSeconds, clearTimer]);

  const start = useCallback(async () => {
    activeRef.current?.abort();
    clearTimer();
    const controller = new AbortController();
    activeRef.current = controller;
    setLoading(true); setMediaError(null);
    try {
      if (!selectedId.current) {
        const response = await fetch(
          `/api/courses/lessons/${encodeURIComponent(lessonId)}/learner-videos?deliveryId=${encodeURIComponent(deliveryId)}`,
          { credentials: "same-origin", cache: "no-store", signal: controller.signal },
        );
        if (!response.ok) throw new Error(await storageApiError(response));
        const chosen = videoForContent(parseLearnerVideos(await response.json()), contentId, storageKey);
        if (!chosen) throw new Error("Video is not available for this lesson.");
        selectedId.current = chosen.id;
      }
      await loadGrant(selectedId.current, controller);
    } catch (failure) {
      if (!controller.signal.aborted) {
        setLoading(false);
        setMediaError(failure instanceof Error ? failure.message : "Video could not be loaded");
      }
    }
  }, [lessonId, deliveryId, contentId, storageKey, loadGrant, clearTimer]);

  useEffect(() => {
    void start();
    return () => {
      activeRef.current?.abort();
      clearTimer();
      const video = videoRef.current;
      if (video) { video.pause(); video.removeAttribute("src"); video.removeAttribute("poster"); video.load(); }
    };
  }, [start, clearTimer]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onLoaded = () => {
      video.playbackRate=playbackRateRef.current;
      if(Number.isFinite(video.duration) && video.duration>0)
        setObservedDuration(video.duration);
      const maxSeek = Number.isFinite(video.duration) && video.duration > 1
        ? video.duration - 1 : seekRef.current;
      video.currentTime = Math.min(Math.max(0, seekRef.current), Math.max(0, maxSeek));
      if (shouldPlayRef.current) {
        shouldPlayRef.current = false;
        void video.play().catch(() => { /* Browser autoplay restrictions: keep user in control. */ });
      }
    };
    const onTime = () => { failureRefreshRef.current = 0; void persist(false); };
    const onPause = () => { void persist(true); };
    const onEnded = () => { void persist(true); };
    const onError = () => {
      const id = selectedId.current;
      if (!id || failureRefreshRef.current >= 1) {
        setMediaError("Video could not be loaded. Try again.");
        return;
      }
      failureRefreshRef.current += 1;
      const controller = new AbortController();
      activeRef.current = controller;
      void loadGrant(id, controller).catch(() => {
        if (!controller.signal.aborted) setMediaError("Video could not be loaded. Try again.");
      });
    };
    const onPageHide = () => { void persist(true, true); };
    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);
    video.addEventListener("error", onError);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("error", onError);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [persist, loadGrant]);

  return <div className="mt-4 space-y-2">
    <video ref={videoRef} controls preload="metadata"
      aria-label="Lesson video"
      className="aspect-video w-full rounded-xl border border-border bg-foreground">
      Your browser does not support HTML video.
    </video>
    <label className="flex flex-wrap items-center gap-2 text-xs font-medium text-body">
      Playback speed
      <Select aria-label="Playback speed" defaultValue="1"
        className="min-h-11 w-auto"
        onChange={event=>{
          const rate=Number(event.target.value);
          playbackRateRef.current=rate;
          if(videoRef.current)videoRef.current.playbackRate=rate;
        }}>
        {[0.5,0.75,1,1.25,1.5,2].map(rate=>
          <option key={rate} value={rate}>{rate}x</option>)}
      </Select>
    </label>
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
      <span role="status">{loading ? "Loading video…" : mediaError ? "Video could not be loaded" :
        readOnly ? "Past semester · progress is read only" : isCompleted ? "Completed" : "Progress saves automatically"}</span>
      <span>Saved at {formatDuration(savedSeconds)} / {formatDuration(authoredDurationSeconds>0?authoredDurationSeconds:observedDuration)}</span>
    </div>
    {mediaError ? <div className="space-y-2">
      <p role="alert" className="text-sm font-semibold text-error">{mediaError}</p>
      <Button type="button" variant="secondary" onClick={() => { failureRefreshRef.current = 0; void start(); }}
        className="min-h-11">
        Retry video
      </Button>
    </div> : null}
    {saveError ? <p role="alert" className="text-sm font-semibold text-error">{saveError}</p> : null}
  </div>;
}
