import React from "react";
import { useSelector } from "react-redux";
import { accountScopeKey } from "@/utils/accountScopeKey";
import ProjectsContent from "@/components/Projects/ProjectsContent";

export default function LearnProjectsPage() {
  const loginUser = useSelector((state) => state.loginUser);
  return <ProjectsContent key={accountScopeKey(loginUser)} />;
}
