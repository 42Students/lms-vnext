import React from "react";
import { Button, Result } from "antd";
import { useSelector } from "react-redux";
import { accountScopeKey } from "@/utils/accountScopeKey";
import ProjectsContent from "@/components/Projects/ProjectsContent";
import useCollegeFeatureFlags from "@/utils/useCollegeFeatureFlags";

export default function MentorProjectsPage() {
  // Deep links can still reach this page when Projects is disabled. Keep the direct
  // page guard aligned with the fail-closed feature hook and the mentor landing page.
  const loginUser = useSelector((state) => state.loginUser);
  const { projectsEnabled, modules, loading, failed } = useCollegeFeatureFlags();
  const isProjectsEnabled = modules.projects !== undefined ? modules.projects : projectsEnabled;

  if (loading) {
    return <Result status="info" title="Checking Projects access" subTitle="Verifying your college module settings…" />;
  }

  if (failed) {
    return (
      <Result
        status="warning"
        title="Could not verify Projects access"
        subTitle="The LMS could not check your college module settings. This does not mean Projects is disabled."
        extra={<Button type="primary" onClick={() => window.location.reload()}>Retry access check</Button>}
      />
    );
  }

  if (!isProjectsEnabled) {
    return (
      <Result
        status="info"
        title="Projects is turned off for your college"
        subTitle="Projects is currently unavailable for your account. Contact your administrator if you need access."
      />
    );
  }

  return <ProjectsContent key={accountScopeKey(loginUser)} />;
}
