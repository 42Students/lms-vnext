import TpoDataTable from "@/components/tpo/TpoDataTable";
import { useRef, useState } from "react";
import { Alert, Button, Modal, Progress, Table, Typography, Upload } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { attachOfferLetter } from "@/api/Services/TpoService";
import { uploadFileViaPresign } from "@/utils/uploadToR2";
import { fullName } from "../tpoFiles";
import { matchLettersToOffers } from "../ui/applicantRules";

const ACCEPT = ".pdf,.png,.jpg,.jpeg";
const OK_TYPES = ["application/pdf", "image/png", "image/jpeg"];
const MAX_BYTES = 10 * 1024 * 1024;

/**
 * Attach offer letters in bulk: drop many files at once, named by roll number (21CS001.pdf). Each file is matched to the student
 * whose roll number is in its name; you see the matches before anything is uploaded, and files that match nobody (or two people)
 * are listed, never guessed.
 *
 * Props: open, offers (the offers still without a letter), onClose, onDone
 */
export default function OfferLettersModal({ open, offers, onClose, onDone }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const uploadingRef = useRef(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [failures, setFailures] = useState([]);

  const reset = () => { setFiles([]); setProgress({ done: 0, total: 0 }); setFailures([]); };
  const { matches, unmatched, ambiguous } = matchLettersToOffers(files, offers);
  const badType = files.filter((f) => !OK_TYPES.includes(f.type) && !/\.(pdf|png|jpe?g)$/i.test(f.name));
  const tooBig = files.filter((f) => f.size > MAX_BYTES);
  const sendable = matches.filter((m) => !badType.includes(m.file) && !tooBig.includes(m.file));

  const finishClose = () => {
    reset();
    onClose?.();
  };

  const requestClose = () => {
    if (uploading) {
      Modal.info({ title: "Offer letters are still uploading", content: "Keep this dialog open until the current uploads finish." });
      return;
    }
    if (files.length === 0) {
      finishClose();
      return;
    }
    Modal.confirm({
      title: "Discard staged offer letters?",
      content: "The selected files and their student matches will be cleared.",
      okText: "Discard files",
      okButtonProps: { danger: true },
      cancelText: "Keep reviewing",
      onOk: finishClose,
    });
  };

  const upload = async () => {
    if (uploadingRef.current || sendable.length === 0) return;
    uploadingRef.current = true;
    setUploading(true); setFailures([]); setProgress({ done: 0, total: sendable.length });
    const failed = [];
    let done = 0;
    for (const m of sendable) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const up = await uploadFileViaPresign(m.file, { folder: "offer-letters", type: "generic" });
        // eslint-disable-next-line no-await-in-loop
        const res = await fetchWithErrorHandling(attachOfferLetter(m.offer.offerId, up.publicUrl));
        if (!res.success) failed.push({ name: m.file.name, reason: res?.data?.message || res?.data?.error || "Could not attach it" });
      } catch (e) {
        failed.push({ name: m.file.name, reason: e?.message || "Upload failed" });
      }
      done += 1; setProgress({ done, total: sendable.length });
    }
    uploadingRef.current = false;
    setUploading(false);
    setFailures(failed);
    if (failed.length === 0) {
      reset();
      onDone?.(sendable.length);
    } else {
      const failedNames = new Set(failed.map((item) => item.name));
      setFiles((current) => current.filter((file) => failedNames.has(file.name)));
      onDone?.(sendable.length - failed.length, true);
    }
  };

  return (
    <Modal open={open} onCancel={requestClose} width={720} destroyOnClose title="Attach offer letters"
      maskClosable={false} closable={!uploading} keyboard={!uploading} footer={[
      <Button key="c" onClick={requestClose} disabled={uploading}>Close</Button>,
      <Button key="u" type="primary" disabled={sendable.length === 0 || uploading} loading={uploading} onClick={upload}>Upload {sendable.length || ""} letter{sendable.length === 1 ? "" : "s"}</Button>,
    ]}>
      <Typography.Paragraph type="secondary">
        Drop all the letters together. Name each file with the student&apos;s roll number, like <b>21CS001.pdf</b>. PDF, PNG or JPG, up to 10 MB each.
      </Typography.Paragraph>
      <Upload.Dragger multiple accept={ACCEPT} showUploadList={false} disabled={uploading}
        beforeUpload={(file) => { setFiles((prev) => (prev.some((p) => p.name === file.name && p.size === file.size) ? prev : [...prev, file])); return false; }}>
        <p className="ant-upload-drag-icon"><InboxOutlined /></p>
        <p className="ant-upload-text">Drop the letters here, or click to choose</p>
      </Upload.Dragger>

      {files.length > 0 && (
        <>
          <Alert style={{ marginTop: 12 }} type={sendable.length === files.length ? "success" : "warning"} showIcon
            message={`${sendable.length} of ${files.length} files matched to a student and ready`}
            description={[
              unmatched.length ? `${unmatched.length} match nobody: ${unmatched.slice(0, 6).map((f) => f.name).join(", ")}${unmatched.length > 6 ? " and more" : ""}.` : null,
              ambiguous.length ? `${ambiguous.length} name more than one student, or repeat a student: ${ambiguous.slice(0, 4).map((f) => f.name).join(", ")}.` : null,
              badType.length ? `${badType.length} are not PDF, PNG or JPG.` : null,
              tooBig.length ? `${tooBig.length} are over 10 MB.` : null,
            ].filter(Boolean).join(" ") || undefined} />
          <div style={{ marginTop: 12 }}>
            <TpoDataTable compact searchInUrl={false} selectable={false} testid="offer-letter-matches" data={matches} rowKey={(m) => m.file.name} exportName="offer-letter-matches"
              height={320} searchOf={(m) => `${m.file.name} ${fullName(m.offer)} ${m.offer.rollNumber || ""}`}
              columns={[{ title: "File", key: "file", exportValue: (m) => m.file.name, render: (_, m) => m.file.name },
                { title: "Student", key: "student", exportValue: (m) => `${fullName(m.offer)} · ${m.offer.rollNumber}`, render: (_, m) => `${fullName(m.offer)} · ${m.offer.rollNumber}` }]} />
          </div>
        </>
      )}
      {uploading && <Progress style={{ marginTop: 12 }} percent={progress.total ? Math.round((progress.done * 100) / progress.total) : 0} status="active" />}
      {failures.length > 0 && <Alert style={{ marginTop: 12 }} type="error" showIcon message={`${failures.length} could not be attached`} description={failures.map((f) => `${f.name}: ${f.reason}`).join("; ")} />}
    </Modal>
  );
}
