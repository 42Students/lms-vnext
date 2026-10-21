import { AutoComplete, Form, Input, InputNumber, Space, Typography } from "antd";
import { SUGGESTED_KINDS } from "@/api/Services/StudentGroupService";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc); // toLocal below calls .utc() on picker dates

/**
 * LocalDateTime for the backend, in UTC: the server compares the window with LocalDateTime.now()
 * on a UTC JVM and serialises it back with "Z". Sending the browser's local wall clock opened an
 * IST window 5h30m late.
 */
const toLocal = (d) => (d ? d.utc().format("YYYY-MM-DDTHH:mm:ss") : null);

/** Convert form values to the GroupUpsertRequest body. */
export function toGroupBody(values, existingKind, existing = null) {
  // The self-join window is not editable here any more (no student screen can join a group yet), so
  // an edit keeps whatever the group already has instead of silently clearing it.
  const [from, until] = values.selfJoinWindow || [];
  const keep = !values.selfJoinWindow && existing;
  return {
    kind: existingKind || (values.kind || "").trim().toUpperCase(),
    name: (values.name || "").trim(),
    description: (values.description || "").trim() || null,
    capacity: values.capacity ?? null,
    selfJoinOpenFrom: keep ? existing.selfJoinOpenFrom ?? null : toLocal(from),
    selfJoinOpenUntil: keep ? existing.selfJoinOpenUntil ?? null : toLocal(until),
    academicYear: (values.academicYear || "").trim() || null,
    semesterNumber: values.semesterNumber ?? null,
    configJson: {
      allowWaitlist: values.allowWaitlist !== false,
      allowSelfLeave: values.allowSelfLeave !== false,
    },
  };
}

/**
 * Create/edit fields for a group. `kind` is immutable after create, so pass `editing` to hide it.
 * The form instance is owned by the caller so it can live inside a Modal.
 */
export default function StudentGroupForm({ form, editing = false }) {
  return (
    <Form form={form} layout="vertical" requiredMark="optional">
      {!editing && (
        <Form.Item
          name="kind"
          label="Kind"
          tooltip="What this generic group is for, e.g. CRT, MENTORSHIP, BUS or CLUB. Feature-managed kinds such as ELECTIVE are created in their own module."
          rules={[
            { required: true, message: "Kind is required" },
            { pattern: /^[A-Za-z][A-Za-z0-9_]{1,39}$/, message: "Letters, digits and underscore only" },
          ]}
          normalize={(v) => (v || "").toUpperCase()}
        >
          <AutoComplete options={SUGGESTED_KINDS.map((k) => ({ value: k }))} placeholder="CRT" />
        </Form.Item>
      )}
      <Form.Item name="name" label="Name" rules={[{ required: true, message: "Name is required" }, { max: 150 }]}>
        <Input placeholder="e.g. CRT Batch A 2026" />
      </Form.Item>
      <Form.Item name="description" label="Description" rules={[{ max: 1000 }]}>
        <Input.TextArea rows={2} placeholder="Shown to students where this group is offered" />
      </Form.Item>
      <Space size="large" wrap>
        <Form.Item name="capacity" label="Capacity" tooltip="Leave empty for unlimited. Hard limit on active members.">
          <InputNumber min={1} placeholder="Unlimited" style={{ width: 140 }} />
        </Form.Item>
        <Form.Item name="academicYear" label="Academic year" rules={[{ max: 20 }]}>
          <Input placeholder="2026-27" style={{ width: 140 }} />
        </Form.Item>
        <Form.Item name="semesterNumber" label="Semester">
          <InputNumber min={1} max={12} style={{ width: 100 }} />
        </Form.Item>
      </Space>
      {/* "Students may join themselves" was a date range here, but no student screen (web or mobile)
          lets a student join a group, so it configured nothing. Members are added by the college:
          by hand, by CSV, or by a rule. */}
      <Typography.Text type="secondary">
        Add members by hand, by roll numbers, or with a rule. When the group is full, extra members are
        waitlisted and promoted automatically as seats free up.
      </Typography.Text>
    </Form>
  );
}

/** Initial values for editing an existing group. */
export function groupToFormValues(g, dayjs) {
  return {
    kind: g.kind,
    name: g.name,
    description: g.description,
    capacity: g.capacity,
    academicYear: g.academicYear,
    semesterNumber: g.semesterNumber,
    selfJoinWindow: g.selfJoinOpenFrom && dayjs ? [dayjs(g.selfJoinOpenFrom), g.selfJoinOpenUntil ? dayjs(g.selfJoinOpenUntil) : null] : undefined,
  };
}
