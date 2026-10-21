import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Button, Card, Col, Row, Skeleton, Statistic } from "antd";
import { TeamOutlined, UserOutlined, BookOutlined, SolutionOutlined } from "@ant-design/icons";
import { getAdminCollegeSummary } from "@/api/Services/AdminService";
import { RefreshStatus } from "@/components/Common/Skeletons";

/**
 * College-admin dashboard audit: the whole dashboard was a first-run setup guide — quick-action
 * links and a numbered checklist — with no live numbers anywhere. An admin who finished setup
 * months ago gets nothing answering "how many students do we have" without leaving the page.
 *
 * The strip is non-blocking, but failure must still be explicit: silently removing four familiar
 * metrics makes "the API failed" indistinguishable from "this college has no summary".
 */
export default function AtAGlance({ collegeId }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const loadedCollegeRef = useRef(null);
  const requestRef = useRef(0);

  const load = useCallback(async () => {
    if (!collegeId) {
      setSummary(null);
      setError(null);
      setLoading(false);
      loadedCollegeRef.current = null;
      return;
    }
    const request = ++requestRef.current;
    const sameCollege = Number(loadedCollegeRef.current) === Number(collegeId);
    if (!sameCollege) setSummary(null);
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminCollegeSummary(collegeId);
      if (request !== requestRef.current) return;
      const next = res?.data?.data ?? res?.data ?? null;
      if (!next) throw new Error("Summary response was empty");
      setSummary(next);
      loadedCollegeRef.current = collegeId;
    } catch (e) {
      if (request !== requestRef.current) return;
      setError(e?.response?.data?.message || e?.message || "Could not load college summary");
    } finally {
      if (request === requestRef.current) setLoading(false);
    }
  }, [collegeId]);

  useEffect(() => { load(); }, [load]);

  if (!collegeId) return null;

  const stats = [
    { key: "studentCount", label: "Students", icon: <UserOutlined /> },
    { key: "facultyCount", label: "Faculty", icon: <TeamOutlined /> },
    { key: "courseCount", label: "Courses", icon: <BookOutlined /> },
    { key: "activeDriveCount", label: "Active drives", icon: <SolutionOutlined /> },
  ];

  return (
    <section className="admin-dashboard-section admin-dashboard-at-a-glance">
      <div className="admin-dashboard-section__head">
        <h2 className="admin-dashboard-section__title">At a glance</h2>
        {error && summary && <Button size="small" onClick={load} loading={loading}>Retry</Button>}
      </div>
      {error && !summary ? (
        <Alert type="error" showIcon message="Couldn't load college summary" description="The rest of the dashboard is still available."
          action={<Button size="small" onClick={load} loading={loading}>Retry</Button>} />
      ) : (
      <>
      {error && summary && <Alert type="warning" showIcon message="Summary refresh failed"
        description="Showing the last successful college totals." style={{ marginBottom: 12 }} />}
      <Row gutter={[16, 16]}>
        {stats.map((s) => (
          <Col xs={12} sm={6} key={s.key}>
            <Card size="small">
              <Skeleton loading={loading} active paragraph={false} title={{ width: 60 }}>
                <Statistic
                  title={s.label}
                  // A count that could not be resolved shows as a dash rather than 0 — 0 is a
                  // real, meaningful answer ("no active drives right now") and must not be
                  // confused with "this number failed to load".
                  value={summary?.[s.key] != null ? summary[s.key] : "—"}
                  prefix={s.icon}
                />
              </Skeleton>
            </Card>
          </Col>
        ))}
      </Row>
      </>
      )}
    </section>
  );
}
