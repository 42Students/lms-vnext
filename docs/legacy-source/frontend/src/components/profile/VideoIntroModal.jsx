import React, { useEffect, useRef, useState } from "react";
import ModalContainer from "../Global/ModalContainer/ModalContainer";
import { Button, Modal, message, Progress } from "antd";
import { RecordRTCPromisesHandler } from "recordrtc";
import { Player } from "video-react";
import Image from "next/image";
import { uploadFileViaPresign } from "@/utils/uploadToR2";
import * as ProfileService from "@/api/Services/ProfileService";

const COUNTDOWN_DURATION = 45; // 45 seconds countdown
const MAX_RECORDING_DURATION = 120000; // 2 minutes in milliseconds
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

function VideoIntroModal({ open, onClose, learnerId, onSuccess, hasExistingVideo }) {
  const [currentStep, setCurrentStep] = useState("warning"); // warning, countdown, recording, preview, uploading, success
  const [countdown, setCountdown] = useState(COUNTDOWN_DURATION);
  const [recordingUrl, setRecordingUrl] = useState(null);
  const [recorder, setRecorder] = useState(null);
  const [stream, setStream] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [isRecorderReady, setIsRecorderReady] = useState(false);

  const videoRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const isRecorderReadyRef = useRef(false);
  const previousStepRef = useRef(null);
  const isInitializingRef = useRef(false);

  // Safe recorder destroy function - defined early to be available everywhere
  const safeDestroyRecorder = React.useCallback((recorderInstance) => {
    if (!recorderInstance) return;

    let wasStarted = false;
    try {
      if (recorderInstance.recorder && recorderInstance.recorder.state) {
        wasStarted = recorderInstance.recorder.state === 'recording';
      }
    } catch (e) {
      wasStarted = true;
    }

    if (wasStarted) {
      try {
        if (typeof recorderInstance.stopRecording === 'function') {
          try {
            const stopPromise = recorderInstance.stopRecording();
            if (stopPromise && typeof stopPromise.catch === 'function') {
              stopPromise.catch(() => {});
            }
          } catch (e) {}
        }
      } catch (e) {}
    }

    setTimeout(() => {
      try {
        if (!recorderInstance) return;
        if (typeof recorderInstance.destroy !== 'function') return;
        try {
          const result = recorderInstance.destroy();
          if (result && typeof result.catch === 'function') {
            result.catch(() => {});
          }
        } catch (destroyError) {
          if (destroyError && destroyError.message && destroyError.message.includes('reset')) return;
        }
      } catch (outerError) {
      }
    }, 150);
  }, []);

  // Initialize camera stream
  useEffect(() => {
    if (open && (currentStep === "countdown" || currentStep === "recording")) {
      if (recorderRef.current && isRecorderReadyRef.current && streamRef.current) return;

      if (currentStep === "countdown") {
      let mediaStream;
      let recorderInstance;
      let isMounted = true;

      async function initiateRecordRtc() {
        try {
          isInitializingRef.current = true;
          setIsRecorderReady(false);
          setError(null);

          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
            audio: { echoCancellation: true, noiseSuppression: true }
          });

          if (!isMounted) {
            mediaStream.getTracks().forEach(track => track.stop());
            return;
          }

          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
            videoRef.current.onloadedmetadata = function () {
              if (videoRef.current && isMounted) {
                videoRef.current.play().catch(() => {});
              }
            };
          }

          setStream(mediaStream);

          recorderInstance = new RecordRTCPromisesHandler(mediaStream, {
            type: "video",
            mimeType: "video/webm;codecs=vp8,opus",
            videoBitsPerSecond: 2500000,
            audioBitsPerSecond: 128000,
            timeSlice: 1000,
          });

          await new Promise(resolve => setTimeout(resolve, 300));

          if (!isMounted) {
            safeDestroyRecorder(recorderInstance);
            mediaStream.getTracks().forEach(track => track.stop());
            return;
          }

          recorderRef.current = recorderInstance;
          streamRef.current = mediaStream;
          isRecorderReadyRef.current = true;

          setRecorder(recorderInstance);
          setIsRecorderReady(true);
          setError(null);
          isInitializingRef.current = false;
        } catch (error) {
          isInitializingRef.current = false;
          if (!isMounted) return;

          const errorMessage = error.name === "NotAllowedError" || error.name === "PermissionDeniedError"
            ? "We need access to your camera and microphone to record. Please allow permissions and try again."
            : error.name === "NotFoundError" || error.name === "DevicesNotFoundError"
            ? "We couldn't find your camera or microphone. Please make sure they're connected and try again."
            : "We're having trouble accessing your camera. Please check that your camera and microphone are connected and try again.";
          setError(errorMessage);
          message.error(errorMessage);
          setIsRecorderReady(false);
          isRecorderReadyRef.current = false;
          recorderRef.current = null;
          streamRef.current = null;
          setCurrentStep("warning");
        }
      }

      initiateRecordRtc();

      return () => { isMounted = false; };
      }
    }

    previousStepRef.current = currentStep;
  }, [open, currentStep]);

  // Cleanup when leaving recording flow or closing modal
  useEffect(() => {
    if (isInitializingRef.current) return;

    const wasInRecordingFlow = previousStepRef.current === "countdown" || previousStepRef.current === "recording";
    const isInRecordingFlow = currentStep === "countdown" || currentStep === "recording";
    const leavingRecordingFlow = wasInRecordingFlow && !isInRecordingFlow;

    if (!open || (leavingRecordingFlow && previousStepRef.current !== null)) {
      if (streamRef.current) {
        try {
          streamRef.current.getTracks().forEach(track => {
            try { track.stop(); track.enabled = false; } catch (e) {}
          });
        } catch (error) {}
        setStream(null);
        streamRef.current = null;
      }
      if (recorderRef.current) {
        safeDestroyRecorder(recorderRef.current);
        setRecorder(null);
        recorderRef.current = null;
      }
      setIsRecorderReady(false);
      isRecorderReadyRef.current = false;
    }
  }, [open, currentStep]);

  // Cleanup on close
  useEffect(() => {
    if (!open) {
      cleanup();
      resetState();
    }
  }, [open]);

  const cleanup = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    if (stream) {
      try {
        stream.getTracks().forEach(track => {
          try { track.stop(); track.enabled = false; } catch (e) {}
        });
      } catch (error) {}
      setStream(null);
    }
    if (recorder) {
      safeDestroyRecorder(recorder);
      setRecorder(null);
    }
  };

  const resetState = () => {
    setCurrentStep("warning");
    setCountdown(COUNTDOWN_DURATION);
    setRecordingUrl(null);
    setRecorder(null);
    setStream(null);
    setRecordingDuration(0);
    setUploadProgress(0);
    setError(null);
    setIsRecorderReady(false);
    recorderRef.current = null;
    streamRef.current = null;
    isRecorderReadyRef.current = false;
  };

  const handleWarningConfirm = () => {
    setIsRecorderReady(false);
    setError(null);
    setCurrentStep("countdown");
    setTimeout(() => { startCountdown(); }, 100);
  };

  const startCountdown = () => {
    let remaining = COUNTDOWN_DURATION;
    setCountdown(remaining);
    setError(null);

    countdownIntervalRef.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);

      if (remaining <= 0) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;

        const checkRecorderReady = (attempts = 0) => {
          const maxAttempts = 10;
          const refReady = !!recorderRef.current && !!streamRef.current && !!isRecorderReadyRef.current;
          const stateReady = !!recorder && !!stream && !!isRecorderReady;

          if (refReady || stateReady) {
            setCurrentStep("recording");
            setTimeout(() => { startRecording(); }, 200);
          } else if (attempts < maxAttempts) {
            setTimeout(() => { checkRecorderReady(attempts + 1); }, 500);
          } else {
            setError("Camera setup is taking a bit longer than expected. You can close this and try again when you're ready.");
            message.info("Camera setup is taking longer than usual. Please try again.");
            setCurrentStep("warning");
          }
        };

        setTimeout(() => { checkRecorderReady(0); }, 300);
      }
    }, 1000);
  };

  const startRecording = async () => {
    const currentRecorder = recorderRef.current || recorder;
    const currentStream = streamRef.current || stream;
    const currentReady = isRecorderReadyRef.current || isRecorderReady;

    if (!currentRecorder || !currentStream || !currentReady) {
      setError("Camera is still setting up. Just a moment, please wait for it to be ready.");
      message.info("Camera is still setting up. Please wait a moment.");
      setCurrentStep("warning");
      return;
    }

    try {
      if (typeof currentRecorder.startRecording !== 'function') {
        setError("Camera setup needs a moment. Please try again.");
        setCurrentStep("warning");
        return;
      }

      const activeTracks = currentStream.getTracks().filter(track => track.readyState === 'live');
      if (activeTracks.length === 0) {
        setError("Camera connection was interrupted. Let's try again.");
        setCurrentStep("warning");
        return;
      }

      await currentRecorder.startRecording();
      setRecordingDuration(0);
      setError(null);

      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          const newDuration = prev + 1;
          if (newDuration >= MAX_RECORDING_DURATION / 1000) stopRecording();
          return newDuration;
        });
      }, 1000);

      recordingTimerRef.current = setTimeout(() => { stopRecording(); }, MAX_RECORDING_DURATION);
    } catch (error) {
      setError(`We couldn't start the recording. ${error.message || "Please try again."}`);
      setCurrentStep("warning");
    }
  };

  const stopRecording = async () => {
    try {
      if (recordingTimerRef.current) {
        clearTimeout(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      const recorderToUse = recorderRef.current || recorder;

      if (!recorderToUse) {
        setError("Recording isn't available right now. Let's try recording again.");
        setCurrentStep("warning");
        return;
      }

      if (typeof recorderToUse.stopRecording !== 'function' || typeof recorderToUse.getBlob !== 'function') {
        setError("Something went wrong with the recording. Let's try again.");
        setCurrentStep("warning");
        return;
      }

      await recorderToUse.stopRecording();
      const blob = await recorderToUse.getBlob();

      if (!blob || blob.size === 0) {
        setError("We couldn't capture your recording. Let's try recording again.");
        setCurrentStep("warning");
        return;
      }

      if (blob.size > MAX_FILE_SIZE) {
        setError(`Your video is a bit too large (${(blob.size / 1024 / 1024).toFixed(2)}MB). The maximum size is 50MB. Could you record a slightly shorter video?`);
        setCurrentStep("warning");
        return;
      }

      handleUpload(blob);
    } catch (error) {
      setError(`We couldn't stop the recording. ${error.message || "Please try again."}`);
      setCurrentStep("warning");
    }
  };

  const handleRecordAgain = () => {
    setRecordingUrl(null);
    setRecordingDuration(0);
    setError(null);

    if (recorderRef.current || recorder) {
      safeDestroyRecorder(recorderRef.current || recorder);
      setRecorder(null);
      recorderRef.current = null;
    }

    if (streamRef.current || stream) {
      try {
        (streamRef.current || stream).getTracks().forEach(track => {
          try { track.stop(); track.enabled = false; } catch (e) {}
        });
      } catch (error) {}
      setStream(null);
      streamRef.current = null;
    }

    setIsRecorderReady(false);
    isRecorderReadyRef.current = false;
    if (videoRef.current) videoRef.current.srcObject = null;

    setCurrentStep("countdown");
    setTimeout(() => { startCountdown(); }, 300);
  };

  const handleUpload = async (blobToUpload = null) => {
    const videoBlob = blobToUpload || recordingUrl;

    if (!videoBlob || !learnerId) {
      setError("No recording available to upload.");
      return;
    }

    setCurrentStep("uploading");
    setUploadProgress(0);
    setError(null);

    try {
      const fileName = `video-intro-${learnerId}-${Date.now()}.webm`;
      const file = new File([videoBlob], fileName, { type: videoBlob.type || "video/webm" });
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => (prev >= 90 ? 90 : prev + 10));
      }, 200);
      const result = await uploadFileViaPresign(file, { folder: "video-intros", type: "video", userId: learnerId });
      clearInterval(progressInterval);
      // Video intro now stores a plain public URL and is returned directly (no more separate
      // signed-playback-url resolution step) — must be publicUrl, not the bare key.
      const publicUrl = result.publicUrl;
      setUploadProgress(100);

      await ProfileService.updateLearnerVideoIntro(learnerId, { videoIntroUrl: publicUrl });

      setUploadProgress(100);
      setCurrentStep("success");
      message.success("Video intro uploaded successfully!");

      if (onSuccess) onSuccess(publicUrl);
      setTimeout(() => { finishClose(); }, 2000);
    } catch (error) {
      setError(error?.response?.data?.message || error?.message || "We couldn't upload your video. Please try again.");
      if (videoBlob && !recordingUrl) setRecordingUrl(videoBlob);
      setCurrentStep("preview");
      setUploadProgress(0);
    }
  };

  const finishClose = () => {
    cleanup();
    resetState();
    onClose();
  };

  const requestClose = () => {
    if (currentStep === "uploading") {
      message.info("Wait for your video upload to finish.");
      return;
    }
    const hasRecordingToLose = currentStep === "recording" || (currentStep === "preview" && recordingUrl);
    if (!hasRecordingToLose) {
      finishClose();
      return;
    }
    Modal.confirm({
      title: currentStep === "recording" ? "Stop and discard this recording?" : "Discard this recorded video?",
      content: currentStep === "recording"
        ? "Closing now stops the current recording and it will not be uploaded."
        : "This recording has not uploaded successfully yet. Closing now will discard the retry copy.",
      okText: "Discard recording",
      okButtonProps: { danger: true },
      cancelText: "Keep recording",
      onOk: finishClose,
    });
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Modal
      title="Record Video Intro"
      className="learn-video-intro-modal"
      open={open}
      onCancel={requestClose}
      footer={null}
      width={640}
      maskClosable={currentStep === "warning" || currentStep === "countdown" || currentStep === "success"}
      closable={currentStep !== "uploading"}
      keyboard={currentStep !== "uploading"}
      destroyOnClose
    >
      <div className="vi">
        {error && (
          <div className="vi__error" role="alert">{error}</div>
        )}

        {/* Warning Step */}
        {currentStep === "warning" && (
          <div className="vi__warning">
            <div className="vi__hero">
              <i className="bi bi-camera-video-fill" />
              <h4 className="vi__hero-title">Record Your Video Introduction</h4>
            </div>

            <div className="vi__notice">
              <i className="bi bi-info-circle-fill" />
              <strong>Important:</strong> This video introduction can be recorded <strong>once</strong> and will be visible to recruiters and potential employers.
              Once you upload it, it will be saved as your profile video. Take your time to prepare a professional introduction!
            </div>

            <div className="vi__section-heading">
              <i className="bi bi-info-circle-fill text-primary" />
              <h5>Instructions for Recording</h5>
            </div>

            <div className="vi__instructions">
              <div className="vi__instruction-item">
                <strong>1. Prepare your professional introduction</strong>
                <span>Think about highlighting: your name, educational background, key skills, career interests, and what makes you a strong candidate.</span>
              </div>
              <div className="vi__instruction-item">
                <strong>2. Choose a professional setting</strong>
                <span>Select a quiet, well-lit space with a clean background. Dress appropriately as you would for a job interview.</span>
              </div>
              <div className="vi__instruction-item">
                <strong>3. Test your setup</strong>
                <span>We&apos;ll help you test your camera and microphone. Position yourself in the center of the frame, maintain eye contact with the camera, and speak clearly.</span>
              </div>
              <div className="vi__instruction-item">
                <strong>4. Recording details</strong>
                <span>You&apos;ll have a 45-second countdown to get ready. Your recording can be up to 2 minutes long.</span>
              </div>
            </div>

            <div className="vi__section-heading">
              <i className="bi bi-lightbulb-fill text-warning" />
              <h5>What to Include</h5>
            </div>
            <div className="vi__tips">
              <div className="vi__tip-item">
                <strong>Start with:</strong> &quot;Hello, my name is [Your Name]. I&apos;m a [Your Program/Field] student...&quot;
              </div>
              <div className="vi__tip-item">
                <strong>Highlight:</strong> Your key skills, relevant coursework or projects, career interests, and what value you bring.
              </div>
              <div className="vi__tip-item">
                <strong>Show enthusiasm:</strong> Express your passion for your field and eagerness to contribute professionally.
              </div>
              <div className="vi__tip-item">
                <strong>End with:</strong> A professional closing that expresses your interest in opportunities and invites recruiters to connect.
              </div>
            </div>

            <div className="vi__footer">
              <p className="vi__footer-hint">
                Take your time to prepare. When you&apos;re ready, click below to begin.
              </p>
              <div className="vi__footer-actions">
                <Button onClick={requestClose} size="large">Cancel</Button>
                <Button type="primary" size="large" onClick={handleWarningConfirm}>
                  I&apos;m Ready to Record
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Countdown Step */}
        {currentStep === "countdown" && (
          <div className="vi__countdown">
            <div className="vi__countdown-number">{countdown}</div>
            <p className="vi__countdown-label">
              {countdown > 30 ? "Take a deep breath and get ready..." : countdown > 15 ? "Almost there..." : "Recording will start in a moment!"}
            </p>

            {videoRef.current && stream && (
              <div className="vi__video-preview vi__video-preview--dim">
                <video ref={videoRef} muted autoPlay />
              </div>
            )}

            <div className="vi__reminders">
              <div className="vi__reminders-title">
                <i className="bi bi-check-circle-fill" />
                <strong>Quick reminders:</strong>
              </div>
              <div className="vi__reminders-list">
                <span>Look at camera</span>
                <span>Speak clearly</span>
                <span>Be professional</span>
                <span>Max 2 minutes</span>
              </div>
            </div>

            <Button onClick={requestClose}>Cancel</Button>
          </div>
        )}

        {/* Recording Step */}
        {currentStep === "recording" && (
          <div className="vi__recording">
            <div className="vi__recording-indicator">
              <Image src="/assets/images/common/recording.png" alt="Recording" height={18} width={18} />
              <span>Recording</span>
            </div>
            <div className="vi__recording-timer">{formatDuration(recordingDuration)}</div>
            <p className="vi__recording-max">Max: {formatDuration(MAX_RECORDING_DURATION / 1000)}</p>

            {videoRef.current && (
              <div className="vi__video-preview">
                <video ref={videoRef} muted autoPlay />
              </div>
            )}

            {recordingDuration < 10 && (
              <div className="vi__recording-tip">
                <i className="bi bi-info-circle" />
                <strong>Quick tip:</strong> Start with &quot;Hello, my name is [Your Name]&quot; and highlight your key skills and career interests.
              </div>
            )}

            <Button type="primary" danger size="large" onClick={stopRecording}>
              <i className="bi bi-stop-fill" style={{ marginRight: 6 }} />
              Finish Recording
            </Button>
          </div>
        )}

        {/* Preview Step - Only shown if upload fails */}
        {currentStep === "preview" && recordingUrl && (
          <div className="vi__preview">
            <h5 className="vi__preview-title">Upload Failed</h5>
            <p className="vi__preview-desc">
              We couldn&apos;t upload your video. You can review it below and try recording again.
            </p>
            <div className="vi__preview-player">
              <Player src={URL.createObjectURL(recordingUrl)}>
                <source src={URL.createObjectURL(recordingUrl)} />
              </Player>
            </div>
            <div className="vi__preview-actions">
              <Button onClick={handleRecordAgain}>Record Again</Button>
              <Button type="primary" size="large" onClick={() => handleUpload(recordingUrl)}>
                Try Upload Again
              </Button>
            </div>
          </div>
        )}

        {/* Uploading Step */}
        {currentStep === "uploading" && (
          <div className="vi__uploading">
            <h5 className="vi__uploading-title">Uploading Your Video...</h5>
            <div className="vi__uploading-progress">
              <Progress percent={uploadProgress} status="active" />
            </div>
            <p className="vi__uploading-hint">
              Please wait while we upload your video. This will just take a moment.
            </p>
          </div>
        )}

        {/* Success Step */}
        {currentStep === "success" && (
          <div className="vi__success">
            <div className="vi__success-icon">
              <i className="bi bi-check-circle-fill" />
            </div>
            <h4 className="vi__success-title">All Set!</h4>
            <p className="vi__success-desc">Your video introduction has been saved successfully.</p>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default VideoIntroModal;
