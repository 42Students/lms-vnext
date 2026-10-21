import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Progress,
  Row,
  Select,
  Skeleton,
  Space,
  Typography,
  message,
} from "antd";
import dayjs from "dayjs";
import { DeleteOutlined, InboxOutlined, SwapOutlined, WarningOutlined } from "@ant-design/icons";
import { showProjectError } from "@/utils/projectErrorModal";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";
import SuperAdminWorkspaceShell from "@/components/admin/SuperAdminWorkspaceShell";
import { useSuperAdminScope } from "@/contexts/SuperAdminScopeContext";
import {
  archiveProject,
  attachProjectTemplate,
  deleteProject,
  fetchWithErrorHandling,
  getClassesByCollege,
  getProjectTemplatesByCollege,
  updateProject,
} from "@/api/Services/AdminService";
import {
  asArray,
  isArchivedStatus,
  isProjectAtRisk,
  normaliseCollegeScopedName,
  projectRiskReasons,
  projectStatus,
  riskSeverity,
  derivedProjectProgress,
} from "@/components/admin/projects/adminProjectUtils";
import { useSuperAdminWorkspace } from "@/components/admin/projects/superAdminWorkspaceSection";
import { useUnsavedFormGuard } from "@/components/admin/projects/useUnsavedFormGuard";

import WorkspaceSummarySnapshot from "@/components/admin/projects/WorkspaceSummarySnapshot";

const { TextArea } = Input;
const { Paragraph } = Typography;

// Live data has status stored uppercase-with-underscores (e.g. "IN_PROGRESS"), matching the
// workspaces list filter — this form previously offered a completely different lowercase set
// ("active"/"ready"/"blocked"/"archived") that never matched real values, so the Select showed
// blank on load and silently rewrote the status to a lowercase value the list filter can never
// find again. Normalize case/spacing so a known status still matches its option regardless of
// how it was originally saved, but never silently discard an unrecognized value.
const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "READY", label: "Ready" },
  { value: "BLOCKED", label: "Blocked" },
  // Disabled rather than removed — an already-archived workspace still needs to show "Archived"
  // here, but setting it FROM this generic status field went through updateProject, a completely
  // different endpoint than the dedicated Archive button (archiveProject), with no guarantee the
  // two produce identical audit/notification side effects. Archiving only through the one
  // purpose-built action avoids two competing paths to the same state.
  { value: "ARCHIVED", label: "Archived", disabled: true },
];

const normalizeStatusValue = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "ACTIVE";
  const upper = raw.toUpperCase().replace(/[\s-]+/g, "_");
  return STATUS_OPTIONS.some((option) => option.value === upper) ? upper : raw;
};

