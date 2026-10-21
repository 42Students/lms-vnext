import { useRef, useState } from "react";
import { Button, Space, Typography, Upload, message } from "antd";
import { PaperClipOutlined } from "@ant-design/icons";
import { uploadFileViaPresign } from "@/utils/uploadToR2";
import { safeHref } from "@/utils/safeHref";

export const JD_MAX_BYTES = 5 * 1024 * 1024;
const JD_TYPES = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
const JD_EXT = /\.(pdf|doc|docx)$/i;

/** Why this file cannot be the job description, or null when it can. */
export function jdFileProblem(file) {
  if (!file) return "Choose a file";
  if (!(JD_TYPES.includes(file.type) || (!file.type && JD_EXT.test(file.name || "")))) return "A job description must be a PDF or a Word file";
  if (file.size > JD_MAX_BYTES) return "The file is too large. The limit is 5 MB";
  if (!(file.size > 0)) return "The file is empty";
  return null;
}

/** A form field (value is the link): upload a PDF or Word job description, see it, replace it, remove it. */
export default function JdUpload({ value, onChange }) {
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const pick = async (file) => {
    if (busyRef.current || busy) return false;
    const problem = jdFileProblem(file);
    if (problem) { message.error(problem); return false; }
    busyRef.current = true;
    setBusy(true);
    try {
      const up = await uploadFileViaPresign(file, { folder: "jd-files", type: "generic" });
      onChange?.(up.publicUrl);
      message.success("Job description uploaded");
    } catch (e) {
      message.error("Could not upload the file. Try again.");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
    return false; // we upload ourselves
  };
  const href = value ? safeHref(value) : null;
  return (
    <Space wrap data-testid="jd-upload">
      <Upload accept=".pdf,.doc,.docx" showUploadList={false} beforeUpload={pick} disabled={busy}>
        <Button icon={<PaperClipOutlined />} loading={busy}>{value ? "Replace file" : "Upload a PDF or Word file"}</Button>
      </Upload>
      {href && <Typography.Link href={href} target="_blank" rel="noopener noreferrer">View the uploaded file</Typography.Link>}
      {value && <Button type="link" danger disabled={busy} onClick={() => onChange?.("")}>Remove</Button>}
    </Space>
  );
}
