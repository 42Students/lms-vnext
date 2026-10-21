import { useEffect, useState } from "react";
import { label } from "../ui/labels";
import { Alert, Button, Card, Col, Descriptions, Form, Input, List, Popconfirm, Row, Select, Space, Statistic, Table, Tag, Typography, message } from "antd";
import { dj } from "@/components/tpo/dj";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { getEligibilityPreview, getStudentsTable, removeEligibilityOverride, sendMessage, setEligibilityOverride } from "@/api/Services/TpoHubService";
import DrivePipeline from "./DrivePipeline";
import PageStrip from "../ui/PageStrip";
import { safeHref } from "@/utils/safeHref";
import AsyncModal from "@/components/tpo/ui/AsyncModal";

const show = (v) => (v === null || v === undefined || v === "" ? "empty" : typeof v === "object" ? JSON.stringify(v) : String(v));
/** The fields the TPO compares when a recruiter sends a request again. */
function changedFields(prev, job) {
  const now = { jobTitle: job.jobTitle, jobDescription: job.jobDescription, location: job.location, roleOptions: job.roleOptionsJson, eligibility: job.eligibilityJson, applicationDeadline: job.applicationDeadline };
  const labels = { jobTitle: "Role", jobDescription: "Description", location: "Location", roleOptions: "Pay packages", eligibility: "Eligibility", applicationDeadline: "Deadline" };
  return Object.keys(labels).filter((k) => show(prev[k]) !== show(now[k])).map((k) => ({ label: labels[k], before: show(prev[k]), after: show(now[k]) }));
}
const fmt = (v) => (v === null || v === undefined || v === "" ? "Not set" : String(v));

