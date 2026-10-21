import { useCallback, useEffect, useRef, useState } from "react";
import { label } from "../ui/labels";
import { Alert, Button, DatePicker, Divider, Form, Input, InputNumber, List, Modal, Popconfirm, Select, Skeleton, Space, Table, Tag, Typography, message } from "antd";
import { generateSlots } from "../ui/slotGenerator";
import { dj, serverTime } from "@/components/tpo/dj";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import {
  clearUnbookedSlots, commitAssignment, confirmSlot, decideReschedule, deleteSlot, getAssignments, getRescheduleRequests, getSlots, previewAssignment, proposeSlots,
} from "@/api/Services/TpoHubService";

const errorText = (res, fallback) => res?.data?.message || res?.data?.error || res?.message || fallback;
const t = (v) => (v ? dj(v).format("D MMM, h:mm A") : "");

/**
 * Slots, room and slot assignment with a preview, and reschedule requests for one round (TPO V1 - Locked.docx §5 Rounds).
 * Tests are assigned by roll number range per room. Interviews go to the first free slot that does not clash with another
 * round the student is in. "Could not place" students are listed for manual handling. Nobody is told until you commit.
 */
export default function ScheduleModal({ round, job, onClose, readOnly = false }) {
  const [slots, setSlots] = useState([]);
  const [requests, setRequests] = useState([]);
  const [assigned, setAssigned] = useState([]);
  const [rooms, setRooms] = useState([{ name: "Hall A", capacity: 60 }]);
  const [roomsDirty, setRoomsDirty] = useState(false);
  const [preview, setPreview] = useState(null);
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [loadedRoundId, setLoadedRoundId] = useState(null);
  const [loadErrors, setLoadErrors] = useState({});
  const roundIdRef = useRef(round?.id);
  roundIdRef.current = round?.id;
  const [slotForm] = Form.useForm();
  const [genForm] = Form.useForm();
  const [generated, setGenerated] = useState(null); // { slots, error }
  const [dragApp, setDragApp] = useState(null);
  const [overSlot, setOverSlot] = useState(null);
  const isInterview = round?.kind === "INTERVIEW";
  const terminal = ["COMPLETED", "CANCELLED"].includes(round?.status);
  const locked = readOnly || terminal;
  const lockMessage = terminal ? "This round is complete or cancelled. Scheduling is read-only." : "This drive is read-only.";

  useEffect(() => {
    setSlots([]);
    setRequests([]);
    setAssigned([]);
    setPreview(null);
    setLoadErrors({});
    setLoadedRoundId(null);
  }, [round?.id]);

  const load = useCallback(async () => {
    if (!round) return;
    const targetRoundId = round.id;
    setLoading(true);
    const [s, q, a] = await Promise.all([
      fetchWithErrorHandling(getSlots(targetRoundId)), fetchWithErrorHandling(getRescheduleRequests(targetRoundId)), fetchWithErrorHandling(getAssignments(targetRoundId)),
    ]);
    if (roundIdRef.current !== targetRoundId) return;
    const errors = {};
    if (s.success && Array.isArray(s.data)) setSlots(s.data);
    else errors.slots = errorText(s, "Could not verify slots");
    if (q.success && Array.isArray(q.data)) setRequests(q.data);
    else errors.requests = errorText(q, "Could not verify reschedule requests");
    if (a.success && Array.isArray(a.data)) setAssigned(a.data);
    else errors.assignments = errorText(a, "Could not verify existing assignments");
    setLoadErrors(errors);
    setLoadedRoundId(targetRoundId);
    setLoading(false);
    setPreview(null);
  }, [round]);
  useEffect(() => { load(); }, [load]);

  // rejectOnFailure keeps a confirm dialog / Popconfirm open on failure (antd waits on the rejected promise).
  const run = async (call, ok, rejectOnFailure = false) => {
    if (busyRef.current) return null;
    busyRef.current = true;
    setBusy(true);
    try {
      const res = await fetchWithErrorHandling(call);
      if (!res.success) {
        const detail = errorText(res, "That did not work");
        message.error(detail);
        if (rejectOnFailure) throw new Error(detail);
        return null;
      }
      if (ok) message.success(ok);
      return res.data;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const addSlot = async () => {
    if (locked || loadErrors.slots) { message.warning(locked ? lockMessage : "Retry loading slots before adding one."); return; }
    try {
      const v = await slotForm.validateFields();
      const body = { startsAt: serverTime(v.range[0]), endsAt: serverTime(v.range[1]), room: v.room, panel: v.panel, capacity: v.capacity || 1 };
      if (await run(proposeSlots(round.id, [body]), "Slot added")) { slotForm.resetFields(); load(); }
    } catch (_) { /* validation */ }
  };

  const confirm = (slot) => {
    if (locked || loadErrors.slots) { message.warning(locked ? lockMessage : "Retry loading slots before confirming one."); return; }
    let room = slot.room || "";
    Modal.confirm({
      title: "Confirm this slot",
      content: round.mode === "VIRTUAL" ? "Virtual panels need no venue." : <Input defaultValue={room} placeholder="Venue or room" onChange={(e) => { room = e.target.value; }} />,
      onOk: async () => { if (await run(confirmSlot(round.id, slot.id, room), "Slot confirmed", true)) load(); },
    });
  };

  const doPreview = async () => {
    if (loadErrors.slots || loadErrors.assignments) { message.warning("Retry the missing schedule data before previewing assignments."); return; }
    setPreview(await run(previewAssignment(round.id, isInterview ? null : rooms)));
  };
  const doCommit = async () => {
    if (locked) { message.warning(lockMessage); return; }
    if (await run(commitAssignment(round.id, preview.placed, notify), `Saved${notify ? " and students told" : ""}`)) load();
  };

  const decide = (req, decision) => {
    if (locked) { message.warning(lockMessage); return; }
    if (decision === "MOVE") {
      let slotId = null;
      Modal.confirm({
        title: "Move to which slot?",
        content: <Select style={{ width: "100%" }} placeholder="Choose a confirmed slot" onChange={(v) => { slotId = v; }}
          options={slots.filter((s) => s.status === "CONFIRMED").map((s) => ({ value: s.id, label: `${t(s.startsAt)} ${s.room || ""}` }))} />,
        onOk: async () => {
          if (!slotId) {
            message.warning("Choose a confirmed slot before moving the student.");
            return Promise.reject(new Error("slot required"));
          }
          if (await run(decideReschedule(req.id, { decision, newSlotId: slotId, reply: "Moved" }), "Moved. The student must confirm again.", true)) load();
          return undefined;
        },
      });
    } else {
      run(decideReschedule(req.id, { decision, reply: "Your slot stays as it is." }), "Kept").then(() => load());
    }
  };

  // ---- slot generator: the whole day in one step
  const previewGenerated = async () => {
    const v = genForm.getFieldsValue();
    setGenerated(generateSlots({
      date: v.date ? v.date.format("YYYY-MM-DD") : "", start: v.start, end: v.end, lengthMin: v.lengthMin, gapMin: v.gapMin,
      breakEvery: v.breakEvery, breakMin: v.breakMin, rooms: v.rooms || [], capacity: v.capacity,
    }));
  };
  const addGenerated = async () => {
    if (locked || loadErrors.slots) { message.warning(locked ? lockMessage : "Retry loading slots before adding generated slots."); return; }
    if (!generated?.slots?.length) return;
    const r = await run(proposeSlots(round.id, generated.slots), `${generated.slots.length} slots added`);
    if (r) { setGenerated(null); genForm.resetFields(); load(); }
  };
  const removeSlot = async (slot, rejectOnFailure = false) => {
    if (locked || loadErrors.slots) { message.warning(locked ? lockMessage : "Retry loading slots before removing one."); return; }
    if (await run(deleteSlot(round.id, slot.id), "Slot removed", rejectOnFailure)) load();
  };
  const clearUnbooked = async (rejectOnFailure = false) => {
    if (locked || loadErrors.slots) { message.warning(locked ? lockMessage : "Retry loading slots before removing them."); return; }
    const r = await run(clearUnbookedSlots(round.id), null, rejectOnFailure);
    if (r) { message.success(`${r.removed} unbooked slot${r.removed === 1 ? "" : "s"} removed`); load(); }
  };

  // ---- place a student the automatic assignment could not: drag onto a slot row, or pick the slot
  const freeSeats = (s) => (Number(s.capacity) || 0) - (Number(s.booked) || 0);
  const placeStudent = async (applicationId, slot) => {
    if (locked) { message.warning(lockMessage); return; }
    if (loadErrors.slots || loadErrors.assignments) { message.warning("Retry the missing schedule data before placing students."); return; }
    if (!slot || freeSeats(slot) <= 0) { message.warning("That slot is full."); return; }
    const ok = await run(commitAssignment(round.id, [{ applicationId, slotId: slot.id, room: slot.room || null, startsAt: slot.startsAt }], notify), `Placed${notify ? " and told" : ""}`);
    if (ok) {
      setPreview((pv) => (pv ? { ...pv, couldNotPlace: pv.couldNotPlace.filter((c) => c.applicationId !== applicationId) } : pv));
      const s = await fetchWithErrorHandling(getSlots(round.id));
      setSlots(Array.isArray(s.data) ? s.data : []);
    }
  };

  const finishClose = () => {
    slotForm.resetFields();
    genForm.resetFields();
    setGenerated(null);
    setPreview(null);
    setRooms([{ name: "Hall A", capacity: 60 }]);
    setRoomsDirty(false);
    setNotify(true);
    onClose?.();
  };

  const requestClose = () => {
    if (busy) {
      message.info("Wait for the scheduling action to finish.");
      return;
    }
    const hasDraft = slotForm.isFieldsTouched()
      || genForm.isFieldsTouched()
      || Boolean(generated?.slots?.length)
      || Boolean(preview)
      || roomsDirty;
    if (!hasDraft) {
      finishClose();
      return;
    }
    Modal.confirm({
      title: "Discard scheduling changes?",
      content: "Unsaved slot inputs, generated slots or assignment preview changes will be cleared.",
      okText: "Discard changes",
      okButtonProps: { danger: true },
      cancelText: "Keep scheduling",
      onOk: finishClose,
    });
  };

  const recruiterProposals = slots.filter((s) => s.proposedBy === "RECRUITER" && s.status === "PROPOSED");

  return (
    <Modal open={Boolean(round)} onCancel={requestClose} maskClosable={false} closable={!busy} keyboard={!busy} footer={null} width={860} destroyOnClose title={`Slots and rooms: ${round?.name || ""}`}>
      {round && loadedRoundId !== round.id ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : (
        <>
      {Object.keys(loadErrors).length > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 12 }}
          message="Schedule data is partially unavailable"
          description={[
            loadErrors.slots ? "Slots could not be verified." : null,
            loadErrors.requests ? "Reschedule requests could not be verified." : null,
            loadErrors.assignments ? "Existing assignments could not be verified." : null,
          ].filter(Boolean).join(" ")}
          action={<Button size="small" loading={loading} onClick={load}>Retry missing data</Button>}
        />
      )}
      {locked && <Alert type="info" showIcon style={{ marginBottom: 12 }} message={lockMessage} description="You can review the current schedule, but changes are disabled." />}
      {recruiterProposals.length > 0 && (
        <Alert type="warning" showIcon style={{ marginBottom: 12 }} message="The recruiter proposed these slots" description={
          <List size="small" dataSource={recruiterProposals} renderItem={(s) => <List.Item actions={[<Button key="c" size="small" type="primary" disabled={locked || busy || Boolean(loadErrors.slots)} onClick={() => confirm(s)}>Confirm with venue</Button>]}>{t(s.startsAt)} to {t(s.endsAt)}</List.Item>} />} />
      )}

      <Typography.Title level={5}>Slots</Typography.Title>
      <Table size="small" rowKey="id" dataSource={slots} loading={loading} pagination={slots.length > 12 ? { pageSize: 12, size: "small" } : false} locale={{ emptyText: loadErrors.slots ? "Slots are unavailable" : "No slots yet" }}
        onRow={(s) => ({
          className: `tpo-slot-row${overSlot === s.id ? " is-drop" : ""}`,
          onDragOver: (e) => { if (dragApp != null) { e.preventDefault(); setOverSlot(s.id); } },
          onDragLeave: () => setOverSlot(null),
          onDrop: (e) => { e.preventDefault(); const a = dragApp; setDragApp(null); setOverSlot(null); if (a != null) placeStudent(a, s); },
        })}
        columns={[{ title: "When", render: (_, s) => `${t(s.startsAt)} to ${t(s.endsAt)}` }, { title: "Room", dataIndex: "room", render: (v) => v || "-" }, { title: "Panel", dataIndex: "panel", render: (v) => v || "-" },
          { title: "Booked", render: (_, s) => `${s.booked}/${s.capacity}` },
          { title: "", dataIndex: "status", render: (v, s) => (v === "CONFIRMED" ? <Tag color="green">Confirmed</Tag> : <Button size="small" disabled={locked || busy || Boolean(loadErrors.slots)} onClick={() => confirm(s)}>Confirm</Button>) },
          { title: "", key: "rm", width: 90, render: (_, s) => (Number(s.booked) > 0 ? null : (
            <Popconfirm title="Remove this slot?" disabled={locked || busy || Boolean(loadErrors.slots)} okText="Remove" okButtonProps={{ danger: true }} onConfirm={() => removeSlot(s, true)}><Button size="small" type="text" danger disabled={locked || busy || Boolean(loadErrors.slots)} aria-label={`Remove slot ${t(s.startsAt)}`}>Remove</Button></Popconfirm>
          )) }]} />
      {slots.some((s) => !(Number(s.booked) > 0)) && slots.length > 1 && (
        <Popconfirm title="Remove every slot nobody is booked into?" description="Slots with students in them stay." okText="Remove them" okButtonProps={{ danger: true }} onConfirm={() => clearUnbooked(true)}>
          <Button size="small" type="link" danger disabled={locked || busy || Boolean(loadErrors.slots)}>Clear all unbooked slots</Button>
        </Popconfirm>
      )}
      <div className="tpo-slotgen">
        <Typography.Text strong>Generate the day</Typography.Text>
        <Typography.Text type="secondary"> pick the window and slot length, and every slot is made for you.</Typography.Text>
        <Form form={genForm} layout="inline" style={{ marginTop: 8, rowGap: 8 }} initialValues={{ lengthMin: 20, gapMin: 0, capacity: 1, rooms: [] }} onValuesChange={() => setGenerated(null)}>
          <Form.Item name="date" label="Date"><DatePicker /></Form.Item>
          <Form.Item name="start" label="From"><Input type="time" style={{ width: 120 }} /></Form.Item>
          <Form.Item name="end" label="To"><Input type="time" style={{ width: 120 }} /></Form.Item>
          <Form.Item name="lengthMin" label="Slot (min)"><InputNumber min={5} max={480} style={{ width: 80 }} /></Form.Item>
          <Form.Item name="gapMin" label="Gap (min)"><InputNumber min={0} max={120} style={{ width: 70 }} /></Form.Item>
          <Form.Item name="breakEvery" label="Break after every"><InputNumber min={0} max={50} style={{ width: 70 }} placeholder="slots" /></Form.Item>
          <Form.Item name="breakMin" label="for (min)"><InputNumber min={0} max={180} style={{ width: 70 }} /></Form.Item>
          <Form.Item name="rooms" label="Rooms or panels"><Select mode="tags" style={{ minWidth: 200 }} tokenSeparators={[","]} placeholder="e.g. Panel A, Panel B (empty = one)" /></Form.Item>
          <Form.Item name="capacity" label="Seats per slot"><InputNumber min={1} style={{ width: 80 }} /></Form.Item>
          <Button onClick={previewGenerated}>Preview slots</Button>
        </Form>
        {generated?.error && <Alert style={{ marginTop: 8 }} type="warning" showIcon message={generated.error} />}
        {generated?.slots?.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <Alert type="info" showIcon message={`${generated.slots.length} slots, ${t(generated.slots[0].startsAt)} to ${t(generated.slots[generated.slots.length - 1].endsAt)}`}
              description={<Space wrap size={[4, 4]}>{generated.slots.slice(0, 8).map((s, i) => <Tag key={i}>{dj(s.startsAt).format("h:mm")}{s.room ? ` ${s.room}` : ""}</Tag>)}{generated.slots.length > 8 && <Typography.Text type="secondary">and {generated.slots.length - 8} more</Typography.Text>}</Space>} />
            <Button type="primary" style={{ marginTop: 8 }} loading={busy} disabled={locked || Boolean(loadErrors.slots)} onClick={addGenerated}>Add {generated.slots.length} slots</Button>
          </div>
        )}
      </div>
      <Form form={slotForm} layout="inline" style={{ marginTop: 12, rowGap: 8 }}>
        <Form.Item name="range" rules={[{ required: true, message: "Pick a time" }]}><DatePicker.RangePicker showTime format="D MMM h:mm A" /></Form.Item>
        <Form.Item name="room"><Input placeholder="Room" style={{ width: 110 }} /></Form.Item>
        <Form.Item name="panel"><Input placeholder="Panel" style={{ width: 110 }} /></Form.Item>
        <Form.Item name="capacity"><InputNumber min={1} placeholder="Seats" style={{ width: 80 }} /></Form.Item>
        <Button onClick={addSlot} loading={busy} disabled={locked || Boolean(loadErrors.slots)}>Add slot</Button>
      </Form>

      <Divider />
      <Typography.Title level={5}>{isInterview ? "Assign interview slots" : "Assign rooms by roll number"}</Typography.Title>
      {!isInterview && rooms.map((r, i) => (
        <Space key={i} style={{ marginBottom: 8 }}>
          <Input value={r.name} style={{ width: 160 }} onChange={(e) => { setRoomsDirty(true); setRooms(rooms.map((x, j) => (j === i ? { ...x, name: e.target.value } : x))); }} />
          <InputNumber min={1} value={r.capacity} onChange={(v) => { setRoomsDirty(true); setRooms(rooms.map((x, j) => (j === i ? { ...x, capacity: v } : x))); }} addonAfter="seats" />
          {rooms.length > 1 && <Button size="small" onClick={() => { setRoomsDirty(true); setRooms(rooms.filter((_, j) => j !== i)); }}>Remove</Button>}
        </Space>
      ))}
      {!isInterview && <div><Button size="small" onClick={() => setRooms([...rooms, { name: `Hall ${String.fromCharCode(65 + rooms.length)}`, capacity: 60 }])}>Add a room</Button></div>}
      <Button type="primary" style={{ marginTop: 8 }} onClick={doPreview} loading={busy} disabled={Boolean(loadErrors.slots || loadErrors.assignments)}>Preview assignment</Button>
      {assigned.length > 0 && !preview && <Typography.Paragraph type="secondary" style={{ marginTop: 8 }}>{assigned.length} students already assigned. Previewing again replaces their placement when you save.</Typography.Paragraph>}

      {preview && (
        <div style={{ marginTop: 12 }}>
          <Alert type="info" showIcon message={`${preview.placed.length} of ${preview.total} placed. Nobody is told until you save.`} />
          {preview.couldNotPlace.length > 0 && (
            <Alert type="warning" showIcon style={{ marginTop: 8 }} message={`Could not place (${preview.couldNotPlace.length}). Drag a student onto a slot above, or pick a slot.`}
              description={(
                <div className="tpo-unplaced">
                  {preview.couldNotPlace.map((c) => (
                    <div key={c.applicationId} className="tpo-unplaced__row" draggable={!locked} onDragStart={() => { if (!locked) setDragApp(c.applicationId); }} onDragEnd={() => { setDragApp(null); setOverSlot(null); }}>
                      <span><b>{c.name}</b> <Typography.Text type="secondary">{c.roll} · {c.reason}</Typography.Text></span>
                      <Select size="small" style={{ width: 220 }} placeholder="Place in a slot" aria-label={`Place ${c.name}`}
                        disabled={locked}
                        options={slots.filter((s) => s.status === "CONFIRMED" && freeSeats(s) > 0).map((s) => ({ value: s.id, label: `${t(s.startsAt)} ${s.room || ""} (${freeSeats(s)} free)` }))}
                        onChange={(sid) => placeStudent(c.applicationId, slots.find((s) => s.id === sid))} />
                    </div>
                  ))}
                </div>
              )} />
          )}
          <Table size="small" style={{ marginTop: 8 }} rowKey="applicationId" dataSource={preview.placed} pagination={{ pageSize: 6 }}
            columns={[{ title: "Student", dataIndex: "name" }, { title: "Roll", dataIndex: "roll" }, { title: "Room", dataIndex: "room" }, { title: "Slot", dataIndex: "startsAt", render: (v) => (v ? t(v) : "-") }]} />
          <Space style={{ marginTop: 8 }}>
            <Select value={notify} onChange={setNotify} style={{ width: 240 }} options={[{ value: true, label: "Save and tell the students" }, { value: false, label: "Save without telling anyone yet" }]} />
            <Button type="primary" onClick={doCommit} loading={busy} disabled={locked || preview.placed.length === 0}>Save assignment</Button>
          </Space>
        </div>
      )}

      {requests.length > 0 && (
        <>
          <Divider />
          <Typography.Title level={5}>Reschedule requests</Typography.Title>
          <List size="small" dataSource={requests} renderItem={(q) => (
            <List.Item actions={q.status === "PENDING" ? [<Button key="m" size="small" disabled={locked || busy} onClick={() => decide(q, "MOVE")}>Move to slot</Button>, <Button key="k" size="small" disabled={locked || busy} onClick={() => decide(q, "KEEP")}>Keep</Button>] : [<Tag key="s">{({ MOVED: "Moved to a new slot", KEPT: "Kept their slot" })[q.status] || label("request", q.status)}</Tag>]}>
              <List.Item.Meta title={`${q.firstName || ""} ${q.lastName || ""} · ${q.rollNumber || ""}`} description={`${q.reason || "No reason given"}${q.preferredTimes ? ` · prefers ${q.preferredTimes}` : ""}`} />
            </List.Item>
          )} />
        </>
      )}
        </>
      )}
    </Modal>
  );
}
