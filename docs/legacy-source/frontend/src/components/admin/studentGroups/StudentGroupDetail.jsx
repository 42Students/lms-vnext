import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import {
  Alert, Button, Card, Descriptions, Dropdown, Form, Input, InputNumber, Modal, Popconfirm, Radio, Select, Space,
  Table, Tabs, Tag, Typography, message,
} from "antd";
import { ArrowLeftOutlined, LockOutlined, UnlockOutlined } from "@ant-design/icons";
import AdminTableToolbar from "@/components/admin/AdminTableToolbar";
import { PanelError } from "@/components/Common/PanelStates";
import { DetailSkeleton, ListSkeleton, RefreshStatus } from "@/components/Common/Skeletons";
import StudentGroupForm, { groupToFormValues, toGroupBody } from "./StudentGroupForm";
import { SOURCE_LABEL, StateTag, StatusTag, fmt, seatsText, statusLabel } from "./groupUi";
import {
  MEMBER_STATES, STATUS_TRANSITIONS, addMembers, applyRule, clearRule, errorMessage, getEvents, getGroup, getMembers,
  getRule, lockMember, previewRule, reconcileGroup, removeMember, setGroupStatus, setRule, updateGroup,
} from "@/api/Services/StudentGroupService";

const { Text } = Typography;

