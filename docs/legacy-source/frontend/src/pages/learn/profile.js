import { useEffect, useState, useCallback, useRef } from "react";
import { Alert, Button } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import ListingPageHeader from "@/components/Global/ListingPageHeader/ListingPageHeader";
import PageShell from "@/components/Common/PageShell";
import About from "../../components/profile/about";
import ProfileSkeleton from "@/components/profile/ProfileSkeleton";
import ProfileVerificationCard from "@/components/profile/ProfileVerificationCard";
import { RefreshStatus } from "@/components/Common/Skeletons";
import { getStudentDetails, getProgramDetailsByLearnerId } from "@/api/Services/UserServices";
import { useSelector, useDispatch } from "react-redux";
import { appAction } from "@/redux/store";
import { useRouter } from "next/router";
import { isLearnerRole } from "@/utils/roleUtils";

export default function Profile() {
  const router = useRouter();
  const [userDetails, setUserDetails] = useState(null);
  const [profileOwnerId, setProfileOwnerId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const loginUser = useSelector(state => state.loginUser);
  const isLearner = isLearnerRole(loginUser);
  const [refresh, setRefresh] = useState(false);
  const [programName, setProgramName] = useState(null);
  const [programOwnerId, setProgramOwnerId] = useState(null);
  const profileRequestRef = useRef(0);
  const dispatch = useDispatch();

  const hasCurrentProfile =
    profileOwnerId != null &&
    loginUser?.id != null &&
    String(profileOwnerId) === String(loginUser.id) &&
    Boolean(userDetails?.id);
  const hasCurrentProgram =
    programOwnerId != null &&
    loginUser?.id != null &&
    String(programOwnerId) === String(loginUser.id);

  useEffect(() => {
    dispatch(appAction.setActiveMenuItem("profile"));
  }, [dispatch]);

  useEffect(() => {
    if (loginUser?.userType && !isLearner) {
      if (loginUser.userType === "FACULTY" && loginUser.facultyType === "ADMIN") {
        router.push("/college-admin/profile");
      } else if (loginUser.userType === "FACULTY") {
        router.push("/teacher/profile");
      }
    }
  }, [loginUser?.userType, loginUser?.facultyType, isLearner, router]);

  useEffect(() => {
    const requestId = ++profileRequestRef.current;
    if (!loginUser?.id || !isLearner) return;
    setLoading(true);
    setLoadError(false);
    const requestedUserId = loginUser.id;
    getStudentDetails({ learnerId: requestedUserId })
      .then((userRes) => {
        if (requestId !== profileRequestRef.current) return;
        const userData = userRes?.data?.data ?? userRes?.data;
        if (!userData?.id) {
          setLoadError(true);
          return;
        }
        setUserDetails(userData);
        setProfileOwnerId(requestedUserId);
        setLoadError(false);
      })
      .catch(() => {
        if (requestId !== profileRequestRef.current) return;
        setLoadError(true);
      })
      .finally(() => {
        if (requestId === profileRequestRef.current) setLoading(false);
      });
    getProgramDetailsByLearnerId(requestedUserId)
      .then((res) => {
        if (requestId !== profileRequestRef.current) return;
        const program = res?.data?.data ?? res?.data;
        setProgramName(program?.name ?? null);
        setProgramOwnerId(requestedUserId);
      })
      // LRN-PROF-01: say the program could not load rather than silently leaving it out. Keep a
      // same-user label through a transient refresh failure (programOwnerId guards a user change).
      .catch(() => setProgramName((current) => current || "Program couldn't load"));
  }, [loginUser?.id, isLearner, refresh]);

  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === "visible" && loginUser?.id && isLearner) {
        setRefresh((prev) => !prev);
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [loginUser?.id, isLearner]);

  useEffect(() => {
    if (!loading && userDetails?.id && router.query.section) {
      const sectionId =
        router.query.section === "connect-accounts"
          ? "profile-connect-accounts-section"
          : "profile-contacts-section";
      const el = document.getElementById(sectionId);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "center" }), 300);
      }
    }
  }, [loading, userDetails?.id, router.query.section]);

  const onRefresh = useCallback(() => setRefresh((prev) => !prev), []);

  if (loginUser?.userType && !isLearner) {
    return null;
  }

  if ((loading && !hasCurrentProfile) || (!hasCurrentProfile && !loadError)) {
    return (
      <div className="scroll-container learn-profile-page learn-placements-dashboard" data-testid="learner.profile.page.loading">
        <PageShell>
            <ListingPageHeader title="Profile" ariaLabel="Profile overview" />
            <div className="learn-profile-content">
              <ProfileSkeleton />
            </div>
        </PageShell>
      </div>
    );
  }

  if (loadError && !hasCurrentProfile) {
    return (
      <div className="scroll-container learn-profile-page learn-placements-dashboard" data-testid="learner.profile.page.error">
        <PageShell>
            <ListingPageHeader title="Profile" ariaLabel="Profile overview" />
            <div className="learn-profile-content" style={{ textAlign: "center", padding: "40px 0" }}>
              <p>We couldn&apos;t load your profile. Please try again.</p>
              <Button icon={<ReloadOutlined />} onClick={onRefresh} data-testid="learner.profile.retry">Retry</Button>
            </div>
        </PageShell>
      </div>
    );
  }

  return (
    <div className="scroll-container learn-profile-page learn-placements-dashboard" data-testid="learner.profile.page.ready">
      <PageShell>
          <ListingPageHeader title="Profile" ariaLabel="Profile overview" />
          <div className="learn-profile-content" aria-busy={loading ? "true" : undefined}>
            {loading && hasCurrentProfile ? <RefreshStatus label="Refreshing profile…" /> : null}
            {loadError && hasCurrentProfile ? (
              <Alert
                type="warning"
                showIcon
                message="Couldn't refresh profile"
                description="Showing the last profile we loaded."
                action={<Button size="small" icon={<ReloadOutlined />} onClick={onRefresh}>Retry</Button>}
                style={{ marginBottom: 16 }}
              />
            ) : null}
            <div style={{ marginBottom: 24 }}>
              <ProfileVerificationCard />
            </div>
            <About
              userDetails={userDetails}
              setRefresh={setRefresh}
              programName={hasCurrentProgram ? programName : null}
            />
          </div>
      </PageShell>
    </div>
  );
}
