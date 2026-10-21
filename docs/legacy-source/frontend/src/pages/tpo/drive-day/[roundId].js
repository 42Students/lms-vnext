import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Alert, Avatar, Button, Card, Empty, Input, Modal, Select, Skeleton, Space, Tag, Typography, message } from "antd";
import { CheckOutlined, CloseOutlined, PhoneOutlined, UserOutlined } from "@ant-design/icons";
import PageStrip from "@/components/tpo/ui/PageStrip";
import { findByRoll, nextInQueue, roomSummary } from "@/components/tpo/ui/driveDayRules";
import { matchRolls, parseRolls } from "@/components/tpo/ui/rollParser";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { stageResult } from "@/api/Services/TpoService";
import { getRoster, markAttendance } from "@/api/Services/TpoHubService";
import { plural } from "@/components/tpo/ui/labels";
import { ListSkeleton } from "@/components/Common/Skeletons";

const errorText = (res, fallback) => res?.data?.message || res?.data?.error || res?.message || fallback;
const LABEL = { WAITING: "Waiting", PRESENT: "Present", IN_INTERVIEW: "In interview", DONE: "Done", ABSENT: "Absent" };
const COLOR = { WAITING: "default", PRESENT: "green", IN_INTERVIEW: "blue", DONE: "purple", ABSENT: "red" };

/**
 * Drive day, phone first (TPO V1 - Locked.docx §5): roll search, counts, room chips, Present / Absent / In interview / Done and
 * recording a result, for the placement cell. Absent students are told the same day.
 */
