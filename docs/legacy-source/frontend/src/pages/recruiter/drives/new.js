import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useDispatch } from "react-redux";
import { Alert, Button, Card, Form, Input, InputNumber, Modal, Result, Select, Skeleton, Tag, Typography, message } from "antd";
import PageShell from "@/components/Common/PageShell";
import { DetailSkeleton } from "@/components/Common/Skeletons";
import ListingPageHeader from "@/components/Global/ListingPageHeader/ListingPageHeader";
import { appAction } from "@/redux/store";
import { getCollegeOverview, listDriveRequests, planDrive, resubmitDriveRequest } from "@/api/Services/RecruiterService";
import JdUpload from "@/components/tpo/JdUpload";
import useRecruiterCollege from "@/components/recruiter/useRecruiterCollege";
import NoCollegeSession from "@/components/recruiter/NoCollegeSession";
import { applyServerFieldErrors, getServerFormError } from "@/utils/formErrors";
import { descriptionHtml, descriptionText } from "@/utils/driveDescription";

const errorText = (e, fallback) => e?.response?.data?.message || e?.response?.data?.error || fallback;
const draftKey = (owner, collegeId) => `recruiter-drive-draft:${owner ?? "unknown"}:${collegeId}`;
/** Job types a recruiter can ask for; the placement cell can change it. An internship offer never counts as placed. */
export const JOB_TYPES = ["Full-time", "Internship", "Internship + full-time"];
const hasInternship = (t) => String(t || "").startsWith("Internship");
const EMPTY_FIELDS = { jobTitle: undefined, jobDescription: undefined, jdUrl: undefined, location: undefined, driveMode: "ON_CAMPUS", jobType: "Full-time", stipendPerMonth: undefined, ctcLpa: undefined, fixedLpa: undefined, variableLpa: undefined, minCgpa: undefined, branches: undefined, passingYears: undefined };

/** True once the recruiter has changed anything from a blank form. The default "On campus" does not count as typing. */
export function hasTypedContent(values) {
  return Object.entries(values || {}).some(([k, v]) => {
    if (v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0)) return false;
    if (k === "driveMode") return v !== "ON_CAMPUS";
    if (k === "jobType") return v !== "Full-time";
    return true;
  });
}

/** The DriveForm the backend takes, from the fields on this page. Pure, so create and resend send the same thing. */
export const ROUND_PRESETS = [
  { label: "Test, Technical, HR", rounds: [["TEST", "Aptitude test"], ["INTERVIEW", "Technical interview"], ["INTERVIEW", "HR interview"]] },
  { label: "Talk, Test, Interview", rounds: [["TALK", "Company talk"], ["TEST", "Online test"], ["INTERVIEW", "Interview"]] },
  { label: "Test, Group discussion, Interview", rounds: [["TEST", "Written test"], ["GD", "Group discussion"], ["INTERVIEW", "Interview"]] },
];
const ROUND_KIND_OPTIONS = [{ value: "TALK", label: "Company talk" }, { value: "TEST", label: "Test" }, { value: "VENDOR_TEST", label: "Vendor test" }, { value: "GD", label: "Group discussion" }, { value: "INTERVIEW", label: "Interview" }];

/** Only rounds with a name go out; the placement cell sets dates and venues. */
export const cleanRounds = (rounds) => (rounds || []).filter((r) => r && r.name && r.name.trim()).map((r) => ({ kind: r.kind, name: r.name.trim() }));

export function buildDriveForm(v, rounds) {
  const sent = cleanRounds(rounds);
  return {
    ...(sent.length ? { rounds: sent } : {}),
    jobTitle: v.jobTitle,
    jobDescription: v.jobDescription ? descriptionHtml(v.jobDescription) : undefined,
    jdUrl: v.jdUrl || undefined,
    location: v.location || undefined,
    driveMode: v.driveMode || "ON_CAMPUS",
    jobType: v.jobType || undefined,
    roleOptions: [{
      name: "Default", ctcLpa: v.ctcLpa ?? undefined, fixedLpa: v.fixedLpa || undefined, variableLpa: v.variableLpa || undefined,
      stipendPerMonth: hasInternship(v.jobType) ? v.stipendPerMonth || undefined : undefined,
    }],
    eligibility: {
      minCgpa: v.minCgpa || undefined,
      branches: Array.isArray(v.branches) && v.branches.length ? v.branches.map((b) => String(b).trim()).filter(Boolean) : undefined,
      passingYears: Array.isArray(v.passingYears) && v.passingYears.length ? v.passingYears.map(Number).filter((y) => y >= 2000 && y <= 2100) : undefined,
    },
  };
}