function SuperAdminWorkspaceSummaryPageBody() {
  const router = useRouter();
  const { selectedCollegeId: collegeId, scopeLoaded } = useSuperAdminScope();
  const workspaceId = router.query.workspaceId;
  const [form] = Form.useForm();

  const { workspace, loading, error, reload } = useSuperAdminWorkspace(workspaceId, collegeId);

  const [submitting, setSubmitting] = useState(false);
  const [statusOptions, setStatusOptions] = useState(STATUS_OPTIONS);
  // Loaded separately from the workspace: a failure here must leave the rest of the form usable,
  // so the picker just ends up empty rather than blocking the page.
  const [classOptions, setClassOptions] = useState([]);

  const [archiving, setArchiving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [templateOpen, setTemplateOpen] = useState(false);
  const [templateSaving, setTemplateSaving] = useState(false);
  const [templateForm] = Form.useForm();
  const selectedTemplateId = Form.useWatch("templateId", templateForm);
  const [templateOptions, setTemplateOptions] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(false);

  const statusValue = Form.useWatch("status", form);
  // The backend unconditionally rejects moving a workspace to ACTIVE without a mentor
  // (requireMentorBeforeActive — see the matching warning on the create-workspace form). The
  // mentor lives on the Team section, so an admin flipping status here with no mentor previously
  // just hit a bare backend rejection with no forewarning.
  const hasMentor = useMemo(
    () => asArray(workspace?.members).some((member) => String(member?.userType).toUpperCase() === "FACULTY"),
    [workspace]
  );
  // The backend guard only fires on an actual transition INTO Active — resaving an already-Active
  // workspace never re-triggers it. Comparing against the status loaded at page-open time (rather
  // than just the live form value) keeps this warning from firing for e.g. a title-only edit on a
  // workspace that was already Active before the admin opened this form.
  const initialStatusRef = useRef(null);
  const showMentorWarning =
    statusValue === "ACTIVE" && !hasMentor && initialStatusRef.current !== null && initialStatusRef.current !== "ACTIVE";
  useUnsavedFormGuard(form, { enabled: Boolean(workspace) });

  // Classes for the class picker. Deliberately its own effect: a failure to load classes must
  // not stop the workspace itself loading, so the picker ends up empty rather than the page
  // failing.
  useEffect(() => {
    if (!collegeId) return undefined;
    let cancelled = false;
    (async () => {
      const res = await fetchWithErrorHandling(getClassesByCollege(collegeId));
      if (cancelled) return;
      const rows = res.success ? (res.data?.data ?? res.data ?? []) : [];
      setClassOptions(
        (Array.isArray(rows) ? rows : []).map((c) => ({
          value: c.id,
          label: c.className || c.name || `Class ${c.id}`,
        }))
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [collegeId]);

  const loadTemplateOptions = async (search = "") => {
    const result = await fetchWithErrorHandling(getProjectTemplatesByCollege(collegeId, { search }));
    if (!result.success) throw new Error(result?.message || "Failed to load templates");
    const raw = result?.data?.data ?? result?.data ?? [];
    return (Array.isArray(raw) ? raw : [])
      // A draft/archived template can't actually be attached to a workspace per the rule stated
      // on the template create form itself — swapping to one wipes the workspace's existing
      // tasks/sprints/resources for unfinished content. Mirror new.js's same filter here.
      .filter((item) => String(item?.lifecycleStatus || item?.status || "").toLowerCase() === "published")
      .map((item) => ({
        value: item.id ?? item.numericId,
        label: `${item.title || item.slug || `Template ${item.id}`}${item.templateVersion ? ` (v${item.templateVersion})` : ""}`,
      }));
  };

  useEffect(() => {
    if (!collegeId) return undefined;
    let mounted = true;
    (async () => {
      setOptionsLoading(true);
      try {
        const templates = await loadTemplateOptions();
        if (mounted) setTemplateOptions(templates);
      } catch (e) {
        if (mounted) message.error(e?.message || "Failed to load template options");
      } finally {
        if (mounted) setOptionsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collegeId]);

  // Each search replaces the whole `options` array with the new result set — if the currently
  // selected value isn't in that new set (because the admin selected one, then searched for a
  // different name), antd Select has no label left to render for it and falls back to showing the
  // raw id instead of the name. Keep a still-selected previously-known option in the list.
  // onSearch and onFocus both call this for the same Select — guard against a slower "" reset
  // request resolving after a more specific query and silently overwriting its filtered results.
  const templateSearchSeq = useRef(0);
  const handleTemplateSearch = async (value) => {
    const requestId = ++templateSearchSeq.current;
    try {
      const options = await loadTemplateOptions(value);
      if (requestId !== templateSearchSeq.current) return;
      setTemplateOptions((prev) => {
        if (!selectedTemplateId) return options;
        const kept = prev.find((o) => String(o.value) === String(selectedTemplateId));
        return kept && !options.some((o) => String(o.value) === String(kept.value)) ? [kept, ...options] : options;
      });
    } catch (e) {
      if (requestId === templateSearchSeq.current) message.error(e?.message || "Failed to search templates");
    }
  };

  // AntD's own Escape handling on this Modal wasn't reliably closing it — wire it explicitly.
  useEffect(() => {
    if (!templateOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;
      // An open antd Select dropdown inside the modal should collapse on Escape first — without
      // this check, hitting Escape to back out of a template search closed the whole modal
      // instead, discarding the in-progress search.
      if (document.querySelector(".ant-select-open")) return;
      setTemplateOpen(false);
      templateForm.resetFields();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [templateOpen, templateForm]);

  useEffect(() => {
    if (!workspace) return;
    const normalizedStatus = normalizeStatusValue(workspace?.status);
    initialStatusRef.current = normalizedStatus;
    if (!STATUS_OPTIONS.some((option) => option.value === normalizedStatus)) {
      setStatusOptions([...STATUS_OPTIONS, { value: normalizedStatus, label: `${normalizedStatus} (unrecognized)` }]);
    }
    // resetFields() first, then refill: this clears touched state (so the untouched-save guard
    // arms again after a save) and repopulates in the same synchronous step, so the editor is
    // never observably blank.
    form.resetFields();
    form.setFieldsValue({
      title: workspace?.title,
      summary: workspace?.summary,
      status: normalizedStatus,
      progress: workspace?.progress ?? 0,
      blocker: workspace?.blocker,
      nextAction: workspace?.nextAction,
      // PR1: 26 entity fields vs 12 form controls -- these seven were settable only at
      // creation, so a wrong schedule, sprint length, estimation unit, phase or class
      // assignment was permanent.
      phase: workspace?.phase,
      dueLabel: workspace?.dueLabel,
      courseLabel: workspace?.course,
      classId: workspace?.classId ?? undefined,
      startDate: workspace?.startDate ? dayjs(workspace.startDate) : null,
      endDate: workspace?.endDate ? dayjs(workspace.endDate) : null,
      sprintLengthWeeks: workspace?.sprintLengthWeeks ?? undefined,
      estimationUnit: workspace?.estimationUnit || undefined,
    });
  }, [workspace, form]);

  // Deep-link support for the Workspaces list's "No template — attach one" tag, which sends the
  // admin straight here with the Change template modal already open instead of a silent landing
  // that leaves them to rediscover the button themselves.
  useEffect(() => {
    if (!workspace || !router.isReady || router.query.openTemplate !== "1") return;
    // Someone else may have attached a template to this workspace between the list page's load
    // and this click-through — re-check the freshly-loaded workspace rather than blindly forcing
    // open a destructive "replace the template" flow that no longer applies.
    const alreadyHasTemplate = Boolean(workspace?.templateId || workspace?.templateTitle || workspace?.templateSlug);
    if (!alreadyHasTemplate) setTemplateOpen(true);
    const { openTemplate, ...rest } = router.query;
    router.replace({ pathname: router.pathname, query: rest }, undefined, { shallow: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace, router.isReady]);

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      // Only send what was actually touched — status in particular gets defaulted to ACTIVE at
      // load time when the real stored value is null/blank (see normalizeStatusValue), and
      // unconditionally resending it previously meant editing just the title could silently
      // fabricate/overwrite the real status. The backend (ProjectWorkspaceUpdateDTO) already
      // treats an omitted field as "leave unchanged".
      const payload = {};
      ["title", "summary", "status", "blocker", "nextAction", "phase", "dueLabel", "courseLabel", "estimationUnit"].forEach((field) => {
        if (form.isFieldTouched(field)) payload[field] = values[field];
      });
      if (form.isFieldTouched("progress")) {
        payload.progress = values.progress !== undefined && values.progress !== null ? Number(values.progress) : undefined;
      }
      // Dates go as plain YYYY-MM-DD (LocalDate server-side), and sprint length as a number.
      ["startDate", "endDate"].forEach((field) => {
        if (form.isFieldTouched(field)) {
          payload[field] = values[field] ? dayjs(values[field]).format("YYYY-MM-DD") : null;
        }
      });
      // Projects audit pass 1: the class a project belongs to could not be changed after creation.
      // updateProject has always accepted classId, validated it against the project's own college
      // and treated 0 as "detach" — only the form never offered it. Sent only when touched,
      // because the server reads a present classId as an instruction rather than a no-op.
      if (form.isFieldTouched("classId")) {
        payload.classId = values.classId ? Number(values.classId) : 0;
      }
      if (form.isFieldTouched("sprintLengthWeeks")) {
        payload.sprintLengthWeeks = values.sprintLengthWeeks != null ? Number(values.sprintLengthWeeks) : undefined;
      }
      // Details token from the copy this page loaded: a newer edit by someone else is a 409, not overwritten (R3-03).
      await updateProject(workspaceId, collegeId, { ...payload, detailsToken: workspace?.detailsToken });
      message.success("Workspace updated");
      // Deliberately no `form.resetFields()` here. It resets to the (empty) initialValues, so it
      // blanked the editor for the whole refetch — and left it blank if the refetch failed, right
      // after a "saved" toast. The re-seed effect/callback below resets and refills in one
      // synchronous step instead, which also clears touched state so the untouched-save guard
      // arms again.
      reload();
    } catch (e) {
      showProjectError(e, { fallback: "Failed to update workspace" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAttachTemplate = async (values) => {
    setTemplateSaving(true);
    try {
      await attachProjectTemplate(workspaceId, {
        collegeId,
        templateId: values.templateId,
        reapplyDefaults: values.reapplyDefaults !== false,
      });
      message.success("Template attached");
      setTemplateOpen(false);
      templateForm.resetFields();
      reload();
    } catch (e) {
      showProjectError(e, { fallback: "Failed to attach template" });
    } finally {
      setTemplateSaving(false);
    }
  };

  const handleArchive = async () => {
    setArchiving(true);
    try {
      await archiveProject(workspaceId, collegeId);
      message.success("Workspace archived");
      reload();
    } catch (e) {
      showProjectError(e, { fallback: "Failed to archive workspace" });
    } finally {
      setArchiving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteProject(workspaceId, collegeId);
      message.success("Workspace deleted — it can be restored from Deleted workspaces.");
      router.push("/superadmin/projects/workspaces/deleted");
    } catch (e) {
      showProjectError(e, { fallback: "Failed to delete workspace" });
    } finally {
      setDeleting(false);
    }
  };

  if (!collegeId) {
    return (
      <div className="ln-module admin-list-page">
        {/* Inside the shell: a missing scope is a state to recover from, and dropping the tab
            strip and every other navigation affordance is the one thing that makes it harder. */}
        <SuperAdminWorkspaceShell workspaceId={workspaceId} title="Workspace">
          {scopeLoaded ? (
            <Alert
              type="warning"
              message="No college selected"
              description="Pick a college in the header to work with its project workspaces."
              showIcon
            />
          ) : (
            <Skeleton active paragraph={{ rows: 4 }} />
          )}
        </SuperAdminWorkspaceShell>
      </div>
    );
  }

  const archived = isArchivedStatus(projectStatus(workspace));
  const risk = workspace
    ? { atRisk: isProjectAtRisk(workspace), reasons: projectRiskReasons(workspace), severity: riskSeverity(workspace) }
    : null;
  // `linkedReason` is why the admin clicked through here (from At-risk's risk reasons, or from
  // Submissions' review-status context) — shown as orientation context regardless of source.
  // Only the "stalled" flavor of reason is actually at risk of disagreeing with this page's own
  // live recomputation (At-risk's list endpoint lacks resolvedActivity; this page's detail
  // endpoint has it — blocker/review-status fields are identical scalars on both endpoints, so
  // they can't drift the same way). A day-count in the reason text (e.g. "No activity in 9 days")
  // will almost never match exactly even when both sources agree it's stalled, so this checks the
  // reason CATEGORY, not exact text — an exact-string match would flag "stale" on effectively
  // every genuinely-still-stalled workspace.
  const linkedReason = typeof router.query.reason === "string" ? router.query.reason : null;
  const STALE_ACTIVITY_REASON_PATTERN = /^(No activity in \d+ days?|No recent activity)$/;
  // At-risk may pass several comma-joined reasons (e.g. "No activity in 9 days, Active blocker") —
  // split before pattern-matching so a multi-reason string is checked reason-by-reason.
  const linkedReasonList = linkedReason ? linkedReason.split(",").map((r) => r.trim()).filter(Boolean) : [];
  const linkedReasonHasStaleness = linkedReasonList.some((r) => STALE_ACTIVITY_REASON_PATTERN.test(r));
  const linkedReasonMismatch = Boolean(
    linkedReasonHasStaleness && (!risk?.atRisk || !risk.reasons.some((r) => STALE_ACTIVITY_REASON_PATTERN.test(r)))
  );



  return (
    <div className="ln-module admin-list-page">
      <SuperAdminWorkspaceShell
        workspaceId={workspaceId}
        title={workspace ? normaliseCollegeScopedName(workspace, "Workspace") : "Workspace"}
        subtitle="Health, setup and operating details for this workspace."
        // Nothing to act on until the workspace has loaded: on "Project not found" these buttons
        // used to sit live above the error.
        actions={!workspace ? null : (
          <Space wrap>
            {/* An ellipsis suffix is the standard convention for "opens a dialog here".
                The backend rejects this outright on an archived workspace
                (requireProjectNotArchived in attachProjectTemplate), so leaving it enabled let an
                admin fill out a whole form only to hit a generic error at the very end. */}
            <Button icon={<SwapOutlined />} onClick={() => setTemplateOpen(true)} disabled={archived}>
              Change template…
            </Button>
            <Popconfirm
              title="Archive this workspace?"
              description="The workspace will be marked archived but remains accessible for review."
              okText="Archive"
              okButtonProps={{ danger: true, loading: archiving }}
              onConfirm={() => {
                if (!archiving) handleArchive();
              }}
            >
              <Button icon={<InboxOutlined />} danger loading={archiving} disabled={archived}>
                Archive
              </Button>
            </Popconfirm>
            <Popconfirm
              title="Delete this workspace?"
              description="The workspace is soft-deleted (moved to Deleted workspaces) and can be restored from there — it is not permanently erased immediately."
              okText="Delete"
              okButtonProps={{ danger: true, loading: deleting }}
              onConfirm={() => {
                if (!deleting) handleDelete();
              }}
            >
              <Button danger icon={<DeleteOutlined />} loading={deleting}>
                Delete
              </Button>
            </Popconfirm>
          </Space>
        )}
      >
        <Modal
          title="Change template"
          open={templateOpen}
          onCancel={() => {
            setTemplateOpen(false);
            templateForm.resetFields();
          }}
          onOk={() => templateForm.submit()}
          confirmLoading={templateSaving}
          okText="Attach"
        >
          <Form form={templateForm} layout="vertical" onFinish={handleAttachTemplate} initialValues={{ reapplyDefaults: true }}>
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
              message="Changing the template replaces this workspace's tasks, sprints and resources with the new template's. Edits made to the current ones are not kept. This happens regardless of the checkbox below, which only controls whether blank title/summary/overview fields get refilled from the new template."
            />
            <Form.Item name="templateId" label="Template" rules={[{ required: true, message: "Template is required" }]}>
              <Select
                allowClear
                options={templateOptions}
                loading={optionsLoading}
                showSearch
                filterOption={false}
                onSearch={handleTemplateSearch}
                onFocus={() => handleTemplateSearch("")}
                placeholder="Search by template title"
              />
            </Form.Item>
            <Form.Item name="reapplyDefaults" valuePropName="checked">
              <Checkbox>Refill blank title/summary/overview from the new template</Checkbox>
            </Form.Item>
          </Form>
        </Modal>

        {error ? (
          <Alert type="error" message="Workspace could not be loaded" description={error} showIcon style={{ marginBottom: 16 }}
            action={<Button size="small" onClick={reload}>Retry</Button>} />
        ) : null}

        <Skeleton loading={loading} active paragraph={{ rows: 8 }}>
          {workspace ? (
            <>
              <WorkspaceSummarySnapshot workspace={workspace} basePath="/superadmin" />

              {risk?.atRisk ? (
                <Alert
                  className="admin-list-page__card-gap"
                  type={risk.severity.color === "red" ? "error" : "warning"}
                  showIcon
                  icon={<WarningOutlined />}
                  message={`Flagged as at-risk (${risk.severity.label})`}
                  description={risk.reasons.join(" · ")}
                />
              ) : null}

              {linkedReason ? (
                <Alert
                  className="admin-list-page__card-gap"
                  type="info"
                  showIcon
                  message="Opened via a filtered view"
                  description={
                    linkedReasonMismatch
                      ? `Flagged there for: ${linkedReason}. This page's own recomputation ${risk?.atRisk ? "shows a different reason" : "no longer shows this workspace as at-risk"} — activity data may have updated since.`
                      : `Reason: ${linkedReason}`
                  }
                />
              ) : null}

              <Card title="Workspace settings" className="admin-form-card project-workspace-summary__editor">
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                <span className="admin-form-section-title">Basic info</span>

                <Form.Item name="title" label="Workspace title" rules={[{ required: true, message: "Title is required" }]}>
                  <Input placeholder="Campus Event Coordination" maxLength={160} showCount />
                </Form.Item>

                <Form.Item name="summary" label="Summary">
                  <TextArea rows={3} placeholder="Short live workspace summary" />
                </Form.Item>

                <span className="admin-form-section-title">Status</span>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="status"
                      label="Status"
                      extra={archived ? "Archived. To reopen it, choose another status and save." : "To archive this workspace, use the Archive action in this page's header instead."}
                    >
                      <Select options={statusOptions} />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      name="progress"
                      label="Progress %"
                      extra={derivedProjectProgress(workspace) != null
                        ? "Calculated from completed tasks and sprints, the same figure students and mentors see. It updates as the board moves."
                        : "No tasks or sprints yet, so this hand-set figure is shown until the board has work on it."}
                    >
                      {derivedProjectProgress(workspace) != null ? <Progress percent={derivedProjectProgress(workspace)} size="small" /> : <InputNumber min={0} max={100} style={{ width: "100%" }} />}
                    </Form.Item>
                  </Col>
                </Row>

                {showMentorWarning ? (
                  <Alert
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16 }}
                    message="This workspace has no mentor"
                    description="Saving with Active will be rejected until a mentor is assigned — use Reassign mentor on the Team section first."
                  />
                ) : null}

                <Form.Item name="blocker" label="Blocker">
                  <TextArea rows={2} placeholder="Any active blocker" />
                </Form.Item>

                <Form.Item name="nextAction" label="Next action">
                  <TextArea rows={2} placeholder="Immediate next step" />
                </Form.Item>

                {/* PR1: these were settable only at creation — a wrong schedule, sprint length,
                    estimation unit, phase or label was permanent until now. */}
                <span className="admin-form-section-title">Schedule &amp; setup</span>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item name="startDate" label="Start date">
                      <DatePicker style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="endDate"
                      label="End date"
                      dependencies={["startDate"]}
                      rules={[
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            const start = getFieldValue("startDate");
                            if (!value || !start || !dayjs(value).isBefore(dayjs(start), "day")) {
                              return Promise.resolve();
                            }
                            return Promise.reject(new Error("End date must be on or after the start date"));
                          },
                        }),
                      ]}
                    >
                      <DatePicker style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="sprintLengthWeeks"
                      label="Sprint length (weeks)"
                      extra="Used for sprints created from now on; existing sprints keep their dates."
                    >
                      <InputNumber min={1} max={12} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="estimationUnit"
                      label="Estimation unit"
                      extra="Changing this does not convert estimates already on tasks; they keep their numbers under the new unit."
                    >
                      <Select
                        allowClear
                        placeholder="POINTS"
                        options={[
                          { value: "POINTS", label: "Points" },
                          { value: "HOURS", label: "Hours" },
                        ]}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col xs={24} md={8}>
                    <Form.Item name="phase" label="Phase">
                      <Input placeholder="e.g. Discovery" maxLength={80} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name="dueLabel" label="Due label">
                      <Input placeholder="e.g. Week 6" maxLength={80} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name="courseLabel" label="Course label">
                      <Input placeholder="e.g. Data Structures" maxLength={160} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="classId"
                      label="Class"
                      tooltip="Which class this project belongs to. Clear it to detach the project from any class — it stays visible to its assigned members either way."
                    >
                      <Select allowClear showSearch optionFilterProp="label" placeholder="No class" options={classOptions} />
                    </Form.Item>
                  </Col>
                </Row>

                <span className="admin-form-section-title">Content</span>
                <Paragraph type="secondary" style={{ marginTop: -4 }}>
                  Goal, deliverables, definition of done and personas are edited on the{" "}
                  <Link href={`/superadmin/projects/workspaces/${workspaceId}/overview`}>Overview</Link> tab.
                </Paragraph>

                <div className="admin-form-actions">
                  <Button type="primary" htmlType="submit" loading={submitting}>
                    Save changes
                  </Button>
                </div>
                </Form>
              </Card>
            </>
          ) : (
            !loading && <Alert type="warning" message="Workspace not found" showIcon />
          )}
        </Skeleton>
      </SuperAdminWorkspaceShell>
    </div>
  );
}

// BE-0154/0155/0175/0176/0186: the page starts afresh for each college, so a header switch can't leave the last college's
// rows, selections, open dialogs or late answers on screen (or let a save act on them).
export default function SuperAdminWorkspaceSummaryPage(props) {
  const { selectedCollegeId } = useSuperAdminScope();
  const { workspaceId } = useRouter().query;
  return <SuperAdminWorkspaceSummaryPageBody key={`${selectedCollegeId ?? "none"}:${workspaceId ?? ""}`} {...props} />;
}

SuperAdminWorkspaceSummaryPage.superAdminLayout = SuperAdminLayout;
