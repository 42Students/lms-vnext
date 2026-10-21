import { useRef, useState } from "react";
import { Alert, Button, Modal, Radio, Space, Table, Tabs, Tag, Typography, Upload, message } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { readRowsFromFile, downloadTemplate } from "./tpoFiles";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";

const errorText = (res, fallback) => res?.data?.message || res?.data?.error || res?.message || fallback;

/**
 * The shared "Import with preview" (TPO V1 - Locked.docx §1): upload a spreadsheet, see what matched, what was not in
 * the file and what could not be matched, fix or skip the problem rows, then commit. Used for results, selections,
 * academic details and recruiter leads. Nothing is saved until "Confirm" is pressed.
 *
 * Props:
 *  - allowed: field names read from the file (see tpoFiles HEADER_ALIASES)
 *  - preview(rows): Promise of the backend preview  { matched, notInFile?, unmatched? | new, duplicates, toFix }
 *  - commit(rows, options): Promise of the backend commit
 *  - matchedColumns / notInFileOptions: how to show matched rows; whether to offer "Not cleared / Leave pending"
 *  - template: { name, headings, example }
 */
export default function ImportPreviewModal({
  open, title, onClose, onDone, allowed, preview, commit, matchedColumns, groups, notInFileOptions, template, help,
}) {
  const [rows, setRows] = useState([]);
  const [ignored, setIgnored] = useState([]);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [operationError, setOperationError] = useState(null);
  const busyRef = useRef(false);
  const [notInFileAction, setNotInFileAction] = useState("LEAVE_PENDING");

  const reset = () => {
    setRows([]);
    setIgnored([]);
    setResult(null);
    setOperationError(null);
    setNotInFileAction("LEAVE_PENDING");
  };
  const finishClose = () => {
    reset();
    onClose();
  };

  const hasReviewProgress = rows.length > 0 || ignored.length > 0 || result != null;

  const close = () => {
    if (busyRef.current || busy) {
      message.info("Wait for the import action to finish.");
      return;
    }
    if (!hasReviewProgress) {
      finishClose();
      return;
    }
    Modal.confirm({
      title: "Discard import review?",
      content: "The uploaded rows, match review and any row resolutions will be cleared. Nothing has been saved yet.",
      okText: "Discard review",
      okButtonProps: { danger: true },
      cancelText: "Keep reviewing",
      onOk: finishClose,
    });
  };

  const chooseAnotherFile = () => {
    if (busyRef.current || busy) return;
    if (!hasReviewProgress) {
      reset();
      return;
    }
    Modal.confirm({
      title: "Choose another import file?",
      content: "This clears the current preview and every row resolution you made.",
      okText: "Choose another file",
      cancelText: "Keep this review",
      onOk: reset,
    });
  };

  const runPreview = async (nextRows) => {
    if (busyRef.current) return false;
    busyRef.current = true;
    setBusy(true);
    setOperationError(null);
    try {
      const res = await fetchWithErrorHandling(preview(nextRows));
      if (!res.success) {
        const errorMessage = errorText(res, "We couldn't read that file");
        setOperationError(errorMessage);
        message.error(errorMessage);
        return false;
      }
      setRows(nextRows);
      setResult(res.data);
      return true;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const onFile = async (file) => {
    try {
      const parsed = await readRowsFromFile(file, allowed);
      setIgnored(parsed.ignored);
      await runPreview(parsed.rows);
    } catch (e) {
      const errorMessage = e.message || "We couldn't read that file";
      setOperationError(errorMessage);
      message.error(errorMessage);
    }
    return false; // never let antd upload it anywhere
  };

  const skipRow = async (rowIndex) => runPreview(rows.filter((_, i) => i !== rowIndex));
  const resolveRow = async (rowIndex, applicationId) => runPreview(rows.map((r, i) => (i === rowIndex ? { ...r, applicationId } : r)));

  const groupDefs = groups || [
    { key: "matched", label: "Matched", tone: "green" },
    { key: "notInFile", label: "Not in file", tone: "gold" },
    { key: "unmatched", label: "Unmatched", tone: "red" },
  ];
  const problemKey = result && (result.unmatched ? "unmatched" : result.toFix ? "toFix" : null);
  const problems = problemKey ? result[problemKey] : [];

  const confirm = async () => {
    if (busyRef.current || busy) return;
    busyRef.current = true;
    setBusy(true);
    setOperationError(null);
    try {
      const res = await fetchWithErrorHandling(commit(rows, { notInFileAction }));
      if (!res.success) {
        const errorMessage = errorText(res, "The import could not be saved");
        setOperationError(errorMessage);
        message.error(errorMessage);
        return;
      }
      message.success("Import saved");
      reset();
      onDone?.(res.data);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const dataOf = (item) => item.data || {};
  const problemColumns = [
    { title: "Row", dataIndex: "row", width: 60, render: (v) => v + 2 },
    { title: "Details", key: "d", render: (_, item) => Object.values(dataOf(item)).slice(0, 3).join(" · ") || item.name || item.roll || "" },
    { title: "Why", dataIndex: "reason" },
    {
      title: "", key: "a",
      render: (_, item) => (
        <Space wrap>
          {(item.suggestions || []).map((s) => (
            <Button key={s.applicationId} size="small" disabled={busy}
              onClick={() => resolveRow(item.row, s.applicationId)}>Use {s.name}</Button>
          ))}
          <Button size="small" danger disabled={busy} onClick={() => skipRow(item.row)}>Skip row</Button>
        </Space>
      ),
    },
  ];

  return (
    <Modal open={open} title={title} onCancel={close} width={820} destroyOnClose
      closable={!busy} maskClosable={false} keyboard={!busy}
      footer={result ? [
        <Button key="back" onClick={chooseAnotherFile} disabled={busy}>Choose another file</Button>,
        <Button key="ok" type="primary" loading={busy} disabled={problems.length > 0 || (result.matched || result.new || []).length === 0} onClick={confirm}>
          Confirm import
        </Button>,
      ] : null}>
      {operationError ? (
        <Alert type="error" showIcon closable message="Import action failed" description={operationError}
          onClose={() => setOperationError(null)} style={{ marginBottom: 12 }} />
      ) : null}
      {!result && (
        <>
          {help && <Typography.Paragraph type="secondary">{help}</Typography.Paragraph>}
          <Upload.Dragger accept=".xlsx,.csv" maxCount={1} showUploadList={false} beforeUpload={onFile} disabled={busy}>
            <p className="ant-upload-drag-icon"><InboxOutlined /></p>
            <p className="ant-upload-text">Drop an Excel (.xlsx) or CSV file here, or click to choose</p>
            <p className="ant-upload-hint">The first row must be the column headings.</p>
          </Upload.Dragger>
          {template && (
            <Button type="link" onClick={() => downloadTemplate(template.name, template.headings, template.example)}>
              Download a template
            </Button>
          )}
        </>
      )}
      {result && (
        <>
          {ignored.length > 0 && <Alert type="info" showIcon style={{ marginBottom: 12 }} message={`Ignored columns we don't use: ${ignored.join(", ")}`} />}
          {problems.length > 0 && (
            <Alert type="warning" showIcon style={{ marginBottom: 12 }}
              message={`${problems.length} row(s) need attention before you can confirm. Pick a suggestion or skip the row.`} />
          )}
          {notInFileOptions && (result.notInFile || []).length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <Typography.Text strong>{result.notInFile.length} applicant(s) are not in the file. What should happen to them?</Typography.Text>
              <div><Radio.Group value={notInFileAction} disabled={busy} onChange={(e) => setNotInFileAction(e.target.value)}>
                <Radio value="LEAVE_PENDING">Leave pending</Radio>
                <Radio value="NOT_CLEARED">Mark not cleared</Radio>
              </Radio.Group></div>
            </div>
          )}
          <Tabs
            items={groupDefs.filter((g) => Array.isArray(result[g.key])).map((g) => ({
              key: g.key,
              label: <span>{g.label} <Tag color={g.tone}>{result[g.key].length}</Tag></span>,
              children: (
                <Table size="small" rowKey={(r, i) => `${g.key}-${r.row ?? r.applicationId ?? i}`} dataSource={result[g.key]}
                  pagination={{ pageSize: 8 }}
                  columns={g.key === "unmatched" || g.key === "toFix" || g.key === "duplicates"
                    ? problemColumns
                    : (matchedColumns || [{ title: "Name", dataIndex: "name" }, { title: "Stage", dataIndex: "stage" }, { title: "Result", dataIndex: "outcome" }])} />
              ),
            }))}
          />
        </>
      )}
    </Modal>
  );
}
