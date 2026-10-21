import { useState } from "react";
import { Button, Space, Tag, Typography, message } from "antd";
import { FileOutlined, LinkOutlined } from "@ant-design/icons";
import { Markup } from "interweave";
import { getFileUrl } from "@/api/Services/AdminService";
import { parseServerTimestamp, formatTimestamp } from "@/components/admin/projects/adminProjectUtils";
import { wallClockToDayjs } from "@/utils/dateUtils";

// What a student handed in, for the admin grading popup. The popup used to show only a
// submission link, so a PDF, file or written answer could be graded without anyone seeing it.
const ALLOWED_TAGS = ["p", "div", "span", "strong", "em", "u", "s", "br", "ul", "ol", "li",
  "h1", "h2", "h3", "h4", "h5", "h6", "a", "table", "thead", "tbody", "tr", "th", "td", "pre", "code", "blockquote"];

const GRADING_LABELS = {
  NOT_GRADED: "Not graded",
  AUTO_GRADED: "Graded, not published",
  MANUALLY_GRADED: "Graded, not published",
  PARTIALLY_GRADED: "Partly graded",
};
export const gradingLabel = (status) => GRADING_LABELS[status] || "Not graded";

const fileKeyOf = (dto) => dto?.cloud_storage_object ?? dto?.cloudStorageObject ?? dto?.url ?? "";
// Uploads are stored under a random id ("a07d6ed5-....pdf"); show "Submitted file (PDF)" instead.
const fileNameOf = (dto, fallback) => {
  const name = dto?.original_name ?? dto?.originalName ?? "";
  if (name && !/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(name)) return name;
  const ext = (name || fileKeyOf(dto)).split(".").pop();
  return ext && ext.length <= 5 ? `${fallback} (${ext.toUpperCase()})` : fallback;
};
const safeLink = (url) => (typeof url === "string" && /^https:\/\//i.test(url.trim()) ? url.trim() : null);

export function isLateSubmission(submission, deadline) {
  const due = wallClockToDayjs(deadline);
  const at = parseServerTimestamp(submission?.createdAt ?? submission?.submittedAt);
  return Boolean(due && at && !Number.isNaN(at.date.getTime()) && at.date.getTime() > due.valueOf());
}

export default function SubmissionWork({ submission, assignment }) {
  const [opening, setOpening] = useState(null);
  const files = [];
  const mainFile = submission?.fileDTO ?? submission?.file_dto;
  if (fileKeyOf(mainFile)) files.push({ id: "main", key: fileKeyOf(mainFile), name: fileNameOf(mainFile, "Submitted file") });
  const links = [];
  const mainLink = safeLink(submission?.submissionLink ?? submission?.submission_link);
  if (mainLink) links.push({ id: "main", url: mainLink, name: "Submitted link" });
  (submission?.submissionAssets ?? submission?.submission_assets ?? []).forEach((asset, i) => {
    const dto = asset?.fileDTO ?? asset?.file_dto;
    if (fileKeyOf(dto) && !files.some((f) => f.key === fileKeyOf(dto))) files.push({ id: `a${asset?.id ?? i}`, key: fileKeyOf(dto), name: fileNameOf(dto, asset?.title || "Attached file") });
    const url = safeLink(asset?.url ?? asset?.link);
    if (url) links.push({ id: `l${asset?.id ?? i}`, url, name: asset?.title || url });
  });
  const html = submission?.htmlContent ?? submission?.html_content ?? "";
  const submittedAt = submission?.createdAt ?? submission?.submittedAt;

  const open = async (file) => {
    setOpening(file.id);
    try {
      const url = await getFileUrl(file.key, {
        courseId: assignment?.courseId,
        classId: assignment?.classId > 0 ? assignment.classId : undefined,
        userId: submission?.studentId,
      });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      message.error("Could not open the file");
    } finally { setOpening(null); }
  };

  const nothing = files.length === 0 && links.length === 0 && !html.trim();
  return (
    <div style={{ marginTop: 6 }}>
      <Space wrap size={[8, 4]}>
        {submittedAt ? <Typography.Text type="secondary">Submitted {formatTimestamp(submittedAt)}</Typography.Text> : null}
        {isLateSubmission(submission, assignment?.deadline) ? <Tag color="orange">Late</Tag> : null}
        {files.map((f) => (
          <Button key={f.id} size="small" icon={<FileOutlined />} loading={opening === f.id} onClick={() => open(f)}>{f.name}</Button>
        ))}
        {links.map((l) => (
          <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer"><LinkOutlined /> {l.name}</a>
        ))}
      </Space>
      {html.trim() ? (
        <div style={{ marginTop: 8, padding: 8, background: "#fafafa", border: "1px solid #f0f0f0", borderRadius: 6, maxHeight: 220, overflow: "auto" }}>
          <Markup content={html} allowList={ALLOWED_TAGS} />
        </div>
      ) : null}
      {nothing ? <Typography.Text type="secondary">Nothing attached to this submission.</Typography.Text> : null}
    </div>
  );
}
