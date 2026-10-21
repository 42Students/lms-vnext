import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Button, Card, Col, Form, Input, Row, Select, Space, Typography, message } from "antd";
import { showProjectError } from "@/utils/projectErrorModal";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";
import SuperAdminGroupShell from "@/components/admin/SuperAdminGroupShell";
import { createProjectTemplate } from "@/api/Services/AdminService";
import RepeatingItemEditor, { validateRepeatingItems } from "@/components/admin/projects/RepeatingItemEditor";
import { useUnsavedFormGuard, confirmDiscardIfDirty } from "@/components/admin/projects/useUnsavedFormGuard";
import {
  SPRINT_FIELDS,
  TASK_FIELDS,
  RESOURCE_FIELDS,
  titleOfSprintOrTask,
  titleOfResource,
  sprintSelectOptions,
  materializeSectionKeys,
  stampSprintClientIds,
} from "@/components/admin/projects/projectSectionFieldConfigs";

const { TextArea } = Input;
const { Paragraph } = Typography;

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

// A title in a non-Latin script or made entirely of accented characters strips down to nothing
// (slugify only keeps a-z0-9) — auto-fill would silently clear the Slug field with no
// explanation, and the required-slug validation error that followed gave no hint why. Falling
// back to a generic base keeps auto-fill from ever producing an empty result.
const slugifyWithFallback = (value) => slugify(value) || "template";

// The admin Templates list/detail pages show a short one-line blurb next to each template's
// title. That used to be its own required, separately-typed "Summary" field — which just
// duplicated (and could drift from) the Goal field mentors/students actually see on the
// Overview tab. Deriving it from Goal removes the redundant data entry entirely.
const deriveSummary = (goal, title) => {
  const firstLine = String(goal || "").trim().split("\n")[0];
  return (firstLine || String(title || "").trim()).slice(0, 160);
};

