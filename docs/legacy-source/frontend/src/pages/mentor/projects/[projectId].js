import React from "react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { accountScopeKey } from "@/utils/accountScopeKey";
import ProjectDetailContent from "@/components/Projects/ProjectDetailContent";

export default function MentorProjectDetailPage() {
  const router = useRouter();
  const loginUser = useSelector((state) => state.loginUser);
  // ProjectDetailContent already reads `tab` straight off router.query itself and re-renders (not
  // remounts) when it changes — keying on the FULL path (including the ?tab= query string) forced
  // a complete unmount/remount on every single tab click, silently discarding whatever was open:
  // an in-progress "Review submission" with typed feedback, "Create task", "Add member",
  // "Schedule meeting", an in-place sprint edit — all reset to nothing with zero warning.
  // Keying on just the project id still forces a clean remount when navigating to a genuinely
  // different project (correct — a new project shouldn't inherit the old one's open modal state).
  return <ProjectDetailContent key={`${router.query.projectId}:${accountScopeKey(loginUser)}`} />;
}
