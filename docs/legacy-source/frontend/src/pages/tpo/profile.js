import { useEffect, useRef, useState } from "react";
import { Alert, Button, Typography } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import TpoProfileCard from "@/components/tpo/TpoProfileCard";
import ProfileSkeleton from "@/components/profile/ProfileSkeleton";
import { getFacultyDetails } from "@/api/Services/UserServices";
import { appAction } from "@/redux/store";
import { isTpoRole } from "@/utils/roleUtils";
import ListingPageHeader from "@/components/Global/ListingPageHeader/ListingPageHeader";
import PageShell from "@/components/Common/PageShell";
import { RefreshStatus } from "@/components/Common/Skeletons";

/**
 * TPO profile: photo, name, role and contact (TpoProfileCard). It used the whole faculty/student-style profile before, which
 * asked a placement officer for a blood group and Aadhaar (TPO page audit 2026-10-04).
 */
export default function TpoProfile() {
  const dispatch = useDispatch();
  const loginUser = useSelector((state) => state.loginUser);
  const isTpo = isTpoRole(loginUser);
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const loadedUserIdRef = useRef(null);

  useEffect(() => {
    dispatch(appAction.setActiveMenuItem("profile"));
  }, [dispatch]);

  useEffect(() => {
    if (!loginUser?.id || !isTpo) {
      setLoading(false);
      return;
    }
    const sameScope = loadedUserIdRef.current === loginUser.id;
    setLoading(true);
    setLoadError(false);
    if (!sameScope) setUserDetails(null);
    // BE-0108: a slower answer for the previous person (or an older refresh) is dropped, never shown as this person.
    let current = true;
    const requestedId = loginUser.id;
    getFacultyDetails({ facultyId: requestedId })
      .then((userRes) => {
        if (!current) return;
        const details = userRes?.data?.data || userRes?.data;
        if (details?.id != null && String(details.id) !== String(requestedId)) { setLoadError(true); return; }
        setUserDetails(details);
        loadedUserIdRef.current = requestedId;
      })
      .catch(() => {
        if (current) setLoadError(true);
      })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [loginUser?.id, isTpo, refresh]);

  if (loginUser?.userType && !isTpo) return null;

  if ((loading && !userDetails?.id) || (!userDetails?.id && !loadError)) {
    return (
      <div className="scroll-container learn-profile-page learn-placements-dashboard tpo-profile" data-testid="tpo.profile.page.loading">
        <PageShell>
          <ListingPageHeader
            className="tpo-profile__header"
            title="Profile"
            subtitle={<Typography.Text type="secondary">How students and recruiters see you in the placement workspace.</Typography.Text>}
            ariaLabel="Profile overview"
          />
          <div className="learn-profile-content tpo-profile__loading">
            <ProfileSkeleton />
          </div>
        </PageShell>
      </div>
    );
  }

  if ((loadError && !userDetails?.id) || !userDetails?.id) {
    return (
      <div className="scroll-container learn-profile-page learn-placements-dashboard tpo-profile" data-testid="tpo.profile.page.error">
        <PageShell>
          <ListingPageHeader
            className="tpo-profile__header"
            title="Profile"
            subtitle={<Typography.Text type="secondary">How students and recruiters see you in the placement workspace.</Typography.Text>}
            ariaLabel="Profile overview"
          />
          <div className="learn-profile-content tpo-profile__error">
            <Typography.Title level={4}>We couldn&apos;t load your profile</Typography.Title>
            <Typography.Paragraph type="secondary">The profile service did not return your faculty record. Retry without leaving this page.</Typography.Paragraph>
            <Button type="primary" icon={<ReloadOutlined />} onClick={() => setRefresh((prev) => !prev)}>Retry</Button>
          </div>
        </PageShell>
      </div>
    );
  }

  return (
    <div className="scroll-container learn-profile-page learn-placements-dashboard tpo-profile" data-testid="tpo.profile.page.ready">
      <PageShell>
        <ListingPageHeader
          className="tpo-profile__header"
          title="Profile"
          subtitle={<Typography.Text type="secondary">How students and recruiters see you in the placement workspace.</Typography.Text>}
          ariaLabel="Profile overview"
        />
        {loading && userDetails?.id && <RefreshStatus label="Refreshing profile…" />}
        {loadError && userDetails?.id && (
          <Alert type="warning" showIcon message="Couldn't refresh profile"
            description="Showing the last profile we loaded."
            action={<Button size="small" icon={<ReloadOutlined />} onClick={() => setRefresh((prev) => !prev)}>Retry</Button>}
            style={{ marginBottom: 12 }} />
        )}
        <div className="learn-profile-content tpo-profile__content" aria-busy={loading ? "true" : undefined}>
          <TpoProfileCard userDetails={userDetails} setRefresh={setRefresh} />
        </div>
      </PageShell>
    </div>
  );
}
