import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Table, Tag, Typography, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import AdminTableToolbar from "@/components/admin/AdminTableToolbar";
import { fetchWithErrorHandling, getProgramsByCollege, getCoursesByCollege, getFacultyByCollegeId, getClassesByCollege, getBatchesByCollege } from "@/api/Services/AdminService";
import { archiveSlot, createSlot, errorMessage, listSlots, updateSlot } from "@/api/Services/ElectiveService";
import ElectiveSlotPanel from "./ElectiveSlotPanel";

const { Text } = Typography;

const isCanonicalAcademicYear = (value) => {
  if (value == null || String(value).trim() === "") return true;
  const match = /^(\d{4})-(\d{2})$/.exec(String(value).trim());
  return Boolean(match) && Number(match[2]) === ((Number(match[1]) + 1) % 100);
};
const idEq = (a, b) => a != null && b != null && Number(a) === Number(b);
const canonicalizeAcademicYear = (value) => {
  const match = /^(\d{4})/.exec(String(value || "").trim());
  if (!match) return value || "";
  const start = Number(match[1]);
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
};

/**
 * Electives for one college: slots (baskets) → offerings → roster. Used by both the college-admin
 * and the super-admin page; the caller's college comes from the session on the backend, so this
 * component only needs the id for the lookups (programs, courses, faculty, classes).
 */
