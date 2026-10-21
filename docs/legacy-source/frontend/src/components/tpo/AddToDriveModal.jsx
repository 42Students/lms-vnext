import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, Checkbox, Empty, Input, List, Modal, Select, Space, Typography, message } from "antd";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { addStudentsToDrive, listDrives } from "@/api/Services/TpoService";
import { fullName } from "@/components/tpo/tpoFiles";
import { splitForAdd } from "@/components/tpo/ui/journeyRules";

const MAX = 200;
const errorText = (res, fallback) => res?.data?.message || res?.data?.error || res?.message || fallback;

/**
 * Put the students you chose on a drive that is open. Shows who is already on it before anything is sent,
 * then says exactly who was added and why anyone was not. A student who is not eligible is only added
 * when the placement cell ticks the box and gives a reason.
 */
export default function AddToDriveModal({ open, selected = [], onClose, onDone }) {
  const [drives, setDrives] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [force, setForce] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!open) return;
    setJobId(null); setForce(false); setReason(""); setError(null); setResult(null);
    busyRef.current = false; setBusy(false);
    fetchWithErrorHandling(listDrives()).then((res) => {
      if (!res.success) { setError(errorText(res, "Could not load your drives")); setDrives([]); return; }
      setDrives((Array.isArray(res.data) ? res.data : []).filter((d) => d.lifecycleStatus === "PUBLISHED"));
    });
  }, [open]);

  const { alreadyOn, canTry } = useMemo(() => splitForAdd(selected, jobId), [selected, jobId]);
  const tooMany = selected.length > MAX;
  const reasonOk = !force || reason.trim().length >= 3;
  const nameOf = (id) => { const s = selected.find((x) => Number(x.learnerId) === Number(id)); return s ? fullName(s) : `#${id}`; };

  const submit = async () => {
    if (busyRef.current || busy) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const res = await fetchWithErrorHandling(addStudentsToDrive(jobId, {
        learnerIds: selected.map((s) => s.learnerId),
        includeIneligible: force,
        reason: force ? reason.trim() : null,
      }));
      if (!res.success) { setError(errorText(res, "Could not add the students")); return; }
      setResult(res.data);
      onDone?.(res.data);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const requestClose = () => {
    if (busyRef.current || busy) {
      message.info("Wait for the students to finish being added.");
      return;
    }
    if (result || (!jobId && !force && !reason.trim())) {
      onClose?.();
      return;
    }
    Modal.confirm({
      title: "Discard Add to Drive setup?",
      content: "Your selected drive and eligibility override reason will be cleared.",
      okText: "Discard",
      okButtonProps: { danger: true },
      cancelText: "Keep editing",
      onOk: () => onClose?.(),
    });
  };

  const skipped = (result?.results || []).filter((r) => r.outcome !== "ADDED");
  return (
    <Modal
      open={open}
      title={`Add ${selected.length} student${selected.length === 1 ? "" : "s"} to a drive`}
      onCancel={requestClose}
      closable={!busy}
      maskClosable={false}
      keyboard={!busy}
      destroyOnClose
      footer={result ? <Button type="primary" onClick={onClose}>Done</Button> : (
        <Space>
          <Button onClick={requestClose} disabled={busy}>Cancel</Button>
          <Button type="primary" loading={busy} disabled={busy || !jobId || tooMany || !reasonOk} onClick={submit}>
            {`Add ${canTry.length || selected.length} to drive`}
          </Button>
        </Space>
      )}
    >
      {result ? (
        <div data-testid="add-to-drive.result">
          <Alert type={result.added ? "success" : "warning"} showIcon message={`${result.added} added, ${result.skipped} skipped`}
            description={result.added ? "Each added student is told and has 48 hours to opt out." : "Nobody was added."} />
          {skipped.length > 0 && <List size="small" style={{ marginTop: 12 }} header="Not added" dataSource={skipped}
            renderItem={(r) => <List.Item><span>{nameOf(r.learnerId)}</span><Typography.Text type="secondary">{r.message}</Typography.Text></List.Item>} />}
        </div>
      ) : (
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          {error && <Alert type="error" showIcon message={error} />}
          {tooMany && <Alert type="warning" showIcon message={`Pick at most ${MAX} students at a time.`} />}
          {drives && drives.length === 0 && !error ? <Empty description="No drive is open for applications. Publish one first." /> : (
            <Select style={{ width: "100%" }} showSearch placeholder="Choose an open drive" loading={!drives} value={jobId} onChange={setJobId} optionFilterProp="label"
              options={(drives || []).map((d) => ({ value: d.id, label: `${d.companyName || "Company"} · ${d.jobTitle || "Role"}` }))} />
          )}
          {jobId && alreadyOn.length > 0 && <Alert type="info" showIcon message={`${alreadyOn.length} of them already applied to this drive. They will be skipped.`} />}
          {jobId && <Typography.Text type="secondary">Students who are debarred or from another college are always skipped. Anyone not eligible is skipped too, unless you add them on purpose below.</Typography.Text>}
          {jobId && <Checkbox checked={force} onChange={(e) => setForce(e.target.checked)}>Add students who are not eligible anyway</Checkbox>}
          {jobId && force && <Input.TextArea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why (kept in the audit log and shown to the company as: Added by college)" />}
        </Space>
      )}
    </Modal>
  );
}
