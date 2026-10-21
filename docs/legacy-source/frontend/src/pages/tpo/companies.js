import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import Link from "next/link";
import { Alert, Button, Card, Col, Empty, List, Row, Skeleton, Table, Tag, Timeline, Typography } from "antd";
import { dj } from "@/components/tpo/dj";
import { recruiterActivity } from "@/components/tpo/ui/recruiterActivity";
import TpoDataTable from "@/components/tpo/TpoDataTable";
import PageShell from "@/components/Common/PageShell";
import { PanelError } from "@/components/Common/PanelStates";
import { DetailSkeleton } from "@/components/Common/Skeletons";
import ListingPageHeader from "@/components/Global/ListingPageHeader/ListingPageHeader";
import { StageTag } from "@/components/tpo/recruiterLeadStages";
import { label } from "@/components/tpo/ui/labels";
import PageStrip from "@/components/tpo/ui/PageStrip";
import RowLink from "@/components/tpo/ui/RowLink";
import { appAction } from "@/redux/store";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { getCompanyDetail, getDriveCounts } from "@/api/Services/TpoHubService";
import CompanyLinkCard from "@/components/tpo/company/CompanyLinkCard";
import TeamConversation from "@/components/tpo/team/TeamConversation";
import useTeamPeople from "@/components/tpo/team/useTeamPeople";

