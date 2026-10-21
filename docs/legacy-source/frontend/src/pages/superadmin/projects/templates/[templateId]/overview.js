import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Skeleton,
  Space,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import {
  AuditOutlined,
  CopyOutlined,
  EyeOutlined,
  InboxOutlined,
  PlusOutlined,
  ReadOutlined,
  SendOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { showProjectError } from "@/utils/projectErrorModal";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";
import SuperAdminTemplateShell from "@/components/admin/SuperAdminTemplateShell";
import { useSuperAdminScope } from "@/contexts/SuperAdminScopeContext";
import {
  archiveProjectTemplate,
  createProjectFromTemplate,
  duplicateProjectTemplate,
  fetchWithErrorHandling,
  getProjectTemplateById,
  getProjectTemplatePreview,
  publishProjectTemplate,
  unpublishProjectTemplate,
  updateProjectTemplate,
} from "@/api/Services/AdminService";
import {
  formatTimestamp,
  isArchivedStatus,
  normaliseCollegeScopedName,
  statusColor,
  statusLabel,
  templateScalars,
  textOrDash,
  toArrayValue,
  toObjectValue,
  unwrapApiItem,
} from "@/components/admin/projects/adminProjectUtils";
import { useUnsavedFormGuard } from "@/components/admin/projects/useUnsavedFormGuard";
import renderStructuredValue from "@/components/admin/projects/renderStructuredValue";

const { TextArea } = Input;
const { Paragraph, Text } = Typography;

// Some templates carry a real lifecycleStatus value in a casing this select doesn't recognize
// (e.g. "Planning" against draft/published/archived). Falling back to a fixed "draft" would LOOK
// like a real selection and silently overwrite the stored value on the next save — so match
// case-insensitively first and otherwise keep the raw value as its own labeled option.
const normalizeOptionValue = (value, validValues) => {
  const normalized = String(value || "").trim().toLowerCase();
  const match = validValues.find((v) => v.toLowerCase() === normalized);
  return match || String(value || "").trim() || validValues[0];
};

const WORKSPACE_STATUS_VALUES = ["ACTIVE", "IN_PROGRESS", "READY", "BLOCKED", "ARCHIVED"];
const normalizeWorkspaceStatusValue = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "ACTIVE";
  const upper = raw.toUpperCase().replace(/[\s-]+/g, "_");
  return WORKSPACE_STATUS_VALUES.includes(upper) ? upper : raw;
};

const LIFECYCLE_STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  // Disabled, same as on the create form: picking "Archived" here soft-deletes the template
  // (isDeleted=true) with no confirmation and no audit entry, while the dedicated Archive button
  // a few pixels away does the same thing behind a Popconfirm and a danger style. Two doors to
  // one destructive action, one of them unguarded — so this one is closed. An already-archived
  // template still displays its value; withUnrecognizedOption keeps the label visible.
  { value: "archived", label: "Archived", disabled: true },
];
const WORKSPACE_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "READY", label: "Ready" },
  { value: "BLOCKED", label: "Blocked" },
  // Disabled — every workspace seeded from this template would be born already archived,
  // skipping the dedicated Archive action's audit/side effects entirely.
  { value: "ARCHIVED", label: "Archived", disabled: true },
];

const withUnrecognizedOption = (options, value) => {
  if (!value || options.some((option) => option.value === value)) return options;
  return [...options, { value, label: `${value} (unrecognized)` }];
};

// The list page shows a one-line blurb next to each template's title. Deriving it from Goal
// removes a redundant, drift-prone "Summary" field the admin had to keep in sync by hand.
const deriveSummary = (goal, title) => {
  const firstLine = String(goal || "").trim().split("\n")[0];
  return (firstLine || String(title || "").trim()).slice(0, 160);
};

const linesOf = (text) =>
  String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

