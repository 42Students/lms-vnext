import React, { useState, useEffect, useRef, useCallback } from "react";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { Popconfirm, message } from "antd";
import { useSelector } from "react-redux";
import YoutubeDrawer from "@/components/Course/Syllabus/YoutubeDrawer";
import ContentProgressBadge from "@/components/Course/Syllabus/ContentProgressBadge";
import deleteLessonContent from "../../../../utils/courseUtils/syllabusUtils";
import ContentTitle, { ContentAddedDate } from "@/components/Course/Syllabus/ContentTitle";
import { saveContentProgress } from "@/api/Services/courseServices";
import { loadClientSettings, getClientSettingsSync } from "@/utils/clientSettings";

const SAVE_PROGRESS_INTERVAL_MS = 15000;

// The player only ever embeds one video ID per mount, so a single shared loader promise (module
// scope, not per-instance) is enough -- concurrent YouTube tiles on the same page would otherwise
// each try to inject the <script> tag and stomp on window.onYouTubeIframeAPIReady.
let apiLoadPromise = null;
function loadYoutubeIframeApi() {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiLoadPromise) return apiLoadPromise;
  apiLoadPromise = new Promise((resolve) => {
    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.();
      resolve(window.YT);
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
  });
  return apiLoadPromise;
}

function extractVideoId(embedUrl) {
  if (!embedUrl) return null;
  const match = embedUrl.match(/embed\/([a-zA-Z0-9_-]{6,})/);
  return match ? match[1] : null;
}

/**
 * Previously a bare <iframe src="...">, which never reports playback -- there is no timeupdate
 * event to listen to. The roadmap's doneCount could never include a YouTube lesson no matter how
 * much of it a learner watched (see the audit note that led here). This uses the real YouTube
 * IFrame Player API to poll playback position, mirroring video.js's own threshold/interval logic
 * so both players complete on the same terms.
 */
