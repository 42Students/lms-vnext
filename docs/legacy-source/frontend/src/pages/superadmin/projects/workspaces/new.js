import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { Alert, Button, Card, Form, Input, Modal, Radio, Select, Skeleton, Space, Table, Tag, Typography, message } from "antd";
import { exportRowsToCsv } from "@/utils/csvExport";
import { CREATE_MODES, TEAMS_MODE_HELP, useProjectTeamSplit, useWholeClassAdd } from "@/components/admin/projects/useProjectTeamSplit";
import { showProjectError, showProjectErrorMessage } from "@/utils/projectErrorModal";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";
import SuperAdminGroupShell from "@/components/admin/SuperAdminGroupShell";
import { useSuperAdminScope } from "@/contexts/SuperAdminScopeContext";
import { useUnsavedFormGuard, confirmDiscardIfDirty } from "@/components/admin/projects/useUnsavedFormGuard";
import { useDebounceHook } from "@/hooks/useDebounceHook";
import {
  bulkCreateProjects,
  previewBulkCreateProjects,
  createProject,
  fetchWithErrorHandling,
  getClassesByCollege,
  getFacultyByCollegeId,
  getLearnersByCollegeId,
  getProjectTemplatesByCollege,
} from "@/api/Services/AdminService";

const { TextArea } = Input;
const { Paragraph } = Typography;

const normalizeList = (result) => {
  const raw = result?.data?.data ?? result?.data ?? [];
  return Array.isArray(raw) ? raw : [];
};

