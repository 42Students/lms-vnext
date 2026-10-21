import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import { Collapse } from "antd";
import { getCollegeById } from "@/api/Services/AdminService";
import {
  quickActionsCollegeScoped,
  getSetupStepsCollegeScoped,
} from "./config";
import QuickActionsGrid from "./QuickActionsGrid";
import SetupGuide from "./SetupGuide";
import AtAGlance from "./AtAGlance";
import AttentionBoard from "./AttentionBoard";

/**
 * College-admin dashboard. It used to open with a welcome banner and a numbered first-run setup
 * guide that never changed, so an admin months past setup learned nothing from it. Now: who you
 * are and what day it is, the college's size, then the "needs attention" board (attendance not
 * taken, at-risk students, grading backlog, unstaffed courses, setup gaps, quizzes closing). The
 * setup guide is still here, folded away, for a college that is being set up.
 */
export default function AdminDashboardView({ onNavigate, collegeId, isCollegeScoped }) {
  const router = useRouter();
  const [collegeName, setCollegeName] = useState(null);

  const quickActions = quickActionsCollegeScoped;
  const setupPhases = getSetupStepsCollegeScoped();

  useEffect(() => {
    if (!isCollegeScoped || !collegeId) return undefined;
    let isMounted = true;
    const fetchCollegeName = () => {
      getCollegeById(collegeId)
        .then((res) => {
          if (!isMounted) return;
          const data = res?.data?.data ?? res?.data;
          setCollegeName(data?.name ?? null);
        })
        .catch(() => { if (isMounted) setCollegeName(null); });
    };
    fetchCollegeName();
    // Client-side nav away and back doesn't remount this component in every layout scenario, so
    // re-fetch on route completion to avoid showing a stale college name indefinitely.
    router.events.on("routeChangeComplete", fetchCollegeName);
    return () => {
      isMounted = false;
      router.events.off("routeChangeComplete", fetchCollegeName);
    };
  }, [isCollegeScoped, collegeId, router.events]);

  return (
    <div className="admin-dashboard-page">
      <div className="admin-dash-hello">
        <div className="admin-dash-hello__college">{collegeName || (isCollegeScoped ? "Your college" : "No college assigned")}</div>
        <div className="admin-dash-hello__date">{dayjs().format("dddd, D MMMM YYYY")}</div>
      </div>

      {isCollegeScoped && <AtAGlance collegeId={collegeId} />}

      {isCollegeScoped && <AttentionBoard collegeId={collegeId} />}

      <QuickActionsGrid actions={quickActions} onNavigate={onNavigate} />

      <Collapse
        className="admin-dash-setup-collapse"
        items={[{
          key: "setup",
          label: "Setting up a new college? Step-by-step setup guide",
          children: (
            // The guide alone: a "Quick Summary" card under it repeated the same steps as prose.
            <SetupGuide phases={setupPhases} onNavigate={onNavigate} />
          ),
        }]}
      />
    </div>
  );
}
