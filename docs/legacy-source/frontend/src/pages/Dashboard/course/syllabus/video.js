import React, { useCallback, useRef } from "react";
import VideoGlobal from "@/components/Global/video/video";
import { useState, useEffect } from "react";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { Popconfirm, message } from "antd";
import { useSelector } from "react-redux";
import deleteLessonContent from "../../../../utils/courseUtils/syllabusUtils";
import VideoDrawer from "@/components/Course/Syllabus/VideoDrawer";
import ContentTitle, { ContentAddedDate } from "@/components/Course/Syllabus/ContentTitle";
import ContentProgressBadge from "@/components/Course/Syllabus/ContentProgressBadge";
import { saveContentProgress } from "@/api/Services/courseServices";
import { loadClientSettings, getClientSettingsSync } from "@/utils/clientSettings";
import { API_URL } from "@/config/appConfig";
import { getAccessToken } from "@/utils/authUtils";
import { saveContentProgressUrl } from "@/api/serviceUrl";

const MESSAGE_KEY_VIDEO_DELETE = "video-delete";
/** Fallback only — the live value is the ui.progressSaveIntervalMs platform setting. */
const SAVE_PROGRESS_INTERVAL_MS = 15000;
const MAX_POSITION_DURATION_SEC = 86400 * 24; // 24h

function sanitizeInitialTime(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.min(MAX_POSITION_DURATION_SEC, Math.round(n));
}

function resolvePlaybackUrl(content) {
  if (!content?.id || (content?.contentType || "").toLowerCase() !== "video") return null;
  const data = content?.contentDataDTO;
  return data?.file_dto?.cloud_storage_object || data?.link || null;
}