export default function SuperAdminProjectWorkspaceCreatePage() {
  const router = useRouter();
  const { selectedCollegeId: collegeId, scopeLoaded, selectedOrganizationId } = useSuperAdminScope();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  // Same three modes as the college-admin page (shared hooks keep them identical).
  const [mode, setMode] = useState("single");
  // Same reconciliation the college-admin flow has (Projects audit R7-03): a server preflight with exact counts before
  // anything is created, and an outcome report kept on screen when some students fail.
  const [cohortPreflight, setCohortPreflight] = useState(null);
  const [bulkReport, setBulkReport] = useState(null);
  const cohortMode = mode === "cohort";
  const teamsMode = mode === "teams";
  // The backend now unconditionally rejects creating a workspace directly into ACTIVE without a
  // mentor (see requireMentorBeforeActive in ProjectWorkspaceServiceImpl — no longer a per-college
  // settings toggle, it's a hard rule). Status defaults to ACTIVE and Mentor was otherwise
  // optional, so without this the default create flow would fail on every submit with no warning
  // beforehand. Mirror the real rule in the form instead of just reordering fields.
  const statusValue = Form.useWatch("status", form);
  const mentorRequired = statusValue === "ACTIVE";

  const [templateOptions, setTemplateOptions] = useState([]);
  const [templatesError, setTemplatesError] = useState(null);
  const [facultyOptions, setFacultyOptions] = useState([]);
  const [classOptions, setClassOptions] = useState([]);
  const [learnerOptions, setLearnerOptions] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [learnerOptionsLoading, setLearnerOptionsLoading] = useState(false);
  useUnsavedFormGuard(form);
  const { addingClass, addWholeClass } = useWholeClassAdd(form, setLearnerOptions);
  const teamSplit = useProjectTeamSplit({
    form,
    collegeId,
    organizationId: selectedOrganizationId,
    onAllCreated: () => router.push("/superadmin/projects/workspaces"),
  });

  // A template page hands off here with ?templateId= ("Use this template"), like the college-admin
  // page: take the first value if duplicated and only accept a real positive id.
  useEffect(() => {
    if (!router.isReady) return;
    const raw = Array.isArray(router.query?.templateId) ? router.query.templateId[0] : router.query?.templateId;
    const numeric = Number(raw);
    if (raw !== undefined && Number.isFinite(numeric) && numeric > 0) form.setFieldsValue({ templateId: numeric });
  }, [router.isReady, router.query?.templateId, form]);

  const loadTemplateOptions = async (search = "") => {
    const result = await fetchWithErrorHandling(getProjectTemplatesByCollege(collegeId, { search }));
    // A failed fetch used to fall through to an empty list, which on a form with a *required*
    // Template field is indistinguishable from "your college has no templates" — and one of those
    // is worth retrying while the other is worth asking an admin about.
    setTemplatesError(result?.success ? null : result?.message || "Templates could not be loaded.");
    return normalizeList(result)
      // A draft/archived template can't actually be attached to a new workspace per the rule
      // stated on the template create form itself — this picker previously offered them anyway.
      .filter((item) => String(item?.lifecycleStatus || item?.status || "").toLowerCase() === "published")
      .map((item) => ({
        value: item.id ?? item.numericId,
        // Two templates can share a title (different versions, or one archived/republished) with
        // nothing to tell them apart in the dropdown — include version so they're distinguishable.
        label: `${item.title || item.slug || `Template ${item.id}`}${item.templateVersion ? ` (v${item.templateVersion})` : ""}`,
      }));
  };

  const loadFacultyOptions = async (search = "") => {
    const result = await fetchWithErrorHandling(getFacultyByCollegeId(collegeId, { search }));
    return normalizeList(result).map((item) => ({
      value: item.id,
      label: `${item.firstName ?? item.first_name ?? ""} ${item.lastName ?? item.last_name ?? ""}`.trim() || item.contactMobile || `Faculty ${item.id}`,
    }));
  };

  const loadClassOptions = async (search = "") => {
    const result = await fetchWithErrorHandling(getClassesByCollege(collegeId, { search }));
    return normalizeList(result).map((item) => ({
      value: item.id,
      label: item.name ?? item.className ?? item.class_name ?? `Class ${item.id}`,
    }));
  };

  const loadLearnerOptions = async (search = "") => {
    const result = await fetchWithErrorHandling(getLearnersByCollegeId(collegeId, { search }));
    return normalizeList(result).map((item) => ({
      value: item.id,
      label: `${item.firstName ?? item.first_name ?? ""} ${item.lastName ?? item.last_name ?? ""}`.trim() || item.rollNumber || item.contactMobile || `Learner ${item.id}`,
    }));
  };

  useEffect(() => {
    if (!collegeId) return;
    let mounted = true;
    (async () => {
      setOptionsLoading(true);
      try {
        const [templates, faculty, classes] = await Promise.all([
          loadTemplateOptions(),
          loadFacultyOptions(),
          loadClassOptions(),
        ]);
        if (!mounted) return;
        setTemplateOptions(templates);
        setFacultyOptions(faculty);
        setClassOptions(classes);
      } finally {
        if (mounted) setOptionsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collegeId]);

  // Each Select's onSearch previously called its load*Options function directly, firing an API
  // request on every keystroke. useDebounceHook debounces the raw search *value* (not a
  // callback) — the handler just records the latest keystroke value, and an effect below fires
  // the actual lookup only once the debounced value settles.
  const [templateSearchText, setTemplateSearchText] = useState("");
  const [facultySearchText, setFacultySearchText] = useState("");
  const [classSearchText, setClassSearchText] = useState("");
  const [learnerSearchText, setLearnerSearchText] = useState("");
  const debouncedTemplateSearch = useDebounceHook(templateSearchText, 400);
  const debouncedFacultySearch = useDebounceHook(facultySearchText, 400);
  const debouncedClassSearch = useDebounceHook(classSearchText, 400);
  const debouncedLearnerSearch = useDebounceHook(learnerSearchText, 400);

  const handleTemplateSearch = (value) => setTemplateSearchText(value);
  const handleFacultySearch = (value) => setFacultySearchText(value);
  const handleClassSearch = (value) => setClassSearchText(value);
  const handleLearnerSearch = (value) => setLearnerSearchText(value);

  useEffect(() => {
    if (!collegeId || debouncedTemplateSearch === undefined) return;
    let mounted = true;
    loadTemplateOptions(debouncedTemplateSearch).then((options) => mounted && setTemplateOptions(options));
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collegeId, debouncedTemplateSearch]);

  useEffect(() => {
    if (!collegeId || debouncedFacultySearch === undefined) return;
    let mounted = true;
    loadFacultyOptions(debouncedFacultySearch).then((options) => mounted && setFacultyOptions(options));
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collegeId, debouncedFacultySearch]);

  useEffect(() => {
    if (!collegeId || debouncedClassSearch === undefined) return;
    let mounted = true;
    loadClassOptions(debouncedClassSearch).then((options) => mounted && setClassOptions(options));
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collegeId, debouncedClassSearch]);

  useEffect(() => {
    if (!collegeId || debouncedLearnerSearch === undefined) return;
    let mounted = true;
    setLearnerOptionsLoading(true);
    loadLearnerOptions(debouncedLearnerSearch)
      .then((options) => mounted && setLearnerOptions(options))
      .finally(() => mounted && setLearnerOptionsLoading(false));
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collegeId, debouncedLearnerSearch]);

  const initialValues = useMemo(
    () => ({
      collegeId,
      organizationId: selectedOrganizationId ?? undefined,
      status: "ACTIVE",
      learnerIds: [],
    }),
    [collegeId, selectedOrganizationId]
  );

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      if (teamsMode) {
        await teamSplit.createTeams(values);
        return;
      }
      if (cohortMode) {
        if (!values.classId) {
          message.error("Pick a section to create one workspace per student in it.");
          return;
        }
        const payload = {
          title: values.title,
          summary: values.summary,
          status: values.status,
          // Disabled antd fields still submit their bound form value, so a tampered form store
          // (devtools/console) could still override collegeId/organizationId despite the field
          // being visually locked. Force these from the session, never from form values.
          organizationId: initialValues.organizationId ? Number(initialValues.organizationId) : undefined,
          collegeId: Number(collegeId),
          classId: Number(values.classId),
          templateId: values.templateId ? Number(values.templateId) : undefined,
          mentorId: values.mentorId ? Number(values.mentorId) : undefined,
        };
        // Preview on every submission: membership and existing coverage can change in another admin's session.
        const preflightResponse = await previewBulkCreateProjects(payload);
        const preview = preflightResponse?.data?.data ?? preflightResponse?.data;
        if (!preview || !Array.isArray(preview.learners) || !Number.isFinite(Number(preview.toCreateCount))) {
          throw new Error("The server did not return a valid cohort preflight. Nothing was created.");
        }
        setCohortPreflight(preview);
        if (Number(preview.toCreateCount) === 0) {
          message.info("Every eligible student already has a workspace from this template. Nothing was created.");
          return;
        }
        const confirmed = await new Promise((resolve) => {
          Modal.confirm({
            title: `Create ${preview.toCreateCount} student workspace${preview.toCreateCount === 1 ? "" : "s"}?`,
            width: 680,
            content: (
              <div>
                <p>Class roster: {preview.rosterCount}; eligible students: {preview.eligibleCount}; already covered: {preview.alreadyCoveredCount}; duplicate roster entries: {preview.duplicateRosterEntries}.</p>
                <p>The full list is below this form. The roster is checked again before anything is created.</p>
              </div>
            ),
            okText: `Create ${preview.toCreateCount} workspaces`,
            onOk: () => resolve(true),
            onCancel: () => resolve(false),
          });
        });
        if (!confirmed) return;
        const response = await bulkCreateProjects(payload);
        const result = response?.data?.data ?? response?.data ?? {};
        const created = Array.isArray(result?.created) ? result.created : Array.isArray(result) ? result : [];
        const failures = Array.isArray(result?.failures) ? result.failures : [];
        const createdCount = created.length;
        setBulkReport({
          completedAt: new Date().toISOString(),
          created: created.map((item) => ({ id: item?.id ?? item?.numericId ?? item?.slug ?? "", title: item?.title ?? "" })),
          failures: failures.map((failure) => String(failure)),
        });
        // A success toast reading "Created 0 workspace(s)" for an empty/invalid class roster
        // told the admin the action worked and redirected them away, giving no signal to
        // re-check the class selection.
        if (createdCount === 0) {
          if (failures.length) {
            showProjectErrorMessage(failures.join("; "), { title: "No workspaces were created" });
          } else {
            message.warning("No workspaces were created — the selected class may have no active learners.");
          }
          return;
        }
        // Partial failure: stay on this screen with the outcome report instead of navigating away from it.
        if (failures.length) {
          message.warning(`${createdCount} workspace(s) created; ${failures.length} student${failures.length === 1 ? "" : "s"} failed. Review or export the report below before retrying.`);
          return;
        }
        message.success(`Created ${createdCount} workspace(s) for the class roster.`);
        router.push("/superadmin/projects/workspaces");
        return;
      }

      const payload = {
        ...values,
        // Same defense-in-depth as the cohort-mode branch above — force from session state.
        collegeId: Number(collegeId),
        organizationId: initialValues.organizationId ? Number(initialValues.organizationId) : undefined,
        classId: values.classId ? Number(values.classId) : undefined,
        templateId: values.templateId ? Number(values.templateId) : undefined,
        mentorId: values.mentorId ? Number(values.mentorId) : undefined,
        learnerIds: Array.isArray(values.learnerIds) ? values.learnerIds : [],
      };
      const response = await createProject(payload);
      const created = response?.data?.data ?? response?.data ?? {};
      message.success("Workspace created");
      const createdId = created?.id ?? created?.slug ?? created?.numericId ?? "";
      if (createdId) {
        // Straight to Summary rather than the bare /{id}: that route only redirects here, costing
        // a render and a history entry Back then bounces off. And if no id came back, going there
        // anyway produced /workspaces/ — a page that sits on a skeleton forever waiting for an id
        // it will never get. Say so instead.
        router.push(`/superadmin/projects/workspaces/${encodeURIComponent(createdId)}/summary`);
      } else {
        message.warning("Workspace created, but the server did not return its id — find it in the workspaces list.");
        router.push("/superadmin/projects/workspaces");
      }
    } catch (error) {
      showProjectError(error, { fallback: "Failed to create workspace" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!collegeId) {
    return (
      <div className="ln-module admin-list-page">
        {/* Inside the shell: a missing scope is a state to recover from, and dropping the tab
            strip and every other navigation affordance is the one thing that makes it harder. */}
        <SuperAdminGroupShell groupKey="projects">
          {scopeLoaded ? (
            <Alert
              type="warning"
              message="No college selected"
              description="Pick a college in the header — a workspace belongs to one college."
              showIcon
            />
          ) : (
            <Skeleton active paragraph={{ rows: 4 }} />
          )}
        </SuperAdminGroupShell>
      </div>
    );
  }

  return (
    <div className="ln-module admin-list-page">
      <SuperAdminGroupShell groupKey="projects">
      <div className="admin-list-page__header">
        <div>
          <h1 className="admin-list-page__title">Create project workspace</h1>
          <div className="admin-list-page__subtitle">Every workspace starts from a template — pick one below.</div>
        </div>
        <Space wrap>
          <Button
            onClick={() => {
              if (confirmDiscardIfDirty(form)) router.push("/superadmin/projects/workspaces");
            }}
          >
            Back to workspaces
          </Button>
        </Space>
      </div>

      <Card>

        <Space style={{ marginBottom: 16 }}>
          <Radio.Group
            optionType="button"
            value={mode}
            options={CREATE_MODES}
            onChange={(event) => {
              const next = event.target.value;
              const checked = next !== "single";
              setMode(next);
              teamSplit.reset();
              // antd's default Form.Item behavior (`preserve: true`) keeps a field's value in the
              // form store even after it's unmounted — so turning cohort mode off (which hides the
              // Class field) did NOT clear `classId`, and it silently rode along into the next
              // single-workspace submit below. That's exactly the surprise class-wide notification
              // this field was hidden outside cohort mode to prevent (see the comment on the Class
              // Form.Item). Clear it explicitly so no stale selection can survive the toggle.
              if (!checked) form.setFieldsValue({ classId: undefined });
            }}
          />
        </Space>
        {teamsMode ? (
          <Alert type="info" showIcon style={{ marginBottom: 16 }} message="Split a class into teams" description={TEAMS_MODE_HELP} />
        ) : null}
        {cohortMode ? (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message="Cohort mode"
            description="Every active student in the section gets their own workspace with the same template, mentor, and title (suffixed with their name)."
          />
        ) : null}

        <Form form={form} layout="vertical" initialValues={{ ...initialValues, teamSize: 5, teamOrder: "roll" }}
          onValuesChange={(changed) => { if ("classId" in changed || "teamSize" in changed || "teamOrder" in changed) teamSplit.setTeamPreview(null); }}
          onFinish={handleSubmit}>
          <Form.Item
            name="title"
            label="Workspace title"
            rules={[
              { required: true, message: "Title is required" },
              { max: 160, message: "Title must be 160 characters or fewer" },
            ]}
          >
            <Input placeholder="Campus Event Coordination" maxLength={160} showCount />
          </Form.Item>

          <Form.Item name="summary" label="Summary">
            <TextArea rows={3} placeholder="Short live workspace summary" />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            style={{ maxWidth: 220 }}
           
          >
            <Select
              options={[
                { value: "ACTIVE", label: "Active" },
                { value: "IN_PROGRESS", label: "In progress" },
                { value: "READY", label: "Ready" },
                { value: "BLOCKED", label: "Blocked" },
                // Disabled rather than removed, for the same reason edit.js disables it: archiving
                // must go through the dedicated Archive action (audit log entry, archivedAt stamp,
                // side effects) rather than this generic status field creating a workspace that was
                // never actually archived through that path.
                { value: "ARCHIVED", label: "Archived", disabled: true },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="templateId"
            label="Template"
            rules={[{ required: true, message: "A template is required — every workspace needs a sprint/task baseline to start from" }]}
            extra={
              templatesError
                ? `Templates could not be loaded: ${templatesError}`
                : !optionsLoading && !templateOptions.length
                  ? "No templates are available to this college yet — a 42Students admin assigns them."
                  : undefined
            }
            validateStatus={templatesError ? "warning" : undefined}
          >
            <Select
              options={templateOptions}
              loading={optionsLoading}
              showSearch
              filterOption={false}
              onSearch={handleTemplateSearch}
              onFocus={() => handleTemplateSearch("")}
              placeholder="Search by template title"
            />
          </Form.Item>

          <Form.Item
            name="mentorId"
            label="Mentor"
            rules={mentorRequired ? [{ required: true, message: "A mentor is required before a workspace can be Active" }] : []}
            extra={mentorRequired ? "Every workspace needs a mentor." : undefined}
          >
            <Select
              allowClear
              options={facultyOptions}
              loading={optionsLoading}
              showSearch
              filterOption={false}
              onSearch={handleFacultySearch}
              onFocus={() => handleFacultySearch("")}
              placeholder={mentorRequired ? "Required — search by faculty name" : "Optional — search by faculty name"}
            />
          </Form.Item>

          {cohortMode || teamsMode ? (
            // Only meaningful in cohort mode, where it's the actual source of the learner roster.
            // For a single workspace it did nothing visible (never shown on the workspace detail
            // page, never used by any dashboard/filter) except silently broadcast a "Project
            // created" notification to every student in that class — regardless of who was
            // actually added below as a Learner — so it's hidden outside cohort mode entirely.
            <Form.Item
              name="classId"
              label="Class"
              rules={[{ required: true, message: teamsMode ? "Pick the class to split into teams" : "Class is required in cohort mode" }]}
            >
              <Select
                allowClear
                options={classOptions}
                loading={optionsLoading}
                showSearch
                filterOption={false}
                onSearch={handleClassSearch}
                onFocus={() => handleClassSearch("")}
                placeholder="Required in cohort mode — search by class name"
              />
            </Form.Item>
          ) : null}

          {teamsMode ? teamSplit.controls : null}

          {mode === "single" ? (
            <Form.Item
              name="learnerIds"
              label="Students"
              rules={[{ max: 500, type: "array", message: "A workspace can have at most 500 students" }]}
            >
              <Select
                mode="multiple"
                options={learnerOptions}
                loading={learnerOptionsLoading}
                showSearch
                filterOption={false}
                onSearch={handleLearnerSearch}
                onFocus={() => handleLearnerSearch("")}
                placeholder="Search by student name"
              />
            </Form.Item>
          ) : null}
          {mode === "single" ? (
            <Form.Item label="Or add a whole class" extra="Adds every student in the section to the list above; remove anyone who isn't on this team.">
              <Select
                value={null}
                allowClear
                loading={addingClass || optionsLoading}
                disabled={addingClass}
                options={classOptions}
                showSearch
                filterOption={false}
                onSearch={handleClassSearch}
                onFocus={() => handleClassSearch("")}
                onChange={addWholeClass}
                placeholder="Pick a section to add its students"
                style={{ maxWidth: 360 }}
              />
            </Form.Item>
          ) : null}

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting}>
              {teamsMode ? (teamSplit.teamPreview ? `Create ${teamSplit.teamPreview.length} team workspaces` : "Create team workspaces") : cohortMode ? "Create workspaces for class" : "Create workspace"}
            </Button>
          </Form.Item>
        </Form>
      </Card>
      {teamsMode ? teamSplit.previewCard : null}
      {teamsMode ? teamSplit.reportCard : null}
      {cohortMode && cohortPreflight ? (
        <Card title="Before creating: one workspace per student" style={{ marginTop: 16 }}>
          <Alert showIcon type="info" style={{ marginBottom: 12 }} message={`${cohortPreflight.toCreateCount} to create · ${cohortPreflight.alreadyCoveredCount} already covered · ${cohortPreflight.duplicateRosterEntries} duplicate roster entries`} description="This preview is advisory; the creation request rechecks eligibility and duplicates." />
          <Table rowKey="learnerId" size="small" dataSource={cohortPreflight.learners} pagination={{ pageSize: 20 }} columns={[
            { title: "Learner", dataIndex: "name", key: "name" },
            { title: "Learner ID", dataIndex: "learnerId", key: "learnerId" },
            { title: "Decision", key: "decision", render: (_, learner) => learner.alreadyCovered ? <Tag color="default">Already has workspace</Tag> : <Tag color="green">Create</Tag> },
          ]} />
        </Card>
      ) : null}
      {bulkReport ? (
        <Card title="Latest cohort creation outcome" style={{ marginTop: 16 }} extra={
          <Button onClick={() => exportRowsToCsv("project-cohort-outcome.csv", [
            { label: "Outcome", key: "outcome" }, { label: "Workspace ID", key: "id" }, { label: "Details", key: "details" },
          ], [
            ...bulkReport.created.map((item) => ({ outcome: "Created", id: item.id, details: item.title })),
            ...bulkReport.failures.map((failure) => ({ outcome: "Failed", id: "", details: failure })),
          ])}>Download outcome CSV</Button>
        }>
          <Paragraph type="secondary">Created: {bulkReport.created.length}; failed: {bulkReport.failures.length}. Completed {new Date(bulkReport.completedAt).toLocaleString()}.</Paragraph>
          {bulkReport.failures.length ? <Alert type="warning" showIcon message="Some workspaces were not created" description="Successful workspaces remain created. Recheck this class and template with the preflight before retrying; already-covered learners will be skipped." style={{ marginBottom: 12 }} /> : null}
          <Table size="small" rowKey="rowKey" dataSource={[
            ...bulkReport.created.map((item, i) => ({ rowKey: `c${i}`, outcome: "Created", id: item.id, details: item.title })),
            ...bulkReport.failures.map((failure, i) => ({ rowKey: `f${i}`, outcome: "Failed", id: "", details: failure })),
          ]} pagination={{ pageSize: 15 }} columns={[
            { title: "Result", dataIndex: "outcome", key: "outcome" },
            { title: "Workspace ID", dataIndex: "id", key: "id" },
            { title: "Workspace / failure", dataIndex: "details", key: "details" },
          ]} />
        </Card>
      ) : null}
      </SuperAdminGroupShell>
    </div>
  );
}

SuperAdminProjectWorkspaceCreatePage.superAdminLayout = SuperAdminLayout;
