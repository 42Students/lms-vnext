import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Card, Result } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import PageShell from "@/components/Common/PageShell";
import { DashboardSkeleton } from "@/components/Common/Skeletons";
import ListingPageHeader from "@/components/Global/ListingPageHeader/ListingPageHeader";
import { appAction } from "@/redux/store";
import { getRecruiterMe } from "@/api/Services/RecruiterService";
import RecruiterToday from "@/components/recruiter/RecruiterToday";
import NoCollegeSession from "@/components/recruiter/NoCollegeSession";
import { isRecruiterType } from "@/config/roles";

/**
 * recruiter (industry recruiter) home. One college per session.
 *
 * Today for this session's college only. A recruiter who works with several colleges signs in on each college's own address.
 * Sign-in is only on a college's own address (N1), so there is no college-less session to choose from any more.
 */
export default function RecruiterHome() {
  const dispatch = useDispatch();
  const loginUser = useSelector((state) => state.loginUser);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    dispatch(appAction.setActiveMenuItem("home"));
  }, [dispatch]);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError(false);
    getRecruiterMe()
      .then((res) => setMe(res?.data ?? null))
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (isRecruiterType(loginUser?.userType)) load();
  }, [load, loginUser?.userType, loginUser?.collegeId]);

  const user = me?.user || {};
  const firstName = user.firstName || loginUser?.firstName || "";
  const isCollegeScope = me?.scope === "COLLEGE";
  
  if (loading) {
    return (
      <div className="scroll-container recruiter-home recruiter-home--state" data-testid="recruiter.home.loading">
        <PageShell>
          <ListingPageHeader title="Today" />
          <DashboardSkeleton metrics={3} label="Loading recruiter home" />
        </PageShell>
      </div>
    );
  }

  if (loadError || !me) {
    return (
      <div className="scroll-container recruiter-home recruiter-home--state" data-testid="recruiter.home.error">
        <PageShell>
          <ListingPageHeader title="Today" />
          <Result
            status="warning"
            title="We couldn't load your account"
            extra={<Button icon={<ReloadOutlined />} onClick={load}>Retry</Button>}
          />
        </PageShell>
      </div>
    );
  }

  if (isCollegeScope) {
    return <RecruiterToday collegeId={me.collegeId} firstName={firstName} companyName={user.companyName} />;
  }

  // Sign-in is only on a college's own address (N1), so every session has a college; anything else has nothing to show.
  return (
    <div className="scroll-container recruiter-home recruiter-home--state" data-testid="recruiter.home.no-college">
      <PageShell>
        <ListingPageHeader title={firstName ? `Welcome, ${firstName}` : "Welcome"} />
        <Card><NoCollegeSession /></Card>
      </PageShell>
    </div>
  );
}