// Plain text from a description that may be rich text, or stored escaped: shared with the TPO's drive form
// (src/utils/driveDescription.js), and still exported here for older imports.
export { descriptionText };

/** Fields restored from an earlier request of the recruiter's own ("hire again"). */
export function valuesFromRequest(r) {
  return {
    jobTitle: r.roleTitle, jobDescription: descriptionText(r.description), jdUrl: r.jdUrl, location: r.location, ctcLpa: r.ctcLpa, fixedLpa: r.fixedLpa, variableLpa: r.variableLpa,
    minCgpa: r.minCgpa, branches: r.branches || undefined, passingYears: (r.passingYears || []).map(String), driveMode: r.driveMode || "ON_CAMPUS",
    jobType: JOB_TYPES.includes(r.jobType) ? r.jobType : "Full-time", stipendPerMonth: r.stipendPerMonth ?? undefined,
  };
}

/**
 * Request a drive at this college. One screen, saved as a draft in this browser as you type, with a live view of what
 * students will see. "Hire again" starts from an earlier drive. Nothing is ever sent back: the placement cell asks for changes on the drive.
 */
function RecruiterRequestDriveBody() {
  const router = useRouter();
  const dispatch = useDispatch();
  const college = useRecruiterCollege();
  const [form] = Form.useForm();
  const [rounds, setRounds] = useState([]);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [result, setResult] = useState(null);
  const [source, setSource] = useState({ state: "idle", request: null, mode: "new" });
  const [restored, setRestored] = useState(false);
  const [initial, setInitial] = useState({});
  const [overview, setOverview] = useState(null);
  const [overviewError, setOverviewError] = useState(null);
  const [dirty, setDirty] = useState(false);
  const saveTimer = useRef(null);
  const submitAttemptRef = useRef(false);
  const watched = Form.useWatch([], form);
  const values = useMemo(() => watched || {}, [watched]);

  useEffect(() => { dispatch(appAction.setActiveMenuItem("drives")); }, [dispatch]);

  // "Fix and resend" is gone (N14): an old ?fix= link opens the drive's Requests tab instead.
  useEffect(() => { if (router.isReady && router.query.fix) router.replace(`/recruiter/drives/${Number(router.query.fix)}?tab=messages`); }, [router.isReady, router.query.fix]); // eslint-disable-line react-hooks/exhaustive-deps
  const fromId = router.isReady && router.query.from ? Number(router.query.from) : null;
  // Edit a request of their own that is still in review (not something the placement cell asked for: that is answered on the drive).
  const editId = router.isReady && router.query.edit ? Number(router.query.edit) : null;

  // Start from an earlier request, or restore the unsent draft.
  useEffect(() => {
    if (!college.collegeId || !router.isReady) return;
    const targetId = editId || fromId;
    if (targetId) {
      const mode = editId ? "edit" : "again";
      setSource({ state: "loading", request: null, mode });
      listDriveRequests(college.collegeId).then((r) => {
        const found = (Array.isArray(r?.data) ? r.data : []).find((x) => x.id === targetId);
        // Only a request still in review can be edited; anything else starts a new one from it.
        if (!found || (mode === "edit" && !found.canResubmit)) { setSource({ state: "missing", request: null, mode }); return; }
        setInitial(valuesFromRequest(found));
        setSource({ state: "ready", request: found, mode });
      }).catch(() => setSource({ state: "error", request: null, mode }));
      return;
    }
    try {
      const saved = JSON.parse(window.localStorage.getItem(draftKey(college.user?.id, college.collegeId)) || "null");
      if (saved?.values && Object.keys(saved.values).length) {
        setInitial(saved.values);
        setRounds(Array.isArray(saved.rounds) ? saved.rounds : []);
        setRestored(true);
      }
    } catch (_) { /* no usable draft */ }
    setSource({ state: "ready", request: null, mode: "new" });
  }, [college.collegeId, college.user, router.isReady, fromId, editId]);

  const loadOverview = useCallback(() => {
    if (!college.collegeId) return;
    setOverviewError(null);
    getCollegeOverview(college.collegeId)
      .then((r) => {
        setOverview(r?.data ?? null);
        setOverviewError(null);
      })
      .catch((error) => {
        // Overview only powers approximate student counts and branch suggestions. The form remains
        // usable with free-form branch tags, but missing overview data must not look like a verified
        // zero-student/no-branch college.
        setOverviewError(errorText(error, "Could not load college eligibility suggestions."));
      });
  }, [college.collegeId]);
  useEffect(() => { loadOverview(); }, [loadOverview]);

  // The autosave reads the latest screen through a ref: the effect cleanup below runs with an older closure, and
  // writing that older state back re-saved a draft right after Send or Start over cleared it.
  const sentRef = useRef(false);
  const draftStateRef = useRef(null);
  draftStateRef.current = { values, rounds, mode: source.mode, state: source.state, collegeId: college.collegeId, userId: college.user?.id, result };
  const persistDraftNow = useCallback(() => {
    const d = draftStateRef.current;
    if (sentRef.current || !d || d.mode !== "new" || d.state !== "ready" || !d.collegeId || d.result) return;
    try {
      if (hasTypedContent(d.values) || cleanRounds(d.rounds).length) {
        window.localStorage.setItem(draftKey(d.userId, d.collegeId), JSON.stringify({ values: d.values, rounds: d.rounds }));
      } else {
        window.localStorage.removeItem(draftKey(d.userId, d.collegeId));
      }
    } catch (_) { /* storage blocked: the draft is simply not kept */ }
  }, []);

  // Save shortly after changes, and synchronously on page hide so a quick Back/navigation within
  // the debounce window cannot discard the most recent keystrokes.
  useEffect(() => {
    if (source.mode !== "new" || source.state !== "ready" || !college.collegeId || result) return undefined;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(persistDraftNow, 600);
    const onPageHide = () => persistDraftNow();
    window.addEventListener("pagehide", onPageHide);
    return () => {
      clearTimeout(saveTimer.current);
      persistDraftNow();
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [persistDraftNow, values, rounds, source.mode, source.state, college.collegeId, result]);

  const clearDraft = useCallback(() => { try { window.localStorage.removeItem(draftKey(college.user?.id, college.collegeId)); } catch (_) { /* nothing to clear */ } }, [college.collegeId, college.user]);

  const startOverNow = () => {
    form.setFieldsValue(EMPTY_FIELDS);
    setRounds([]);
    setRestored(false);
    setDirty(false);
    clearDraft();
  };
  const startOver = () => {
    if (!hasTypedContent(values) && cleanRounds(rounds).length === 0) {
      startOverNow();
      return;
    }
    Modal.confirm({
      title: "Discard this drive draft?",
      content: "The role, eligibility and round changes on this screen will be cleared.",
      okText: "Discard draft",
      okButtonProps: { danger: true },
      cancelText: "Keep editing",
      onOk: startOverNow,
    });
  };

  const leaveToDrives = () => {
    // Brand-new requests are persisted locally as the user types. Fix/resend and Hire again are
    // derived from an existing request and are not auto-saved, so protect those edits explicitly.
    if (source.mode === "new") {
      persistDraftNow();
      router.push("/recruiter/drives");
      return;
    }
    if (!dirty) {
      router.push("/recruiter/drives");
      return;
    }
    Modal.confirm({
      title: "Leave without these changes?",
      content: source.mode === "edit" ? "Your changes to this request will be lost." : "Your changes to this Hire again request will be lost.",
      okText: "Leave and discard",
      okButtonProps: { danger: true },
      cancelText: "Keep editing",
      onOk: () => router.push("/recruiter/drives"),
    });
  };

  useEffect(() => {
    if (source.mode === "new" || !dirty) return undefined;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, source.mode]);

  const submit = async (validatedValues = null) => {
    if (busy || submitAttemptRef.current) return;
    submitAttemptRef.current = true;
    let v = validatedValues;
    if (!v) {
      try {
        v = await form.validateFields();
      } catch (error) {
        submitAttemptRef.current = false;
        if (error?.errorFields?.length) {
          form.scrollToField(error.errorFields[0].name, { behavior: "smooth", block: "center" });
        }
        return;
      }
    }
    const body = buildDriveForm(v, rounds);
    setSubmitError("");
    setBusy(true);
    try {
      if (source.mode === "edit") {
        await resubmitDriveRequest(college.collegeId, source.request.id, body);
        setDirty(false);
        message.success("Saved. The placement cell sees the new version.");
        router.push(`/recruiter/drives/${source.request.id}`);
      } else {
        const r = await planDrive(body, []);
        const row = (r.data?.colleges || [])[0];
        if (row?.jobId) {
          // Clear the local draft only after a real drive/request was created. A skipped response
          // is a failed business outcome even if the HTTP request itself succeeded.
          sentRef.current = true;
          clearDraft();
          setDirty(false);
          // A trusted company's request (or a college with approval off) is approved at once; the placement cell still sets the dates.
          const approved = row.status && row.status !== "REQUEST";
          message.success(approved ? "Approved. The placement cell sets the dates and opens it to students." : "Sent to the placement cell for review");
          setResult({ jobId: row.jobId, approved });
        } else {
          const detail = row?.skippedReason || "The request could not be sent. Your draft is still saved.";
          setSubmitError(detail);
          message.warning(detail);
        }
      }
    } catch (e) {
      const fieldError = applyServerFieldErrors(form, e, {
        job_title: "jobTitle", job_description: "jobDescription", ctc_lpa: "ctcLpa",
        fixed_lpa: "fixedLpa", variable_lpa: "variableLpa", min_cgpa: "minCgpa",
        passing_years: "passingYears",
      });
      const detail = getServerFormError(e, "Could not send this request. Your draft is saved; try again.");
      setSubmitError(detail);
      if (!fieldError) message.error(detail);
    } finally {
      submitAttemptRef.current = false;
      setBusy(false);
    }
  };

  const shell = (node) => <div className="scroll-container recruiter-plan-drive recruiter-plan-drive--state"><PageShell>{node}</PageShell></div>;
  if (college.error) return shell(<Result status="warning" title="We couldn't load your account" extra={<Button onClick={college.reload}>Retry</Button>} />);
  if (college.needsCollege) return shell(<NoCollegeSession />);
  if (college.loading || source.state === "idle" || source.state === "loading") return shell(<DetailSkeleton label="Loading drive request form" withMedia={false} />);
  if (source.state === "missing" || source.state === "error") {
    return shell(<Result status={source.state === "missing" ? "404" : "warning"} title={source.state === "missing" ? "We could not find that drive" : "We couldn't load that drive"} extra={<Button onClick={() => router.push("/recruiter/drives")}>Back to Drives</Button>} />);
  }

  if (result) {
    return (
      <div className="scroll-container recruiter-plan-drive recruiter-plan-drive--result" data-testid="recruiter.plan-drive.result">
        <PageShell>
          <ListingPageHeader className="recruiter-plan-drive__header" title={result.approved ? "Drive approved" : "Request sent"}
            subtitle={<Typography.Text type="secondary">{result.approved ? "The placement cell sets the dates and opens it to students. Track it on the drive." : "The placement cell reviews it and replies on the drive. If they need a change, you answer it there."}</Typography.Text>} />
          <Card className="recruiter-plan-drive__result-card">
            <div className="recruiter-plan-drive__result-actions">
              <Button type="primary" onClick={() => router.push(`/recruiter/drives/${result.jobId}`)}>Open the drive</Button>
              <Button onClick={() => router.push("/recruiter/drives")}>Go to Drives</Button>
              <Button onClick={() => { setResult(null); startOver(); }}>Request another</Button>
            </div>
          </Card>
        </PageShell>
      </div>
    );
  }

  const title = source.mode === "edit" ? "Edit your request" : source.mode === "again" ? "Hire again" : "Request a drive";
  const company = college.user?.companyName;
  const students = overview?.studentsTotal;

  return (
    <div className="scroll-container recruiter-plan-drive" data-testid="recruiter.plan-drive">
      <PageShell>
        <ListingPageHeader
          className="recruiter-plan-drive__header"
          title={title}
          subtitle={<Typography.Text type="secondary">{source.mode === "edit" ? "Still in review, so you can change it. The placement cell sees the new version." : source.mode === "again" ? "Started from your earlier drive. Change anything, then send it." : "Describe the opportunity and send it to the placement cell for review."}</Typography.Text>}
          rightContent={<Button type="link" onClick={leaveToDrives}>All drives</Button>}
        />
        {restored && <Alert className="recruiter-plan-drive__restored" type="info" showIcon message="We restored your unsent draft" action={<Button size="small" onClick={startOver}>Start over</Button>} data-testid="recruiter.plan-drive.restored" />}
        {submitError && <Alert type="error" showIcon message="Drive request was not sent" description={submitError}
          closable onClose={() => setSubmitError("")} style={{ marginBottom: 12 }} />}
        {overviewError && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 12 }}
            message="College eligibility suggestions are unavailable"
            description="You can still enter branches and eligibility manually. Student counts and branch suggestions are not being treated as empty."
            action={<Button size="small" onClick={loadOverview}>Retry suggestions</Button>}
          />
        )}
        {source.mode !== "new" && dirty && <Tag color="orange" style={{ marginBottom: 12 }}>Unsaved changes</Tag>}

        <div className="recruiter-plan-drive__layout">
          <div className="recruiter-plan-drive__form-column">
            <Form id="recruiter-drive-request-form" form={form} layout="vertical" initialValues={{ driveMode: "ON_CAMPUS", jobType: "Full-time", ...initial }}
              onFinish={submit} disabled={busy} onValuesChange={() => setDirty(true)}>
              <Card className="recruiter-plan-drive__section" title="Role and work">
                <Form.Item name="jobTitle" label="Role title" rules={[{ required: true, min: 3, message: "Enter a role title" }]}><Input placeholder="e.g. Software Engineer" /></Form.Item>
                <Form.Item name="jobDescription" label="Description (optional)"><Input.TextArea rows={4} /></Form.Item>
                <Form.Item name="jdUrl" label="Job description file (optional)" extra="PDF or Word, up to 5 MB. Students see it as a link."><JdUpload /></Form.Item>
                <Form.Item name="jobType" label="Job type"><Select options={JOB_TYPES.map((t) => ({ value: t, label: t }))} /></Form.Item>
                <div className="recruiter-plan-drive__field-grid recruiter-plan-drive__field-grid--two">
                  <Form.Item name="location" label="Location (optional)"><Input /></Form.Item>
                  <Form.Item name="driveMode" label="Mode"><Select options={[{ value: "ON_CAMPUS", label: "On campus" }, { value: "OFF_CAMPUS", label: "Off campus (students apply on your site)" }]} /></Form.Item>
                </div>
              </Card>

              <Card className="recruiter-plan-drive__section" title="Pay">
                <div className="recruiter-plan-drive__field-grid">
                  <Form.Item name="ctcLpa" label={values.jobType === "Internship" ? "CTC after the internship (LPA, optional)" : "CTC (LPA)"}
                    rules={[{ required: values.jobType !== "Internship", message: "CTC is required" }]}><InputNumber min={0} step={0.1} /></Form.Item>
                  <Form.Item name="fixedLpa" label="Fixed (optional)" dependencies={["ctcLpa", "variableLpa"]}
                    rules={[({ getFieldValue }) => ({ validator: (_, fixed) => {
                      const ctc = getFieldValue("ctcLpa");
                      const total = (Number(fixed) || 0) + (Number(getFieldValue("variableLpa")) || 0);
                      return ctc != null && total > Number(ctc) ? Promise.reject(new Error("Fixed and variable add up to more than the CTC")) : Promise.resolve();
                    } })]}><InputNumber min={0} step={0.1} /></Form.Item>
                  <Form.Item name="variableLpa" label="Variable (optional)"><InputNumber min={0} step={0.1} /></Form.Item>
                </div>
                {hasInternship(values.jobType) && (
                  <Form.Item name="stipendPerMonth" label="Stipend per month (₹)" rules={[{ required: values.jobType === "Internship", message: "Students need to know the stipend" }]}>
                    <InputNumber min={0} step={1000} style={{ width: 200 }} />
                  </Form.Item>
                )}
              </Card>

              <Card className="recruiter-plan-drive__section" title="Rounds" data-testid="recruiter.plan-drive.rounds">
                <Typography.Paragraph type="secondary">Optional. Tell the placement cell how you will select. They set the dates and venues.</Typography.Paragraph>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                  {ROUND_PRESETS.map((p) => <Button key={p.label} size="small" onClick={() => { setRounds(p.rounds.map(([kind, name]) => ({ kind, name }))); setDirty(true); }}>{p.label}</Button>)}
                </div>
                {rounds.map((r, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                    <Select style={{ width: 170 }} value={r.kind} options={ROUND_KIND_OPTIONS} onChange={(kind) => { setRounds((rs) => rs.map((x, j) => (j === i ? { ...x, kind } : x))); setDirty(true); }} />
                    <Input style={{ flex: 1, minWidth: 160 }} maxLength={100} value={r.name} placeholder={`Round ${i + 1} name`} onChange={(e) => { setRounds((rs) => rs.map((x, j) => (j === i ? { ...x, name: e.target.value } : x))); setDirty(true); }} />
                    <Button onClick={() => { setRounds((rs) => rs.filter((_, j) => j !== i)); setDirty(true); }}>Remove</Button>
                  </div>
                ))}
                <Button onClick={() => { setRounds((rs) => [...rs, { kind: "INTERVIEW", name: "" }]); setDirty(true); }}>Add a round</Button>
              </Card>

              <Card className="recruiter-plan-drive__section" title="Eligibility">
                <Typography.Paragraph type="secondary">Optional. Leave these blank to include every registered student.</Typography.Paragraph>
                <div className="recruiter-plan-drive__field-grid recruiter-plan-drive__field-grid--two">
                  <Form.Item name="branches" label="Branches"><Select mode="tags" allowClear tokenSeparators={[","]} placeholder="All branches"
                    options={(overview?.byBranch || []).map((b) => b.branch).filter((b) => b && b !== "Other").map((b) => ({ value: b, label: b }))} /></Form.Item>
                  <Form.Item name="passingYears" label="Passing year"><Select mode="tags" allowClear tokenSeparators={[","]} placeholder="Any year, e.g. 2027"
                    options={[0, 1, 2].map((i) => String(new Date().getFullYear() + i)).map((y) => ({ value: y, label: y }))} /></Form.Item>
                </div>
                <div className="recruiter-plan-drive__field-grid recruiter-plan-drive__field-grid--two">
                  <Form.Item name="minCgpa" label="Minimum CGPA"><InputNumber min={0} max={10} step={0.1} /></Form.Item>
                </div>
              </Card>
              {/* On a phone the preview sits far below: Send also ends the form there (UX audit, 19 Oct 2026). */}
              <div className="recruiter-plan-drive__send-bottom">
                <Button type="primary" size="large" block loading={busy} htmlType="submit">{source.mode === "edit" ? "Save changes" : "Send for review"}</Button>
              </div>
            </Form>
          </div>

          <aside className="recruiter-plan-drive__review">
            <Card title="What students will see" data-testid="recruiter.plan-drive.preview">
              <Tag color="blue">Drive</Tag>
              <Typography.Title level={4} style={{ margin: "8px 0 2px" }}>{values.jobTitle?.trim() || "Role title"}</Typography.Title>
              <Typography.Text type="secondary">{company || "Your company"} · {values.driveMode === "OFF_CAMPUS" ? "Off campus" : "On campus"}{values.location ? ` · ${values.location}` : ""}</Typography.Text>
              <div className="recruiter-plan-drive__review-row"><span>Job type</span><strong>{values.jobType || "Full-time"}</strong></div>
              <div className="recruiter-plan-drive__review-row"><span>CTC</span><strong>{values.ctcLpa != null ? `${values.ctcLpa} LPA` : "Not set"}</strong></div>
              {hasInternship(values.jobType) && <div className="recruiter-plan-drive__review-row"><span>Stipend</span><strong>{values.stipendPerMonth != null ? `₹${Number(values.stipendPerMonth).toLocaleString("en-IN")} a month` : "Not set"}</strong></div>}
              <div className="recruiter-plan-drive__review-row"><span>Minimum CGPA</span><strong>{values.minCgpa ?? "Any"}</strong></div>
              {(values.branches || []).length > 0 && <div className="recruiter-plan-drive__review-row"><span>Branches</span><strong>{values.branches.join(", ")}</strong></div>}
              {(values.passingYears || []).length > 0 && <div className="recruiter-plan-drive__review-row"><span>Passing year</span><strong>{values.passingYears.join(", ")}</strong></div>}
              {students != null && <Typography.Paragraph type="secondary" style={{ margin: "10px 0 0", fontSize: 12 }}>About {students} students at this college. Counts are rounded; names appear only after students apply.</Typography.Paragraph>}
              <Button className="recruiter-plan-drive__send-aside" type="primary" block loading={busy} htmlType="submit" form="recruiter-drive-request-form"
                style={{ marginTop: 12 }} data-testid="recruiter.plan-drive.send">{source.mode === "edit" ? "Save changes" : "Send for review"}</Button>
              {source.mode === "new" && <Typography.Text type="secondary" style={{ display: "block", marginTop: 8, fontSize: 12 }}>Your draft is kept in this browser until you send it.</Typography.Text>}
            </Card>
          </aside>
        </div>
      </PageShell>
    </div>
  );
}

// BE-0153: moving between ?fix=A and ?fix=B (or ?from=) starts the form afresh, so A's late answer can't fill B's form, and
// Send can't resubmit A while the address names B.
export default function RecruiterRequestDrivePage() {
  const { fix, from, edit } = useRouter().query;
  return <RecruiterRequestDriveBody key={`${fix ?? ""}:${from ?? ""}:${edit ?? ""}`} />;
}
