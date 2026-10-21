import { safeHref } from "@/utils/safeHref";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useDispatch } from "react-redux";
import { Alert, Avatar, Button, Card, Descriptions, Empty, List, Progress, Result, Space, Table, Tabs, Tag, Typography } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import PageShell from "@/components/Common/PageShell";
import { DetailSkeleton } from "@/components/Common/Skeletons";
import ListingPageHeader from "@/components/Global/ListingPageHeader/ListingPageHeader";
import { appAction } from "@/redux/store";
import { getRecruiterCompany, getRecruiterReports, getRecruiterTeam } from "@/api/Services/RecruiterService";
import useRecruiterCollege from "@/components/recruiter/useRecruiterCollege";
import NoCollegeSession from "@/components/recruiter/NoCollegeSession";
import { driveHref, driveStatus } from "@/components/recruiter/recruiterRoutes";

const errorText = (e, fallback) => e?.response?.data?.message || e?.response?.data?.error || fallback;
const STAGE_LABEL = { APPLIED: "Applied", SHORTLISTED: "Shortlisted", ASSESSMENT: "Test", INTERVIEW: "Interview", OFFERED: "Offered", HIRED: "Placed" };

/** Conversion from one funnel stage to the next, as whole percentages. Pure, so the report and its tests agree. */
export function funnelSteps(funnel) {
  const rows = Array.isArray(funnel) ? funnel : [];
  const first = rows.length ? Number(rows[0].count) || 0 : 0;
  return rows.map((r, i) => {
    const count = Number(r.count) || 0;
    const prev = i === 0 ? null : Number(rows[i - 1].count) || 0;
    return { stage: r.stage, label: STAGE_LABEL[r.stage] || r.stage, count, ofAll: first ? Math.round((count / first) * 100) : 0, fromPrev: prev ? Math.round((count / prev) * 100) : null };
  });
}

function useLoaded(fetcher, collegeId) {
  const [state, setState] = useState({ data: null, error: null });
  const load = useCallback(() => {
    if (!collegeId) return;
    setState({ data: null, error: null });
    fetcher(collegeId).then((r) => {
      if (r?.data == null) {
        setState({ data: null, error: "This information was unavailable in the response. Please retry." });
        return;
      }
      setState({ data: r.data, error: null });
    }).catch((e) => setState({ data: null, error: errorText(e, "Could not load this") }));
  }, [fetcher, collegeId]);
  useEffect(() => { load(); }, [load]);
  return { ...state, reload: load };
}

const Section = ({ q, children }) => (q.error ? <Alert type="warning" showIcon message={q.error} action={<Button size="small" icon={<ReloadOutlined />} onClick={q.reload}>Retry</Button>} /> : q.data === null ? <DetailSkeleton label="Loading company workspace" withMedia={false} /> : children);

function CompanyTab({ collegeId, user }) {
  const q = useLoaded(getRecruiterCompany, collegeId);
  return (
    <Section q={q}>
      <Card className="recruiter-company__card" data-testid="recruiter.company.profile">
        <Space align="start" size={16}>
          <Avatar shape="square" size={64} src={q.data?.logoUrl || undefined}>{(q.data?.name || user?.companyName || "?").slice(0, 1)}</Avatar>
          <div>
            <Typography.Title level={4} style={{ margin: 0 }}>{q.data?.name || user?.companyName || "Your company"}</Typography.Title>
            <div>
              {q.data?.verifiedBy42 ? <Tag color="green">Verified</Tag> : null}
              {q.data?.domains ? <Typography.Text type="secondary">{String(q.data.domains).split(", ").map((d) => `@${d}`).join(", ")}</Typography.Text> : null}
            </div>
            {q.data?.industry && <div><Typography.Text type="secondary">{q.data.industry}</Typography.Text></div>}
            {q.data?.website && <div>{safeHref(q.data.website) ? <a href={safeHref(q.data.website)} target="_blank" rel="noreferrer">{q.data.website}</a> : q.data.website}</div>}
          </div>
        </Space>
        <Typography.Paragraph type="secondary" style={{ margin: "16px 0 0" }}>{q.data?.domains ? `Colleges see this profile. Colleagues who sign in with a work email at ${String(q.data.domains).split(", ").map((d) => `@${d}`).join(" or ")} join it.` : "Colleges see this profile. Your company comes from your work email."} To change the name or logo, ask the placement cell.</Typography.Paragraph>
      </Card>
    </Section>
  );
}

function TeamTab({ collegeId }) {
  const q = useLoaded(getRecruiterTeam, collegeId);
  const teamKnown = Array.isArray(q.data);
  return (
    <Section q={q}>
      {!teamKnown ? (
        <Alert type="warning" showIcon message="Team data is incomplete" description="The team list could not be verified, so it is not being shown as empty." action={<Button size="small" onClick={q.reload}>Retry</Button>} />
      ) : <Card className="recruiter-company__card" data-testid="recruiter.company.team">
        <Typography.Paragraph type="secondary">Colleagues from your company who work with this college. To add one, ask the placement cell to invite them with their work email; the placement cell decides who gets access.</Typography.Paragraph>
        <List dataSource={Array.isArray(q.data) ? q.data : []} locale={{ emptyText: <Empty description="Only you so far" /> }} renderItem={(m) => (
          <List.Item>
            <List.Item.Meta avatar={<Avatar>{(m.firstName || "?").slice(0, 1)}</Avatar>} title={<span>{[m.firstName, m.lastName].filter(Boolean).join(" ")}{m.you && <Tag style={{ marginLeft: 8 }}>You</Tag>}</span>} description={[m.designation, m.email].filter(Boolean).join(" · ")} />
            <Typography.Text type="secondary">{m.drives} drive{m.drives === 1 ? "" : "s"} here</Typography.Text>
          </List.Item>
        )} />
      </Card>}
    </Section>
  );
}