/** Company page (TPO V1 - Locked.docx §3 Companies): people with stages, drives, hired per year, a combined timeline and documents. */
export default function TpoCompany() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { name } = router.query;
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [counts, setCounts] = useState({});
  const [countsLoading, setCountsLoading] = useState(true);
  const [countsError, setCountsError] = useState(null);
  const companyLoadSeqRef = useRef(0);
  const countsLoadSeqRef = useRef(0);

  useEffect(() => { dispatch(appAction.setActiveMenuItem("recruiters")); }, [dispatch]);
  // Clear the previous company's data the instant `name` changes (navigating Acme -> Globex
  // directly used to briefly keep showing Acme's data while Globex loaded), and give a genuine
  // load failure an inline error + Retry instead of only a toast that leaves the page on a
  // permanent skeleton.
  useEffect(() => { setData(null); setError(null); }, [name]);
  const load = () => {
    if (!name) return;
    const requestId = ++companyLoadSeqRef.current;
    fetchWithErrorHandling(getCompanyDetail(name)).then((res) => {
      if (requestId !== companyLoadSeqRef.current) return;
      if (!res.success) { setError(res?.data?.message || res?.data?.error || "Company not found"); return; }
      setError(null);
      setData(res.data);
    });
  };
  useEffect(() => { load(); }, [name]); // eslint-disable-line react-hooks/exhaustive-deps
  // Opened with no company (an old link, a typed address): the list of companies is on Engage; this page only ever waited.
  useEffect(() => { if (router.isReady && !name) router.replace("/tpo/recruiters?view=companies"); }, [router.isReady, name]); // eslint-disable-line react-hooks/exhaustive-deps
  const loadCounts = () => {
    const requestId = ++countsLoadSeqRef.current;
    setCountsLoading(true);
    setCountsError(null);
    fetchWithErrorHandling(getDriveCounts())
      .then((r) => {
        if (requestId !== countsLoadSeqRef.current) return;
        if (!r.success || !Array.isArray(r.data)) {
          setCountsError(r?.data?.message || r?.data?.error || "Could not load drive application counts.");
          return;
        }
        setCounts(Object.fromEntries(r.data.map((count) => [count.jobId, count])));
      })
      .catch((error) => {
        if (requestId !== countsLoadSeqRef.current) return;
        setCountsError(error?.response?.data?.message || error?.message || "Could not load drive application counts.");
      })
      .finally(() => {
        if (requestId === countsLoadSeqRef.current) setCountsLoading(false);
      });
  };
  useEffect(() => { loadCounts(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const employer = useMemo(() => {
    const hires = data?.hiredPerYear || [];
    const totalHires = hires.reduce((sum, row) => sum + (Number(row.hired) || 0), 0);
    const maxHires = Math.max(...hires.map((row) => Number(row.hired) || 0), 1);
    const yearsHiring = hires.filter((row) => (Number(row.hired) || 0) > 0).length;
    const latestActivity = (data?.timeline || []).reduce((latest, item) => {
      if (!item?.createdAt) return latest;
      if (!latest || dj(item.createdAt).isAfter(dj(latest.createdAt))) return item;
      return latest;
    }, null);
    const activeContacts = (data?.people || []).filter((p) => !["NOT_NOW", "RECRUITED"].includes(p.stage)).length;
    return {
      totalHires,
      maxHires,
      yearsHiring,
      latestActivity,
      activeContacts,
      repeatRelationship: (data?.drives?.length || 0) > 1 || yearsHiring > 1,
    };
  }, [data]);

  if (error && !data) return <div className="scroll-container tpo-company-detail"><PageShell><div className="tpo-company-detail__load-state"><PanelError title={error} onRetry={load} /></div></PageShell></div>;
  if (!data) return <div className="scroll-container tpo-company-detail"><PageShell><Card className="tpo-company-detail__loading"><DetailSkeleton label="Loading company details" withMedia={false} /></Card></PageShell></div>;
  return (
    <div className="scroll-container tpo-company-detail" data-testid="tpo.company">
      <PageShell>
        <ListingPageHeader
          className="tpo-company-detail__header"
          title={data.name}
          subtitle={<Typography.Text type="secondary">{employer.repeatRelationship ? "Repeat hiring relationship" : "Recruiter contacts, drives and hiring history"}</Typography.Text>}
          rightContent={<div className="tpo-company-detail__header-actions"><Button onClick={() => router.push(`/tpo/drives/new?company=${encodeURIComponent(data.name)}`)}>Create drive</Button><Button type="primary" onClick={() => router.push(`/tpo/recruiters?add=1&company=${encodeURIComponent(data.name)}`)}>Add contact</Button></div>}
        />

        {countsError && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            message="Drive application counts are unavailable"
            description="Company details are loaded, but Applied/Offers counts could not be verified. Those table cells are shown as unavailable until you retry."
            action={<Button size="small" onClick={loadCounts}>Retry counts</Button>}
          />
        )}

        <PageStrip ariaLabel="Company numbers" items={[
          { key: "contacts", label: `contacts · ${employer.activeContacts} active`, value: data.people.length },
          { key: "drives", label: "drives that ran", value: data.drivesRan ?? data.drives.length },
          { key: "hired", label: "students placed", value: data.studentsHired ?? employer.totalHires, tone: (data.studentsHired ?? employer.totalHires) > 0 ? "good" : undefined },
          { key: "years", label: "years hiring", value: employer.yearsHiring },
          { key: "last", label: employer.latestActivity ? `last activity ${String(employer.latestActivity.type || "activity").replace(/_/g, " ").toLowerCase()}` : "no activity yet", value: employer.latestActivity ? dj(employer.latestActivity.createdAt).format("D MMM") : "-" },
        ]} />
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card className="tpo-company-detail__panel tpo-company-detail__people" title="People">
              <List dataSource={data.people} locale={{ emptyText: "No contacts yet" }} renderItem={(p) => <List.Item><RowLink href={`/tpo/recruiters/${p.id}`} className="tpo-company-detail__person"><List.Item.Meta title={p.name} description={[p.designation || p.email, recruiterActivity(p).text].filter(Boolean).join(" · ")} /></RowLink><StageTag stage={p.stage} /></List.Item>} />
            </Card>
            {(data.hiredPerYear || []).length > 0 && (
              <Card className="tpo-company-detail__panel tpo-company-detail__hiring" title="Students placed, by year" style={{ marginTop: 16 }}>
                <div className="tpo-company-detail__hiring-bars">
                  {data.hiredPerYear.map((row) => {
                    const count = Number(row.hired) || 0;
                    return (
                      <div className="tpo-company-detail__hiring-row" key={row.year}>
                        <span>{row.year}</span>
                        <div><i style={{ width: `${(count * 100) / employer.maxHires}%` }} /></div>
                        <strong>{count}</strong>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
            {data.companyId && <div style={{ marginTop: 16 }}><CompanyLinkCard companyId={data.companyId} companyName={data.name} /></div>}
            <Card className="tpo-company-detail__panel tpo-company-detail__documents" title="Documents" style={{ marginTop: 16 }}>
              <List size="small" dataSource={data.documents} locale={{ emptyText: "Nothing shared yet" }} renderItem={(d) => <List.Item>Applicant list shared {dj(d.createdAt).format("D MMM YYYY")} <Button type="link" onClick={() => router.push(`/tpo/drives/${d.jobId}`)}>Open drive</Button></List.Item>} />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card className="tpo-company-detail__panel tpo-company-detail__drives" title="Drives">
              <TpoDataTable compact searchInUrl={false} testid="company-drives" data={data.drives} rowKey="id" exportName={`${data.name}-drives`}
                emptyTitle="No drives yet" emptySubtitle="Drives with this company show up here." searchOf={(d) => `${d.jobTitle} ${d.year || ""}`}
                onRow={(d) => ({ onClick: () => router.push(`/tpo/drives/${d.id}`) })}
                columns={[{ title: "Role", dataIndex: "jobTitle", render: (v, d) => <Link href={`/tpo/drives/${d.id}`}>{v}</Link> }, { title: "Year", dataIndex: "year", width: 90, render: (v) => v || "-" },
                  { title: "Applied", key: "applied", align: "right", width: 150, exportValue: (d) => counts[d.id]?.applied ?? "",
                    render: (_, d) => (countsLoading
                      ? <Skeleton.Button active size="small" style={{ width: 64 }} />
                      : countsError
                        ? <Typography.Text type="secondary">Unavailable</Typography.Text>
                        : counts[d.id]
                          ? <span>{counts[d.id].applied}{counts[d.id].offers > 0 && <Typography.Text type="secondary"> · {counts[d.id].offers} offers</Typography.Text>}</span>
                          : "-") },
                  { title: "Status", dataIndex: "status", width: 120, exportValue: (d) => label("drive", d.status), render: (v) => <Tag>{label("drive", v)}</Tag> }]} />
            </Card>
            {/* Team module V1: the team's own conversation about this company (one per company), here and in Team. */}
            <Card className="tpo-company-detail__panel tpo-company-detail__team" title="Team" style={{ marginTop: 16 }} data-testid="company.team">
              <CompanyTeam name={data.name} />
            </Card>
            <Card className="tpo-company-detail__panel tpo-company-detail__timeline" title="Timeline" style={{ marginTop: 16 }}>
              {data.timeline.length === 0 ? <Empty description="Nothing logged yet" /> : <Timeline items={data.timeline.map((t) => ({ children: <div><b>{t.person}</b> · {String(t.type).toLowerCase()}{t.note ? `: ${t.note}` : ""}<div><Typography.Text type="secondary">{dj(t.createdAt).format("D MMM, h:mm A")}</Typography.Text></div></div> }))} />}
            </Card>
          </Col>
        </Row>
      </PageShell>
    </div>
  );
}

/** The company's Team conversation, embedded (people for @ and Ask load with it). */
function CompanyTeam({ name }) {
  const { people, meId } = useTeamPeople(true);
  return <TeamConversation embedded about={{ kind: "COMPANY", key: String(name || "").trim().toLowerCase() }} meId={meId} people={people} />;
}
