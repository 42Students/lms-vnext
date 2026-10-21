import { useMemo, useState } from "react";
import { Alert, Button, Empty, Input, Pagination, Select, Space, Table, Tag, Typography, message } from "antd";
import { reconcileProjectTeam } from "@/api/Services/AdminService";
import { formatTimestamp, parseServerTimestamp, textOrDash } from "@/components/admin/projects/adminProjectUtils";

const timeOf = (v) => parseServerTimestamp(v)?.date?.getTime?.() || 0;

// Shared by the college-admin and superadmin workspace tabs so both roles read a workspace the same way.

const SPRINT_STATE_TAG = { ACTIVE: ["blue", "Active"], COMPLETED: ["green", "Completed"], PLANNED: ["default", "Planned"] };
const TASK_STATUS_TAG = { TO_DO: ["default", "To do"], IN_PROGRESS: ["blue", "In progress"], IN_REVIEW: ["gold", "In review"], DONE: ["green", "Done"], COMPLETED: ["green", "Done"], BLOCKED: ["red", "Blocked"] };

const shortDate = (v) => {
  if (!v) return null;
  const d = Array.isArray(v) ? new Date(v[0], (v[1] || 1) - 1, v[2] || 1) : new Date(String(v).length === 10 ? `${v}T00:00:00` : v);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
};
const asList = (v) => (Array.isArray(v) ? v : []);

/** metaOf for the Sprints editor: state, dates, done/total tasks. */
export const sprintRowMeta = (workspace) => function sprintRowMetaOf(row) {
  const [color, label] = SPRINT_STATE_TAG[String(row?.sprintState || "PLANNED").toUpperCase()] || SPRINT_STATE_TAG.PLANNED;
  const tasks = asList(workspace?.resolvedTasks || workspace?.tasks).filter((t) => t?.sprintKey && t.sprintKey === row?.sprintKey);
  const done = tasks.filter((t) => ["DONE", "COMPLETED"].includes(String(t?.status || "").toUpperCase())).length;
  const from = shortDate(row?.startDate);
  const to = shortDate(row?.endDate);
  return (
    <>
      <Tag color={color}>{label}</Tag>
      {from || to ? <span>{from && to ? `${from} – ${to}` : from ? `From ${from}` : `Until ${to}`}</span> : null}
      {tasks.length ? <span>{done}/{tasks.length} tasks done</span> : null}
    </>
  );
};

/** metaOf for the Tasks editor: status, assignee, sprint, due date. */
export const taskRowMeta = (row) => {
  const [color, label] = TASK_STATUS_TAG[String(row?.status || "TO_DO").toUpperCase().replace(/ /g, "_")] || TASK_STATUS_TAG.TO_DO;
  const due = shortDate(row?.dueDate);
  return (
    <>
      <Tag color={color}>{label}</Tag>
      <span>{row?.assigneeName || "Unassigned"}</span>
      {row?.sprintLabel ? <span>{row.sprintLabel}</span> : null}
      {due ? <span>due {due}</span> : null}
    </>
  );
};

const MEMBER_PAGE_SIZE = 20;

/**
 * Members table for the Team tab: role, tasks assigned, done / in review / in progress, last task
 * update, with search and a type filter. `roleOf(member)` returns { label, color }.
 */
