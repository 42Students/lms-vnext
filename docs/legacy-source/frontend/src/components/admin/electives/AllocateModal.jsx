import { useRef, useState } from "react";
import { Alert, Form, Input, Modal, Radio, Select, message } from "antd";
import { allocate, errorMessage } from "@/api/Services/ElectiveService";

/** Allocate students into one offering by roll numbers, learner ids, or a whole section class. */
export default function AllocateModal({ offering, slot, classes, batches, onClose, onDone }) {
  const [form] = Form.useForm();
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [dirty, setDirty] = useState(false);
  const [result, setResult] = useState(null);
  const [by, setBy] = useState("roll");

  const yearStart = (value) => {
    const match = /^(\d{4})/.exec(String(value || "").trim());
    return match ? match[1] : null;
  };
  const eligibleSections = (classes || []).filter((c) => {
    if (c.classType === "GROUP_BACKED" || c.class_type === "GROUP_BACKED") return false;
    if (Number(c.programId ?? c.program_id) !== Number(slot.programId)) return false;
    const batchId = c.batchId ?? c.batch_id;
    const batch = (batches || []).find((b) => Number(b.id) === Number(batchId));
    if (!batch) return false;
    if (Number(batch.currentSemester ?? batch.current_semester) !== Number(slot.semesterNumber)) return false;
    const slotYear = yearStart(slot.academicYear);
    const batchYear = yearStart(batch.academicYear ?? batch.academic_year);
    return !slotYear || !batchYear || slotYear === batchYear;
  });

  const submit = async (submittedValues = null) => {
    if (busyRef.current) return;
    const v = submittedValues || await form.validateFields().catch(() => null);
    if (!v) return;
    const body = { note: v.note || null };
    if (by === "class") {
      if (!v.fromClassId) { message.warning("Pick a class"); return; }
      body.fromClassId = v.fromClassId;
    } else {
      const tokens = String(v.list || "").split(/[\s,;]+/).map((t) => t.trim()).filter(Boolean);
      if (tokens.length === 0) { message.warning("Paste at least one roll number or learner id"); return; }
      if (by === "id") {
        const ids = tokens.map(Number);
        if (ids.some((n) => !Number.isInteger(n) || n <= 0)) {
          message.warning("Learner ids must all be positive numbers. Fix the invalid values and try again.");
          return;
        }
        body.learnerIds = ids;
      } else {
        body.rollNumbers = tokens;
      }
    }
    setResult(null);
    busyRef.current = true;
    setBusy(true);
    try {
      const res = await allocate(offering.id, body);
      setResult(res.data);
      setDirty(false);
      onDone?.();
    } catch (e) {
      message.error(errorMessage(e));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const requestClose = () => {
    if (busy) {
      message.info("Wait for the allocation to finish.");
      return;
    }
    if (result || (!form.isFieldsTouched() && by === "roll")) {
      onClose?.();
      return;
    }
    Modal.confirm({
      title: "Discard allocation setup?",
      content: "The student list, section choice and note in this dialog have not been applied.",
      okText: "Discard changes",
      okButtonProps: { danger: true },
      cancelText: "Keep editing",
      onOk: () => onClose?.(),
    });
  };

  const seatsNote = offering.capacity != null
    ? `Capacity ${offering.capacity} (${offering.activeCount ?? 0} enrolled): students beyond it are waitlisted in the order added.`
    : "Unlimited capacity.";

  return (
    <Modal title={`Add students to ${offering.courseName || "this course"} — ${slot.name}`} open
      onCancel={requestClose} onOk={() => form.submit()} okText="Add students" confirmLoading={busy}
      okButtonProps={{ disabled: busy }} cancelButtonProps={{ disabled: busy }}
      maskClosable={false} closable={!busy} keyboard={!busy} width={640} destroyOnClose>
      <Form form={form} layout="vertical" initialValues={{ by: "roll" }} onFinish={submit} disabled={busy}>
        <Form.Item label="Identify students by">
          <Radio.Group value={by} onChange={(e) => { setBy(e.target.value); setResult(null); setDirty(true); }} optionType="button"
            options={[{ value: "roll", label: "Roll numbers" }, { value: "class", label: "Whole section" }]} />
        </Form.Item>
        {by === "class" ? (
          <Form.Item name="fromClassId" label="Section"
            extra={eligibleSections.length === 0 ? "No section currently matches this slot's program, semester and academic year." : null}
            rules={[{ required: true, message: "Pick a section" }]}>
            <Select showSearch optionFilterProp="label" placeholder="Every active student of this section"
              options={eligibleSections.map((c) => ({ value: c.id, label: c.name }))} />
          </Form.Item>
        ) : (
          <Form.Item name="list" label="Paste one per line (or comma-separated)" rules={[{ required: true, message: "Paste at least one" }]}>
            <Input.TextArea rows={6} placeholder={by === "roll" ? "21CS001\n21CS002" : "159\n160"} />
          </Form.Item>
        )}
        <Form.Item name="note" label="Note (optional)"><Input maxLength={500} /></Form.Item>
        <Alert type="info" showIcon message={seatsNote}
          description={`Only students of this program who are in Semester ${slot.semesterNumber} right now are added. A student can take at most ${slot.maxPick} course${slot.maxPick === 1 ? "" : "s"} in ${slot.name}. Timetable clashes are shown as a warning but do not stop it.`} />
      </Form>
      {result && <Alert style={{ marginTop: 12 }} type={result.errors?.length ? "warning" : "success"} showIcon
        message={`${result.added} added${result.waitlisted ? `, ${result.waitlisted} waitlisted` : ""}${result.unchanged ? `, ${result.unchanged} already enrolled` : ""}${result.errors?.length ? `, ${result.errors.length} skipped` : ""}`}
        description={(result.errors?.length || result.warnings?.length) ? <ul style={{ margin: 0, paddingLeft: 18, maxHeight: 180, overflow: "auto" }}>
          {(result.errors || []).map((e, i) => <li key={`e${i}`}>{e.name || e.rollNumber || `#${e.learnerId}`}: {e.message}</li>)}
          {(result.warnings || []).map((w, i) => <li key={`w${i}`} style={{ color: "#ad6800" }}>{w.name || w.rollNumber || `#${w.learnerId}`}: {w.message}</li>)}
        </ul> : null} />}
    </Modal>
  );
}