function ReportsTab({ collegeId }) {
  const router = useRouter();
  const q = useLoaded(getRecruiterReports, collegeId);
  const reportsKnown = Boolean(q.data && Array.isArray(q.data.drives) && Array.isArray(q.data.funnel));
  const drives = reportsKnown ? q.data.drives : [];
  const combined = funnelSteps(reportsKnown ? q.data.funnel : []);
  const offerCount = (d, key) => (d?.offers && Number.isFinite(Number(d.offers[key])) ? Number(d.offers[key]) : null);
  return (
    <Section q={q}>
      {!reportsKnown ? (
        <Alert type="warning" showIcon message="Report data is incomplete" description="Drive and funnel totals could not be verified, so missing values are not being treated as zero." action={<Button size="small" onClick={q.reload}>Retry</Button>} />
      ) : drives.length === 0 ? <Empty description="Reports appear once you have a drive with applicants." /> : (
        <Space direction="vertical" size={16} className="recruiter-company__reports" data-testid="recruiter.company.reports">
          <Card title="All your drives at this college">
            {combined.filter((s) => !(s.stage === "ASSESSMENT" && s.count === 0)).map((s) => (
              <div key={s.stage} className="recruiter-funnel__row">
                <span className="recruiter-funnel__label">{s.label}</span>
                <Progress percent={s.ofAll} showInfo={false} size="small" />
                <span className="recruiter-funnel__num">{s.count}{s.stage !== "APPLIED" ? <Typography.Text type="secondary"> · {s.ofAll}% of applied</Typography.Text> : null}</span>
              </div>
            ))}
          </Card>
          <Table size="small" rowKey="jobId" dataSource={drives} pagination={false} onRow={(d) => ({ onClick: () => router.push(driveHref(d.jobId)), style: { cursor: "pointer" } })}
            columns={[
              // BE-0172: the drive name is a real link (a tab stop for keyboard users); the row click stays for the mouse.
              { title: "Drive", key: "t", render: (_, d) => <span><Link href={driveHref(d.jobId)} onClick={(ev) => ev.stopPropagation()}>{d.title}</Link> <Tag color={driveStatus(d.lifecycle).color}>{driveStatus(d.lifecycle).label}</Tag></span> },
              { title: "Applied", key: "a", render: (_, d) => d.funnel?.[0]?.count ?? <Typography.Text type="secondary">Unavailable</Typography.Text> },
              { title: "Offered", key: "o", render: (_, d) => {
                const values = ["awaiting", "accepted", "declined"].map((k) => offerCount(d, k));
                return values.some((v) => v == null) ? <Typography.Text type="secondary">Unavailable</Typography.Text> : values.reduce((sum, v) => sum + v, 0);
              } },
              { title: "Accepted", key: "ac", render: (_, d) => offerCount(d, "accepted") ?? <Typography.Text type="secondary">Unavailable</Typography.Text> },
              { title: "Declined", key: "de", render: (_, d) => offerCount(d, "declined") ?? <Typography.Text type="secondary">Unavailable</Typography.Text> },
              { title: "Joined", key: "j", render: (_, d) => offerCount(d, "joined") ?? <Typography.Text type="secondary">Unavailable</Typography.Text> },
            ]} />
        </Space>
      )}
    </Section>
  );
}

/** Company & Team: how the company appears here, the recruiter's colleagues at this college, and funnel reports. */
export default function RecruiterCompanyPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const college = useRecruiterCollege();
  const requested = typeof router.query.tab === "string" ? router.query.tab : "company";
  const tab = ["company", "team", "reports"].includes(requested) ? requested : "company";

  useEffect(() => { dispatch(appAction.setActiveMenuItem("company")); }, [dispatch]);

  const shell = (node) => <div className="scroll-container recruiter-company recruiter-company--state"><PageShell>{node}</PageShell></div>;
  if (college.error) return shell(<Result status="warning" title="We couldn't load your account" extra={<Button icon={<ReloadOutlined />} onClick={college.reload}>Retry</Button>} />);
  if (college.needsCollege) return shell(<NoCollegeSession />);
  if (college.loading) return shell(<DetailSkeleton label="Loading company access" withMedia={false} />);

  return (
    <div className="scroll-container recruiter-company" data-testid="recruiter.company">
      <PageShell>
        <ListingPageHeader
          className="recruiter-company__header"
          title="Company & Team"
          rightContent={<Button onClick={() => router.push("/recruiter/profile")}>Your profile</Button>}
        />
        <Card className="recruiter-company__workspace">
          <Tabs activeKey={tab} onChange={(k) => router.replace({ pathname: router.pathname, query: { tab: k } }, undefined, { shallow: true })} destroyInactiveTabPane items={[
            { key: "company", label: "Company", children: <CompanyTab collegeId={college.collegeId} user={college.user} /> },
            { key: "team", label: "Team", children: <TeamTab collegeId={college.collegeId} /> },
            { key: "reports", label: "Reports", children: <ReportsTab collegeId={college.collegeId} /> },
          ]} />
        </Card>
      </PageShell>
    </div>
  );
}
