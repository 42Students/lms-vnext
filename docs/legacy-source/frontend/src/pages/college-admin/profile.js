import { useEffect, useRef, useState } from "react";
import { Alert, Button } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import About from "../../components/profile/about";
import ProfileSkeleton from "@/components/profile/ProfileSkeleton";
import { getFacultyDetails } from "@/api/Services/UserServices";
import { useSelector, useDispatch } from "react-redux";
import { appAction } from "@/redux/store";
import { isAdminRole, getProfilePath } from "@/utils/roleUtils";
import AdminLayout from "@/layouts/AdminLayout";
import { useRouter } from "next/router";
import ListingPageHeader from "@/components/Global/ListingPageHeader/ListingPageHeader";
import { RefreshStatus } from "@/components/Common/Skeletons";

export default function AdminProfile() {
  const router = useRouter();
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const loginUser = useSelector(state => state.loginUser);
  const isAdmin = isAdminRole(loginUser);
  const [refresh, setRefresh] = useState(false);
  const dispatch = useDispatch();
  const loadedUserIdRef = useRef(null);

  useEffect(() => {
    dispatch(appAction.setActiveMenuItem("profile"));
  }, [dispatch]);

  useEffect(() => {
    if (!loginUser?.userType) return;
    if (loginUser.userType === "LEARNER") {
      router.push("/learn/profile");
      return;
    }
    if (loginUser.userType === "FACULTY" && loginUser.facultyType !== "ADMIN") {
      router.push(getProfilePath(loginUser));
    }
  }, [loginUser?.userType, loginUser?.facultyType, router]);

  useEffect(() => {
    if (!loginUser?.id || !isAdmin) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const sameScope = loadedUserIdRef.current === loginUser.id;
    setLoading(true);
    setLoadError(false);
    if (!sameScope) setUserDetails(null);
    getFacultyDetails({ facultyId: loginUser.id })
      .then(userRes => {
        if (cancelled) return;
        const userData = userRes?.data?.data || userRes?.data;
        setUserDetails(userData);
        loadedUserIdRef.current = loginUser.id;
      })
      .catch(() => {
        if (cancelled) return;
        setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [loginUser?.id, isAdmin, refresh]);

  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === "visible" && loginUser?.id && isAdmin) {
        setRefresh((prev) => !prev);
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [loginUser?.id, isAdmin]);

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

  if (loginUser?.userType && !isAdmin) {
    return (
      <div className="learn-profile-page learn-placements-dashboard">
        <div className="ln-module-card learn-placements-dashboard__card">
          <div className="learn-placements-dashboard__body">
            <ListingPageHeader title="Profile" ariaLabel="Profile overview" />
            <div className="learn-profile-content">
              <ProfileSkeleton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if ((loading && !userDetails?.id) || (!userDetails?.id && !loadError)) {
    return (
      <div className="learn-profile-page learn-placements-dashboard">
        <div className="ln-module-card learn-placements-dashboard__card">
          <div className="learn-placements-dashboard__body">
            <ListingPageHeader title="Profile" ariaLabel="Profile overview" />
            <div className="learn-profile-content">
              <ProfileSkeleton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if ((loadError && !userDetails?.id) || !userDetails?.id) {
    return (
      <div className="learn-profile-page learn-placements-dashboard">
        <div className="ln-module-card learn-placements-dashboard__card">
          <div className="learn-placements-dashboard__body">
            <ListingPageHeader title="Profile" ariaLabel="Profile overview" />
            <div className="learn-profile-content" style={{ textAlign: "center", padding: "40px 0" }}>
              <p>Failed to load profile.</p>
              <Button icon={<ReloadOutlined />} onClick={() => setRefresh(prev => !prev)}>Retry</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="learn-profile-page learn-placements-dashboard">
      <div className="ln-module-card learn-placements-dashboard__card">
        <div className="learn-placements-dashboard__body">
          <ListingPageHeader title="Profile" ariaLabel="Profile overview" />
          {loading && userDetails?.id && <RefreshStatus label="Refreshing profile…" />}
          {loadError && userDetails?.id && (
            <Alert
              type="warning"
              showIcon
              message="Couldn't refresh profile"
              description="Showing the last profile we loaded."
              action={<Button size="small" icon={<ReloadOutlined />} onClick={() => setRefresh(prev => !prev)}>Retry</Button>}
              style={{ marginBottom: 12 }}
            />
          )}
          <div className="learn-profile-content" aria-busy={loading ? "true" : undefined}>
            {/* programName intentionally omitted: it's a learner-only concept (see About/UserInfo), not applicable to admin profiles */}
            <About userDetails={userDetails} setRefresh={setRefresh} compact />
          </div>
        </div>
      </div>
    </div>
  );
}

AdminProfile.adminLayout = AdminLayout;
