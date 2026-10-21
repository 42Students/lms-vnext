import Link from "next/link";
import { Button, Space, Typography } from "antd";

/** Orientation and direct previous/next links for the ordered academic setup workflow. */
// The setup sequence is only these pages, in this order. The banner used to number every tab in
// the Academic Setup strip, so Batch Promotion, Lecture Halls, Electives and Attendance read as
// setup steps ("Step 7 of 10: Batch Promotion") although they are things done later, or daily.
export const SETUP_STEP_PATHS = ["departments", "programs", "semesters", "semester-courses", "batches", "classes"];

export default function AdminWorkflowGuide({ group, activeItem, basePath }) {
  if (!group || !activeItem || !Array.isArray(group.items)) return null;
  const steps = group.items.filter((item) => SETUP_STEP_PATHS.includes(item.path));
  const position = steps.indexOf(activeItem);
  if (position < 0) return null;
  const previous = steps[position - 1];
  const next = steps[position + 1];
  return (
    <nav aria-label="Academic setup steps" style={{ marginBottom: 16, padding: "10px 14px", border: "1px solid #e6edf1", borderRadius: 8, background: "#fafcfd" }}>
      <Space wrap size={12} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography.Text>
          <strong>Academic setup</strong> · Step {position + 1} of {steps.length}: {activeItem.label}
        </Typography.Text>
        <Space wrap>
          {previous && <Link href={`${basePath}/${previous.path}`}><Button size="small">Previous: {previous.label}</Button></Link>}
          {next && <Link href={`${basePath}/${next.path}`}><Button type="primary" size="small">Next: {next.label}</Button></Link>}
        </Space>
      </Space>
    </nav>
  );
}
