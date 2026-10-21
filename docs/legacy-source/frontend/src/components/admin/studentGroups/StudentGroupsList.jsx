import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Alert, Button, Dropdown, Form, Modal, Popconfirm, Select, Space, Table, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import AdminTableToolbar from "@/components/admin/AdminTableToolbar";
import { PanelError } from "@/components/Common/PanelStates";
import { RefreshStatus, TableSkeleton } from "@/components/Common/Skeletons";
import StudentGroupForm, { toGroupBody } from "./StudentGroupForm";
import { StatusTag, seatsText, statusLabel } from "./groupUi";
import {
  GROUP_STATUSES,
  STATUS_TRANSITIONS,
  createGroup,
  deleteGroup,
  errorMessage,
  listGroups,
  setGroupStatus,
} from "@/api/Services/StudentGroupService";

/** College-admin list of generic groups. Feature-managed groups such as ELECTIVE stay in their owning module. */
export default function StudentGroupsList() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [loadingMode, setLoadingMode] = useState(null);
  const requestSeq = useRef(0);
  const loadedQueryRef = useRef(null);
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState();
  const [status, setStatus] = useState();
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingRowIds, setPendingRowIds] = useState(() => new Set());
  const [rowActionFailure, setRowActionFailure] = useState(null);
  const rowActionIdsRef = useRef(new Set());

  const markRowPending = (id, pending) => {
    const key = String(id);
    setPendingRowIds((current) => {
      const next = new Set(current);
      if (pending) next.add(key); else next.delete(key);
      return next;
    });
  };

  const beginRowAction = (id) => {
    const key = String(id);
    if (rowActionIdsRef.current.has(key)) return false;
    rowActionIdsRef.current.add(key);
    markRowPending(key, true);
    return true;
  };

  const finishRowAction = (id) => {
    const key = String(id);
    rowActionIdsRef.current.delete(key);
    markRowPending(key, false);
  };

  const load = useCallback(async ({ preserveExisting = true } = {}) => {
    const request = ++requestSeq.current;
    const queryKey = `${kind ?? "all"}:${status ?? "all"}`;
    if (loadedQueryRef.current !== queryKey) setRows([]);
    setLoading(true);
    setLoadingMode(preserveExisting ? "refresh" : "scope");
    setLoadError(null);
    if (!preserveExisting) setRows([]);
    try {
      const res = await listGroups({ ...(kind ? { kind } : {}), ...(status ? { status } : {}) });
      if (request !== requestSeq.current) return;
      if (!Array.isArray(res?.data)) throw new Error("Unexpected groups response");
      setRows(res.data);
      loadedQueryRef.current = queryKey;
    } catch (e) {
      if (request !== requestSeq.current) return;
      setLoadError(errorMessage(e, "Could not load groups"));
    } finally {
      if (request === requestSeq.current) {
        setLoading(false);
        setLoadingMode(null);
      }
    }
  }, [kind, status]);

  useEffect(() => {
    load({ preserveExisting: false });
  }, [load]);

  const kinds = useMemo(() => Array.from(new Set(rows.map((r) => r.kind))).sort(), [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => `${r.name} ${r.kind} ${r.description || ""}`.toLowerCase().includes(q));
  }, [rows, search]);

  const handleCreate = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    setSaving(true);
    try {
      const res = await createGroup(toGroupBody(values));
      message.success("Group created");
      setCreating(false);
      form.resetFields();
      router.push(`/college-admin/student-groups/${res.data.id}`);
    } catch (e) {
      message.error(errorMessage(e, "Could not create the group"));
    } finally {
      setSaving(false);
    }
  };

  const move = async (g, to) => {
    if (!beginRowAction(g.id)) return;
    setRowActionFailure(null);
    try {
      await setGroupStatus(g.id, to);
      message.success(`${g.name} is now ${statusLabel(to)}`);
      await load({ preserveExisting: true });
    } catch (e) {
      setRowActionFailure({
        type: "status",
        group: g,
        to,
        message: errorMessage(e, `Could not move ${g.name} to ${statusLabel(to)}`),
      });
    } finally {
      finishRowAction(g.id);
    }
  };

  const remove = async (g) => {
    if (!beginRowAction(g.id)) return;
    setRowActionFailure(null);
    try {
      await deleteGroup(g.id);
      message.success("Group deleted");
      await load({ preserveExisting: true });
    } catch (e) {
      setRowActionFailure({
        type: "delete",
        group: g,
        message: errorMessage(e, `Could not delete ${g.name}`),
      });
    } finally {
      finishRowAction(g.id);
    }
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (v, g) => (
        <Link href={`/college-admin/student-groups/${g.id}`}>
          <strong>{v}</strong>
          {g.description ? <span style={{ color: "#888", fontSize: 12, display: "block" }}>{g.description}</span> : null}
        </Link>
      ),
    },
    { title: "Kind", dataIndex: "kind", width: 130, sorter: (a, b) => a.kind.localeCompare(b.kind) },
    { title: "Status", dataIndex: "status", width: 110, render: (s) => <StatusTag status={s} /> },
    { title: "Members", key: "seats", width: 130, render: (_, g) => seatsText(g) },
    {
      title: "Term",
      key: "term",
      width: 120,
      render: (_, g) => [g.academicYear, g.semesterNumber ? `Sem ${g.semesterNumber}` : null].filter(Boolean).join(" · ") || "—",
    },
    {
      title: "",
      key: "actions",
      width: 160,
      render: (_, g) => {
        const moves = STATUS_TRANSITIONS[g.status] || [];
        const rowPending = pendingRowIds.has(String(g.id));
        return (
          <Space size="small">
            <Button size="small" disabled={rowPending} onClick={() => router.push(`/college-admin/student-groups/${g.id}`)}>Open</Button>
            {moves.length > 0 && (
              <Dropdown
                disabled={rowPending}
                menu={{ items: moves.map((to) => ({ key: to, label: `Move to ${statusLabel(to)}`, disabled: rowPending, onClick: () => move(g, to) })) }}
              >
                <Button size="small" loading={rowPending}>Status</Button>
              </Dropdown>
            )}
            {(g.status === "DRAFT" || g.status === "ARCHIVED") && (
              <Popconfirm disabled={rowPending} title="Delete this group?" description="Members and history are kept but the group disappears from every list." onConfirm={() => remove(g)}>
                <Button size="small" danger loading={rowPending} disabled={rowPending}>Delete</Button>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        <AdminTableToolbar
          searchValue={search}
          onSearch={setSearch}
          searchPlaceholder="Search groups"
          onRefresh={() => load({ preserveExisting: true })}
          loading={loading}
          resultCount={filtered.length}
          totalCount={rows.length}
          exportFileName="student-groups.csv"
          exportRows={() => filtered.map((g) => ({ id: g.id, kind: g.kind, name: g.name, status: g.status, active: g.activeCount, capacity: g.capacity ?? "" }))}
          extra={
            <Space size="small">
              <Select allowClear placeholder="Kind" size="small" style={{ width: 130 }} value={kind} onChange={setKind}
                options={kinds.map((k) => ({ value: k, label: k }))} />
              <Select allowClear placeholder="Status" size="small" style={{ width: 120 }} value={status} onChange={setStatus}
                options={GROUP_STATUSES.map((s) => ({ value: s, label: statusLabel(s) }))} />
            </Space>
          }
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreating(true)}>New group</Button>
      </div>

      {loadingMode === "refresh" && rows.length > 0 && <RefreshStatus label="Refreshing student groups…" />}
      {rowActionFailure && (
        <Alert
          type="error"
          showIcon
          message="Student group action failed"
          description={rowActionFailure.message}
          action={
            <Space size="small">
              <Button
                size="small"
                onClick={() => rowActionFailure.type === "delete"
                  ? remove(rowActionFailure.group)
                  : move(rowActionFailure.group, rowActionFailure.to)}
              >
                Retry
              </Button>
              <Button size="small" type="text" onClick={() => setRowActionFailure(null)}>Dismiss</Button>
            </Space>
          }
          style={{ marginBottom: 12 }}
        />
      )}
      {loadError && rows.length > 0 && (
        <Alert type="warning" showIcon message="Couldn't refresh student groups"
          description={loadError}
          action={<Button size="small" onClick={() => load({ preserveExisting: true })}>Retry</Button>}
          style={{ marginBottom: 12 }} />
      )}
      {loadingMode === "scope" && rows.length === 0 ? (
        <TableSkeleton rows={8} columns={6} label="Loading student groups" />
      ) : loadError && rows.length === 0 ? (
        <PanelError title={loadError} onRetry={() => load({ preserveExisting: false })} />
      ) : (
        <Table rowKey="id" columns={columns} dataSource={filtered} loading={false} size="middle" pagination={{ pageSize: 20, showSizeChanger: false }}
          locale={{ emptyText: "No generic student groups yet. Use these for purposes such as CRT batches, mentorship cohorts, clubs or bus routes." }} />
      )}

      <Modal title="New group" open={creating} onCancel={() => setCreating(false)} onOk={handleCreate} okText="Create" confirmLoading={saving} destroyOnClose>
        <StudentGroupForm form={form} />
      </Modal>
    </div>
  );
}