export function TeamMembersTable({ workspace, members, roleOf }) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("ALL");
  const [page, setPage] = useState(1);

  const workByUserId = useMemo(() => {
    const out = new Map();
    asList(workspace?.resolvedTasks || workspace?.tasks).forEach((task) => {
      if (task?.assigneeId == null) return;
      const key = Number(task.assigneeId);
      const row = out.get(key) || { assigned: 0, done: 0, review: 0, active: 0, lastUpdate: null };
      const status = String(task?.status || "").toUpperCase();
      row.assigned += 1;
      if (status === "DONE" || status === "COMPLETED") row.done += 1;
      else if (status === "IN_REVIEW") row.review += 1;
      else if (status === "IN_PROGRESS") row.active += 1;
      const updated = task?.submittedAt || task?.updatedAt;
      if (updated && (!row.lastUpdate || timeOf(updated) > timeOf(row.lastUpdate))) row.lastUpdate = updated;
      out.set(key, row);
    });
    return out;
  }, [workspace]);

  const nameOf = (m) => textOrDash(m?.name || m?.fullName || m?.displayName || m?.userName || m?.mobile);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return asList(members).filter((m) => (type === "ALL" || String(m?.userType).toUpperCase() === type)
      && (!q || `${nameOf(m)} ${m?.userId ?? ""}`.toLowerCase().includes(q)));
  }, [members, search, type]); // eslint-disable-line react-hooks/exhaustive-deps
  const visible = filtered.slice((page - 1) * MEMBER_PAGE_SIZE, page * MEMBER_PAGE_SIZE);

  if (!asList(members).length) return <Empty description="No members yet" />;
  return (
    <Space direction="vertical" size={8} style={{ width: "100%" }}>
      <Space wrap style={{ width: "100%", justifyContent: "space-between" }}>
        <Input.Search allowClear value={search} placeholder="Search member name or ID" aria-label="Search project members"
          onChange={(e) => { setSearch(e.target.value); setPage(1); }} style={{ maxWidth: 320 }} />
        <Select value={type} aria-label="Filter project members by type" style={{ width: 160 }}
          onChange={(v) => { setType(v); setPage(1); }}
          options={[{ value: "ALL", label: "All members" }, { value: "LEARNER", label: "Learners" }, { value: "FACULTY", label: "Faculty" }]} />
      </Space>
      <Table
        size="small"
        pagination={false}
        rowKey={(m) => m?.userId ?? m?.id ?? m?.name}
        dataSource={visible}
        scroll={{ x: "max-content" }}
        locale={{ emptyText: "No members match these filters" }}
        columns={[
          { title: "Member", key: "name", render: (_, m) => nameOf(m) },
          { title: "Role", key: "role", render: (_, m) => { const r = roleOf(m); return <Tag color={r.color}>{r.label}</Tag>; } },
          {
            title: "Tasks assigned",
            key: "assigned",
            render: (_, m) => {
              if (String(m?.userType).toUpperCase() !== "LEARNER") return <Typography.Text type="secondary">—</Typography.Text>;
              const w = workByUserId.get(Number(m?.userId));
              return w?.assigned ? w.assigned : <Tag color="orange">None</Tag>;
            },
          },
          {
            title: "Done · In review · In progress",
            key: "progress",
            render: (_, m) => {
              const w = workByUserId.get(Number(m?.userId));
              return w ? `${w.done} · ${w.review} · ${w.active}` : <Typography.Text type="secondary">—</Typography.Text>;
            },
          },
          {
            title: "Last task update",
            key: "last",
            render: (_, m) => {
              const w = workByUserId.get(Number(m?.userId));
              return w?.lastUpdate ? formatTimestamp(w.lastUpdate) : <Typography.Text type="secondary">—</Typography.Text>;
            },
          },
        ]}
      />
      {filtered.length > MEMBER_PAGE_SIZE ? (
        <Pagination size="small" current={page} pageSize={MEMBER_PAGE_SIZE} total={filtered.length} showSizeChanger={false}
          showTotal={(total, range) => `${range[0]}–${range[1]} of ${total} matching members`} onChange={setPage} />
      ) : null}
    </Space>
  );
}

/**
 * Shown on the Team tab of a workspace created as a team: its learners are kept by a team group
 * (docs/groups/PROJECT-TEAMS.md). "Check roster" re-syncs the member rows from the group, which only
 * matters after a hand edit in the database.
 */
export function TeamGroupNotice({ workspace, workspaceId, collegeId, onRepaired }) {
  const [checking, setChecking] = useState(false);
  if (!workspace?.teamGroupId) return null;
  const check = async () => {
    setChecking(true);
    try {
      const res = await reconcileProjectTeam(workspaceId, collegeId);
      const changed = Number(res?.data?.data?.changed ?? 0);
      if (changed > 0) {
        message.success(`Fixed ${changed} member row${changed === 1 ? "" : "s"} to match the team.`);
        onRepaired?.();
      } else {
        message.success("The roster already matches the team.");
      }
    } catch (error) {
      message.error(error?.response?.data?.message || "Could not check the roster.");
    } finally {
      setChecking(false);
    }
  };
  return (
    <Alert
      type="info"
      showIcon
      style={{ marginBottom: 16 }}
      message="This workspace is a team"
      description="Its learners are kept by the team it was created with. Adding or removing learners here updates the team too."
      action={<Button size="small" loading={checking} onClick={check}>Check roster</Button>}
    />
  );
}
