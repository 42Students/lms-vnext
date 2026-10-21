import { useEffect, useRef } from "react";
import { ControlBar, Player, PlaybackRateMenuButton } from "video-react";
import { reportVideoPlaybackFailure } from "@/utils/clientErrorReporting";

const PROGRESS_REPORT_INTERVAL_SEC = 15;
const PLAYBACK_RATES = [2, 1.5, 1.25, 1, 0.75, 0.5];

const Video = (props) => {
  const { src, initialTime, onTimeUpdate, poster, height, autoPlay, style } = props;
  const videoPlayer = useRef();
  const videoCurrentTime = useRef(0);
  const validationArray = useRef(new Array(10).fill(false));
  const lastReportedTimeRef = useRef(-1);
  const initialTimeSeekedRef = useRef(false);

  useEffect(() => {
    videoPlayer.current?.subscribeToStateChange(playerStateChange);
  }, []);

  useEffect(() => {
    initialTimeSeekedRef.current = false;
  }, [src]);

  useEffect(() => {
    const safeInitial = typeof initialTime === "number" && Number.isFinite(initialTime) && initialTime > 0;
    if (!videoPlayer.current || initialTimeSeekedRef.current || !safeInitial) return;
    const player = videoPlayer.current;
    const seekTime = Math.max(0, initialTime);
    const unsubscribe = player.subscribeToStateChange(state => {
      if (state.duration && !initialTimeSeekedRef.current && seekTime > 0) {
        try {
          const t = Math.min(seekTime, state.duration);
          player.seek(t);
          initialTimeSeekedRef.current = true;
        } catch (e) {
          initialTimeSeekedRef.current = true;
        }
      }
    });
    return () => { if (typeof unsubscribe === "function") unsubscribe(); };
  }, [initialTime, src]);

  function handleVideoError(event) {
    reportVideoPlaybackFailure(src, event?.target?.error?.code);
  }

  function playerStateChange(state) {
    videoCurrentTime.current = state.currentTime;
    validationArray?.current?.some(element => element === false) &&
      state.currentTime !== 0 &&
      viewsValidationCheck(state);

    if (typeof onTimeUpdate !== "function") return;
    const ct = state.currentTime ?? 0;
    const dur = state.duration ?? 0;
    const ctNum = Number(ct);
    const durNum = Number(dur);
    if (!Number.isFinite(ctNum) || !Number.isFinite(durNum) || ctNum < 0 || durNum < 0) return;
    const shouldReport =
      state.paused ||
      state.ended ||
      (durNum > 0 && ctNum - lastReportedTimeRef.current >= PROGRESS_REPORT_INTERVAL_SEC);
    if (shouldReport && (ctNum > 0 || durNum > 0)) {
      lastReportedTimeRef.current = ctNum;
      onTimeUpdate(ctNum, durNum);
    }
  }

  return (
    <Player
      className="sittr-video"
      ref={videoPlayer}
      playsInline
      poster={poster}
      src={src}
      height={height}
      autoPlay={autoPlay}
      style={style}
      onError={handleVideoError}
    >
      <ControlBar>
        <PlaybackRateMenuButton rates={PLAYBACK_RATES} order={7.1} />
      </ControlBar>
    </Player>
  );

  function viewsValidationCheck(state) {
    if (!state?.duration || state.duration <= 0) return;
    let tempvalidationArray = [...validationArray.current];
    let interval = state.duration / tempvalidationArray.length;
    if (interval <= 0) return;
    const index = Math.trunc(state.currentTime / interval);
    if (index < 0 || index >= tempvalidationArray.length) return;
    if (tempvalidationArray[index] === true) {
      return;
    }
    tempvalidationArray[index] = true;
    validationArray.current = [...tempvalidationArray];
  }
};

export default Video;
