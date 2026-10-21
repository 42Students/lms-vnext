import { useEffect, useState } from "react";
import { Typography } from "antd";
import ReasonPicker, { reasonIsValid } from "@/components/tpo/ui/ReasonPicker";
import { INELIGIBLE_REASONS } from "./batchRules";
import AsyncModal from "@/components/tpo/ui/AsyncModal";

/**
 * One reason for everything being marked Ineligible (a student, a class, a batch or a whole selection).
 * Props: open, what (e.g. "12 students", "class CSE-A"), onCancel, onConfirm(reason), busy.
 */
export default function IneligibleModal({ open, what, onCancel, onConfirm, busy }) {
  const [reason, setReason] = useState("");
  useEffect(() => { if (open) setReason(""); }, [open]);
  const ok = reasonIsValid(reason, INELIGIBLE_REASONS);
  return (
    <AsyncModal
      open={open} title={`Mark ${what} ineligible`} onCancel={() => { if (!busy) onCancel?.(); }} okText="Mark ineligible"
      okButtonProps={{ danger: true, disabled: !ok || busy, loading: busy }} cancelButtonProps={{ disabled: busy }}
      closable={!busy} keyboard={!busy} maskClosable={!busy}
      onOk={() => ok && !busy && onConfirm(reason.trim())} destroyOnClose
    >
      <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
        Pick the reason. Students never see this. You can undo it straight after.
      </Typography.Paragraph>
      <ReasonPicker reasons={INELIGIBLE_REASONS} value={reason} onChange={setReason} placeholder="Why are they not in placements?" />
    </AsyncModal>
  );
}
