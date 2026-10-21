import React from "react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { accountScopeKey } from "@/utils/accountScopeKey";
import ProjectDetailContent from "@/components/Projects/ProjectDetailContent";

export default function LearnProjectDetailPage() {
  const router = useRouter();
  const loginUser = useSelector((state) => state.loginUser);
  // See the matching comment in pages/mentor/projects/[projectId].js — ProjectDetailContent
  // already reacts to router.query.tab changing on its own; keying on the whole path (including
  // the ?tab= query) forced a full remount on every tab click, silently discarding any open
  // modal/form. Keying on just the project id keeps that reset for an actual project change only.
  return <ProjectDetailContent key={`${router.query.projectId}:${accountScopeKey(loginUser)}`} />;
}
