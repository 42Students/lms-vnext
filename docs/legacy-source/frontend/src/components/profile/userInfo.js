import { Alert, Button, Card, Skeleton, Typography } from "antd";
import PencilUploadButton from "../Global/Button/PencilUploadButton";
import { stringValueCheck } from "@/utils/profileUtils";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Player } from "video-react";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import * as ProfileService from "@/api/Services/ProfileService";
import ResilientAvatar from "@/components/Common/ResilientAvatar";

dayjs.extend(customParseFormat);

function formatDob(dob) {
  if (!dob || dob === "string") return null;
  const formats = ["YYYY-MM-DD", "DD-MM-YYYY", "MM-DD-YYYY", "DD/MM/YYYY", "YYYY/MM/DD"];
  for (const fmt of formats) {
    const parsed = dayjs(dob, fmt, true);
    if (parsed.isValid()) return parsed.format("DD-MM-YYYY");
  }
  const fallback = dayjs(dob);
  return fallback.isValid() ? fallback.format("DD-MM-YYYY") : dob;
}
const VideoIntroModal = dynamic(() => import("./VideoIntroModal"), {
  ssr: false,
});

const { Title } = Typography;

function normalizeDepartments(department) {
  if (Array.isArray(department)) return department.filter(Boolean);
  if (typeof department === "string") {
    return department
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  }
  if (department && typeof department === "object") {
    return Object.values(department).filter((value) => typeof value === "string" && value.trim());
  }
  return [];
}