export default function ElectivesConsole({ collegeId }) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [programId, setProgramId] = useState();
  const [semester, setSemester] = useState();
  const [includeArchived, setIncludeArchived] = useState(false);
  const [search, setSearch] = useState("");
  const [lookups, setLookups] = useState({ programs: [], courses: [], faculty: [], classes: [], batches: [] });
  const [lookupErrors, setLookupErrors] = useState([]);
  const slotRequestSeq = useRef(0);
  const lookupRequestSeq = useRef(0);
  const [openSlotId, setOpenSlotId] = useState(null);
  const [editing, setEditing] = useState(null); // null | "new" | slot
  const [saving, setSaving] = useState(false);
  const [archiveBusyId, setArchiveBusyId] = useState(null);
  const [editDirty, setEditDirty] = useState(false);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    const request = ++slotRequestSeq.current;
    if (!collegeId) {
      setSlots([]);
      setLoadError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const res = await listSlots({ ...(programId ? { programId } : {}), ...(semester ? { semester } : {}), includeArchived });
      if (request !== slotRequestSeq.current) return;
      if (!Array.isArray(res?.data)) throw new Error("Unexpected elective slot response");
      setSlots(res.data);
      setLoadError(null);
    } catch (e) {
      if (request !== slotRequestSeq.current) return;
      setSlots([]);
      setLoadError(errorMessage(e, "Could not load electives"));
    } finally {
      if (request === slotRequestSeq.current) setLoading(false);
    }
  }, [collegeId, programId, semester, includeArchived]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const request = ++lookupRequestSeq.current;
    setProgramId(undefined);
    setSemester(undefined);
    setSearch("");
    setOpenSlotId(null);
    setEditing(null);
    form.resetFields();
    setSlots([]);
    setLookups({ programs: [], courses: [], faculty: [], classes: [], batches: [] });
    setLookupErrors([]);
    if (!collegeId) return;
    (async () => {
      const [p, c, f, k, b] = await Promise.all([
        fetchWithErrorHandling(getProgramsByCollege(collegeId)),
        fetchWithErrorHandling(getCoursesByCollege(collegeId)),
        fetchWithErrorHandling(getFacultyByCollegeId(collegeId)),
        fetchWithErrorHandling(getClassesByCollege(collegeId)),
        fetchWithErrorHandling(getBatchesByCollege(collegeId)),
      ]);
      if (request !== lookupRequestSeq.current) return;
      const rows = (result) => result.success && Array.isArray(result.data)
        ? result.data
        : result.success && Array.isArray(result.data?.content)
          ? result.data.content
          : null;
      const programRows = rows(p), courseRows = rows(c), facultyRows = rows(f), classRows = rows(k), batchRows = rows(b);
      setLookups({
        programs: programRows || [],
        courses: courseRows || [],
        faculty: facultyRows || [],
        classes: classRows || [],
        batches: batchRows || [],
      });
      const errors = [];
      if (!programRows) errors.push("programs");
      if (!courseRows) errors.push("courses");
      if (!facultyRows) errors.push("faculty");
      if (!classRows) errors.push("classes");
      if (!batchRows) errors.push("batches");
      setLookupErrors(errors);
    })();
    return () => {
      if (request === lookupRequestSeq.current) ++lookupRequestSeq.current;
      ++slotRequestSeq.current;
    };
  }, [collegeId, form]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return slots;
    return slots.filter((s) => `${s.name} ${s.programName || ""} ${s.description || ""}`.toLowerCase().includes(q));
  }, [slots, search]);

  const openEditor = (slot) => {
    form.resetFields();
    setEditDirty(false);
    setEditing(slot || "new");
    form.setFieldsValue(slot ? {
      programId: slot.programId, semesterNumber: slot.semesterNumber, academicYear: canonicalizeAcademicYear(slot.academicYear), name: slot.name,
      description: slot.description, credits: slot.credits, minPick: slot.minPick, maxPick: slot.maxPick,
    } : { credits: 3, minPick: 1, maxPick: 1 });
  };

  const saveSlot = async () => {
    const values = await form.validateFields().catch(() => null);
    if (!values) return;
    setSaving(true);
    try {
      if (editing === "new") {
        const res = await createSlot(values);
        message.success("Slot created");
        setEditDirty(false);
        setEditing(null);
        await load();
        setOpenSlotId(res.data.id);
      } else {
        await updateSlot(editing.id, values);
        message.success("Slot saved");
        setEditDirty(false);
        setEditing(null);
        load();
      }
    } catch (e) {
      message.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const archive = async (slot) => {
    if (archiveBusyId != null || saving) return;
    setArchiveBusyId(slot.id);
    try {
      await archiveSlot(slot.id);
      message.success(`${slot.name} archived`);
      if (openSlotId === slot.id) setOpenSlotId(null);
      load();
    } catch (e) {
      message.error(errorMessage(e));
    } finally {
      setArchiveBusyId(null);
    }
  };

  const finishEditorClose = () => {
    setEditing(null);
    setEditDirty(false);
    form.resetFields();
  };

  const requestEditorClose = () => {
    if (saving) return;
    if (!editDirty) {
      finishEditorClose();
      return;
    }
    Modal.confirm({
      title: editing === "new" ? "Discard this elective slot draft?" : "Discard elective slot edits?",
      content: "Your unsaved changes will be lost.",
      okText: "Discard",
      okButtonProps: { danger: true },
      cancelText: "Keep editing",
      onOk: finishEditorClose,
    });
  };

  const columns = [
    { title: "Slot", dataIndex: "name", render: (v, s) => (
      <Button type="link" style={{ padding: 0, height: "auto", textAlign: "left" }} onClick={() => setOpenSlotId(s.id)}><span><strong>{v}</strong>{s.description ? <span style={{ color: "#888", fontSize: 12, display: "block" }}>{s.description}</span> : null}</span></Button>
    ) },
    { title: "Program", dataIndex: "programName", width: 200, render: (v, s) => v || `Program #${s.programId}` },
    { title: "Sem", dataIndex: "semesterNumber", width: 70 },
    { title: "Year", dataIndex: "academicYear", width: 100, render: (v) => v || "—" },
    { title: "Credits", dataIndex: "credits", width: 80 },
    { title: "Pick", key: "pick", width: 80, render: (_, s) => s.minPick === s.maxPick ? s.maxPick : `${s.minPick}–${s.maxPick}` },
    { title: "Offerings", dataIndex: "offeringCount", width: 90 },
    { title: "Students", dataIndex: "currentStudentCount", width: 90, render: (v) => v ?? 0 },
    { title: "Status", dataIndex: "status", width: 100, render: (s) => <Tag color={s === "ACTIVE" ? "green" : "default"}>{s === "ACTIVE" ? "Active" : s === "ARCHIVED" ? "Archived" : s}</Tag> },
    { title: "", key: "actions", width: 210, render: (_, s) => (
      <Space size="small">
        <Button size="small" type="primary" onClick={() => setOpenSlotId(s.id)} disabled={archiveBusyId != null || saving}>Open</Button>
        <Button size="small" onClick={() => openEditor(s)} disabled={s.status !== "ACTIVE" || archiveBusyId != null || saving || lookupErrors.includes("programs")}>Edit</Button>
        {s.status === "ACTIVE" && <Popconfirm title="Archive this slot?" description="All its offerings are archived; enrolled students lose access, history is kept."
          disabled={archiveBusyId != null || saving} onConfirm={() => archive(s)}>
          <Button size="small" danger loading={archiveBusyId === s.id} disabled={archiveBusyId != null || saving}>Archive</Button>
        </Popconfirm>}
      </Space>
    ) },
  ];

  const openSlot = slots.find((s) => s.id === openSlotId) || null;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        <AdminTableToolbar
          searchValue={search} onSearch={setSearch} searchPlaceholder="Search slots" onRefresh={load} loading={loading}
          resultCount={filtered.length} totalCount={slots.length}
          extra={<Space size="small">
            <Select allowClear placeholder="Program" size="small" style={{ width: 200 }} value={programId} onChange={setProgramId} showSearch optionFilterProp="label"
              options={lookups.programs.map((p) => ({ value: p.id, label: p.name }))} />
            <Select allowClear placeholder="Semester" size="small" style={{ width: 110 }} value={semester} onChange={setSemester}
              options={Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `Sem ${i + 1}` }))} />
            <Select size="small" style={{ width: 130 }} value={includeArchived} onChange={setIncludeArchived}
              options={[{ value: false, label: "Active only" }, { value: true, label: "Incl. archived" }]} />
          </Space>} />
        <Button type="primary" icon={<PlusOutlined />} disabled={lookupErrors.includes("programs")} onClick={() => openEditor(null)}>New slot</Button>
      </div>

      <Alert type="info" showIcon style={{ marginBottom: 12 }}
        message="A slot is one elective choice for a program and semester, for example &ldquo;pick 1 of these 3 courses&rdquo;. Only students of that program who are in that semester right now can be added. Open a slot to add its courses, faculty and students." />
      {lookupErrors.length > 0 && <Alert type="error" showIcon style={{ marginBottom: 12 }}
        message="Some elective setup data could not be loaded"
        description={`Unavailable: ${lookupErrors.join(", ")}. Retry before creating or editing elective data.`}
        action={<Button size="small" onClick={() => window.location.reload()}>Reload</Button>} />}
      {loadError && <Alert type="error" showIcon style={{ marginBottom: 12 }}
        message="Elective slots could not be loaded" description={loadError}
        action={<Button size="small" onClick={load}>Retry slots</Button>} />}

      <Table rowKey="id" columns={columns} dataSource={filtered} loading={loading} size="middle" pagination={{ pageSize: 20, showSizeChanger: false }}
        locale={{ emptyText: loadError ? "Could not load elective slots; use Retry above." : "No elective slots yet. Create one per program × semester, e.g. “Professional Elective 1”." }} />

      {openSlot && <ElectiveSlotPanel slot={openSlot} lookups={lookups} onClose={() => setOpenSlotId(null)} onChanged={load} />}

      <Modal title={editing === "new" ? "New elective slot" : "Edit slot"} open={editing !== null} onCancel={requestEditorClose} onOk={saveSlot}
        okText={editing === "new" ? "Create" : "Save"} confirmLoading={saving} maskClosable={false}
        okButtonProps={{ disabled: lookupErrors.includes("programs") || archiveBusyId != null }} forceRender>
        <Form form={form} layout="vertical" requiredMark="optional" onValuesChange={() => setEditDirty(true)}>
          {editing !== "new" && editing?.hasEnrollmentHistory && <Alert type="info" showIcon style={{ marginBottom: 12 }}
            message="Academic identity is locked"
            description="This slot already has allocation history. Program, semester, academic year, credits and pick rules are preserved for audit/history; create a new slot for a new term." />}
          <Form.Item name="programId" label="Program" rules={[{ required: true, message: "Program is required" }]}>
            <Select showSearch optionFilterProp="label" disabled={editing !== "new" || lookupErrors.includes("programs")} placeholder="Select program"
              options={lookups.programs.map((p) => ({ value: p.id, label: p.name }))} />
          </Form.Item>
          <Space size="large" wrap>
            <Form.Item name="semesterNumber" label="Semester"
              rules={[
                { required: true, message: "Semester is required" },
                { validator: (_, value) => {
                  if (value == null) return Promise.resolve();
                  const p = lookups.programs.find((row) => idEq(row.id, form.getFieldValue("programId")));
                  const years = p?.durationYears ?? p?.duration_years;
                  return years && value > Number(years) * 2
                    ? Promise.reject(new Error(`This program has only ${Number(years) * 2} semesters`))
                    : Promise.resolve();
                } },
              ]}>
              <InputNumber min={1} max={12} disabled={editing !== "new" && editing?.hasEnrollmentHistory} style={{ width: 100 }} />
            </Form.Item>
            <Form.Item name="academicYear" label="Academic year"
              rules={[{ validator: (_, value) => isCanonicalAcademicYear(value)
                ? Promise.resolve() : Promise.reject(new Error("Use consecutive YYYY-YY years, e.g. 2026-27")) }]}>
              <Input placeholder="2026-27" style={{ width: 130 }} maxLength={7}
                disabled={editing !== "new" && editing?.hasEnrollmentHistory} />
            </Form.Item>
            <Form.Item name="credits" label="Credits">
              <InputNumber min={0} max={30} disabled={editing !== "new" && editing?.hasEnrollmentHistory} style={{ width: 100 }} />
            </Form.Item>
          </Space>
          <Form.Item name="name" label="Slot name" rules={[{ required: true, message: "Name is required" }, { max: 150 }]}>
            <Input placeholder="Professional Elective 1" />
          </Form.Item>
          <Form.Item name="description" label="Description" rules={[{ max: 1000 }]}><Input.TextArea rows={2} /></Form.Item>
          <Space size="large">
            <Form.Item name="minPick" label="Each student picks at least">
              <InputNumber min={0} max={10} disabled={editing !== "new" && editing?.hasEnrollmentHistory} style={{ width: 120 }} />
            </Form.Item>
            <Form.Item name="maxPick" label="Each student picks at most" tooltip="A student can’t be added to more of this slot’s courses than this.">
              <InputNumber min={1} max={10} disabled={editing !== "new" && editing?.hasEnrollmentHistory} style={{ width: 120 }} />
            </Form.Item>
          </Space>
          <Text type="secondary">Only students of this program who are in this semester right now can be added.</Text>
        </Form>
      </Modal>
    </div>
  );
}