/** Overview tab (TPO V1 - Locked.docx §5): details, eligibility with eligible and applied by branch, include/exclude list with reasons, key numbers and activity. */
export default function OverviewTab({ job, summary, activity, applicants, notApplied, reload, readOnly, onNavigateToTab }) {
  const [elig, setElig] = useState(null);
  const [eligError, setEligError] = useState(false);
  const loadElig = () => fetchWithErrorHandling(getEligibilityPreview(job.id)).then((r) => { setEligError(!r.success); if (r.success) setElig(r.data || null); });
  const [adding, setAdding] = useState(false);
  const [followingUp, setFollowingUp] = useState(false);
  const [followUpNote, setFollowUpNote] = useState("");
  const [students, setStudents] = useState([]);
  const [form] = Form.useForm();
  const openAdd = async () => {
    form.resetFields();
    setAdding(true);
    if (students.length === 0) {
      const r = await fetchWithErrorHandling(getStudentsTable());
      setStudents((r.data?.students || []).map((s) => ({ value: s.learnerId, label: `${s.firstName} ${s.lastName || ""} · ${s.rollNumber || ""}` })));
    }
  };
  const saveOverride = async () => {
    const v = await form.validateFields();
    const res = await fetchWithErrorHandling(setEligibilityOverride(job.id, v));
    if (!res.success) { message.error(res?.data?.message || res?.data?.error || "Could not save"); return; }
    setAdding(false);
    loadElig();
    reload?.();
  };
  useEffect(() => { loadElig(); }, [job.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const rules = job.eligibilityJson || {};
  const ruleBits = [
    rules.minCgpa != null && `CGPA ${rules.minCgpa}+`, rules.minPctThroughout != null && `${rules.minPctThroughout}% throughout`,
    rules.tenthMinPct != null && `10th ${rules.tenthMinPct}%+`, rules.twelfthMinPct != null && `12th ${rules.twelfthMinPct}%+`,
    rules.diplomaMinPct != null && `Diploma ${rules.diplomaMinPct}%+`, rules.ugMinPct != null && `UG ${rules.ugMinPct}%+`, rules.pgMinPct != null && `PG ${rules.pgMinPct}%+`,
    rules.gender && `${rules.gender} only`, rules.verifiedMarksOnly && "verified marks only", Array.isArray(rules.branches) && rules.branches.length > 0 && `branches: ${rules.branches.join(", ")}`,
    Array.isArray(rules.passingYears) && rules.passingYears.length > 0 && `passing year ${rules.passingYears.join(", ")}`,
  ].filter(Boolean);
  const applied = Object.fromEntries((summary?.appliedByBranch || []).map((b) => [b.branch, b.applied]));
  const branchRows = Object.entries(elig?.eligibleByBranch || {}).map(([branch, eligible]) => ({ branch, eligible, applied: applied[branch] || 0 }));
  const options = Array.isArray(job.roleOptionsJson) ? job.roleOptionsJson : [];

  return (
    <Space className="tpo-drive-overview" direction="vertical" style={{ width: "100%" }} size="large">
      {/* The pipeline and the applied numbers live in the journey strip on Applicants; here, who the rules let in. */}
      <Typography.Paragraph type="secondary" className="tpo-drive-overview__elig-line" data-testid="drive.about.eligible">
        {elig ? `${elig.eligible} students meet the rules (${applicants.length + notApplied.length} of them registered for placements and can apply now)${elig.excluded ? `; ${elig.excluded} are kept out by the rules` : ""}.` : eligError ? "Couldn't work out who is eligible." : "Working out who is eligible…"}
      </Typography.Paragraph>
      {job.lifecycleStatus === "CLOSED" && summary?.closedSummary && (
        <Card className="tpo-drive-overview__panel tpo-drive-overview__closed" title="Closed drive summary" data-testid="drive.closed-summary">
          <Typography.Paragraph type="secondary">Closed {dj(summary.closedSummary.closedAt).format("D MMM YYYY, h:mm A")} · read only</Typography.Paragraph>
          <Row gutter={[16, 16]}>
            <Col xs={12} md={6}><Statistic title="Applicants" value={summary.closedSummary.applicants} /></Col>
            {(summary.closedSummary.byStatus || []).map((b) => (
              <Col xs={12} md={6} key={b.status}><Statistic title={label("stage", b.status)} value={b.c} /></Col>
            ))}
          </Row>
          {(summary.closedSummary.rounds || []).length > 0 && (
            <Table style={{ marginTop: 16 }} size="small" pagination={false} rowKey="seq" dataSource={summary.closedSummary.rounds}
              columns={[{ title: "Round", dataIndex: "name" }, { title: "Passed", dataIndex: "passed" }, { title: "Failed", dataIndex: "failed" }, { title: "Absent", dataIndex: "absent" }, { title: "Waitlisted", dataIndex: "waitlisted" }]} />
          )}
          {(summary.closedSummary.offers || []).length > 0 && (
            <div style={{ marginTop: 12 }}><Typography.Text strong>Offers: </Typography.Text>
              <Space wrap>{summary.closedSummary.offers.map((o) => <Tag key={o.status}>{label("offer", o.status)}: {o.c}</Tag>)}</Space>
            </div>
          )}
          {job.recruiterId && !summary?.recruiter?.accessEnded && (
            <Button style={{ marginTop: 16 }} disabled={readOnly} onClick={() => { setFollowUpNote(""); setFollowingUp(true); }}>Follow up with the recruiter</Button>
          )}
        </Card>
      )}
      {summary?.recruiter && (
        <Card className="tpo-drive-overview__panel tpo-drive-overview__recruiter" title="Recruiter">
          <Space wrap>
            <b>{summary.recruiter.name}</b>
            <Typography.Text type="secondary">{[summary.recruiter.designation, summary.recruiter.company].filter(Boolean).join(" · ")}</Typography.Text>
            {summary.recruiter.verification === "PENDING" && <Tag color="orange">Unverified</Tag>}
            {summary.recruiter.agencyFor && <Tag color="purple">Agency for {summary.recruiter.agencyFor}</Tag>}
            {summary.recruiter.recruiterLeadId && <a href={`/tpo/recruiters/${summary.recruiter.recruiterLeadId}`}>Open recruiter</a>}
          </Space>
          <div><Typography.Text type="secondary">{summary.recruiter.email || ""} {summary.recruiter.phone || ""}</Typography.Text></div>
          {summary.recruiter.accessEnded && <Alert style={{ marginTop: 8 }} type="warning" showIcon message="Recruiter access ended. Finish this drive yourself." />}
        </Card>
      )}
      {summary?.previousRequest && job.recruiterId && ["REQUEST", "DRAFT"].includes(job.lifecycleStatus) && (
        <Card className="tpo-drive-overview__panel tpo-drive-overview__changes" title="What changed since the last request" size="small">
          {changedFields(summary.previousRequest, job).length === 0 ? <Typography.Text type="secondary">Nothing that we compare changed.</Typography.Text> : (
            <List size="small" dataSource={changedFields(summary.previousRequest, job)} renderItem={(c) => <List.Item><b>{c.label}:</b>&nbsp;<Typography.Text delete type="secondary">{c.before}</Typography.Text>&nbsp;to&nbsp;<Tag color="blue">{c.after}</Tag></List.Item>} />
          )}
        </Card>
      )}
      <Card className="tpo-drive-overview__panel tpo-drive-overview__details" title="Drive details">
        <Descriptions bordered size="small" column={{ xs: 1, md: 2 }}>
          <Descriptions.Item label="Company">{job.companyName}</Descriptions.Item>
          <Descriptions.Item label="Role">{job.jobTitle}</Descriptions.Item>
          <Descriptions.Item label="CTC">{fmt(job.ctcRange)}</Descriptions.Item>
          <Descriptions.Item label="Category">{fmt(job.category)}{job.categoryOverrideReason ? ` (overridden: ${job.categoryOverrideReason})` : ""}</Descriptions.Item>
          <Descriptions.Item label="Mode">{{ ON_CAMPUS: "On campus", POOL: `Pool at ${job.hostCollegeName || "another college"}`, OFF_CAMPUS: "Off campus (students apply on the company's site)" }[job.driveMode] || job.driveMode}</Descriptions.Item>
          <Descriptions.Item label="Application deadline">{job.applicationDeadline ? dj(job.applicationDeadline).format("D MMM YYYY, h:mm A") : "Not set"}</Descriptions.Item>
          {job.driveMode === "POOL" && <Descriptions.Item label="Reporting">{job.reportingAt ? dj(job.reportingAt).format("D MMM, h:mm A") : "Not set"}{job.travelNote ? ` · ${job.travelNote}` : ""}</Descriptions.Item>}
          {job.driveMode === "OFF_CAMPUS" && <Descriptions.Item label="Company link">{safeHref(job.externalApplyUrl) ? <a href={safeHref(job.externalApplyUrl)} target="_blank" rel="noreferrer">{job.externalApplyUrl}</a> : job.externalApplyUrl || "Not set"}</Descriptions.Item>}
          {job.requiresExternalRegistration && <Descriptions.Item label="Company portal">{job.externalPortalName || "Portal"} {safeHref(job.externalPortalUrl) ? <a href={safeHref(job.externalPortalUrl)} target="_blank" rel="noreferrer">open</a> : null}</Descriptions.Item>}
          <Descriptions.Item label="Recruiter">{job.recruiterId ? "Recruiter has a login" : "No recruiter login (you run this drive)"}</Descriptions.Item>
        </Descriptions>
        {options.length > 0 && (
          <Table style={{ marginTop: 12 }} size="small" pagination={false} rowKey="name" dataSource={options}
            columns={[{ title: "Package", dataIndex: "name" }, { title: "CTC (LPA)", dataIndex: "ctcLpa" }, { title: "Fixed", dataIndex: "fixedLpa", render: fmt }, { title: "Variable", dataIndex: "variableLpa", render: fmt }]} />
        )}
      </Card>
      <Card className="tpo-drive-overview__panel tpo-drive-overview__eligibility" title="Eligibility">
        {eligError && <Alert style={{ marginBottom: 12 }} type="error" showIcon message="Eligible and excluded counts could not be loaded." action={<Button size="small" onClick={loadElig}>Retry</Button>} />}
        <Typography.Paragraph>{ruleBits.length ? ruleBits.join(" · ") : "No eligibility rules set: every registered student is eligible."}</Typography.Paragraph>
        <Typography.Paragraph type="secondary">Students with a missing value count as eligible and are flagged &quot;Not provided&quot;.</Typography.Paragraph>
        {branchRows.length > 0 && <Table size="small" pagination={false} rowKey="branch" dataSource={branchRows} columns={[{ title: "Branch", dataIndex: "branch" }, { title: "Eligible", dataIndex: "eligible" }, { title: "Applied", dataIndex: "applied" }]} />}
        {(elig?.excludedStudents || []).length > 0 && (
          <List style={{ marginTop: 12 }} size="small" header={<b>Excluded by rules ({elig.excluded})</b>} dataSource={elig.excludedStudents.slice(0, 15)}
            renderItem={(s) => <List.Item>{s.name} · {s.roll} <Space wrap size={4} style={{ marginLeft: 8 }}>{s.reasons.map((r) => <Tag key={r} color="red">{r}</Tag>)}</Space></List.Item>} />
        )}
        <List style={{ marginTop: 12 }} size="small" header={<Space><b>Included or excluded by hand</b><Button size="small" disabled={readOnly} onClick={openAdd}>Add or exclude a student</Button></Space>}
          locale={{ emptyText: "No one added or excluded by hand" }} dataSource={summary?.overrides || []}
          renderItem={(o) => (
            // A manual eligibility override is a real decision - reversing one used to happen
            // through a plain link with no confirmation and no failure feedback at all.
            <List.Item actions={[
              <Popconfirm key="r" title="Remove this override?" description={o.type === "INCLUDE" ? "They will go back to being excluded by the normal rules." : "They will go back to being eligible under the normal rules."} okText="Remove" okButtonProps={{ danger: true }}
                onConfirm={async () => {
                  const res = await fetchWithErrorHandling(removeEligibilityOverride(job.id, o.learnerId));
                  if (!res.success) { message.error(res?.data?.message || res?.data?.error || "Could not remove"); return; }
                  reload?.();
                  loadElig();
                }}>
                <a>Remove</a>
              </Popconfirm>,
            ]}>
              <Tag color={o.type === "INCLUDE" ? "green" : "red"}>{o.type === "INCLUDE" ? "Added by college" : "Excluded"}</Tag>{o.firstName} {o.lastName || ""}: {o.reason}
            </List.Item>
          )} />
      </Card>
      <Card className="tpo-drive-overview__panel tpo-drive-overview__activity" title="Activity">
        <List size="small" dataSource={activity} locale={{ emptyText: "Nothing has happened on this drive yet" }}
          renderItem={(a) => <List.Item>{String(a.action).replace(/_/g, " ").toLowerCase()}{a.detail ? `: ${a.detail}` : ""} <Typography.Text type="secondary" style={{ marginLeft: 8 }}>{dj(a.createdAt).format("D MMM, h:mm A")}</Typography.Text></List.Item>} />
      </Card>
      <AsyncModal open={adding} title="Add or exclude one student" onCancel={() => setAdding(false)} onOk={saveOverride} okText="Save" destroyOnClose>
        <Typography.Paragraph type="secondary">Use this when the company agreed to see a student who does not meet the rules, or when you need to keep one out. The reason is logged, and the recruiter sees &quot;Added by college: reason&quot;.</Typography.Paragraph>
        <Form form={form} layout="vertical" initialValues={{ type: "INCLUDE" }}>
          <Form.Item name="learnerId" label="Student" rules={[{ required: true }]}><Select showSearch optionFilterProp="label" options={students} /></Form.Item>
          <Form.Item name="type" label="What to do"><Select options={[{ value: "INCLUDE", label: "Add: they can apply" }, { value: "EXCLUDE", label: "Exclude: they cannot apply" }]} /></Form.Item>
          <Form.Item name="reason" label="Reason" rules={[{ required: true, min: 3, message: "Give a reason" }]}><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </AsyncModal>
      <AsyncModal open={followingUp} title="Follow up with the recruiter" okText="Send" onCancel={() => setFollowingUp(false)}
        onOk={async () => {
          const res = await fetchWithErrorHandling(sendMessage({ jobId: job.id, body: followUpNote.trim() }));
          if (!res.success) { message.error(res?.data?.message || "Could not send"); return; }
          setFollowingUp(false); message.success("Sent");
        }} okButtonProps={{ disabled: followUpNote.trim().length < 3 }}>
        <Typography.Paragraph type="secondary">Sent to {summary?.recruiter?.name || "the recruiter"} in this drive&apos;s message thread.</Typography.Paragraph>
        <Input.TextArea rows={3} value={followUpNote} onChange={(e) => setFollowUpNote(e.target.value)} placeholder="e.g. Thanks for a great drive — how did the joining go?" />
      </AsyncModal>
    </Space>
  );
}
