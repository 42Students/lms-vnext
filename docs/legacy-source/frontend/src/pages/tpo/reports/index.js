import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import { Alert, Button, Typography } from "antd";
import PageShell from "@/components/Common/PageShell";
import ListingPageHeader from "@/components/Global/ListingPageHeader/ListingPageHeader";
import { REPORTS } from "@/components/tpo/reportsMeta";
import { ArrowRightOutlined } from "@ant-design/icons";
import JourneyStrip from "@/components/tpo/ui/JourneyStrip";
import { appAction } from "@/redux/store";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { getReport } from "@/api/Services/TpoHubService";

const REPORT_GROUPS = [
  {
    key: "overview",
    eyebrow: "Placement health",
    title: "Overview and performance",
    description: "Start with the college-wide picture, then compare branches, companies and compensation.",
    reports: ["placement-summary", "by-branch", "by-company", "ctc"],
  },
  {
    key: "outcomes",
    eyebrow: "Student outcomes",
    title: "Offers, joining and readiness gaps",
    description: "Understand who is still unplaced, what happened to offers, and where students are dropping out of the funnel.",
    reports: ["unplaced", "offers-acceptance", "joining-status", "failure-reasons"],
  },
  {
    key: "relationships",
    eyebrow: "Relationships and compliance",
    title: "Recruiter funnel and accreditation",
    description: "Measure employer engagement and export the formal data required for accreditation workflows.",
    reports: ["recruiter-leads", "outcomes", "accreditation"],
  },
];

/** Reports gallery (TPO V1 - Locked.docx §8). Unique students placed and total offers always appear side by side on each report. */
export default function TpoReports() {
  const dispatch = useDispatch();
  const router = useRouter();
  const [snapshot, setSnapshot] = useState(null);
  const [snapshotError, setSnapshotError] = useState(false);
  const [retryTick, setRetryTick] = useState(0);
  useEffect(() => { dispatch(appAction.setActiveMenuItem("reports")); }, [dispatch]);
  useEffect(() => {
    fetchWithErrorHandling(getReport("placement-summary", {}))
      .then((r) => {
        if (r.success) { setSnapshotError(false); setSnapshot(r.data?.stats || null); } else setSnapshotError(true);
      });
  }, [retryTick]);
  return (
    <div className="scroll-container tpo-reports" data-testid="tpo.reports">
      <PageShell>
        <ListingPageHeader
          className="tpo-reports__header"
          title="Reports"
          subtitle={<Typography.Text type="secondary">Answer placement questions quickly, then drill in and export the underlying data.</Typography.Text>}
        />

        {snapshotError && <Alert className="tpo-reports__snapshot-error" type="error" showIcon message="The headline numbers could not be loaded." action={<Button size="small" onClick={() => setRetryTick((n) => n + 1)}>Retry</Button>} />}
        {/* The college's placement journey, the same idea as Students: each step opens the report that explains it. */}
        {snapshot && (() => {
          const looking = Number(snapshot.registered) || 0;
          const placed = Number(snapshot.placedUnique) || 0;
          const accepted = Number(snapshot.acceptedUnique) || 0;
          const go = { R_LOOKING: "by-branch", R_PLACED: "placement-summary", R_ACCEPTED: "offers-acceptance", R_UNPLACED: "unplaced", R_WAITING: "offers-acceptance" };
          return (
            <JourneyStrip testid="reports.journey" onPick={(k) => router.push(`/tpo/reports/${go[k]}`)}
              caption={`The college's placement journey: ${Number(snapshot.offers) || 0} ${Number(snapshot.offers) === 1 ? "offer" : "offers"} made. Click any number for its report.`}
              steps={[{ key: "R_LOOKING", label: "Looking for a job", n: looking }, { key: "R_PLACED", label: "Placed", n: placed }, { key: "R_ACCEPTED", label: "Accepted", n: accepted }]}
              gaps={{ R_LOOKING: { key: "R_UNPLACED", label: "Unplaced", n: Math.max(0, looking - placed) }, R_PLACED: { key: "R_WAITING", label: "Not accepted yet", n: Math.max(0, placed - accepted) } }} />
          );
        })()}

        <div className="tpo-reports__groups">
          {REPORT_GROUPS.map((group) => (
            <section className="tpo-reports__group" key={group.key} aria-labelledby={`report-group-${group.key}`}>
              <div className="tpo-reports__group-heading is-stacked">
                <Typography.Title level={4} id={`report-group-${group.key}`}>{group.title}</Typography.Title>
                <Typography.Text type="secondary">{group.description}</Typography.Text>
              </div>

              <div className="tpo-reports__grid">
                {group.reports.map((key) => {
                  const report = REPORTS[key];
                  if (!report) return null;
                  return (
                    <button
                      type="button"
                      className={`tpo-reports__card ${key === "placement-summary" ? "tpo-reports__card--featured" : ""}`}
                      key={key}
                      onClick={() => router.push(`/tpo/reports/${key}`)}
                    >
                      <div className="tpo-reports__card-top">
                        <div>
                          {key === "placement-summary" && <span className="tpo-nextstep__eyebrow">Start here</span>}
                          <Typography.Title level={5}>{report.title}</Typography.Title>
                        </div>
                        <ArrowRightOutlined className="tpo-reports__card-arrow" aria-hidden="true" />
                      </div>
                      <Typography.Text type="secondary">{report.help}</Typography.Text>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </PageShell>
    </div>
  );
}
