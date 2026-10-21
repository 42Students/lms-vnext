import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, Drawer, Popconfirm, Select, Space, Table, Tag, Typography, message } from "antd";
import AdminTableToolbar from "@/components/admin/AdminTableToolbar";
import { errorMessage, getRoster, moveLearner, removeFromOffering } from "@/api/Services/ElectiveService";
import { SOURCE_LABEL, StateTag, fmt } from "@/components/admin/studentGroups/groupUi";

const { Text } = Typography;

/** Who is in one offering, with remove / remove-and-lock / move-to-sibling actions. */
export default function OfferingRosterDrawer({ offering, siblings, onClose, onChanged }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const mutationRef = useRef(false);
  const [mutationBusy, setMutationBusy] = useState(null);
  const [state, setState] = useState("ACTIVE");
  const [search, setSearch] = useState("");
  const [moveTarget, setMoveTarget] = useState({});
  const [actionBusyId, setActionBusyId] = useState(null);
  const [actionError, setActionError] = useState("");
  const requestSeq = useRef(0);
  const mutable = offering.status === "ACTIVE";

  const load = useCallback(async () => {
    const request = ++requestSeq.current;
    setLoading(true);
    setLoadError(null);
    try {
      const res = await getRoster(offering.id, state === "ALL" ? undefined : state);
      if (request !== requestSeq.current) return;
      if (!Array.isArray(res?.data)) throw new Error("Unexpected roster response");
      setRows(res.data);
    } catch (e) {
      if (request !== requestSeq.current) return;
      setRows([]);
      setLoadError(errorMessage(e, "Could not load the roster"));
    } finally {
      if (request === requestSeq.current) setLoading(false);
    }
  }, [offering.id, state]);

  useEffect(() => {
    load();
    return () => { ++requestSeq.current; };
  }, [load]);

  const refresh = () => { load(); onChanged?.(); };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((m) => `${m.name || ""} ${m.rollNumber || ""} ${m.department || ""}`.toLowerCase().includes(q));
  }, [rows, search]);

  const remove = async (m, lock) => {
    if (!mutable || actionBusyId != null) return;
    setActionBusyId(m.memberId);
    setActionError("");
    try {
      await removeFromOffering(offering.id, m.memberId, { reason: lock ? "Removed and locked by college" : "Removed by college", lock });
      message.success(lock ? "Removed and locked" : "Removed");
      refresh();
    } catch (e) {
      const detail = errorMessage(e);
      setActionError(detail);
      message.error(detail);
    } finally {
      setActionBusyId(null);
    }
  };

  const move = async (m) => {
    if (!mutable || actionBusyId != null) return;
    const to = moveTarget[m.memberId];
    if (!to) return;
    setActionBusyId(m.memberId);
    setActionError("");
    try {
      const res = await moveLearner(offering.id, m.memberId, to);
      message.success(`Moved (${res.data.state})`);
      setMoveTarget((prev) => { const next = { ...prev }; delete next[m.memberId]; return next; });
      refresh();
    } catch (e) {
      const detail = errorMessage(e);
      setActionError(detail);
      message.error(detail);
    } finally {
      setActionBusyId(null);
    }
  };

  const columns = [
    { title: "Student", key: "name", render: (_, m) => <span>{m.name || `Learner #${m.memberId}`}{m.rollNumber ? <Text type="secondary"> · {m.rollNumber}</Text> : null}</span> },
    { title: "Dept", dataIndex: "department", width: 90 },
    { title: "State", dataIndex: "state", width: 130, render: (s, m) => <Space size={4}><StateTag state={s} />{m.waitlistPosition ? <Text type="secondary">#{m.waitlistPosition}</Text> : null}</Space> },
    { title: "How", dataIndex: "source", width: 130, render: (s) => SOURCE_LABEL[s] || s },
    { title: "Since", key: "since", width: 160, render: (_, m) => fmt(m.joinedAt || m.createdAt) },
    { title: "", key: "actions", width: 280, render: (_, m) => !mutable || m.state === "REMOVED" ? null : (
      <Space size="small" wrap>
        {siblings.length > 0 && <Space.Compact>
          <Select size="small" placeholder="Move to…" style={{ width: 170 }} value={moveTarget[m.memberId]}
            onChange={(v) => setMoveTarget((prev) => ({ ...prev, [m.memberId]: v }))}
            disabled={actionBusyId != null}
            options={siblings.map((o) => ({ value: o.id, label: o.courseName || `Course #${o.courseId}` }))} />
          <Button size="small" onClick={() => move(m)} loading={actionBusyId === m.memberId}
            disabled={!moveTarget[m.memberId] || (actionBusyId != null && actionBusyId !== m.memberId)}>Move</Button>
        </Space.Compact>}
        {/* Electives are allocated only by the college (no rules, no self-join), and an admin can
            always re-allocate, so the old "Lock out" did nothing that Remove doesn't. */}
        <Popconfirm title="Remove from this elective?" description="The student loses access to this elective's class. You can allocate them again later."
          disabled={actionBusyId != null} onConfirm={() => remove(m, false)}>
          <Button size="small" danger loading={actionBusyId === m.memberId}
            disabled={actionBusyId != null && actionBusyId !== m.memberId}>Remove</Button>
        </Popconfirm>
      </Space>
    ) },
  ];

  return (
    <Drawer open width={Math.min(1000, typeof window !== "undefined" ? window.innerWidth - 60 : 1000)}
      onClose={() => { if (actionBusyId == null) onClose?.(); }} destroyOnClose closable={actionBusyId == null}
      keyboard={actionBusyId == null} maskClosable={actionBusyId == null}
      title={<Space wrap><span>Roster — {offering.courseName || `Course #${offering.courseId}`}</span>
        <Tag>{offering.activeCount ?? 0}{offering.capacity != null ? ` / ${offering.capacity}` : ""} enrolled</Tag>
        <Tag color={mutable ? "green" : "default"}>Status: {offering.status === "ARCHIVED" ? "Archived" : offering.status === "ACTIVE" ? "Active" : offering.status}</Tag></Space>}>
      {actionError && <Alert type="error" showIcon style={{ marginBottom: 12 }}
        message="Roster change was not saved" description={actionError}
        closable onClose={() => setActionError("")} />}
      {!mutable && <Alert type="info" showIcon style={{ marginBottom: 12 }}
        message="Archived roster — read only"
        description="Membership states are preserved as history. Reallocate a student from the slot's Eligible students tab instead of rewriting an archived offering." />}
      {loadError ? <Alert type="error" showIcon message="Elective roster could not be loaded" description={loadError} action={<Button size="small" onClick={load}>Retry</Button>} style={{ marginBottom: 12 }} /> : null}
      <div style={{ marginBottom: 12 }}>
        <AdminTableToolbar searchValue={search} onSearch={setSearch} searchPlaceholder="Search students" onRefresh={refresh} loading={loading}
          resultCount={filtered.length} totalCount={rows.length}
          exportFileName={`elective-${offering.id}-roster.csv`}
          exportRows={() => filtered.map((m) => ({ name: m.name, rollNumber: m.rollNumber, department: m.department, state: m.state, since: fmt(m.joinedAt || m.createdAt) }))}
          extra={<Select size="small" style={{ width: 140 }} value={state} onChange={setState}
            options={[{ value: "ACTIVE", label: "Enrolled" }, { value: "WAITLISTED", label: "Waitlisted" }, { value: "REMOVED", label: "Removed" }, { value: "ALL", label: "All" }]} />} />
      </div>
      <Table rowKey="id" columns={columns} dataSource={loadError ? [] : filtered} loading={loading} size="small" locale={{ emptyText: loadError ? "Could not load roster; use Retry above." : "No students in this state." }} pagination={{ pageSize: 50, showSizeChanger: false }} />
    </Drawer>
  );
}