export default function DriveDay() {
  const router = useRouter();
  const { roundId } = router.query;
  const [data, setData] = useState(null);
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);
  const [room, setRoom] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [roomFilter, setRoomFilter] = useState(null);
  const [gate, setGate] = useState("");
  const [lastAction, setLastAction] = useState(null);
  const [pasting, setPasting] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [pasteBusy, setPasteBusy] = useState(false);
  const mutationRef = useRef(null);
  const pasteBusyRef = useRef(false);
  const loadSeqRef = useRef(0);

  const load = useCallback(async () => {
    if (!roundId) return;
    const requestId = ++loadSeqRef.current;
    const res = await fetchWithErrorHandling(getRoster(roundId));
    if (requestId !== loadSeqRef.current) return;
    if (!res.success) { setError(errorText(res, "This drive day isn't available to you.")); return; }
    setData(res.data);
    setError(null);
  }, [roundId]);
  useEffect(() => { load(); const t = setInterval(load, 20000); return () => clearInterval(t); }, [load]);

  const fullAccess = useMemo(() => Boolean(data?.students?.length && Object.prototype.hasOwnProperty.call(data.students[0], "phone")), [data]);
  const roundLocked = ["COMPLETED", "CANCELLED"].includes(data?.round?.status);
  const lockedReason = data?.round?.status === "CANCELLED"
    ? "This round was cancelled. The roster is read-only."
    : "This round is complete. Attendance and result changes are locked.";
  const operations = useMemo(() => {
    const students = data?.students || [];
    const total = students.length;
    const waiting = students.filter((s) => s.attendance === "WAITING").length;
    const present = students.filter((s) => s.attendance === "PRESENT").length;
    const interviewing = students.filter((s) => s.attendance === "IN_INTERVIEW").length;
    const done = students.filter((s) => s.attendance === "DONE").length;
    const absent = students.filter((s) => s.attendance === "ABSENT").length;
    const checkedIn = present + interviewing + done;
    const attendanceRate = total ? Math.round((checkedIn * 100) / total) : 0;
    const completionRate = total ? Math.round((done * 100) / total) : 0;
    const roomMap = new Map();
    students.forEach((s) => {
      const key = s.room || s.assignedRoom || "Unassigned";
      const row = roomMap.get(key) || { name: key, total: 0, waiting: 0, interviewing: 0, done: 0 };
      row.total += 1;
      if (s.attendance === "WAITING" || s.attendance === "PRESENT") row.waiting += 1;
      if (s.attendance === "IN_INTERVIEW") row.interviewing += 1;
      if (s.attendance === "DONE") row.done += 1;
      roomMap.set(key, row);
    });
    return { total, waiting, present, interviewing, done, absent, checkedIn, attendanceRate, completionRate, rooms: [...roomMap.values()].sort((a, b) => b.total - a.total || a.name.localeCompare(b.name)) };
  }, [data]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (data?.students || []).filter((s) => {
      const matchesText = !needle || `${s.rollNumber || ""} ${s.firstName || ""} ${s.lastName || ""}`.toLowerCase().includes(needle);
      const matchesStatus = statusFilter === "ALL" || (statusFilter === "CHECKED_IN" ? ["PRESENT", "IN_INTERVIEW", "DONE"].includes(s.attendance) : s.attendance === statusFilter);
      const studentRoom = s.room || s.assignedRoom || "Unassigned";
      return matchesText && matchesStatus && (!roomFilter || studentRoom === roomFilter);
    });
  }, [data, q, statusFilter, roomFilter]);

  const beginMutation = (key) => {
    if (mutationRef.current) return false;
    mutationRef.current = key;
    return true;
  };
  const finishMutation = () => {
    mutationRef.current = null;
    setBusyId(null);
  };

  const mark = async (s, status) => {
    if (roundLocked) { message.warning(lockedReason); return; }
    if (!beginMutation(`attendance-${s.applicationId}`)) return;
    setBusyId(s.applicationId);
    try {
      const res = await fetchWithErrorHandling(markAttendance(roundId, { applicationId: s.applicationId, status, room: room || undefined }));
      if (!res.success) { message.error(errorText(res, "Could not save")); return; }
      if (status === "ABSENT") message.info("Marked absent. The student is told today and can dispute.");
      load();
    } finally {
      finishMutation();
    }
  };

  const result = async (s, outcome) => {
    if (roundLocked) { message.warning(lockedReason); return; }
    if (!beginMutation(`result-${s.applicationId}`)) return;
    setBusyId(s.applicationId);
    try {
      const res = await fetchWithErrorHandling(stageResult(roundId, { applicationId: s.applicationId, outcome, source: "DRIVE_DAY" }));
      if (!res.success) { message.error(errorText(res, "Could not record the result")); return; }
      message.success("Result staged. Apply it from the drive page.");
      load();
    } finally {
      finishMutation();
    }
  };

  // ---- field mode
  const students = data?.students || [];
  const panelRooms = useMemo(() => roomSummary(students), [students]);

  // Type a roll number, press Enter: that student is present. A short ending ("007") works when it is unique.
  const checkIn = async (value) => {
    if (roundLocked) { message.warning(lockedReason); return; }
    const found = findByRoll(students, value);
    if (found.ambiguous) { message.warning(`More than one student matches "${value}": ${found.ambiguous.map((s) => s.rollNumber).join(", ")}. Type more of the roll number.`); return; }
    if (!found.student) { message.error(`No student with roll number "${value}" is on this roster.`); return; }
    const s = found.student;
    setGate("");
    if (s.attendance === "PRESENT") { setLastAction({ ok: true, text: `${s.firstName} ${s.lastName || ""} was already marked present.` }); return; }
    if (!beginMutation(`checkin-${s.applicationId}`)) return;
    setBusyId(s.applicationId);
    try {
      const res = await fetchWithErrorHandling(markAttendance(roundId, { applicationId: s.applicationId, status: "PRESENT", room: room || undefined }));
      if (!res.success) { setLastAction({ ok: false, text: errorText(res, `Could not mark ${s.firstName} present`) }); return; }
      setLastAction({ ok: true, text: `${s.firstName} ${s.lastName || ""} (${s.rollNumber}) marked present.` });
      load();
    } finally {
      finishMutation();
    }
  };

  // A list of roll numbers from a message or the gate sheet: all of them present at once.
  const markList = async () => {
    if (roundLocked) { message.warning(lockedReason); return; }
    if (pasteBusyRef.current || mutationRef.current) return;
    const { matched, unmatched } = matchRolls(parseRolls(pasteText), students);
    const todo = matched.filter((s) => s.attendance !== "PRESENT");
    pasteBusyRef.current = true;
    mutationRef.current = "paste-attendance";
    setPasteBusy(true);
    const failed = [];
    try {
      for (const s of todo) {
        // eslint-disable-next-line no-await-in-loop
        const res = await fetchWithErrorHandling(markAttendance(roundId, { applicationId: s.applicationId, status: "PRESENT", room: room || undefined }));
        if (!res.success) failed.push(s);
      }
    } finally {
      pasteBusyRef.current = false;
      mutationRef.current = null;
      setPasteBusy(false);
    }
    const done = todo.length - failed.length;
    load();
    if (failed.length || unmatched.length) {
      // Keep only unresolved rows in the editor. Successful rows are already on the server and
      // must not be blindly re-sent; unmatched values remain so the operator can correct them.
      setPasteText([...failed.map((s) => s.rollNumber).filter(Boolean), ...unmatched].join("\n"));
      Modal.warning({
        title: `${done} marked present; ${failed.length + unmatched.length} still need attention`,
        content: [
          failed.length ? `Could not save: ${failed.map((s) => s.rollNumber).join(", ")}.` : null,
          unmatched.length ? `Not on this roster: ${unmatched.join(", ")}.` : null,
          "The unresolved values are still in the box so you can correct or retry them.",
        ].filter(Boolean).join(" "),
      });
      return;
    }
    setPasting(false);
    setPasteText("");
    Modal.success({
      title: `${done} marked present`,
      content: matched.length - todo.length > 0
        ? `${matched.length - todo.length} were already present.`
        : "Everyone in the list is now marked present.",
    });
  };

  // "Call next" for a panel: the next checked-in student for that room goes in.
  const callNext = async (roomName) => {
    if (roundLocked) { message.warning(lockedReason); return; }
    const s = nextInQueue(students, roomName);
    if (!s) { message.info(`Nobody is waiting for ${roomName}.`); return; }
    if (!beginMutation(`call-${s.applicationId}`)) return;
    setBusyId(s.applicationId);
    try {
      const res = await fetchWithErrorHandling(markAttendance(roundId, { applicationId: s.applicationId, status: "IN_INTERVIEW", room: roomName }));
      if (!res.success) { message.error(errorText(res, "Could not call the next student")); return; }
      setLastAction({ ok: true, text: `${roomName}: ${s.firstName} ${s.lastName || ""} (${s.rollNumber}) called in.` });
      load();
    } finally {
      finishMutation();
    }
  };

  if (error && !data) {
    return (
      <div className="scroll-container tpo-drive-day-roster tpo-drive-day-roster--state" data-testid="tpo.drive-day">
        <Card className="tpo-drive-day-roster__state-card">
          <Alert
            type="warning"
            showIcon
            message={error}
            description="This round could not be loaded. Retry without leaving the drive-day workflow."
            action={<Button size="small" onClick={load}>Retry</Button>}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="scroll-container tpo-drive-day-roster" data-testid="tpo.drive-day">
      <div className="tpo-drive-day-roster__shell">
        <div className="tpo-drive-day-roster__top">
          <div>
            {/* On the day, the screen says which drive and round it is (it said only "Drive day"). */}
            <Typography.Title level={4}>{data?.round?.company ? `${data.round.company} · ${data.round.name}` : "Drive day"}</Typography.Title>
            <Typography.Text type="secondary">{data ? `${data.round?.title ? `${data.round.title} · ` : ""}${plural(data.students?.length || 0, "student")} on this roster` : "Loading roster…"}</Typography.Text>
          </div>
          <Space>
            {data?.round?.status === "COMPLETED"
              ? <Tag color="green">Round done</Tag>
              : data?.round?.status === "CANCELLED"
                ? <Tag color="red">Round cancelled</Tag>
                : <span className="tpo-drive-day-roster__live"><i />LIVE</span>}
            <Button onClick={() => router.push("/tpo/drive-day")}>Back</Button>
          </Space>
        </div>

        {error && data && <Alert className="tpo-drive-day-roster__stale-alert" type="error" showIcon closable message="This refresh failed. Showing the last successful roster." description={error} action={<Button size="small" onClick={load}>Retry</Button>} />}
        {data && roundLocked && <Alert className="tpo-drive-day-roster__locked-alert" type={data.round?.status === "CANCELLED" ? "warning" : "info"} showIcon message={lockedReason} description="You can still review attendance, rooms and recorded outcomes below." />}

        {!data ? (
          <Card className="tpo-drive-day-roster__loading"><ListSkeleton rows={5} avatar label="Loading drive-day roster" /></Card>
        ) : (
          <>
            {students.length > 0 && <Card className="tpo-drive-day-roster__gate">
              <Input.Search
                size="large" allowClear autoFocus enterButton="Mark present"
                placeholder="Roll number, then Enter"
                value={gate} onChange={(e) => setGate(e.target.value)} onSearch={(v) => { if (v.trim()) checkIn(v); }}
                aria-label="Roll number to mark present"
                disabled={roundLocked}
              />
              {lastAction && <Alert style={{ marginTop: 8 }} type={lastAction.ok ? "success" : "error"} showIcon message={lastAction.text} closable onClose={() => setLastAction(null)} />}
              <Space wrap style={{ marginTop: 8 }}>
                <Button onClick={() => setPasting(true)} disabled={roundLocked}>Paste a list of roll numbers</Button>
                {fullAccess && panelRooms.map((r) => (
                  <Button key={r.name} type="primary" ghost onClick={() => callNext(r.name)} aria-label={`Call next for ${r.name}`} disabled={roundLocked}>
                    Call next · {r.name} <Tag style={{ marginLeft: 6 }}>{r.waiting} waiting</Tag><Tag>{r.inside} in</Tag>
                  </Button>
                ))}
              </Space>
            </Card>}

            <PageStrip ariaLabel="Roster status" items={[
              { key: "all", label: "on the roster", value: operations.total, onClick: () => { setStatusFilter("ALL"); setRoomFilter(null); } },
              { key: "in", label: "checked in", value: operations.checkedIn, tone: "good", onClick: () => setStatusFilter("CHECKED_IN") },
              { key: "wait", label: "not here yet", value: operations.waiting, tone: operations.waiting > 0 ? "attention" : undefined, onClick: () => setStatusFilter("WAITING") },
              { key: "live", label: "in interview", value: operations.interviewing, onClick: () => setStatusFilter("IN_INTERVIEW") },
              { key: "done", label: "done", value: operations.done, onClick: () => setStatusFilter("DONE") },
              { key: "abs", label: "absent", value: operations.absent, onClick: () => setStatusFilter("ABSENT") },
            ]} />

            {students.length > 0 && <Card className="tpo-drive-day-roster__controls">
              <Input.Search
                size="large"
                allowClear
                placeholder="Search by roll number or name"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <Input
                placeholder="Room or panel for the next marks (optional)"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
              />
              <div className="tpo-drive-day-roster__filter-summary"><Typography.Text type="secondary">{rows.length} student{rows.length === 1 ? "" : "s"} shown</Typography.Text>{(statusFilter !== "ALL" || roomFilter) && <Button size="small" type="link" onClick={() => { setStatusFilter("ALL"); setRoomFilter(null); }}>Clear filters</Button>}</div>
            </Card>}

            {rows.length === 0 ? (
              <Card className="tpo-drive-day-roster__empty">
                <Empty description={students.length === 0 ? "No students are on this round's roster." : "No student matches your search."} />
              </Card>
            ) : (
              <div className="tpo-drive-day-roster__students">
                {rows.map((s) => (
                  <Card className="tpo-drive-day-roster__student" key={s.applicationId} size="small" loading={busyId === s.applicationId}>
                    <div className="tpo-drive-day-roster__student-head">
                      <div className="tpo-drive-day-roster__identity">
                        <Avatar src={s.photoUrl || undefined} icon={<UserOutlined />} size={42} />
                        <div>
                          <Typography.Text strong>{s.firstName} {s.lastName || ""}</Typography.Text>
                          <div className="tpo-drive-day-roster__student-meta">
                            <span>{s.rollNumber || "-"}</span>
                            {s.branch && <span>{s.branch}</span>}
                            {(s.room || s.assignedRoom) && <span>{s.room || s.assignedRoom}</span>}
                          </div>
                        </div>
                      </div>
                      <Tag className="tpo-drive-day-roster__status" color={COLOR[s.attendance]}>{LABEL[s.attendance]}</Tag>
                    </div>

                    <div className="tpo-drive-day-roster__attendance-actions">
                      {/* Filled only once the student is marked present: a filled button read as already marked. */}
                      <Button type={s.attendance === "PRESENT" ? "primary" : "default"} icon={<CheckOutlined />} onClick={() => mark(s, "PRESENT")} disabled={roundLocked || s.attendance === "PRESENT"}>Present</Button>
                      <Button danger icon={<CloseOutlined />} onClick={() => mark(s, "ABSENT")} disabled={roundLocked || s.attendance === "ABSENT"}>Absent</Button>
                      {fullAccess && <Button onClick={() => mark(s, "IN_INTERVIEW")} disabled={roundLocked}>In interview</Button>}
                      {fullAccess && <Button onClick={() => mark(s, "DONE")} disabled={roundLocked}>Done</Button>}
                    </div>

                    {fullAccess && (
                      <div className="tpo-drive-day-roster__secondary-actions">
                        {s.phone && <Button icon={<PhoneOutlined />} href={`tel:${s.phone}`}>Call</Button>}
                        <Select
                          size="middle"
                          placeholder="Result"
                          disabled={roundLocked}
                          onChange={(v) => result(s, v)}
                          options={[
                            { value: "PASS", label: "Pass" },
                            { value: "FAIL", label: "Not cleared" },
                            { value: "HOLD", label: "Waitlist" },
                          ]}
                        />
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <Modal open={pasting} title="Paste a list of roll numbers" okText={`Mark ${matchRolls(parseRolls(pasteText), students).matched.length || ""} present`} onCancel={() => {
          if (pasteBusyRef.current) return;
          if (!pasteText.trim() || window.confirm("Discard this pasted attendance list?")) {
            setPasting(false);
            setPasteText("");
          }
        }}
        okButtonProps={{ disabled: roundLocked || matchRolls(parseRolls(pasteText), students).matched.length === 0 || pasteBusy, loading: pasteBusy }} onOk={markList} destroyOnClose>
        <Typography.Paragraph type="secondary">From the gate sheet or a message. Separate them with spaces, commas or lines.</Typography.Paragraph>
        <Input.TextArea rows={5} autoFocus value={pasteText} onChange={(e) => setPasteText(e.target.value)} placeholder="21CS001, 21CS014, 21EC007 ..." />
        {parseRolls(pasteText).length > 0 && (() => {
          const { matched, unmatched } = matchRolls(parseRolls(pasteText), students);
          return <Typography.Text type={unmatched.length ? "warning" : "secondary"} style={{ display: "block", marginTop: 8 }}>{matched.length} on this roster{unmatched.length ? `, ${unmatched.length} not found: ${unmatched.slice(0, 8).join(", ")}` : ""}</Typography.Text>;
        })()}
      </Modal>
    </div>
  );
}
