import React, { useEffect } from "react";
import { Button, Result } from "antd";
import { useRouter } from "next/router";
import useCollegeFeatureFlags from "@/utils/useCollegeFeatureFlags";

/** A mentor must never be unconditionally redirected into a disabled optional module. */
export default function MentorLanding() {
  const router = useRouter();
  const { projectsEnabled, modules, loading, failed } = useCollegeFeatureFlags();
  const projectsAvailable = modules?.projects !== undefined ? modules.projects : projectsEnabled;

  useEffect(() => {
    if (!loading && !failed && projectsAvailable) {
      void router.replace("/mentor/projects");
    }
  }, [loading, failed, projectsAvailable, router]);

  if (loading || (!failed && projectsAvailable)) {
    return <Result status="info" title="Opening your mentor workspace" />;
  }

  if (failed) {
    return (
      <Result
        status="warning"
        title="Could not verify Projects access"
        subTitle="The LMS could not check your college module settings. This does not mean Projects is disabled."
        extra={<Button type="primary" onClick={() => router.reload()}>Retry access check</Button>}
      />
    );
  }

  return (
    <Result
      status="info"
      title="Projects is currently unavailable"
      subTitle="Projects is disabled for this account. You can still check notifications."
      extra={<Button href="/mentor/notifications" type="primary">View notifications</Button>}
    />
  );
}