const YoutubeVideo = ({ content, refreshAllContent, progress, onProgressUpdate, inModal = false }) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [selectedEditCont, setSelectedEditCont] = useState(null);
  const [iframeError, setIframeError] = useState(false);
  const loginUser = useSelector(state => state.loginUser);
  const isFacultyRole = loginUser?.userType === "FACULTY";
  const isLearner = loginUser?.userType === "LEARNER";
  const lessonContentId = content?.id ?? content?.lessonContentId ?? content?.lesson_content_id;
  const [localProgress, setLocalProgress] = useState(progress);
  const playerElRef = useRef(null);
  const playerRef = useRef(null);
  const pollRef = useRef(null);
  const lastSaveRef = useRef(0);
  // Resume where the learner stopped (uploaded videos already do). Captured once so a progress
  // save mid-playback never rebuilds the player. A finished video starts from the beginning.
  const resumeAtRef = useRef(null);
  if (resumeAtRef.current === null) {
    const position = Number(progress?.lastPositionSeconds);
    const finished = progress?.status === "WATCHED" || Boolean(progress?.completedAt);
    resumeAtRef.current = !finished && Number.isFinite(position) && position > 5 ? Math.floor(position) : 0;
  }

  useEffect(() => { setLocalProgress(progress); }, [progress]);
  const displayProgress = localProgress ?? progress;

  const embedUrl =
    content?.contentDataDTO?.link ||
    content?.contentDataDTO?.file_dto?.cloud_storage_object;
  const videoId = extractVideoId(embedUrl);

  const reportProgress = useCallback(() => {
    const player = playerRef.current;
    if (!player || !isLearner || !lessonContentId || lessonContentId <= 0) return;
    const now = Date.now();
    const clientSettings = getClientSettingsSync();
    if (now - lastSaveRef.current < (clientSettings.progressSaveIntervalMs || SAVE_PROGRESS_INTERVAL_MS)) return;
    let currentTime, duration;
    try {
      currentTime = player.getCurrentTime?.();
      duration = player.getDuration?.();
    } catch {
      return;
    }
    if (!Number.isFinite(currentTime) || !Number.isFinite(duration) || duration <= 0) return;
    // #5/#8: same fix as video.js's handleTimeUpdate -- this gate was only closed in the success
    // handler below, so a slow or failed save left it open and the next 5s poll tick (this runs on
    // setInterval) would fire again before the real 15s window was up, instead of waiting for it.
    lastSaveRef.current = now;
    const watchedPct = Number(clientSettings.watchedThresholdPercent) || 90;
    const completed = currentTime >= duration * (watchedPct / 100);
    saveContentProgress({
      lessonContentId,
      lastPositionSeconds: Math.round(currentTime),
      durationSeconds: Math.round(duration),
      completed: completed || undefined,
    })
      .then(res => {
        const data = res?.data?.data ?? res?.data;
        if (data && typeof data === "object") {
          setLocalProgress(data);
          onProgressUpdate?.(data);
        }
      })
      .catch(() => {});
  }, [isLearner, lessonContentId, onProgressUpdate]);

  useEffect(() => {
    if (!videoId || !playerElRef.current || iframeError) return undefined;
    let cancelled = false;
    loadClientSettings();
    loadYoutubeIframeApi().then((YT) => {
      if (cancelled || !YT || !playerElRef.current) return;
      playerRef.current = new YT.Player(playerElRef.current, {
        videoId,
        host: "https://www.youtube-nocookie.com",
        playerVars: { rel: 0, modestbranding: 1, ...(resumeAtRef.current > 0 ? { start: resumeAtRef.current } : {}) },
        events: {
          onError: () => setIframeError(true),
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.PLAYING) {
              if (pollRef.current) clearInterval(pollRef.current);
              pollRef.current = setInterval(reportProgress, 5000);
            } else {
              if (pollRef.current) clearInterval(pollRef.current);
              if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
                // Force a save on pause/end even if the last periodic save was recent, so a short
                // clip (or a learner who pauses right after finishing) still records progress.
                lastSaveRef.current = 0;
                reportProgress();
              }
            }
          },
        },
      });
    });
    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
      try { playerRef.current?.destroy?.(); } catch {}
      playerRef.current = null;
    };
  }, [videoId, iframeError, reportProgress]);

  if (!content?.contentDataDTO || !embedUrl) return null;

  return (
    <>
      {contextHolder}
      {selectedEditCont && (
        <YoutubeDrawer
          open={selectedEditCont}
          onClose={() => {
            setSelectedEditCont(null);
            refreshAllContent?.();
          }}
          editSelectedYoutube={selectedEditCont}
        />
      )}
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-3 mb-md-4" style={{ gap: 8 }}>
        {inModal ? <span /> : <ContentTitle content={content} contentType="YouTube Video" />}
        <div className="d-flex align-items-center flex-shrink-0 ln-content-actions" style={{ marginLeft: "auto" }}>
          {isFacultyRole && (
            <>
              <EditOutlined
                className="ln-icon-action"
                onClick={() => setSelectedEditCont(content)}
              />
              <Popconfirm
                title="Delete the YouTube video"
                description="Are you sure you want to delete this YouTube video?"
                onConfirm={() => {
                  deleteLessonContent("YOUTUBE", content, loginUser.id)
                    .then(() => {
                      messageApi.open({ type: "success", content: "YouTube video deleted successfully", duration: 2 });
                      setTimeout(() => refreshAllContent?.(), 1000);
                    })
                    .catch(() => {
                      messageApi.open({ type: "error", content: "Failed to delete", duration: 2 });
                    });
                }}
                okText="Yes"
                cancelText="No"
              >
                <DeleteOutlined className="ln-icon-action" />
              </Popconfirm>
            </>
          )}
          <ContentAddedDate content={content} />
        </div>
      </div>
      <div className="ln-syllabus-video-wrap ln-syallabus-content clrgray2BB fnt-14">
        {iframeError || !videoId ? (
          <div className="text-center p-4">
            <p>Video unavailable. It may be region-blocked or removed.</p>
            <a href={embedUrl} target="_blank" rel="noopener noreferrer">
              Open on YouTube
            </a>
          </div>
        ) : (
          <div ref={playerElRef} aria-label={content?.contentTitle || "Embedded YouTube video"} />
        )}
      </div>
      {isLearner && <ContentProgressBadge progress={displayProgress} compact={false} />}
    </>
  );
};

export default YoutubeVideo;