export default function SuperAdminProjectTemplateCreatePage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const slugManuallyEdited = useRef(false);
  const sprints = Form.useWatch("sprints", form);
  const sprintOptions = useMemo(() => sprintSelectOptions(sprints), [sprints]);
  useUnsavedFormGuard(form);

  // Stamp a stable _clientId onto any sprint row that doesn't have one yet (a freshly-added
  // row) before anything can link to it via the Sprint dropdown — see stampSprintClientIds.
  useEffect(() => {
    const stamped = stampSprintClientIds(sprints);
    if (stamped !== sprints) form.setFieldValue("sprints", stamped);
  }, [sprints, form]);

  const handleTitleChange = (event) => {
    if (slugManuallyEdited.current) return;
    form.setFieldsValue({ slug: event.target.value ? slugifyWithFallback(event.target.value) : "" });
  };

  const handleSlugChange = (event) => {
    // Once the admin edits the slug directly, stop overwriting it from the title —
    // otherwise a manual tweak would keep getting clobbered on every keystroke.
    slugManuallyEdited.current = event.target.value !== slugify(form.getFieldValue("title"));
  };

  const initialValues = useMemo(
    () => ({
      status: "ACTIVE",
      lifecycleStatus: "draft",
      overviewGoal: "",
      overviewDeliverablesText: "",
      overviewDoDText: "",
      overviewPersonasText: "",
      sprints: [],
      tasks: [],
      resources: [],
    }),
    []
  );

  const handleSubmit = async (values) => {
    // Enter-key submission from any text field bypasses the submit button's loading/disabled
    // state entirely (antd Form triggers onFinish directly, not through the button element), so
    // two Enter presses in quick succession could fire two concurrent createProjectTemplate
    // calls before either had rendered as disabled.
    if (submitting) return;
    setSubmitting(true);
    try {
      const { sprints, tasks, resources } = materializeSectionKeys(values.sprints, values.tasks, values.resources);
      // "goal" and "deliverables" are the only two Overview keys the Overview tab actually
      // reads (see ProjectDetailContent.jsx's resolvedOverview.goal/.deliverables) — they get
      // their own dedicated fields above so an admin can't miss them or mistype the key.
      const deliverablesList = String(values.overviewDeliverablesText || "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      const dodList = String(values.overviewDoDText || "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      const personasList = String(values.overviewPersonasText || "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      const overview = {
        ...(values.overviewGoal ? { goal: values.overviewGoal } : {}),
        ...(deliverablesList.length ? { deliverables: deliverablesList } : {}),
        ...(dodList.length ? { definitionOfDone: dodList } : {}),
        ...(personasList.length ? { personas: personasList } : {}),
      };
      const payload = {
        ...values,
        // Templates are a global catalog now (V136__project_template_global.sql) — no
        // collegeId/organizationId to force onto the payload; the backend ignores both fields
        // entirely on this path.
        summary: deriveSummary(values.overviewGoal, values.title),
        overview,
        sprints,
        tasks,
        resources,
      };
      delete payload.overviewGoal;
      delete payload.overviewDeliverablesText;
      delete payload.overviewDoDText;
      delete payload.overviewPersonasText;
      const response = await createProjectTemplate(payload);
      const created = response?.data?.data ?? response?.data ?? {};
      message.success("Template created");
      // Straight to the first section, not the bare /{id} — that only redirects here anyway,
      // so going through it costs the user an extra render and a second history entry that
      // Back then bounces off. `slug` is not a usable fallback either: the controller declares
      // @PathVariable Integer templateId, so a slug is a hard 400.
      router.push(`/superadmin/projects/templates/${encodeURIComponent(created?.id ?? "")}/overview`);
    } catch (error) {
      showProjectError(error, { fallback: "Failed to create template" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ln-module admin-list-page">
      <SuperAdminGroupShell groupKey="projects">
      <div className="admin-list-page__header">
        <div>
          <h1 className="admin-list-page__title">Create project template</h1>
          <div className="admin-list-page__subtitle">Define the reusable blueprint for workspaces.</div>
        </div>
        <Space wrap>
          <Button
            onClick={() => {
              if (confirmDiscardIfDirty(form)) router.push("/superadmin/projects/templates");
            }}
          >
            Back to templates
          </Button>
        </Space>
      </div>

      <Card className="admin-form-card">
        <Paragraph type="secondary">
          Keep the template generic. Live meetings, activity, and submission state belong to workspaces.
        </Paragraph>

        <Form form={form} layout="vertical" initialValues={initialValues} onFinish={handleSubmit}>
          <span className="admin-form-section-title">Basic info</span>

          <Form.Item
            name="title"
            label="Title"
            rules={[
              { required: true, message: "Title is required" },
              { max: 200, message: "Title must be 200 characters or fewer" },
            ]}
          >
            <Input placeholder="Campus Event Coordination" maxLength={200} showCount onChange={handleTitleChange} />
          </Form.Item>

          <Form.Item
            name="slug"
            label="Template slug"
            rules={[
              { required: true, message: "Template slug is required" },
              { max: 80, message: "Slug must be 80 characters or fewer" },
              { pattern: /^[a-z0-9]+(-[a-z0-9]+)*$/, message: "Use lowercase letters, numbers, and hyphens only (e.g. campus-event-coordination)" },
            ]}
            extra="Auto-filled from the title — edit it directly if you need something different."
          >
            <Input placeholder="campus-event-coordination" maxLength={80} onChange={handleSlugChange} />
          </Form.Item>

          <span className="admin-form-section-title">Lifecycle settings</span>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="lifecycleStatus"
                label="Lifecycle status"
                extra="Controls this template itself — draft templates can't be attached to new workspaces until published."
              >
                <Select
                  options={[
                    { value: "draft", label: "Draft" },
                    { value: "published", label: "Published" },
                    // Disabled — same reason as "Initial workspace status" below: creating a
                    // brand-new template already Archived soft-deletes it server-side on
                    // creation (isDeleted=true), silently vanishing it from the default list
                    // view with no error.
                    { value: "archived", label: "Archived", disabled: true },
                  ]}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="status"
                label="Initial workspace status"
                extra="Starting status copied onto every new workspace created from this template."
              >
                <Select
                  options={[
                    { value: "ACTIVE", label: "Active" },
                    { value: "IN_PROGRESS", label: "In progress" },
                    { value: "READY", label: "Ready" },
                    { value: "BLOCKED", label: "Blocked" },
                    // Disabled — every workspace seeded from this template would be born already
                    // archived, skipping the dedicated Archive action's audit/side effects entirely.
                    { value: "ARCHIVED", label: "Archived", disabled: true },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <span className="admin-form-section-title">Content</span>

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
                  String(value || "").split("\n").some((line) => line.trim())
                    ? Promise.resolve()
                    : Promise.reject(new Error("Add at least one deliverable.")),
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

          <Form.Item name="sprints" label="Sprints" rules={[{ validator: validateRepeatingItems(SPRINT_FIELDS) }]}>
            <RepeatingItemEditor fields={SPRINT_FIELDS} titleOf={titleOfSprintOrTask} addLabel="Add sprint" emptyText="No sprints yet." />
          </Form.Item>

          <Form.Item
            name="tasks"
            label="Tasks"
            extra={sprints?.length ? undefined : "Add sprints above first so you can link each task to one."}
            rules={[{ validator: validateRepeatingItems(TASK_FIELDS) }]}
          >
            <RepeatingItemEditor
              fields={TASK_FIELDS}
              titleOf={titleOfSprintOrTask}
              addLabel="Add task"
              emptyText="No tasks yet."
              dynamicOptions={{ sprintKey: sprintOptions }}
            />
          </Form.Item>

          <Form.Item name="resources" label="Resources" rules={[{ validator: validateRepeatingItems(RESOURCE_FIELDS) }]}>
            <RepeatingItemEditor fields={RESOURCE_FIELDS} titleOf={titleOfResource} addLabel="Add resource" emptyText="No resources yet." />
          </Form.Item>

          <div className="admin-form-actions">
            <Button type="primary" htmlType="submit" loading={submitting}>
              Create template
            </Button>
            <Button
              onClick={() => {
                if (confirmDiscardIfDirty(form)) router.push("/superadmin/projects/templates");
              }}
            >
              Cancel
            </Button>
          </div>
        </Form>
      </Card>
      </SuperAdminGroupShell>
    </div>
  );
}

SuperAdminProjectTemplateCreatePage.superAdminLayout = SuperAdminLayout;