/** One group: header + Members / Rule / Activity. All mutations refetch, never patch local state. */
export default function StudentGroupDetail({ id }) {
  const router = useRouter();
  const [group, setGroup] = useState(null);
  const [groupLoading, setGroupLoading] = useState(true);
  const [groupError, setGroupError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [editForm] = Form.useForm();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const statusRef = useRef(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [editDirty, setEditDirty] = useState(false);

  const loadGroup = useCallback(async () => {
    if (!id) return;
    setGroupLoading(true);
    setGroupError(null);
    try {
      const res = await getGroup(id);
      setNotFound(false);
      if (!res?.data) throw new Error("Group response was empty");
      setGroup(res.data);
    } catch (e) {
      if (e?.response?.status === 404) {
        setNotFound(true);
        setGroup(null);
      } else {
        setGroupError(errorMessage(e, "Could not load the group"));
      }
    } finally {
      setGroupLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setGroup(null);
    setNotFound(false);
    setGroupError(null);
    if (id) loadGroup();
  }, [id, loadGroup]);

  const openEdit = () => {
    editForm.setFieldsValue(groupToFormValues(group, dayjs));
    setEditDirty(false);
    setEditing(true);
  };

  const saveEdit = async () => {
    if (savingRef.current) return;
    let values;
    try {
      values = await editForm.validateFields();
    } catch {
      return;
    }
    savingRef.current = true;
    setSaving(true);
    try {
      await updateGroup(id, toGroupBody(values, group.kind, group));
      message.success("Saved");
      setEditDirty(false);
      setEditing(false);
      loadGroup();
    } catch (e) {
      message.error(errorMessage(e));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const move = async (to) => {
    if (statusRef.current) return;
    statusRef.current = true;
    setStatusBusy(true);
    try {
      await setGroupStatus(id, to);
      message.success(`Group is now ${statusLabel(to)}`);
      loadGroup();
    } catch (e) {
      message.error(errorMessage(e));
    } finally {
      statusRef.current = false;
      setStatusBusy(false);
    }
  };

  if (notFound) {
    return <Alert type="warning" showIcon message="Group not found" description="It may have been deleted, or it belongs to another college."
      action={<Button onClick={() => router.push("/college-admin/student-groups")}>Back to groups</Button>} />;
  }
  if (groupLoading && !group) return <DetailSkeleton label="Loading student group" withMedia={false} />;
  if (groupError && !group) return <PanelError title={groupError} onRetry={loadGroup} />;
  if (!group) return <PanelError title="Could not load the group" onRetry={loadGroup} />;

  const moves = STATUS_TRANSITIONS[group.status] || [];
  return (
    <div aria-busy={groupLoading ? "true" : undefined}>
      {groupLoading && <RefreshStatus label="Refreshing student group…" />}
      {groupError && (
        <Alert type="warning" showIcon message="Couldn't refresh this group"
          description={groupError} action={<Button size="small" onClick={loadGroup}>Retry</Button>}
          style={{ marginBottom: 12 }} />
      )}
      <Space style={{ marginBottom: 12 }} wrap>
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.push("/college-admin/student-groups")}>All groups</Button>
        <Button onClick={openEdit} disabled={group.status === "ARCHIVED"}>Edit</Button>
        {moves.length > 0 && (
          <Dropdown menu={{ items: moves.map((to) => ({ key: to, label: `Move to ${statusLabel(to)}`, onClick: () => move(to) })) }}>
            <Button type="primary" loading={statusBusy} disabled={statusBusy}>Status: {statusLabel(group.status)}</Button>
          </Dropdown>
        )}
      </Space>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Descriptions size="small" column={{ xs: 1, sm: 2, lg: 4 }} title={<Space><span>{group.name}</span><Tag>Type: {statusLabel(String(group.kind || "").replace(/_/g, " "))}</Tag><Tag color={group.status === "ACTIVE" ? "green" : "default"}>Status: {statusLabel(group.status)}</Tag></Space>}>
          <Descriptions.Item label="Members">{seatsText(group)}</Descriptions.Item>
          <Descriptions.Item label="Term">{[group.academicYear, group.semesterNumber ? `Sem ${group.semesterNumber}` : null].filter(Boolean).join(" · ") || "—"}</Descriptions.Item>
          <Descriptions.Item label="Created">{fmt(group.createdAt)}</Descriptions.Item>
          {group.description && <Descriptions.Item label="Description" span={4}>{group.description}</Descriptions.Item>}
        </Descriptions>
      </Card>

      <Tabs
        defaultActiveKey="members"
        items={[
          { key: "members", label: "Members", children: <MembersTab group={group} onChanged={loadGroup} /> },
          { key: "rule", label: "Rule", children: <RuleTab group={group} onChanged={loadGroup} /> },
          { key: "activity", label: "Activity", children: <ActivityTab groupId={group.id} /> },
        ]}
      />

      <Modal title="Edit group" open={editing}
        onCancel={() => {
          if (savingRef.current) return;
          if (!editDirty) { setEditing(false); return; }
          Modal.confirm({
            title: "Discard group edits?",
            content: "Your unsaved group changes will be lost.",
            okText: "Discard",
            okButtonProps: { danger: true },
            cancelText: "Keep editing",
            onOk: () => { setEditDirty(false); setEditing(false); },
          });
        }}
        onOk={saveEdit} okText="Save" confirmLoading={saving} maskClosable={false} destroyOnClose>
        <Form.Provider onFormChange={() => setEditDirty(true)}>
          <StudentGroupForm form={editForm} editing />
        </Form.Provider>
      </Modal>
    </div>
  );
}

// ------------------------------------------------------------------------------------------ members

function MembersTab({ group, onChanged }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const mutationRef = useRef(false);
  const [mutationBusy, setMutationBusy] = useState(null);
  const [state, setState] = useState("ACTIVE");
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [addForm] = Form.useForm();
  const [addResult, setAddResult] = useState(null);
  const [addBusy, setAddBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await getMembers(group.id, state === "ALL" ? undefined : state);
      if (!Array.isArray(res?.data)) throw new Error("Unexpected member response");
      setRows(res.data);
    } catch (e) {
      setRows([]);
      setLoadError(errorMessage(e, "Could not load members"));
    } finally {
      setLoading(false);
    }
  }, [group.id, state]);

  useEffect(() => {
    load();
  }, [load]);

  const refreshAll = () => {
    load();
    onChanged();
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((m) => `${m.name || ""} ${m.rollNumber || ""} ${m.department || ""}`.toLowerCase().includes(q));
  }, [rows, search]);

  const submitAdd = async () => {
    if (mutationRef.current) return;
    const values = await addForm.validateFields().catch(() => null);
    if (!values) return;
    const tokens = String(values.list || "").split(/[\s,;]+/).map((t) => t.trim()).filter(Boolean);
    if (tokens.length === 0) {
      message.warning("Paste at least one roll number or learner id");
      return;
    }
    const body = { source: values.source || "MANUAL", note: values.note || null };
    if (values.by === "id") body.learnerIds = tokens.map(Number).filter((n) => Number.isInteger(n) && n > 0);
    else body.rollNumbers = tokens;
    mutationRef.current = true;
    setMutationBusy("add");
    setAddBusy(true);
    try {
      const res = await addMembers(group.id, body);
      setAddResult(res.data);
      refreshAll();
    } catch (e) {
      message.error(errorMessage(e));
    } finally {
      mutationRef.current = false;
      setMutationBusy(null);
      setAddBusy(false);
    }
  };

  const remove = async (m, lock) => {
    if (mutationRef.current) return;
    mutationRef.current = true;
    setMutationBusy(`remove:${m.memberId}`);
    try {
      await removeMember(group.id, m.memberId, { reason: lock ? "Removed and locked by college" : "Removed by college", lock });
      message.success(lock ? "Removed and locked" : "Removed");
      refreshAll();
    } catch (e) {
      message.error(errorMessage(e));
    } finally {
      mutationRef.current = false;
      setMutationBusy(null);
    }
  };

  const toggleLock = async (m) => {
    if (mutationRef.current) return;
    mutationRef.current = true;
    setMutationBusy(`lock:${m.memberId}`);
    try {
      await lockMember(group.id, m.memberId, !m.isLocked);
      refreshAll();
    } catch (e) {
      message.error(errorMessage(e));
    } finally {
      mutationRef.current = false;
      setMutationBusy(null);
    }
  };

  const reconcile = async () => {
    if (mutationRef.current) return;
    mutationRef.current = true;
    setMutationBusy("reconcile");
    try {
      const res = await reconcileGroup(group.id);
      message.success(`Active count is ${res.data.activeCount}`);
      onChanged();
    } catch (e) {
      message.error(errorMessage(e));
    } finally {
      mutationRef.current = false;
      setMutationBusy(null);
    }
  };

  const columns = [
    { title: "Student", key: "name", render: (_, m) => <span>{m.name || `Learner #${m.memberId}`}{m.rollNumber ? <Text type="secondary"> · {m.rollNumber}</Text> : null}</span> },
    { title: "Dept", dataIndex: "department", width: 90 },
    { title: "State", dataIndex: "state", width: 130, render: (s, m) => <Space size={4}><StateTag state={s} />{m.waitlistPosition ? <Text type="secondary">#{m.waitlistPosition}</Text> : null}</Space> },
    { title: "How", dataIndex: "source", width: 140, render: (s) => SOURCE_LABEL[s] || s },
    { title: "Since", key: "since", width: 170, render: (_, m) => fmt(m.joinedAt || m.createdAt) },
    { title: "Lock", key: "lock", width: 70, render: (_, m) => (
      <Button size="small" type="text" icon={m.isLocked ? <LockOutlined /> : <UnlockOutlined />} loading={mutationBusy === `lock:${m.memberId}`} disabled={mutationBusy != null} onClick={() => toggleLock(m)}
        title={m.isLocked ? "Locked: rules and the student cannot change this. Click to unlock." : "Click to lock this decision"} />
    ) },
    { title: "", key: "actions", width: 200, render: (_, m) => m.state === "REMOVED" ? null : (
      <Space size="small">
        <Popconfirm title="Remove from group?" disabled={mutationBusy != null} onConfirm={() => remove(m, false)}><Button size="small" loading={mutationBusy === `remove:${m.memberId}`} disabled={mutationBusy != null}>Remove</Button></Popconfirm>
        <Popconfirm title="Remove and lock?" description="The student cannot re-join on their own." disabled={mutationBusy != null} onConfirm={() => remove(m, true)}><Button size="small" danger loading={mutationBusy === `remove:${m.memberId}`} disabled={mutationBusy != null}>Remove & lock</Button></Popconfirm>
      </Space>
    ) },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        <AdminTableToolbar
          searchValue={search} onSearch={setSearch} searchPlaceholder="Search members" onRefresh={refreshAll} loading={loading}
          resultCount={filtered.length} totalCount={rows.length}
          exportFileName={`group-${group.id}-members.csv`}
          exportRows={() => filtered.map((m) => ({ name: m.name, rollNumber: m.rollNumber, department: m.department, state: m.state, source: m.source, locked: m.isLocked ? "yes" : "no" }))}
          extra={<Select size="small" style={{ width: 130 }} value={state} onChange={setState}
            options={[{ value: "ALL", label: "All states" }, ...MEMBER_STATES.map((s) => ({ value: s, label: s }))]} />}
        />
        <Space>
          <Button onClick={reconcile} loading={mutationBusy === "reconcile"} disabled={mutationBusy != null} title="Recompute the active count from the roster">Recount</Button>
          <Button type="primary" onClick={() => { setAddResult(null); setAdding(true); }} disabled={group.status === "ARCHIVED" || mutationBusy != null}>Add students</Button>
        </Space>
      </div>
      {loadError ? <Alert type="error" showIcon message="Members could not be loaded" description={loadError}
        action={<Button size="small" onClick={load}>Retry</Button>} style={{ marginBottom: 12 }} /> : null}
      <Table rowKey="id" columns={columns} dataSource={loadError ? [] : filtered} loading={loading} size="small"
        locale={{ emptyText: loadError ? "Could not load members; use Retry above." : "No members in this state." }}
        pagination={{ pageSize: 50, showSizeChanger: false }} />

      <Modal title="Add students" open={adding} onCancel={() => { if (!mutationRef.current) setAdding(false); }} onOk={submitAdd} okText="Add" confirmLoading={addBusy} destroyOnClose width={620}>
        <Form form={addForm} layout="vertical" initialValues={{ by: "roll", source: "MANUAL" }}>
          <Form.Item name="by" label="Identify students by">
            <Radio.Group options={[{ value: "roll", label: "Roll number" }, { value: "id", label: "Learner id" }]} optionType="button" />
          </Form.Item>
          <Form.Item name="list" label="Paste one per line (or comma-separated)" rules={[{ required: true, message: "Paste at least one" }]}>
            <Input.TextArea rows={6} placeholder={"21CS001\n21CS002\n21CS015"} />
          </Form.Item>
          <Space size="large">
            <Form.Item name="source" label="Record as">
              <Select style={{ width: 160 }} options={[{ value: "MANUAL", label: "Added by admin" }, { value: "CSV", label: "Imported from file" }]} />
            </Form.Item>
            <Form.Item name="note" label="Note (optional)"><Input style={{ width: 260 }} maxLength={500} /></Form.Item>
          </Space>
          {group.capacity != null && <Alert type="info" showIcon message={`Capacity ${group.capacity}: students beyond it are waitlisted in the order added.`} />}
        </Form>
        {addResult && (
          <Alert style={{ marginTop: 12 }} type={addResult.errors?.length ? "warning" : "success"} showIcon
            message={`${addResult.added} added${addResult.errors?.length ? `, ${addResult.errors.length} skipped` : ""}`}
            description={addResult.errors?.length ? (
              <ul style={{ margin: 0, paddingLeft: 18, maxHeight: 160, overflow: "auto" }}>
                {addResult.errors.map((e, i) => <li key={i}>{e.rollNumber || `#${e.learnerId}`}: {e.error}</li>)}
              </ul>
            ) : null} />
        )}
      </Modal>
    </div>
  );
}

// ------------------------------------------------------------------------------------------ rule

const PCT = { min: 0, max: 100, step: 0.5 };

function RuleTab({ group, onChanged }) {
  const [form] = Form.useForm();
  const [rule, setRuleState] = useState(undefined); // undefined = never loaded, null = none
  const [ruleLoading, setRuleLoading] = useState(true);
  const [ruleError, setRuleError] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [loadError, setLoadError] = useState(null);

  const load = useCallback(async () => {
    setRuleLoading(true);
    setRuleError(null);
    try {
      const res = await getRule(group.id);
      const r = res.status === 204 || !res.data ? null : res.data;
      setRuleState(r);
      const c = r?.criteriaJson || {};
      form.setFieldsValue({
        branches: c.branches || [],
        minCgpa: c.minCgpa,
        passingYears: c.passingYears || [], tenthMinPct: c.tenthMinPct, twelfthMinPct: c.twelfthMinPct,
        diplomaMinPct: c.diplomaMinPct, ugMinPct: c.ugMinPct,
      });
    } catch (e) {
      setRuleError(errorMessage(e, "Could not load the rule"));
    } finally {
      setRuleLoading(false);
    }
  }, [group.id, form]);

  useEffect(() => {
    load();
  }, [load]);

  const criteriaFromForm = (v) => {
    const clean = (x) => (x === undefined || x === null || x === "" ? undefined : x);
    const c = {
      branches: v.branches?.length ? v.branches : undefined,
      passingYears: v.passingYears?.length ? v.passingYears.map(Number).filter(Number.isInteger) : undefined,
      minCgpa: clean(v.minCgpa),
      tenthMinPct: clean(v.tenthMinPct), twelfthMinPct: clean(v.twelfthMinPct), diplomaMinPct: clean(v.diplomaMinPct),
      ugMinPct: clean(v.ugMinPct),
    };
    Object.keys(c).forEach((k) => c[k] === undefined && delete c[k]);
    return c;
  };

  const save = async () => {
    if (busyRef.current || loadError) return;
    busyRef.current = true;
    const v = await form.validateFields().catch(() => null);
    if (!v) { busyRef.current = false; return; }
    const criteria = criteriaFromForm(v);
    if (Object.keys(criteria).length === 0) {
      message.warning("Set at least one criterion");
      busyRef.current = false;
      return;
    }
    setBusy(true);
    try {
      await setRule(group.id, { criteria, autoRefresh: false });
      message.success("Rule saved");
      setPreview(null);
      load();
    } catch (e) {
      message.error(errorMessage(e));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const doPreview = async () => {
    if (busyRef.current || loadError) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const res = await previewRule(group.id);
      setPreview(res.data);
    } catch (e) {
      message.error(errorMessage(e));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const doApply = async () => {
    if (busyRef.current || loadError) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const res = await applyRule(group.id);
      const r = res.data;
      message.success(`Matched ${r.matched}: added ${r.added}, removed ${r.removed}, unchanged ${r.unchanged}${r.skippedLocked ? `, ${r.skippedLocked} locked left alone` : ""}`);
      setPreview(null);
      load();
      onChanged();
    } catch (e) {
      message.error(errorMessage(e));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const doClear = async () => {
    if (busyRef.current || loadError) return;
    busyRef.current = true;
    setBusy(true);
    try {
      await clearRule(group.id);
      message.success("Rule removed. Members matched earlier stay until you remove them.");
      form.resetFields();
      setPreview(null);
      load();
    } catch (e) {
      message.error(errorMessage(e));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  if (ruleLoading && rule === undefined) {
    return <ListSkeleton rows={3} avatar={false} label="Loading group rule" />;
  }
  if (ruleError && rule === undefined) {
    return <PanelError title={ruleError} onRetry={load} />;
  }

  return (
    <div aria-busy={ruleLoading ? "true" : undefined}>
      {ruleLoading && rule !== undefined && <RefreshStatus label="Refreshing group rule…" />}
      {ruleError && rule !== undefined && (
        <Alert type="warning" showIcon message="Couldn't refresh this rule"
          description={ruleError} action={<Button size="small" onClick={load}>Retry</Button>}
          style={{ marginBottom: 12 }} />
      )}
      <Alert type="info" showIcon style={{ marginBottom: 12 }}
        message="A rule fills the group from academic records"
        description="Same criteria placements use. Applying adds students who match and removes rule-matched students who no longer do. It never touches students added by hand, imported, or self-joined, and never changes a locked row. Missing data never excludes a student." />
      <Form form={form} layout="vertical">
        <Space size="large" wrap align="start">
          <Form.Item name="branches" label="Branches / departments"><Select mode="tags" style={{ width: 240 }} placeholder="CSE, ECE …" tokenSeparators={[",", " "]} /></Form.Item>
          <Form.Item name="passingYears" label="Passing years"><Select mode="tags" style={{ width: 200 }} placeholder="2027" tokenSeparators={[",", " "]} /></Form.Item>
          <Form.Item name="minCgpa" label="Min CGPA"><InputNumber min={0} max={10} step={0.1} style={{ width: 110 }} /></Form.Item>
        </Space>
        <Space size="large" wrap align="start">
          <Form.Item name="tenthMinPct" label="10th min %"><InputNumber {...PCT} style={{ width: 110 }} /></Form.Item>
          <Form.Item name="twelfthMinPct" label="12th min %"><InputNumber {...PCT} style={{ width: 110 }} /></Form.Item>
          <Form.Item name="diplomaMinPct" label="Diploma min %"><InputNumber {...PCT} style={{ width: 110 }} /></Form.Item>
          <Form.Item name="ugMinPct" label="UG min %"><InputNumber {...PCT} style={{ width: 110 }} /></Form.Item>
        </Space>
      </Form>
      <Space wrap>
        <Button type="primary" onClick={save} loading={busy} disabled={busy || Boolean(loadError)}>Save rule</Button>
        <Button onClick={doPreview} loading={busy} disabled={busy || !rule || Boolean(loadError)}>Preview matches</Button>
        <Popconfirm title="Apply the rule now?" description="Adds matches, removes rule-matched students who no longer match." onConfirm={doApply} disabled={!rule}>
          <Button disabled={busy || !rule || group.status === "ARCHIVED" || Boolean(loadError)} loading={busy}>Apply to roster</Button>
        </Popconfirm>
        {rule && <Popconfirm title="Remove the rule?" disabled={busy || Boolean(loadError)} onConfirm={doClear}><Button danger loading={busy} disabled={busy || Boolean(loadError)}>Remove rule</Button></Popconfirm>}
        {rule?.lastRunAt && <Text type="secondary">Last applied {fmt(rule.lastRunAt)} · {rule.lastRunMatched} matched</Text>}
      </Space>
      {preview && (
        <Card size="small" style={{ marginTop: 16 }} title={`${preview.matched} of ${preview.evaluated} students match`}>
          <Table rowKey="learnerId" size="small" pagination={{ pageSize: 25 }} dataSource={preview.matches}
            columns={[
              { title: "Student", key: "n", render: (_, m) => <span>{m.name}{m.rollNumber ? <Text type="secondary"> · {m.rollNumber}</Text> : null}</span> },
              { title: "Dept", dataIndex: "department", width: 90 },
              { title: "Checks", key: "c", render: (_, m) => (m.checks || []).map((c, i) => <Tag key={i} color={c.pass ? "green" : "red"}>{c.rule}: {c.detail}</Tag>) },
            ]} />
        </Card>
      )}
    </div>
  );
}

// ------------------------------------------------------------------------------------------ activity

function ActivityTab({ groupId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await getEvents(groupId);
      setRows(Array.isArray(res?.data) ? res.data : []);
    } catch (e) {
      setRows([]);
      setLoadError(errorMessage(e, "Could not load activity"));
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      {loadError ? <Alert type="error" showIcon message="Activity could not be loaded" description={loadError}
        action={<Button size="small" onClick={load}>Retry</Button>} style={{ marginBottom: 8 }} /> : null}
      <div style={{ marginBottom: 8 }}><AdminTableToolbar onRefresh={load} loading={loading} /></div>
      <Table rowKey="id" size="small" loading={loading} dataSource={loadError ? [] : rows}
        locale={{ emptyText: loadError ? "Could not load activity; use Retry above." : "No activity recorded yet." }} pagination={{ pageSize: 50, showSizeChanger: false }}
        columns={[
          { title: "When", dataIndex: "createdAt", width: 170, render: fmt },
          { title: "Learner", dataIndex: "memberId", width: 100, render: (v) => `#${v}` },
          { title: "Change", key: "c", width: 220, render: (_, e) => <Space size={4}>{e.fromState ? <StateTag state={e.fromState} /> : <Tag>new</Tag>}<span>→</span><StateTag state={e.toState} /></Space> },
          { title: "How", dataIndex: "source", width: 130, render: (s) => SOURCE_LABEL[s] || s },
          { title: "By", key: "by", width: 140, render: (_, e) => e.actorType === "SYSTEM" ? "System" : `${e.actorType || ""} ${e.actorId ?? ""}`.trim() },
          { title: "Reason", dataIndex: "reason" },
        ]} />
    </div>
  );
}
