import { useEffect, useRef, useState } from "react";
import { Alert, Button } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import About from "../../components/profile/about";
import ProfileSkeleton from "@/components/profile/ProfileSkeleton";
import { getFacultyDetails } from "@/api/Services/UserServices";
import { useSelector, useDispatch } from "react-redux";
import { appAction } from "@/redux/store";
import { useRouter } from "next/router";
import { isFacultyRole, isMentorRole, getProfilePath } from "@/utils/roleUtils";
import ListingPageHeader from "@/components/Global/ListingPageHeader/ListingPageHeader";
import PageShell from "@/components/Common/PageShell";
import { RefreshStatus } from "@/components/Common/Skeletons";

export default function Profile() {
  const router = useRouter();
  const [userDetails, setUserDetails] = useState(null);
  const [profileOwnerId, setProfileOwnerId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const loginUser = useSelector(state => state.loginUser);
  // isFacultyRole only excludes ADMIN, so mentors satisfy it. Exclude them explicitly, otherwise
  // this page still fetches and renders a mentor's full profile in the moment before the redirect
  // below lands.
  const isTeacher = isFacultyRole(loginUser) && !isMentorRole(loginUser);
  const [refresh, setRefresh] = useState(false);
  const profileRequestRef = useRef(0);
  const dispatch = useDispatch();
  const hasCurrentProfile =
    profileOwnerId != null &&
    loginUser?.id != null &&
    String(profileOwnerId) === String(loginUser.id) &&
    Boolean(userDetails?.id);

  useEffect(() => {
    dispatch(appAction.setActiveMenuItem("profile"));
  }, [dispatch]);

  useEffect(() => {
    if (loginUser?.userType) {
      if (loginUser.userType === "LEARNER") {
        router.push("/learn/profile");
      } else if (loginUser.userType === "FACULTY" && loginUser.facultyType === "ADMIN") {
        router.push("/college-admin/profile");
      } else if (loginUser.userType === "FACULTY" && loginUser.facultyType === "MENTOR") {
        // Mentors deliberately have no profile page (/mentor/profile is a redirect stub, and
        // mentorNavigationMenu has no Profile entry). But isFacultyRole only excludes ADMIN, so a
        // mentor passed this page's own role check and got a fully working profile here — the
        // "mentors have no profile" decision was one URL away from being bypassed. Send them
        // wherever getProfilePath says mentors belong, so both routes agree.
        router.push(getProfilePath(loginUser));
      }
    }
  }, [loginUser, loginUser?.userType, loginUser?.facultyType, router]);

  useEffect(() => {
    const requestId = ++profileRequestRef.current;
    if (!loginUser?.id || !isTeacher) {
      setLoading(false);
      return;
    }
    const requestedUserId = loginUser.id;
    setLoading(true);
    setLoadError(false);
    getFacultyDetails({ facultyId: requestedUserId })
      .then(userRes => {
        if (requestId !== profileRequestRef.current) return;
        const userData = userRes?.data?.data || userRes?.data;
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
  }, [loginUser?.id, isTeacher, refresh]);

  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === "visible" && loginUser?.id && isTeacher) {
        setRefresh((prev) => !prev);
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [loginUser?.id, isTeacher]);

  useEffect(() => {
    if (!loading && userDetails?.id && router.query.section) {
      const sectionId =
        router.query.section === "connect-accounts"
          ? "profile-connect-accounts-section"
          : "profile-contacts-section";
      const el = document.getElementById(sectionId);
      if (el) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          });
        });
      }
    }
  }, [loading, userDetails?.id, router.query.section]);

  if (loginUser?.userType && !isTeacher) {
    return null;
  }

  if ((loading && !hasCurrentProfile) || (!hasCurrentProfile && !loadError)) {
    return (
      <div className="scroll-container learn-profile-page learn-placements-dashboard" data-testid="teacher.profile.page.loading">
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
      <div className="scroll-container learn-profile-page learn-placements-dashboard" data-testid="teacher.profile.page.error">
        <PageShell>
            <ListingPageHeader title="Profile" ariaLabel="Profile overview" />
            <div className="learn-profile-content" style={{ textAlign: "center", padding: "40px 0" }}>
              <p>We couldn&apos;t load your profile. Please try again.</p>
              <Button icon={<ReloadOutlined />} onClick={() => setRefresh(prev => !prev)} data-testid="teacher.profile.retry">Retry</Button>
            </div>
        </PageShell>
      </div>
    );
  }

  return (
    <div className="scroll-container learn-profile-page learn-placements-dashboard" data-testid="teacher.profile.page.ready">
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
                action={<Button size="small" icon={<ReloadOutlined />} onClick={() => setRefresh(prev => !prev)}>Retry</Button>}
                style={{ marginBottom: 16 }}
              />
            ) : null}
            <About userDetails={userDetails} setRefresh={setRefresh} />
          </div>
      </PageShell>
    </div>
  );
}