const Video = ({ content, refreshAllContent, progress, onProgressUpdate, inModal = false }) => {
  const [selectedEditCont, setSelectedEditCont] = useState(null);
  // Video stores a plain public URL directly on the content (see FileUploadController#presign
  // and LessonContentsServiceImpl — every upload type already gets this, video used to be the
  // one exception routed through a separate signed playback-url fetch). Reading it straight off
  // `content` means no network round trip and no loading/error state to manage here.
  const playbackUrl = resolvePlaybackUrl(content);
  const [localProgress, setLocalProgress] = useState(progress);
  const lastSaveRef = useRef(0);
  const currentTimeRef = useRef(0);
  const [messageApi, contextHolder] = message.useMessage();
  const loginUser = useSelector(state => state.loginUser);
  const isTeacherRole = loginUser?.userType === "FACULTY";
  const isLearner = loginUser?.userType === "LEARNER";
  const lessonContentId = content?.id;
  // progress is the learner's progress record ({ status, percentWatched, lastPositionSeconds }),
  // not a number. Treating it as a number made this always 0, so the player never resumed and the
  // progress badge never rendered.
  const displayProgress = (localProgress && typeof localProgress === "object")
    ? localProgress
    : (progress && typeof progress === "object" ? progress : null);
  useEffect(() => {
    setLocalProgress(progress);
  }, [progress]);
  // Warm the platform-tunables cache once so handleTimeUpdate can read it synchronously.
  useEffect(() => {
    loadClientSettings();
  }, []);
  const handleTimeUpdate = useCallback(
    (currentTimeSeconds, durationSeconds) => {
      if (!lessonContentId || lessonContentId <= 0 || !isLearner || typeof onProgressUpdate !== "function") return;
      const ct = Number(currentTimeSeconds);
      const dur = Number(durationSeconds);
      if (!Number.isFinite(ct) || !Number.isFinite(dur) || ct < 0 || dur < 0) return;
      currentTimeRef.current = ct;
      const now = Date.now();
      // Read synchronously: this fires on every timeupdate event, so it must not await anything.
      // loadClientSettings() is kicked off once on mount below and cached module-side.
      const clientSettings = getClientSettingsSync();
      if (now - lastSaveRef.current < (clientSettings.progressSaveIntervalMs || SAVE_PROGRESS_INTERVAL_MS)) return;
      // #5/#8: this gate was only ever closed in the *success* handler below. timeupdate fires many
      // times a second, so as soon as one save was slow (normal network latency) or failed (a
      // transient blip, or a token refresh in flight), the gate stayed open and every subsequent
      // tick fired ANOTHER concurrent save -- a request storm instead of a quiet 15s retry, and
      // exactly the kind of burst that turns one transient failure into a very visible one via the
      // global response interceptor (ApiMethod.js). Closing the gate here, before the call, makes
      // this a true "at most once per interval" checkpoint regardless of how the call resolves.
      lastSaveRef.current = now;
      const lastPos = Math.min(MAX_POSITION_DURATION_SEC, Math.max(0, Math.round(ct)));
      const durSec = Math.min(MAX_POSITION_DURATION_SEC, Math.max(0, Math.round(dur)));
      // Optimistic client-side marker only — the server recomputes this authoritatively in
      // LearnerContentProgressServiceImpl#isWatched. Reading the same configured threshold keeps
      // the two from drifting when an admin changes course.watchedThresholdPercent.
      const watchedPct = Number(clientSettings.watchedThresholdPercent) || 90;
      const completed = durSec > 0 && ct >= durSec * (watchedPct / 100);
      saveContentProgress({
        lessonContentId,
        lastPositionSeconds: lastPos,
        durationSeconds: durSec,
        completed: completed || undefined,
      })
        .then(res => {
          const data = res?.data?.data ?? res?.data;
          if (data && typeof data === "object") {
            setLocalProgress(data);
            onProgressUpdate(data);
          }
        })
        .catch(() => {});
    },
    [lessonContentId, isLearner, onProgressUpdate]
  );

  useEffect(() => {
    const handleBeforeUnload = () => {
      // Best-effort final progress save on tab close. This previously called
      // navigator.sendBeacon('/api/saveProgress', ...) -- a path with no Next.js route, on the
      // frontend's own origin, using POST -- while the real endpoint is a PUT on the backend's
      // origin (saveContentProgressUrl) and needs a Bearer token sendBeacon has no way to attach.
      // It always 404'd/401'd silently, so the only progress ever actually persisted was the last
      // periodic save (up to progressSaveIntervalMs stale). fetch with keepalive is the documented
      // sendBeacon replacement for exactly this case: it survives page unload like a beacon, but
      // still allows a custom method/headers.
      if (currentTimeRef.current > 0 && lessonContentId && isLearner) {
        const token = getAccessToken();
        if (!token) return;
        const payload = JSON.stringify({
          lessonContentId,
          lastPositionSeconds: Math.round(currentTimeRef.current),
        });
        try {
          fetch(`${API_URL}${saveContentProgressUrl}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            credentials: "include",
            keepalive: true,
            body: payload,
          }).catch(() => {});
        } catch {
          // keepalive requests have a small payload-size cap; a failure here just means the last
          // periodic save (already persisted) is what survives, same as before this fix.
        }
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [lessonContentId, isLearner]);

  return (
    <>
      {contextHolder}
      {selectedEditCont && (
        <VideoDrawer
          open={selectedEditCont}
          onClose={() => {
            setSelectedEditCont(null);
            refreshAllContent?.();
          }}
          editSelectedVideo={selectedEditCont}
        />
      )}
      {content?.contentDataDTO && (content?.contentType || "").toLowerCase() === "video" && (
        <>
          <div className="d-flex flex-wrap align-items-center justify-content-between mb-3 mb-md-4" style={{ gap: 8 }}>
            {inModal ? <span /> : <ContentTitle content={content} contentType={"Video"} />}
            <div className="d-flex align-items-center flex-shrink-0 ln-content-actions" style={{ marginLeft: "auto" }}>
              {isTeacherRole && (
                <>
                  <button aria-label="Edit content" className="ln-icon-action" onClick={() => setSelectedEditCont(content)} style={{background:'none',border:'none',cursor:'pointer',padding:'4px'}}>
                    <EditOutlined />
                  </button>
                  <Popconfirm
                    title="Delete the video"
                    description="Are you sure to delete this video?"
                    onConfirm={() => {
                      deleteLessonContent("VIDEO", content, loginUser.id)
                        .then(response => {
                          messageApi.open({
                            type: "success",
                            content: "Video deleted successfully",
                            duration: 2,
                            key: MESSAGE_KEY_VIDEO_DELETE,
                          });
                          setTimeout(() => {
                            refreshAllContent?.();
                          }, 1000);
                        })
                        .catch(() => {
                          messageApi.open({
                            type: "error",
                            content: "Failed to delete",
                            duration: 2,
                            key: MESSAGE_KEY_VIDEO_DELETE,
                          });
                        });
                    }}
                    okText="Yes"
                    cancelText="No"
                  >
                    <button aria-label="Delete content" className="ln-icon-action" style={{background:'none',border:'none',cursor:'pointer',padding:'4px'}}>
                      <DeleteOutlined />
                    </button>
                  </Popconfirm>
                </>
              )}
              <ContentAddedDate content={content} />
            </div>
          </div>
          <div className="ln-syllabus-video-wrap ln-syallabus-content clrgray2BB fnt-14">
            {playbackUrl ? (
              <VideoGlobal
                src={playbackUrl}
                initialTime={sanitizeInitialTime(displayProgress?.lastPositionSeconds)}
                onTimeUpdate={handleTimeUpdate}
              />
            ) : (
              <div className="text-center py-3 text-secondary">Video not available</div>
            )}
          </div>
          {isLearner && (
            <ContentProgressBadge progress={displayProgress} compact={false} />
          )}
        </>
      )}
    </>
  );
};

export default Video;
