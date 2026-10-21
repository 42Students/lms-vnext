import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, Drawer, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Table, Tabs, Tag, Typography, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { archiveOffering, courseLabel, createOffering, errorMessage, getSlot, getUnallocated, personName, setOfferingFaculty, updateOffering, allocate } from "@/api/Services/ElectiveService";
import AllocateModal from "./AllocateModal";
import OfferingRosterDrawer from "./OfferingRosterDrawer";

const { Text } = Typography;

/** One slot: its offerings (course, faculty, seats) and the students not yet allocated. */
export default function ElectiveSlotPanel({ slot: initial, lookups, onClose, onChanged }) {
  const [slot, setSlot] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const requestSeq = useRef(0);
  const [addingOffering, setAddingOffering] = useState(false);
  const [facultyFor, setFacultyFor] = useState(null);
  const [capacityFor, setCapacityFor] = useState(null);
  const [allocateFor, setAllocateFor] = useState(null);
  const [rosterFor, setRosterFor] = useState(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [archiveBusyId, setArchiveBusyId] = useState(null);
  const [offeringForm] = Form.useForm();
  const [facultyForm] = Form.useForm();
  const [capacityForm] = Form.useForm();

  const reload = useCallback(async () => {
    const request = ++requestSeq.current;
    setLoading(true);
    setLoadError("");
    try {
      const res = await getSlot(initial.id);
      if (request !== requestSeq.current) return;
      setSlot(res.data);
      onChanged?.();
    } catch (e) {
      if (request !== requestSeq.current) return;
      const msg = errorMessage(e, "Could not load the slot");
      setLoadError(msg);
      message.error(msg);
    } finally {
      if (request === requestSeq.current) setLoading(false);
    }
  }, [initial.id, onChanged]);

  useEffect(() => {
    reload();
    return () => { ++requestSeq.current; };
  }, [reload]);

  const offerings = slot?.offerings || [];
  const active = slot?.status === "ACTIVE" && !loadError;

  const requestFormClose = (form, close) => {
    if (busyRef.current) return;
    if (!form.isFieldsTouched()) {
      close();
      return;
    }
    Modal.confirm({
      title: "Discard these elective changes?",
      content: "Your unsaved values will be lost.",
      okText: "Discard",
      okButtonProps: { danger: true },
      cancelText: "Keep editing",
      onOk: () => { form.resetFields(); close(); },
    });
  };

  const addOffering = async () => {
    if (busyRef.current) return;
    const v = await offeringForm.validateFields().catch(() => null);
    if (!v) return;
    busyRef.current = true;
    setBusy(true);
    try {
      await createOffering(slot.id, { courseId: v.courseId, capacity: v.capacity ?? null });
      message.success("Offering added");
      setAddingOffering(false);
      offeringForm.resetFields();
      reload();
    } catch (e) {
      message.error(errorMessage(e));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const saveFaculty = async () => {
    if (busyRef.current) return;
    const v = await facultyForm.validateFields().catch(() => null);
    if (!v) return;
    const orderedFaculty = [
      ...(v.primaryFacultyId ? [v.primaryFacultyId] : []),
      ...((v.coTeacherIds || []).filter((id) => id !== v.primaryFacultyId)),
    ];
    busyRef.current = true;
    setBusy(true);
    try {
      await setOfferingFaculty(facultyFor.id, orderedFaculty);
      message.success("Faculty updated");
      setFacultyFor(null);
      reload();
    } catch (e) {
      message.error(errorMessage(e));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const saveCapacity = async () => {
    if (busyRef.current) return;
    const v = await capacityForm.validateFields().catch(() => null);
    if (!v) return;
    busyRef.current = true;
    setBusy(true);
    try {
      await updateOffering(capacityFor.id, { capacity: v.capacity ?? null });
      message.success("Capacity updated");
      setCapacityFor(null);
      reload();
    } catch (e) {
      message.error(errorMessage(e));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const archive = async (o) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setArchiveBusyId(o.id);
    try {
      await archiveOffering(o.id);
      message.success("Offering archived");
      reload();
    } catch (e) {
      message.error(errorMessage(e));
    } finally {
      busyRef.current = false;
      setArchiveBusyId(null);
    }
  };

  const columns = [
    { title: "Course", key: "course", render: (_, o) => (
      <span><strong>{o.courseName || `Course #${o.courseId}`}</strong>{o.courseCode ? <Text type="secondary"> · {o.courseCode}</Text> : null}
        {/* Each offering runs as its own section; name it plainly instead of the internal "[Elective] ..." label. */}
        {o.backedClassName ? <div style={{ color: "#888", fontSize: 12 }}>Section: {String(o.backedClassName).replace(/^\[Elective\]\s*/, "")}</div> : null}</span>
    ) },
    { title: "Faculty", key: "faculty", width: 240, render: (_, o) => (
      <Space direction="vertical" size={0}>
        {(o.faculty || []).length ? o.faculty.map((f) => <span key={f.id}>{f.name}{f.role !== "PRIMARY" ? <Text type="secondary"> ({f.role === "CO_TEACHER" ? "co-teacher" : f.role.toLowerCase()})</Text> : null}</span>)
          : <Text type="warning">Not assigned</Text>}
        {o.status === "ACTIVE" && active && <Button type="link" size="small" style={{ padding: 0, height: "auto" }} onClick={() => {
          setFacultyFor(o);
          facultyForm.resetFields();
          const primary = (o.faculty || []).find((f) => f.role === "PRIMARY");
          facultyForm.setFieldsValue({
            primaryFacultyId: primary?.id,
            coTeacherIds: (o.faculty || []).filter((f) => f.role !== "PRIMARY").map((f) => f.id),
          });
        }}>Set faculty</Button>}
      </Space>
    ) },
    { title: "Seats", key: "seats", width: 170, render: (_, o) => (
      <span>{o.activeCount ?? 0}{o.capacity != null ? ` / ${o.capacity}` : " · unlimited"}
        {o.waitlistedCount ? <Tag color="gold" style={{ marginLeft: 6 }}>{o.waitlistedCount} waitlisted</Tag> : null}
        {o.status === "ACTIVE" && active && <div><Button type="link" size="small" style={{ padding: 0, height: "auto" }} onClick={() => { capacityForm.resetFields(); setCapacityFor(o); capacityForm.setFieldsValue({ capacity: o.capacity }); }}>Edit capacity</Button></div>}
      </span>
    ) },
    { title: "Status", dataIndex: "status", width: 100, render: (s) => <Tag color={s === "ACTIVE" ? "green" : "default"}>{s === "ACTIVE" ? "Active" : s === "ARCHIVED" ? "Archived" : s}</Tag> },
    { title: "", key: "actions", width: 250, render: (_, o) => (
      <Space size="small" wrap>
        <Button size="small" onClick={() => setRosterFor(o)}>Roster</Button>
        {o.status === "ACTIVE" && active && <Button size="small" type="primary" onClick={() => setAllocateFor(o)}>Add students</Button>}
        {o.status === "ACTIVE" && active && <Popconfirm title="Archive this offering?" description="Enrolled students lose access; grades and attendance stay." disabled={busy || archiveBusyId != null} onConfirm={() => archive(o)}>
          <Button size="small" danger loading={archiveBusyId === o.id} disabled={busy || archiveBusyId != null}>Archive</Button>
        </Popconfirm>}
      </Space>
    ) },
  ];

  // Only a LIVE offering blocks re-picking its course (matches the backend: an archived
  // offering's (slot, course) pairing can be re-offered — ARCHIVED is terminal for the offering
  // itself, but not for whether that course can come back into the slot under a new offering).
  const usedCourseIds = useMemo(() => new Set(offerings.filter((o) => o.status === "ACTIVE").map((o) => o.courseId)), [offerings]);

  return (
    <Drawer open width={Math.min(1100, typeof window !== "undefined" ? window.innerWidth - 40 : 1100)} onClose={onClose} destroyOnClose
      title={<Space wrap><span>{slot.name}</span><Tag>{slot.programName || `Program #${slot.programId}`}</Tag><Tag>Sem {slot.semesterNumber}</Tag>
        {slot.academicYear && <Tag>Year {slot.academicYear}</Tag>}<Tag color={active ? "green" : "default"}>Status: {slot.status === "ARCHIVED" ? "Archived" : slot.status === "ACTIVE" ? "Active" : slot.status}</Tag></Space>}>
      {loadError && <Alert type="error" showIcon style={{ marginBottom: 12 }}
        message="Could not refresh this elective slot" description={loadError}
        action={<Button size="small" onClick={reload}>Retry</Button>} />}
      <Tabs defaultActiveKey="offerings" items={[
        { key: "offerings", label: `Offerings (${offerings.length})`, children: (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
              <Text type="secondary">{slot.credits} credits · {slot.currentStudentCount ?? 0} current student{slot.currentStudentCount === 1 ? "" : "s"} · {slot.allocatedCount ?? 0} seat{slot.allocatedCount === 1 ? "" : "s"} taken · each student picks {slot.minPick === slot.maxPick ? slot.minPick : `${slot.minPick}–${slot.maxPick}`}</Text>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => { offeringForm.resetFields(); setAddingOffering(true); }} disabled={!active || busy || archiveBusyId != null}>Add offering</Button>
            </div>
            <Table rowKey="id" columns={columns} dataSource={offerings} loading={loading} size="small" pagination={false}
              locale={{ emptyText: "No offerings yet. Add the courses students can be allocated to." }} />
          </div>
        ) },
        { key: "unallocated", label: "Eligible students", children: <UnallocatedTab slot={slot} offerings={offerings.filter((o) => o.status === "ACTIVE")} classes={lookups.classes} onChanged={reload} /> },
      ]} />

      <Modal title="Add offering" open={addingOffering} onCancel={() => requestFormClose(offeringForm, () => setAddingOffering(false))} onOk={addOffering} okText="Add" confirmLoading={busy} maskClosable={false} forceRender>
        <Form form={offeringForm} layout="vertical">
          <Form.Item name="courseId" label="Course" rules={[{ required: true, message: "Pick a course" }]}>
            <Select showSearch optionFilterProp="label" placeholder="Search the college's courses"
              options={lookups.courses.filter((c) => !usedCourseIds.has(c.id)).map((c) => ({ value: c.id, label: courseLabel(c) }))} />
          </Form.Item>
          <Form.Item name="capacity" label="Capacity" tooltip="Leave empty for unlimited. Extra students are waitlisted in allocation order.">
            <InputNumber min={1} placeholder="Unlimited" style={{ width: 160 }} />
          </Form.Item>
          <Alert type="info" showIcon message="This creates a dedicated class for the offering. Lessons, quizzes, timetable and attendance for the elective live on that class; the roster is whoever you allocate." />
        </Form>
      </Modal>

      <Modal title={`Faculty — ${facultyFor?.courseName || ""}`} open={!!facultyFor} onCancel={() => requestFormClose(facultyForm, () => setFacultyFor(null))} onOk={saveFaculty} okText="Save" confirmLoading={busy} maskClosable={false} forceRender>
        <Form form={facultyForm} layout="vertical">
          <Form.Item name="primaryFacultyId" label="Primary instructor">
            <Select allowClear showSearch optionFilterProp="label" placeholder="Select primary faculty"
              options={lookups.faculty.map((f) => ({ value: f.id, label: personName(f) }))} />
          </Form.Item>
          <Form.Item name="coTeacherIds" label="Co-teachers"
            rules={[{ validator: (_, values) => {
              const primary = facultyForm.getFieldValue("primaryFacultyId");
              if ((values || []).length > 0 && !primary) {
                return Promise.reject(new Error("Choose a primary instructor before adding co-teachers"));
              }
              return primary && (values || []).includes(primary)
                ? Promise.reject(new Error("Primary instructor cannot also be a co-teacher"))
                : Promise.resolve();
            } }]}>
            <Select mode="multiple" showSearch optionFilterProp="label" placeholder="Optional co-teachers"
              options={lookups.faculty.map((f) => ({ value: f.id, label: personName(f) }))} />
          </Form.Item>
          <Text type="secondary">Primary and co-teacher roles are explicit; selection order no longer changes teaching ownership.</Text>
        </Form>
      </Modal>

      <Modal title={`Capacity — ${capacityFor?.courseName || ""}`} open={!!capacityFor} onCancel={() => requestFormClose(capacityForm, () => setCapacityFor(null))} onOk={saveCapacity} okText="Save" confirmLoading={busy} maskClosable={false} forceRender>
        <Form form={capacityForm} layout="vertical">
          <Form.Item name="capacity" label="Capacity" tooltip="Cannot go below the current enrolled count">
            <InputNumber min={1} placeholder="Unlimited" style={{ width: 160 }} />
          </Form.Item>
        </Form>
      </Modal>

      {allocateFor && <AllocateModal offering={allocateFor} slot={slot} classes={lookups.classes} batches={lookups.batches} onClose={() => setAllocateFor(null)} onDone={reload} />}
      {rosterFor && <OfferingRosterDrawer offering={rosterFor} siblings={offerings.filter((o) => o.id !== rosterFor.id && o.status === "ACTIVE")}
        onClose={() => setRosterFor(null)} onChanged={reload} />}
    </Drawer>
  );
}

function UnallocatedTab({ slot, offerings, classes, onChanged }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState([]);
  const [target, setTarget] = useState();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  // A whole semester of one program can be several hundred students; picking a section's worth
  // by scrolling 50-row pages was the only way to find anyone.
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState();
  const requestSeq = useRef(0);
  const classNameById = useMemo(() => new Map((classes || []).map((c) => [Number(c.id), c.name])), [classes]);
  const belowMinimumCount = useMemo(
    () => rows.filter((r) => Number(r.currentPickCount ?? 0) < Number(slot.minPick ?? 0)).length,
    [rows, slot.minPick],
  );

  const load = useCallback(async () => {
    const request = ++requestSeq.current;
    setLoading(true);
    try {
      const res = await getUnallocated(slot.id);
      if (request !== requestSeq.current) return;
      setRows(Array.isArray(res?.data) ? res.data : []);
      setSelected([]);
    } catch (e) {
      if (request !== requestSeq.current) return;
      setRows([]);
      setSelected([]);
      message.error(errorMessage(e, "Could not load eligible students"));
    } finally {
      if (request === requestSeq.current) setLoading(false);
    }
  }, [slot.id]);

  useEffect(() => {
    load();
    return () => { ++requestSeq.current; };
  }, [load]);

  const classOf = (r) => r.className || classNameById.get(Number(r.classId)) || "";
  const classOptions = useMemo(() => [...new Set(rows.map(classOf).filter(Boolean))].sort().map((c) => ({ value: c, label: c })), [rows]); // eslint-disable-line react-hooks/exhaustive-deps
  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => (!classFilter || classOf(r) === classFilter)
      && (!q || `${r.name || ""} ${r.rollNumber || ""} ${r.department || ""}`.toLowerCase().includes(q)));
  }, [rows, query, classFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const allocateSelected = async () => {
    if (!target || selected.length === 0) return;
    setResult(null);
    setBusy(true);
    try {
      const res = await allocate(target, { learnerIds: selected });
      setResult(res.data);
      await load();
      onChanged?.();
    } catch (e) {
      message.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <Alert type={belowMinimumCount > 0 ? "warning" : "info"} showIcon style={{ marginBottom: 12 }}
        message={belowMinimumCount > 0
          ? `${belowMinimumCount} student${belowMinimumCount === 1 ? "" : "s"} still below the required minimum of ${slot.minPick} pick${slot.minPick === 1 ? "" : "s"}`
          : `All listed students have met the required minimum; they remain eligible for optional picks up to ${slot.maxPick}.`}
        description={`Only students of ${slot.programName || "this program"} whose batch is in Semester ${slot.semesterNumber} are listed here. Students disappear once they reach the maximum of ${slot.maxPick}.`} />
      <Space wrap style={{ marginBottom: 12 }}>
        <Select placeholder="Allocate selected to…" style={{ width: 320 }} value={target} onChange={setTarget} showSearch optionFilterProp="label"
          options={offerings.map((o) => ({ value: o.id, label: `${o.courseName || `Course #${o.courseId}`}${o.capacity != null ? ` (${o.activeCount ?? 0}/${o.capacity})` : ""}` }))} />
        <Button type="primary" disabled={!target || selected.length === 0} loading={busy} onClick={allocateSelected}>Allocate {selected.length || ""}</Button>
        <Button onClick={load} loading={loading}>Refresh</Button>
        <Text type="secondary">{visibleRows.length === rows.length ? `${rows.length} eligible` : `${visibleRows.length} of ${rows.length} eligible`}{selected.length ? ` · ${selected.length} selected` : ""}</Text>
      </Space>
      <Space wrap style={{ marginBottom: 12 }}>
        <Input.Search allowClear placeholder="Search name, roll no. or dept" style={{ width: 260 }} value={query} onChange={(e) => setQuery(e.target.value)} />
        <Select allowClear placeholder="All classes" style={{ width: 200 }} value={classFilter} onChange={setClassFilter} options={classOptions} />
      </Space>
      {result && <Alert style={{ marginBottom: 12 }} type={result.errors?.length ? "warning" : "success"} showIcon closable onClose={() => setResult(null)}
        message={`${result.added} allocated${result.waitlisted ? `, ${result.waitlisted} waitlisted` : ""}${result.errors?.length ? `, ${result.errors.length} skipped` : ""}${result.warnings?.length ? ` · ${result.warnings.length} timetable warning${result.warnings.length === 1 ? "" : "s"}` : ""}`}
        description={(result.errors?.length || result.warnings?.length) ? <ul style={{ margin: 0, paddingLeft: 18, maxHeight: 160, overflow: "auto" }}>
          {(result.errors || []).map((e, i) => <li key={`e${i}`}>{e.name || e.rollNumber || `#${e.learnerId}`}: {e.message}</li>)}
          {(result.warnings || []).map((w, i) => <li key={`w${i}`}>{w.name || w.rollNumber || `#${w.learnerId}`}: {w.message}</li>)}
        </ul> : null} />}
      <Table rowKey="learnerId" size="small" loading={loading} dataSource={visibleRows} pagination={{ pageSize: 50, showSizeChanger: false }}
        rowSelection={{ selectedRowKeys: selected, onChange: setSelected, preserveSelectedRowKeys: true }}
        columns={[
          { title: "Student", key: "n", render: (_, r) => <span>{r.name}{r.rollNumber ? <Text type="secondary"> · {r.rollNumber}</Text> : null}</span> },
          { title: "Dept", dataIndex: "department", width: 100 },
          { title: "Class", key: "class", width: 160, render: (_, r) => classOf(r) || "—" },
          { title: "Picks", key: "picks", width: 150, render: (_, r) => {
            const current = Number(r.currentPickCount ?? 0);
            const minimum = Number(slot.minPick ?? 0);
            const maximum = Number(slot.maxPick ?? 1);
            return current < minimum
              ? <Tag color="orange">{current}/{minimum} required · max {maximum}</Tag>
              : <Tag color="green">{current}/{minimum} minimum met · max {maximum}</Tag>;
          } },
        ]} />
    </div>
  );
}