// Every other section reader on these pages runs its value through toArrayValue/toObjectValue
// first, because these JSON columns come back parsed on some endpoints and as a raw JSON string on
// others. This one read the value directly, so a string-wrapped payload fell to the object branch
// and rendered "No sprints provided." on a template that has plenty.
const renderPreviewSection = (label, rawValue) => {
  const value = toObjectValue(rawValue, rawValue);
  return (
  <Card size="small" title={label} className="admin-list-page__card-gap">
    {Array.isArray(value) ? (
      value.length ? (
        <Space wrap size={[8, 8]}>
          {value.map((item, index) => (
            <Tag key={`${label}-${index}`}>
              {typeof item === "object" ? textOrDash(item?.title || item?.name || item?.label) : textOrDash(item)}
            </Tag>
          ))}
        </Space>
      ) : (
        <Empty description={`No ${label.toLowerCase()} configured`} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )
    ) : value && typeof value === "object" && Object.keys(value).length ? (
      renderStructuredValue(value)
    ) : (
      <Text type="secondary">{`No ${label.toLowerCase()} provided.`}</Text>
    )}
  </Card>
  );
};

export default function SuperAdminProjectTemplateOverviewPage() {
  const router = useRouter();
  const { selectedCollegeId: collegeId } = useSuperAdminScope();
  const templateId = router.query.templateId;
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [template, setTemplate] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [lifecycleStatusOptions, setLifecycleStatusOptions] = useState(LIFECYCLE_STATUS_OPTIONS);
  const [workspaceStatusOptions, setWorkspaceStatusOptions] = useState(WORKSPACE_STATUS_OPTIONS);

  // Overview keys the admin has no control for (legacy "facts" older rows may still carry) are
  // carried through unedited on save rather than silently dropped.
  const overviewFactsRef = useRef({});
  const rawEnumValuesRef = useRef({});

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [duplicateForm] = Form.useForm();
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm] = Form.useForm();

  useUnsavedFormGuard(form, { enabled: Boolean(template) });


  const applyTemplateToForm = useCallback(
    (item) => {
      rawEnumValuesRef.current = { status: item?.status, lifecycleStatus: item?.lifecycleStatus };
      const normalizedStatus = normalizeWorkspaceStatusValue(item?.status);
      const normalizedLifecycle = normalizeOptionValue(item?.lifecycleStatus, ["draft", "published", "archived"]);
      setWorkspaceStatusOptions(withUnrecognizedOption(WORKSPACE_STATUS_OPTIONS, normalizedStatus));
      setLifecycleStatusOptions(withUnrecognizedOption(LIFECYCLE_STATUS_OPTIONS, normalizedLifecycle));
      const overviewValue = toObjectValue(item?.overview, {});
      const {
        goal: overviewGoal,
        deliverables: overviewDeliverables,
        definitionOfDone: overviewDoD,
        personas: overviewPersonas,
        ...overviewFacts
      } = overviewValue;
      overviewFactsRef.current = overviewFacts;
      form.setFieldsValue({
        slug: item?.slug,
        title: item?.title,
        courseLabel: item?.courseLabel,
        phase: item?.phase,
        status: normalizedStatus,
        lifecycleStatus: normalizedLifecycle,
        overviewGoal: overviewGoal || "",
        overviewDeliverablesText: Array.isArray(overviewDeliverables) ? overviewDeliverables.join("\n") : "",
        overviewDoDText: Array.isArray(overviewDoD) ? overviewDoD.join("\n") : "",
        overviewPersonasText: Array.isArray(overviewPersonas) ? overviewPersonas.join("\n") : "",
        deliverySubmissionType: toObjectValue(item?.delivery, {})?.submissionType || undefined,
        deliveryInstructions: toObjectValue(item?.delivery, {})?.summary || "",
      });
    },
    [form]
  );

  const loadTemplate = useCallback(
    async (mountedRef) => {
      // Templates are a global catalog — super-admin doesn't need a college selected to view one.
      if (!templateId) return;
      setLoading(true);
      setError(null);
      try {
        const result = await fetchWithErrorHandling(getProjectTemplateById(templateId, collegeId));
        if (mountedRef && !mountedRef.current) return;
        if (result.success) {
          const item = unwrapApiItem(result);
          setTemplate(item);
          applyTemplateToForm(item);
        } else {
          setTemplate(null);
          setError(result?.message || "Failed to load template.");
        }
      } catch (e) {
        if (mountedRef && !mountedRef.current) return;
        setTemplate(null);
        setError(e?.message || "Failed to load template.");
      } finally {
        if (!mountedRef || mountedRef.current) setLoading(false);
      }
    },
    [templateId, collegeId, applyTemplateToForm]
  );

  useEffect(() => {
    const mountedRef = { current: true };
    loadTemplate(mountedRef);
    return () => {
      mountedRef.current = false;
    };
  }, [loadTemplate]);

  const handleSubmit = async (values) => {
    if (saving) return;
    setSaving(true);
    try {
      // BE-0187: the four fields on this form are written as they are now, empty included, so clearing one clears it.
      // (They used to be left out when empty, and the old value came back from the stored overview.)
      const overview = { ...overviewFactsRef.current };
      const goal = String(values.overviewGoal || "").trim();
      if (goal) overview.goal = goal; else delete overview.goal;
      [["deliverables", values.overviewDeliverablesText], ["definitionOfDone", values.overviewDoDText], ["personas", values.overviewPersonasText]]
        .forEach(([field, text]) => {
          const lines = linesOf(text);
          if (lines.length) overview[field] = lines; else delete overview[field];
        });
      const payload = {
        ...templateScalars(template),
        slug: values.slug,
        title: values.title,
        courseLabel: values.courseLabel,
        phase: values.phase,
        summary: deriveSummary(values.overviewGoal, values.title),
        // Preserve the true stored value for any enum field the admin didn't actually touch,
        // instead of resending the display-only fallback normalizeOptionValue produced.
        status: form.isFieldTouched("status") ? values.status : rawEnumValuesRef.current.status,
        // lifecycleStatus is sent ONLY when the admin actually changed it here. Echoing it back
        // unchanged re-ran applyTemplatePayload's publish gate on every save (so saving Overview
        // on a published template with empty deliverables failed on a field this page does own,
        // but for the wrong reason) and reset archivedAt on an archived template. It is one of
        // the guarded fields, so omitting it leaves the stored value alone — which also means a
        // Publish made in another tab is no longer reverted by a save from this one.
        ...(form.isFieldTouched("lifecycleStatus") ? { lifecycleStatus: values.lifecycleStatus } : {}),
        overview,
        // Only the template-level half of delivery: what the learner must submit and the
        // instructions for it. Per-workspace runtime state stays with the workspace.
        delivery: {
          ...toObjectValue(template?.delivery, {}),
          // Sent unconditionally so clearing a field actually clears it. Conditionally spreading
          // them meant an emptied submission type or instruction simply vanished from the payload
          // and the stored value survived — the opposite of how the Overview text fields directly
          // above this behave.
          submissionType: values.deliverySubmissionType || null,
          summary: values.deliveryInstructions || "",
        },
      };
      // Sprints, tasks and resources are deliberately absent — see templateScalars' note; the
      // backend leaves an omitted section exactly as stored, so saving Overview cannot wipe them.
      await updateProjectTemplate(templateId, collegeId, payload);
      message.success("Overview saved");
      // Clear the "touched" flags first so the unsaved-changes guard stops firing after a
      // successful save; loadTemplate then re-populates the form from the saved server state.
      form.resetFields();
      await loadTemplate();
    } catch (e) {
      showProjectError(e, { fallback: "Failed to save the template overview" });
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (form.isFieldsTouched()) {
      message.warning("Save your overview changes before publishing the saved template.");
      return;
    }
    if (publishing) return;
    setPublishing(true);
    try {
      await publishProjectTemplate(templateId, collegeId);
      message.success("Template published");
      await loadTemplate();
    } catch (e) {
      showProjectError(e, { fallback: "Failed to publish template" });
    } finally {
      setPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    // Shares the `publishing` flag with handlePublish — only one of the two is ever shown.
    if (publishing) return;
    setPublishing(true);
    try {
      await unpublishProjectTemplate(templateId, collegeId);
      message.success("Template moved back to draft");
      await loadTemplate();
    } catch (e) {
      showProjectError(e, { fallback: "Failed to unpublish template" });
    } finally {
      setPublishing(false);
    }
  };

  const handleArchive = async () => {
    if (archiving) return;
    setArchiving(true);
    try {
      await archiveProjectTemplate(templateId, collegeId);
      message.success("Template archived");
      router.push("/superadmin/projects/templates");
    } catch (e) {
      showProjectError(e, { fallback: "Failed to archive template" });
    } finally {
      setArchiving(false);
    }
  };

  const handlePreview = async () => {
    if (form.isFieldsTouched()) {
      message.warning("Save your overview changes before previewing the saved template.");
      return;
    }
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewData(null);
    try {
      const res = await fetchWithErrorHandling(getProjectTemplatePreview(templateId, collegeId));
      if (res?.success) {
        setPreviewData(unwrapApiItem(res) ?? null);
      } else {
        message.error(res?.message || "Failed to load preview");
      }
    } catch (e) {
      showProjectError(e, { fallback: "Failed to load preview" });
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDuplicate = async (values) => {
    // antd's async field validation means confirmLoading doesn't disable the OK button until
    // after this function's first line runs — guard the double-click explicitly.
    if (duplicating) return;
    setDuplicating(true);
    try {
      const response = await duplicateProjectTemplate(templateId, collegeId, {
        slug: values?.slug || undefined,
        title: values?.title || undefined,
        summary: values?.summary || undefined,
        status: values?.status || undefined,
      });
      const created = response?.data?.data ?? response?.data ?? {};
      message.success("Template duplicated");
      setDuplicateOpen(false);
      duplicateForm.resetFields();
      // Template routes take an Integer id — a slug fallback here would be a 400.
      router.push(`/superadmin/projects/templates/${encodeURIComponent(created?.id ?? "")}/overview`);
    } catch (e) {
      showProjectError(e, { fallback: "Failed to duplicate template" });
    } finally {
      setDuplicating(false);
    }
  };

  const handleCreateFromTemplate = async (values) => {
    if (creating) return;
    // Unlike the template itself (global), a new WORKSPACE genuinely needs a real college.
    if (!collegeId) {
      message.error("Select a college in the header first — a workspace belongs to one college.");
      return;
    }
    setCreating(true);
    try {
      const response = await createProjectFromTemplate(templateId, {
        title: values?.title,
        collegeId,
        classId: values?.classId || undefined,
      });
      const created = response?.data?.data ?? response?.data ?? {};
      message.success("Workspace created from template");
      setCreateOpen(false);
      createForm.resetFields();
      const createdId = created?.id ?? created?.slug ?? "";
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
    } catch (e) {
      showProjectError(e, { fallback: "Failed to create workspace from template" });
    } finally {
      setCreating(false);
    }
  };

  const isPublished = String(template?.lifecycleStatus || template?.status || "").toUpperCase() === "PUBLISHED";

  // publishProjectTemplate enforces exactly two preconditions, and both are already answerable
  // from data on this page. Until now the button was always enabled and the failure arrived as a
  // toast naming a section on a different tab, with no way to get there — so the same check runs
  // here, names the missing piece, and links to the tab that fixes it.
  const publishBlockers = [];
  if (!toArrayValue(toObjectValue(template?.overview, {})?.deliverables).length) {
    publishBlockers.push({ label: "at least one deliverable", tab: "overview", tabLabel: "Overview" });
  }
  if (!toArrayValue(template?.sprints).length && !toArrayValue(template?.tasks).length) {
    publishBlockers.push({ label: "at least one sprint or task", tab: "sprints", tabLabel: "Sprints" });
  }

  const actions = (
    <Space wrap>
      {template?.slug ? (
        <Button
          icon={<AuditOutlined />}
          onClick={() => router.push(`/superadmin/projects/audit?entityId=${encodeURIComponent(template.slug)}&range=all`)}
        >
          Audit trail
        </Button>
      ) : null}
      <Button icon={<EyeOutlined />} onClick={handlePreview} disabled={!template}>
        Preview
      </Button>
      <Tooltip title={collegeId ? undefined : "Select a college in the header first — a workspace belongs to one college."}>
        <Button icon={<PlusOutlined />} onClick={() => setCreateOpen(true)} disabled={!template || !collegeId}>
          Create workspace
        </Button>
      </Tooltip>
      <Button
        icon={<CopyOutlined />}
        disabled={!template}
        onClick={() => {
          // Pre-fill the source's initial workspace status so a duplicate can't silently carry
          // over an unseen value. "ACTIVE" (not "draft") is the fallback — "draft" isn't one of
          // the real workspace-status enum values.
          duplicateForm.setFieldsValue({ status: template?.status || "ACTIVE" });
          setDuplicateOpen(true);
        }}
      >
        Duplicate
      </Button>
      {isPublished ? (
        <Popconfirm
          title="Unpublish this template?"
          description="It will move back to draft and stop being offered for new workspaces."
          okText="Unpublish"
          onConfirm={handleUnpublish}
          disabled={!template}
        >
          <Button icon={<StopOutlined />} loading={publishing} disabled={!template}>
            Unpublish
          </Button>
        </Popconfirm>
      ) : (
        publishBlockers.length ? (
          <Tooltip
            title={
              <span>
                Add {publishBlockers.map((b) => b.label).join(" and ")} first. Go to{" "}
                {publishBlockers.map((b, i) => (
                  <span key={b.tab}>
                    {i > 0 ? " or " : ""}
                    <Link href={`/superadmin/projects/templates/${templateId}/${b.tab}`}>{b.tabLabel}</Link>
                  </span>
                ))}
                .
              </span>
            }
          >
            {/* A span so the tooltip still fires: antd does not surface one on a disabled button. */}
            <span>
              <Button icon={<SendOutlined />} disabled>
                Publish
              </Button>
            </span>
          </Tooltip>
        ) : (
        <Popconfirm
          title="Publish this template?"
          description="It will become available for new workspaces to use."
          okText="Publish"
          onConfirm={handlePublish}
          disabled={!template}
        >
          <Button icon={<SendOutlined />} loading={publishing} disabled={!template}>
            Publish
          </Button>
        </Popconfirm>
        )
      )}
      <Popconfirm
        title="Archive this template?"
        description={`"${normaliseCollegeScopedName(template, "This template")}" will no longer be offered for new workspaces. Existing workspaces stay linked and keep working.`}
        okText="Archive"
        okButtonProps={{ danger: true, loading: archiving }}
        onConfirm={handleArchive}
        disabled={!template || isArchivedStatus(template?.lifecycleStatus || template?.status)}
      >
        <Button
          icon={<InboxOutlined />}
          danger
          loading={archiving}
          // The backend archives via findActiveById, which already excludes archived rows —
          // clicking Archive again throws "not found" instead of no-op-ing.
          disabled={!template || isArchivedStatus(template?.lifecycleStatus || template?.status)}
        >
          Archive
        </Button>
      </Popconfirm>
    </Space>
  );

  return (
    <div className="ln-module admin-list-page">
      <SuperAdminTemplateShell
        templateId={templateId}
        title={template ? normaliseCollegeScopedName(template, "Template") : "Template"}
        subtitle="Identity, lifecycle and the overview content mentors and students read."
        actions={actions}
      >
        {error ? (
          <Alert type="error" message="Template could not be loaded" description={error} showIcon style={{ marginBottom: 16 }} />
        ) : null}

        <Skeleton loading={loading} active paragraph={{ rows: 10 }}>
          {template ? (
            <>
              <Card className="admin-list-page__card-gap">
                <Space wrap>
                  <Tag color={statusColor(template?.lifecycleStatus || template?.status)}>
                    {statusLabel(template?.lifecycleStatus || template?.status)}
                  </Tag>
                  <Tag icon={<ReadOutlined />}>Version {textOrDash(template?.templateVersion)}</Tag>
                </Space>
                <Descriptions column={{ xs: 1, md: 2 }} size="small" style={{ marginTop: 12 }}>
                  <Descriptions.Item label="Published at">{formatTimestamp(template?.publishedAt)}</Descriptions.Item>
                  <Descriptions.Item label="Archived at">{formatTimestamp(template?.archivedAt)}</Descriptions.Item>
                </Descriptions>
              </Card>

              <Card className="admin-form-card">
                <Paragraph type="secondary">
                  Edits to this global template affect future workspace creation. Existing workspaces retain their pinned template snapshots unless an admin deliberately reattaches a template to them.
                </Paragraph>

                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                  <span className="admin-form-section-title">Basic info</span>

                  <Form.Item
                    name="slug"
                    label="Template slug"
                    rules={[
                      { required: true, message: "Template slug is required" },
                      { max: 80, message: "Slug must be 80 characters or fewer" },
                      {
                        pattern: /^[a-z0-9]+(-[a-z0-9]+)*$/,
                        message: "Use lowercase letters, numbers, and hyphens only (e.g. campus-event-coordination)",
                      },
                    ]}
                  >
                    <Input placeholder="campus-event-coordination" maxLength={80} />
                  </Form.Item>

                  <Form.Item name="title" label="Title" rules={[{ required: true, message: "Title is required" }]}>
                    <Input placeholder="Campus Event Coordination" />
                  </Form.Item>

                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item name="courseLabel" label="Course label">
                        <Input placeholder="e.g. Data Structures" maxLength={160} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="phase" label="Phase">
                        <Input placeholder="e.g. Discovery" maxLength={80} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <span className="admin-form-section-title">Lifecycle settings</span>

                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="lifecycleStatus"
                        label="Lifecycle status"
                        extra="Controls this template itself — draft templates can't be attached to new workspaces until published."
                      >
                        <Select options={lifecycleStatusOptions} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="status"
                        label="Initial workspace status"
                        extra="Starting status copied onto every new workspace created from this template."
                      >
                        <Select options={workspaceStatusOptions} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <span className="admin-form-section-title">Overview content</span>

                  <Form.Item
                    name="overviewGoal"
                    label="Project goal / description"
                    extra="Shown to mentors and students as “About this project” on the Overview tab."
                  >
                    <TextArea rows={3} placeholder="What this project is about and what success looks like" />
                  </Form.Item>

                  <Form.Item
                    name="overviewDeliverablesText"
                    label="Deliverables"
                    extra="One per line — shown as a checklist on the Overview tab."
                    rules={[
                      {
                        validator: (_, value) =>
                          linesOf(value).length ? Promise.resolve() : Promise.reject(new Error("Add at least one deliverable.")),
                      },
                    ]}
                  >
                    <TextArea rows={3} placeholder={"e.g.\nWireframes for all core screens\nWorking prototype\nFinal presentation deck"} />
                  </Form.Item>

                  <Form.Item
                    name="overviewDoDText"
                    label="Definition of done"
                    extra="One condition per line — what makes the whole project done, not a single task."
                  >
                    <TextArea rows={3} placeholder={"e.g.\nAll acceptance criteria across sprints pass\nDeployed to a public URL\nMentor sign-off recorded"} />
                  </Form.Item>

                  <Form.Item
                    name="overviewPersonasText"
                    label="Personas"
                    extra="One per line, e.g. Frontend lead — owns the board UI and component structure."
                  >
                    <TextArea rows={3} placeholder={"e.g.\nFrontend lead — owns the board UI and component structure\nBackend lead — owns the API and data model"} />
                  </Form.Item>

                  <span className="admin-form-section-title">Submission</span>
                  <Paragraph type="secondary" style={{ marginTop: -4 }}>
                    Copied onto every workspace created from this template. Per-workspace submission state (status, uploaded file,
                    feedback) stays with the workspace and isn&apos;t set here.
                  </Paragraph>

                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item name="deliverySubmissionType" label="Submission type">
                        <Select
                          allowClear
                          placeholder="Not specified"
                          options={[
                            { value: "LINK", label: "Link" },
                            { value: "FILE", label: "File upload" },
                            { value: "TEXT", label: "Text" },
                          ]}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="deliveryInstructions" label="Submission instructions">
                        <TextArea rows={2} placeholder="What the learner needs to submit" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <div className="admin-form-actions">
                    <Button type="primary" htmlType="submit" loading={saving}>
                      Save overview
                    </Button>
                  </div>
                </Form>
              </Card>
            </>
          ) : (
            !loading && <Alert type="warning" message="Template not found" showIcon />
          )}
        </Skeleton>

        <Modal
          title="Duplicate template"
          open={duplicateOpen}
          destroyOnClose
          onCancel={() => setDuplicateOpen(false)}
          onOk={() => duplicateForm.submit()}
          confirmLoading={duplicating}
          okText="Duplicate"
        >
          <Form form={duplicateForm} layout="vertical" onFinish={handleDuplicate}>
            <Form.Item name="slug" label="New slug (optional)">
              <Input placeholder="Leave blank to auto-generate" />
            </Form.Item>
            <Form.Item name="title" label="New title (optional)">
              <Input placeholder="Leave blank to reuse the original title" />
            </Form.Item>
            <Form.Item name="summary" label="Summary (optional)">
              <Input.TextArea rows={2} placeholder="Leave blank to reuse the original summary" />
            </Form.Item>
            <Form.Item
              name="status"
              label="Initial workspace status"
              extra="Starting status copied onto every new workspace created from this template."
            >
              <Select options={WORKSPACE_STATUS_OPTIONS} />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          open={previewOpen}
          onCancel={() => setPreviewOpen(false)}
          footer={[
            <Button key="close" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>,
          ]}
          title="Template preview"
          width={820}
          destroyOnClose
        >
          <Paragraph type="secondary">What a workspace created from this template would start with.</Paragraph>
          <Skeleton loading={previewLoading} active paragraph={{ rows: 6 }}>
            {previewData ? (
              <>
                <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
                  <Descriptions.Item label="Title">{textOrDash(previewData.title)}</Descriptions.Item>
                  <Descriptions.Item label="Summary">{textOrDash(previewData.summary)}</Descriptions.Item>
                  <Descriptions.Item label="Course">{textOrDash(previewData.courseLabel || previewData.course)}</Descriptions.Item>
                  <Descriptions.Item label="Phase">{textOrDash(previewData.phase)}</Descriptions.Item>
                </Descriptions>
                {renderPreviewSection("Sprints", previewData.sprints)}
                {renderPreviewSection("Tasks", previewData.tasks)}
                {renderPreviewSection("Resources", previewData.resources)}
                {/* No Meetings row: whatever a template holds under `meetings` is never applied to a
                    workspace created from it — see the note on SUPER_ADMIN_TEMPLATE_SECTIONS.
                    Previewing it here would show a section this modal's own create action doesn't
                    honor. */}
              </>
            ) : (
              <Empty description="No preview available" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Skeleton>
        </Modal>

        <Modal
          open={createOpen}
          onCancel={() => setCreateOpen(false)}
          onOk={() => createForm.submit()}
          confirmLoading={creating}
          okText="Create workspace"
          title="Create a workspace from this template"
          destroyOnClose
        >
          <Paragraph type="secondary">
            Seeds a new workspace with this template&apos;s sprints, tasks and resources.
          </Paragraph>
          <Form form={createForm} layout="vertical" onFinish={handleCreateFromTemplate} preserve={false}>
            <Form.Item
              name="title"
              label="Workspace title"
              rules={[{ required: true, message: "Title is required" }]}
              initialValue={template?.title || undefined}
            >
              <Input placeholder="Campus Event Coordination" maxLength={160} />
            </Form.Item>
            <Form.Item name="classId" label="Class ID (optional)" extra="Leave blank for a workspace that isn't tied to a specific class.">
              <InputNumber min={1} style={{ width: "100%" }} placeholder="e.g. 12" />
            </Form.Item>
          </Form>
        </Modal>
      </SuperAdminTemplateShell>
    </div>
  );
}

SuperAdminProjectTemplateOverviewPage.superAdminLayout = SuperAdminLayout;
