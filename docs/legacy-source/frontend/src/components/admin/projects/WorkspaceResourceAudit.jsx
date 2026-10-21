import { useMemo, useState } from "react";
import { Alert, Button, Card, Empty, Input, Select, Skeleton, Table, Tag, Typography } from "antd";
import { formatTimestamp, textOrDash } from "@/components/admin/projects/adminProjectUtils";

const { Text } = Typography;

const ACTIONS = {
  UPSERT: { label: "Saved", color: "blue" },
  CREATE: { label: "Added", color: "green" },
  UPDATE: { label: "Edited", color: "gold" },
  DELETE: { label: "Removed", color: "red" },
};

const actorTypeLabel = (value) =>
  ({ FACULTY: "Staff", LEARNER: "Student", ADMIN: "Admin" })[String(value || "").toUpperCase()] ||
  textOrDash(value);

const resourceLabel = (value) =>
  value
    ? String(value)
        .replace(/^resource-/, "")
        .replace(/-/g, " ")
        .replace(/^./, (character) => character.toUpperCase())
    : "—";

const actionMeta = (value) => {
  const normalized = String(value || "").toUpperCase();
  return ACTIONS[normalized] || { label: textOrDash(value), color: "default" };
};

export default function WorkspaceResourceAudit({ items, loading, error, onRetry }) {
  const rows = Array.isArray(items) ? items : [];
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("ALL");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((record) => {
      const normalizedAction = String(record?.actionType || "").toUpperCase();
      if (action !== "ALL" && normalizedAction !== action) return false;
      if (!query) return true;
      const haystack = [
        resourceLabel(record?.resourceKey),
        record?.actorName,
        record?.actorUserId,
        actorTypeLabel(record?.actorUserType),
        actionMeta(record?.actionType).label,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [rows, search, action]);

  const counts = {
    total: rows.length,
    added: rows.filter((row) => String(row?.actionType || "").toUpperCase() === "CREATE").length,
    edited: rows.filter((row) => ["UPDATE", "UPSERT"].includes(String(row?.actionType || "").toUpperCase())).length,
    removed: rows.filter((row) => String(row?.actionType || "").toUpperCase() === "DELETE").length,
  };

  const columns = [
    { title: "Resource", dataIndex: "resourceKey", key: "resourceKey", render: resourceLabel },
    {
      title: "Action",
      dataIndex: "actionType",
      key: "actionType",
      render: (value) => {
        const meta = actionMeta(value);
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: "Actor",
      key: "actor",
      render: (_, record) => (
        <div>
          <div>{textOrDash(record?.actorName || record?.actorUserId)}</div>
          <Text type="secondary">{actorTypeLabel(record?.actorUserType)}</Text>
        </div>
      ),
    },
    { title: "When", dataIndex: "createdAt", key: "createdAt", render: formatTimestamp },
  ];

  return (
    <Card className="project-workspace-audit__card">
      <div className="project-workspace-audit__intro">
        <div>
          <div className="project-workspace-audit__eyebrow">Resource activity</div>
          <div className="project-workspace-audit__headline">See who changed project resources and when</div>
        </div>
        <Text type="secondary">
          This view focuses on resource changes inside the workspace. Use the full audit trail for broader project events.
        </Text>
      </div>

      <div className="project-workspace-audit__metrics">
        {[
          ["Changes", counts.total],
          ["Added", counts.added],
          ["Edited", counts.edited],
          ["Removed", counts.removed],
        ].map(([label, value]) => (
          <div className="project-workspace-audit__metric" key={label}>
            <Text type="secondary">{label}</Text>
            <div>{value}</div>
          </div>
        ))}
      </div>

      <div className="project-workspace-audit__filters">
        <Input.Search
          allowClear
          value={search}
          placeholder="Search resource or actor"
          aria-label="Search resource audit"
          onChange={(event) => setSearch(event.target.value)}
        />
        <Select
          value={action}
          aria-label="Filter audit actions"
          onChange={setAction}
          options={[
            { value: "ALL", label: "All actions" },
            { value: "CREATE", label: "Added" },
            { value: "UPDATE", label: "Edited" },
            { value: "UPSERT", label: "Saved" },
            { value: "DELETE", label: "Removed" },
          ]}
        />
      </div>

      <Skeleton loading={loading} active paragraph={{ rows: 5 }}>
        {error ? (
          <Alert
            type="error"
            showIcon
            message="Resource audit could not be loaded"
            description={error}
            action={<Button size="small" onClick={onRetry}>Retry</Button>}
          />
        ) : rows.length === 0 ? (
          <Empty description="No resource changes yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : filtered.length === 0 ? (
          <Empty description="No resource changes match these filters" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Table
            rowKey={(record) => String(record?.id ?? `${record?.resourceKey}-${record?.createdAt}`)}
            dataSource={filtered}
            columns={columns}
            size="small"
            scroll={{ x: "max-content" }}
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
              showTotal: (total, range) => `${range[0]}–${range[1]} of ${total} matching changes`,
            }}
          />
        )}
      </Skeleton>
    </Card>
  );
}