const UserInfo = ({ userDetails, saveImage, saveImageFromLink, userId, setRefresh, programName }) => {
  const isLearner = userDetails?.userType === "LEARNER";
  const [openVideoModal, setOpenVideoModal] = useState(false);
  const [videoIntro, setVideoIntro] = useState(null);
  const [loadingVideo, setLoadingVideo] = useState(true);
  const [videoLoadError, setVideoLoadError] = useState(false);
  const [videoPlaybackUrl, setVideoPlaybackUrl] = useState(null);
  const departmentList = normalizeDepartments(userDetails?.department);

  // Fetch video intro status
  useEffect(() => {
    if (isLearner && userDetails?.id) {
      loadVideoIntro();
    } else {
      setVideoIntro(null);
      setVideoPlaybackUrl(null);
      setLoadingVideo(false);
    }
  }, [isLearner, userDetails?.id]);

  // Video intro now stores a plain public URL, returned directly by getLearnerVideoIntro — no
  // separate signed-URL fetch, and no 30-minute refresh timer (that existed purely to keep a
  // short-lived signed URL alive; a permanent public link doesn't expire, so there's nothing to
  // refresh).
  const loadVideoIntro = async () => {
    try {
      setLoadingVideo(true);
      setVideoLoadError(false);
      const response = await ProfileService.getLearnerVideoIntro(userDetails.id);
      const data = response?.data?.data;
      setVideoIntro(data);
      setVideoPlaybackUrl(data?.hasVideoIntro ? (data?.videoIntroUrl || null) : null);
    } catch (error) {
      setVideoIntro(null);
      setVideoPlaybackUrl(null);
      setVideoLoadError(true);
    } finally {
      setLoadingVideo(false);
    }
  };

  const handleVideoSuccess = () => {
    if (userDetails?.id) {
      loadVideoIntro();
    }
    if (setRefresh) {
      setRefresh(prev => !prev);
    }
  };

  return (
    <>
      <Card className="profile-userinfo-card profile-userinfo">
        <div className="profile-userinfo__main">
          <div className="profile-userinfo__avatar ln-prof-img">
            <ResilientAvatar
              src={userDetails?.website}
              name={[userDetails?.firstName, userDetails?.lastName].filter(Boolean).join(" ") || "Profile"}
              alt={userDetails?.firstName ? `${userDetails.firstName}'s profile photo` : "Profile photo"}
              size={120}
              shape="square"
            />
            <PencilUploadButton saveImage={saveImage} saveImageFromLink={saveImageFromLink} userId={userId} />
          </div>

          <div className="profile-userinfo__content">
            <h2 className="profile-userinfo__name">
              {[userDetails?.firstName, userDetails?.lastName].filter(Boolean).join(" ") || "-"}
            </h2>
            {(programName || userDetails?.rollNumber) && (
              <div className="profile-userinfo__identity">
                {programName && <span>{programName}</span>}
                {programName && userDetails?.rollNumber && <span className="profile-userinfo__dot" aria-hidden />}
                {userDetails?.rollNumber && <span>{userDetails.rollNumber}</span>}
              </div>
            )}
            {userDetails?.description && (
              <p className="profile-userinfo__description learn-userinfo-description">{userDetails?.description}</p>
            )}
            {(stringValueCheck(userDetails?.dob) ||
              (departmentList.length > 0)) && (
              <div className="profile-userinfo__meta profile-user-meta">
                {userDetails?.dob && (
                  <span className="profile-user-meta-item">
                    <span className="bi bi-gift" aria-hidden />
                    {formatDob(userDetails.dob)}
                  </span>
                )}
                {departmentList.length > 0 && (
                  <span className="profile-user-meta-item">
                    <span className="bi bi-bullseye" aria-hidden />
                    {departmentList.slice(0, 2).join(", ")}
                    {departmentList.length > 2 ? " etc." : ""}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Video Intro Section - Only for Learners */}
        {isLearner && (
          <div className="profile-userinfo__video-section">
            <div className="profile-userinfo__video-header">
              <Title level={5} className="profile-userinfo__video-title">Video Introduction</Title>
              {!videoIntro?.hasVideoIntro && !videoLoadError && (
                <Button 
                  type="primary" 
                  icon={<i className="bi bi-camera-video pe-2"></i>}
                  onClick={() => setOpenVideoModal(true)}
                  disabled={loadingVideo}
                >
                  Record Video Intro
                </Button>
              )}
            </div>
            {loadingVideo ? (
              <div className="profile-userinfo__video-loading">
                <Skeleton.Node active className="profile-userinfo__video-skeleton" />
                <Typography.Text type="secondary">Checking video intro...</Typography.Text>
              </div>
            ) : videoLoadError ? (
              <Alert
                type="warning"
                showIcon
                message="Video introduction status unavailable"
                description="We couldn't verify whether you already have a video introduction, so recording is temporarily disabled."
                action={<Button size="small" onClick={loadVideoIntro}>Retry</Button>}
              />
            ) : videoIntro?.hasVideoIntro ? (
              <div className="profile-userinfo__video-content">
                <div style={{ maxWidth: "500px", margin: "0 auto" }}>
                  {videoPlaybackUrl ? (
                    <Player src={videoPlaybackUrl}>
                      <source src={videoPlaybackUrl} />
                    </Player>
                  ) : (
                    <div className="profile-userinfo__video-empty profile-userinfo__video-empty--compact">
                      <Typography.Text type="secondary">Video intro is available. Preview is loading...</Typography.Text>
                    </div>
                  )}
                </div>
                <div className="profile-userinfo__video-status">
                  <Typography.Text type="secondary" className="profile-userinfo__video-status-text">
                    <i className="bi bi-check-circle-fill text-success pe-1"></i>
                    Video intro uploaded
                  </Typography.Text>
                </div>
              </div>
            ) : (
              <div className="profile-userinfo__video-empty">
                <Typography.Text type="secondary">
                  Record a video introduction to help others get to know you better.
                </Typography.Text>
              </div>
            )}
          </div>
        )}
      </Card>
      
      {/* Video Intro Modal */}
      {openVideoModal && (
        <VideoIntroModal
          open={openVideoModal}
          onClose={() => setOpenVideoModal(false)}
          learnerId={userDetails?.id}
          onSuccess={handleVideoSuccess}
          hasExistingVideo={videoIntro?.hasVideoIntro}
        />
      )}
    </>
  );
};

export default UserInfo;
