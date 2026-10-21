import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { Alert, Button, Card, Col, Descriptions, Row, Select, Skeleton, Space, Statistic, Table, Tag, Tooltip, Typography } from "antd";
import { ReloadOutlined, WarningOutlined, DownloadOutlined } from "@ant-design/icons";
import { exportRowsToCsv } from "@/utils/csvExport";
import dayjs from "dayjs";
import SuperAdminLayout from "@/layouts/SuperAdminLayout";
import SuperAdminGroupShell from "@/components/admin/SuperAdminGroupShell";
import { useSuperAdminScope } from "@/contexts/SuperAdminScopeContext";
import { fetchWithErrorHandling, getProjectAuditLog } from "@/api/Services/AdminService";
import { auditActorTypeLabel, formatTimestamp, projectAuditActionLabel, projectAuditEntityLabel, textOrDash } from "@/components/admin/projects/adminProjectUtils";
import renderStructuredValue from "@/components/admin/projects/renderStructuredValue";

const { Text } = Typography;

// Kept in sync with the eventKey strings auditProjectAction()/auditTemplateAction() actually
// write — the list was previously missing most real action types, so most log volume couldn't
// be filtered at all.
const ACTION_KEYS = [
  "PROJECT_CREATE",
  "PROJECT_UPDATE",
  "PROJECT_ARCHIVE",
  "PROJECT_DELETE",
  "PROJECT_RESTORE",
  "PROJECT_TEMPLATE_ATTACH",
  "PROJECT_READINESS_OVERRIDE",
  // PROJECT_SETTINGS_UPDATE removed — grepping ProjectWorkspaceServiceImpl (and the whole
  // backend) turns up no call site that ever writes an audit row with this action key, so
  // selecting it always showed an empty result with no explanation.
  // Reversed word order from the real backend event keys (auditProjectAction writes
  // PROJECT_ASSIGN_MENTOR / PROJECT_ASSIGN_LEARNERS) meant these two options could never match a
  // real row — selecting either always showed an empty result even though mentor/learner
  // assignment happens constantly.
  "PROJECT_ASSIGN_MENTOR",
  "PROJECT_ASSIGN_LEARNERS",
  "PROJECT_MEMBER_ADD",
  "PROJECT_MEMBER_UPDATE",
  "PROJECT_MEMBER_REMOVE",
  "PROJECT_TASK_CREATE",
  "PROJECT_TASK_UPDATE",
  "PROJECT_TASK_DELETE",
  "PROJECT_TASK_REORDER",
  "PROJECT_TASK_COMMENT_ADD",
  "PROJECT_TASK_SYNC",
  "PROJECT_RESOURCE_SYNC",
  "PROJECT_MEETINGS_SYNC",
  "PROJECT_DELIVERY_UPDATE",
  "PROJECT_DELIVERY_ADMIN_REVIEW",
  // Template lifecycle actions were previously never written to this table at all (see
  // auditTemplateAction) — a create/edit/archive/publish on a template was invisible here.
  "PROJECT_TEMPLATE_CREATE",
  "PROJECT_TEMPLATE_UPDATE",
  "PROJECT_TEMPLATE_ARCHIVE",
  "PROJECT_TEMPLATE_PUBLISH",
  "PROJECT_TEMPLATE_UNPUBLISH",
  "PROJECT_TEMPLATE_DUPLICATE",
  "PROJECT_TEMPLATE_ROLLBACK",
  // Per-college template assignment (V140) writes these two, and nothing here could filter for
  // them — so the one action that decides which colleges can use a template was unfindable in its
  // own audit log.
  "PROJECT_TEMPLATE_COLLEGE_ASSIGN",
  "PROJECT_TEMPLATE_COLLEGE_UNASSIGN",
  // Release lifecycle: shipping and unshipping are ordinary events, but deleting a release that
  // has already shipped is the destructive one below.
  "PROJECT_RELEASE_SHIPPED",
  "PROJECT_RELEASE_UNSHIPPED",
  "PROJECT_RELEASE_DELETED_AFTER_SHIP",
  // SAA-04: PROJECT_MEETING_REQUESTED removed — it can never match a row here. It's written via
  // recordActivityEvent to ProjectActivityEvent, a completely separate feed this endpoint doesn't
  // read from at all (unlike every other key in this list, which reaches AdminAuditLog through
  // auditProjectAction/auditTemplateAction/auditTaskAction). No collegeId fix helps this one —
  // it's the wrong table, not a scoping gap. Selecting it always returned an empty result with no
  // explanation, the exact anti-pattern the notes elsewhere in this file describe fixing.
];

// The subset of actions a daily-check admin actually needs to notice — irreversible or
// access-changing moves, as opposed to routine syncs (task reorder, resource sync, etc).
const DESTRUCTIVE_ACTIONS = new Set([
  "PROJECT_ARCHIVE",
  "PROJECT_DELETE",
  "PROJECT_READINESS_OVERRIDE",
  "PROJECT_ASSIGN_MENTOR",
  // Not irreversible or access-changing the way the rest of this set is — an admin overriding a
  // mentor's own review verdict on a submission is high-stakes enough to warrant the same
  // daily-check visibility even though it doesn't structurally destroy anything. Kept here
  // deliberately for that visibility, not because it fits the set's literal definition above.
  "PROJECT_DELIVERY_ADMIN_REVIEW",
  "PROJECT_MEMBER_REMOVE",
  "PROJECT_TASK_DELETE",
  // SAA-08: these three template-lifecycle keys were flagged as dead weight on this page because
  // SAA-02 meant a null-collegeId template row could never match this page's collegeId-scoped
  // query. SAA-02 has since been fixed (AdminAuditLogRepository#search's
  // includeGlobalTemplateEvents escape hatch, role-gated to super-admin) — template rows genuinely
  // surface here now, so these are live, not inert.
  "PROJECT_TEMPLATE_ARCHIVE",
  "PROJECT_TEMPLATE_ROLLBACK",
  // Removing a college's access to a template, and deleting a release that already shipped: both
  // take something away that people were relying on, which is what this set is for.
  "PROJECT_TEMPLATE_COLLEGE_UNASSIGN",
  "PROJECT_RELEASE_DELETED_AFTER_SHIP",
]);

const RANGE_OPTIONS = [
  { key: "today", label: "Today", days: 0 },
  { key: "7d", label: "7 days", days: 7 },
  { key: "30d", label: "30 days", days: 30 },
  { key: "all", label: "All time", days: null },
];

// "Today"/short ranges fetch a wide page in one shot (bounded well under realistic daily volume
// for a single college) so the summary strip reflects the whole range rather than just page 1 —
// longer ranges fall back to normal server pagination since they can genuinely span thousands of
// rows.
const WIDE_RANGE_SIZE = 200;
const PAGED_SIZE = 25;

// createdAt is serialized by the backend as a Jackson LocalDateTime array
// [year, month(1-indexed), day, hour, minute, second], not an ISO string — dayjs (unlike moment)
// doesn't parse that shape and silently produces "Invalid Date". Same quirk/fix as
// parseBackendTimestamp in ProjectDetailContent.jsx.
const parseBackendTimestamp = (value) => {
  if (!value) return null;
  if (Array.isArray(value)) {
    const [year, month, day, hour = 0, minute = 0, second = 0] = value;
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day, hour, minute, second);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export default function SuperAdminProjectAuditPage() {
  const router = useRouter();
  const { selectedCollegeId, scopeLoaded } = useSuperAdminScope();
  const collegeId = selectedCollegeId ?? null;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [range, setRange] = useState("today");
  const [actionKey, setActionKey] = useState(undefined);
  const [entityId, setEntityId] = useState(undefined);
  const [hydratedFromUrl, setHydratedFromUrl] = useState(false);
  const auditSeq = useRef(0);
  // The hydration effect below sets range/actionKey/entityId/page from the URL and flips
  // hydratedFromUrl to true in the same batched render — which made the page-reset effect fire
  // immediately afterward (its deps had just changed too) and stomp the deep-linked page back to
  // 0. This flag tells that effect "the change you're seeing is the hydration itself, not a real
  // filter change — skip it once."
  const skipNextPageResetRef = useRef(false);

  const size = range === "all" ? PAGED_SIZE : WIDE_RANGE_SIZE;

  // Restore the range/action/entity filter and page from the URL on load — including entityId,
  // which is how a "View audit trail" link from a workspace/template detail page deep-links
  // straight to that entity's history instead of the whole college feed.
  useEffect(() => {
    if (!router.isReady || hydratedFromUrl) return;
    const q = router.query;
    if (q.status !== undefined) setActionKey(String(q.status));
    if (q.range !== undefined && RANGE_OPTIONS.some((opt) => opt.key === q.range)) setRange(String(q.range));
    if (q.entityId !== undefined) setEntityId(String(q.entityId));
    const hydratedPage = q.page !== undefined ? Number(q.page) || 0 : 0;
    if (hydratedPage > 0) {
      setPage(hydratedPage);
      // Only arm the skip when there's an actual non-zero page to protect — if nothing else
      // changes on this same render (deps unchanged), the reset effect below won't even re-run,
      // and an unconditionally-armed flag would sit there and wrongly swallow the *next* genuine
      // filter change instead.
      skipNextPageResetRef.current = true;
    }
    setHydratedFromUrl(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, hydratedFromUrl]);

  // Keep the URL addressable/shareable — reflect the current filters/page into the query string
  // without triggering a navigation (shallow routing).
  useEffect(() => {
    if (!hydratedFromUrl) return;
    router.replace(
      {
        pathname: router.pathname,
        // `range` omitted at its default ("today"), like every sibling param.
        query: Object.fromEntries(Object.entries({
          ...router.query,
          status: actionKey || undefined,
          range: range === "today" ? undefined : range,
          entityId: entityId || undefined,
          page: page || undefined,
        }).filter(([, value]) => value !== undefined && value !== null && value !== "")),
      },
      undefined,
      { shallow: true }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionKey, range, entityId, page, hydratedFromUrl]);

  // Switching range/action/entity resets to page 1 — otherwise e.g. narrowing from "All time" page
  // 4 down to "Today" could land on a now-nonexistent page.
  useEffect(() => {
    if (!hydratedFromUrl) return;
    if (skipNextPageResetRef.current) {
      skipNextPageResetRef.current = false;
      return;
    }
    setPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, actionKey, entityId, collegeId]);

  // A deep-link/"Filter to this entity" entityId is a per-project/per-template slug — switching
  // the header college while one is active virtually always returns zero rows against the new
  // college, indistinguishable in the UI from "this entity genuinely has no audit history".
  // Clear it (and its "Filtered to: X" tag) on a real college change so a stale filter can't
  // silently masquerade as a genuinely empty result.
  const collegeBaselineRef = useRef(null);
  useEffect(() => {
    if (!hydratedFromUrl) return;
    if (collegeBaselineRef.current === null) {
      collegeBaselineRef.current = collegeId;
      return;
    }
    if (collegeId === collegeBaselineRef.current) return;
    collegeBaselineRef.current = collegeId;
    setEntityId(undefined);
    // The stat cards and Export CSV button are only overwritten after the async fetch below
    // resolves — with nothing clearing them synchronously, they kept showing the PREVIOUS
    // college's numbers (and Export CSV stayed enabled over the previous college's rows) for the
    // full duration of the new fetch, with no loading indicator on the stat cards to signal it.
    // Clear immediately so the stale-data window can't be mistaken for the new college's real data.
    setItems([]);
    setTotal(0);
  }, [collegeId, hydratedFromUrl]);

  const sinceMillis = useMemo(() => {
    const opt = RANGE_OPTIONS.find((o) => o.key === range);
    if (!opt || opt.days === null) return undefined;
    // Send a real epoch instant, not a naive local-time string — the backend's audit rows are
    // stamped in the SERVER's timezone, not the browser's, so a naive "today start" string built
    // from the browser's clock would misalign whenever the two differ (e.g. admin in IST, server
    // in UTC). An epoch millis value is zone-unambiguous; the backend re-derives it in whatever
    // zone the rows were actually written in.
    return dayjs().subtract(opt.days, "day").startOf("day").valueOf();
  }, [range]);

  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let mounted = true;
    const requestId = ++auditSeq.current;
    const load = async () => {
      if (!collegeId) return;
      setLoading(true);
      setError(null);
      const result = await fetchWithErrorHandling(
        getProjectAuditLog(collegeId, { actionKey, entityId, sinceMillis, page, size })
      );
      if (!mounted || requestId !== auditSeq.current) return;
      if (result.success) {
        const payload = result?.data?.data ?? result?.data ?? {};
        const fetchedItems = Array.isArray(payload?.items) ? payload.items : [];
        // Pagination controls are hidden for non-"all" ranges, so a hand-edited/stale URL like
        // ?range=today&page=3 has no visual cue why the table is empty — clamp back to page 0
        // (the effect below re-fetches on the page change) rather than leaving an unexplained
        // blank table on screen.
        if (range !== "all" && page > 0 && fetchedItems.length === 0) {
          setPage(0);
        }
        setItems(fetchedItems);
        setTotal(Number(payload?.total) || 0);
      } else {
        setItems([]);
        setTotal(0);
        setError(result?.message || "Failed to load audit log.");
      }
      setLoading(false);
    };
    load();
    return () => {
      mounted = false;
    };
  }, [collegeId, actionKey, entityId, sinceMillis, page, size, range, refreshTick]);

  const summary = useMemo(() => {
    const actorKeys = new Set();
    let destructive = 0;
    items.forEach((item) => {
      actorKeys.add(item?.actorUserId ?? item?.actorName ?? "unknown");
      if (DESTRUCTIVE_ACTIONS.has(item?.actionKey)) destructive += 1;
    });
    return { actions: items.length, actors: actorKeys.size, destructive };
  }, [items]);

  // A response that exactly fills the wide page means the day may hold more than was
  // fetched, so the summary strip below is a floor rather than a total and says so.
  const rangeCapReached = range !== "all" && items.length >= WIDE_RANGE_SIZE;

  const showDayDividers = range !== "today";
  const tableData = useMemo(() => {
    if (!showDayDividers) return items;
    // Inserts a lightweight divider row before the first entry of each new calendar day so a
    // multi-day range (7d/30d/all) reads as "today / yesterday / ..." instead of one undivided
    // flat list where every row repeats its own date.
    const rows = [];
    let lastDay = null;
    items.forEach((item, index) => {
      const day = item?.createdAt ? dayjs(parseBackendTimestamp(item.createdAt)).format("YYYY-MM-DD") : null;
      if (day && day !== lastDay) {
        rows.push({ __divider: true, __key: `divider-${day}`, day });
        lastDay = day;
      }
      rows.push({ ...item, __key: item?.id ?? `audit-row-${index}` });
    });
    return rows;
  }, [items, showDayDividers]);

  // Day-divider rows merge into a single full-width cell (the standard antd pattern: colSpan on
  // the first column, colSpan 0 — i.e. "don't render" — on every other column of that row).
  // +1 for the expand column: antd renders that outside `columns`, so spanning
  // columns.length left one stray cell to the left of every day divider.
  const dividerCell = (record, isFirstColumn) =>
    record.__divider ? { colSpan: isFirstColumn ? columns.length + 1 : 0 } : {};

  const columns = [
    {
      title: "Action",
      dataIndex: "actionKey",
      key: "actionKey",
      onCell: (record) => dividerCell(record, true),
      render: (value, record) => {
        if (record.__divider) return <Text strong>{dayjs(record.day).format("dddd, DD MMM YYYY")}</Text>;
        const isDestructive = DESTRUCTIVE_ACTIONS.has(value);
        return (
          <Space size={6}>
            {isDestructive ? (
              <Tooltip title="Irreversible or access-changing action">
                <WarningOutlined style={{ color: "#d4380d" }} />
              </Tooltip>
            ) : null}
            <Tooltip title={value}><Tag color={isDestructive ? "volcano" : "blue"}>{projectAuditActionLabel(value)}</Tag></Tooltip>
          </Space>
        );
      },
    },
    {
      title: "Entity",
      key: "entity",
      onCell: (record) => dividerCell(record, false),
      render: (_, record) => {
        if (record.__divider) return null;
        // PROJECT_TASK_SYNC is logged with entityType "PROJECT_TASK" but, since it covers a whole
        // bulk sync rather than one task, its entityId is actually the project's own slug (CAA-03:
        // see auditTaskAction's `task != null ? task.getTaskKey() : project.getSlug()` fallback,
        // consistent with every other project-level row) — showing it under "PROJECT_TASK" reads
        // as a task identifier when it isn't one.
        const isBulkTaskSync = record?.actionKey === "PROJECT_TASK_SYNC";
        const displayId = isBulkTaskSync ? `Project ${textOrDash(record?.entityId)}` : textOrDash(record?.entityId);
        const filterToThisEntity = record?.entityId ? () => setEntityId(String(record.entityId)) : undefined;
        const entityType = isBulkTaskSync ? "PROJECT" : String(record?.entityType || "").toUpperCase();
        const entityHref = !record?.entityId
          ? null
          : entityType === "PROJECT"
            ? `/superadmin/projects/workspaces/${encodeURIComponent(record.entityId)}/summary?from=audit`
            : null;
        // Deliberately no PROJECT_TEMPLATE link: auditTemplateAction stamps the entityId with the
        // template's slug, and the template routes take an Integer id (@PathVariable Integer
        // templateId), so a link built from it would be a 400. Filtering still works on those rows.

        return (
          <div>
            <div>{projectAuditEntityLabel(isBulkTaskSync ? "PROJECT" : record?.entityType)}</div>
            <Text
              type="secondary"
              role={filterToThisEntity ? "button" : undefined}
              tabIndex={filterToThisEntity ? 0 : undefined}
              aria-label={filterToThisEntity ? `Filter audit log to ${displayId}` : undefined}
              style={{ cursor: filterToThisEntity ? "pointer" : "default" }}
              onClick={filterToThisEntity}
              onKeyDown={
                filterToThisEntity
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        filterToThisEntity();
                      }
                    }
                  : undefined
              }
            >
              {/* Workspace/template title when the backend resolved one; the slug otherwise. */}
              {record?.entityName || displayId}
            </Text>
            {/* SL-23: the cell could filter the log to an entity but never take you to it, so
                answering "what is this workspace now?" meant copying the id into the address bar.
                Only workspaces and templates have a destination — a task or member row's entity is
                not separately addressable. */}
            {entityHref ? (
              <div>
                <Button type="link" size="small" style={{ padding: 0, height: "auto" }} onClick={() => router.push(entityHref)}>
                  Open
                </Button>
              </div>
            ) : null}
          </div>
        );
      },
    },
    {
      title: "Actor",
      key: "actor",
      onCell: (record) => dividerCell(record, false),
      render: (_, record) => {
        if (record.__divider) return null;
        return (
          <div>
            <div>{textOrDash(record?.actorName) !== "—" ? record.actorName : `User #${textOrDash(record?.actorUserId)}`}</div>
            <Text type="secondary">{auditActorTypeLabel(record?.actorUserType)}</Text>
          </div>
        );
      },
    },
    {
      title: "When",
      dataIndex: "createdAt",
      key: "createdAt",
      onCell: (record) => dividerCell(record, false),
      render: (value, record) => (record.__divider ? null : formatTimestamp(value)),
    },
  ];

  const parsePayload = (record) => {
    const raw = record?.payloadJson;
    if (!raw) return null;
    if (typeof raw === "string") {
      try {
        return JSON.parse(raw);
      } catch (e) {
        return raw;
      }
    }
    return raw;
  };

  const expandable = {
    rowExpandable: (record) => !record?.__divider && Boolean(record?.payloadJson),
    expandedRowRender: (record) => {
      const payload = parsePayload(record);
      if (!payload) return <Text type="secondary">No additional details</Text>;
      // Payload shape varies a lot across actionKey values (member-add, mentor-reassign,
      // settings-update, template-update, ...) — a generic recursive key/value renderer handles
      // all of them instead of special-casing each actionKey. If JSON.parse failed above,
      // payload is the raw (non-JSON) string — show it as plain text rather than as a key list.
      if (typeof payload !== "object") return <Text>{String(payload)}</Text>;
      const entries = Object.entries(payload);
      if (!entries.length) return <Text type="secondary">No additional details</Text>;
      return (
        <Descriptions column={1} size="small" bordered>
          {entries.map(([key, val]) => (
            <Descriptions.Item key={key} label={key}>
              {renderStructuredValue(val)}
            </Descriptions.Item>
          ))}
        </Descriptions>
      );
    },
  };

  if (!collegeId) {
    return (
      <div className="ln-module admin-list-page">
        {/* Inside the tab strip, like At Risk: the bare alert dropped every way off this page, and it
            flashed before a saved college had restored. */}
        <SuperAdminGroupShell groupKey="projects">
          {scopeLoaded ? (
            <Alert
              type="warning"
              message="Select a college to continue"
              description="Choose a college in the header above to see its project audit."
              showIcon
            />
          ) : (
            <Skeleton active paragraph={{ rows: 4 }} />
          )}
        </SuperAdminGroupShell>
      </div>
    );
  }

  return (
    <div className="ln-module admin-list-page">
      <SuperAdminGroupShell groupKey="projects">
      <div className="admin-list-page__header">
        <div>
          <h1 className="admin-list-page__title">Project audit</h1>
          <div className="admin-list-page__subtitle">Who changed what, and when — check daily for anything unexpected.</div>
        </div>
        <Space wrap>
          <Button icon={<ReloadOutlined />} loading={loading} onClick={() => setRefreshTick((t) => t + 1)}>
            Refresh
          </Button>
          <Button onClick={() => router.push("/superadmin/audit")}>
            View activity log
          </Button>
        </Space>
      </div>

      {error ? <Alert type="error" message="Audit log could not be loaded" description={error} showIcon style={{ marginBottom: 16 }} /> : null}

      <div className="admin-list-page__card-gap">
        <Space wrap size={8}>
          {RANGE_OPTIONS.map((opt) => (
            <Button key={opt.key} type={range === opt.key ? "primary" : "default"} size="small" onClick={() => setRange(opt.key)}>
              {opt.label}
            </Button>
          ))}
          {entityId ? (
            <Tag closable onClose={() => setEntityId(undefined)} color="processing">
              Filtered to: {entityId}
            </Tag>
          ) : null}
        </Space>
      </div>

      <Row gutter={[16, 16]} className="admin-list-page__card-gap">
        <Col xs={24} sm={8}>
          <Card size="small">
            {/* SAA-05: the cap disclosure previously only fired for range === "today", even though
                the same WIDE_RANGE_SIZE cap applies to 7d/30d too — a super-admin on a 7-day range
                with 340 real actions saw a bare "Actions shown: 200" with no on-card indication
                it's a floor. Qualify whenever the cap is actually reached, for any non-"all" range,
                matching cards 2/3's own qualifier logic below. */}
            <Statistic
              title={
                rangeCapReached
                  ? `Actions ${range === "today" ? "today" : "shown"} (first ${WIDE_RANGE_SIZE})`
                  : range === "today"
                    ? "Actions today"
                    : "Actions shown"
              }
              value={summary.actions}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            {/* Mirrors the "Actions today"/"Actions shown" qualifier on the first card — these two
                stats are computed purely from the currently loaded `items` page, which in "All
                time" mode is one 25-row server page, not the whole range. Without the qualifier
                this silently undercounts everything past page 1. */}
            <Statistic
              title={
                range === "today" && !rangeCapReached ? "People who made changes" : "People who made changes (this page)"
              }
              value={summary.actors}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title={
                range === "today" && !rangeCapReached ? "Destructive actions" : "Destructive actions (this page)"
              }
              value={summary.destructive}
              valueStyle={summary.destructive ? { color: "#d4380d" } : undefined}
              prefix={summary.destructive ? <WarningOutlined /> : undefined}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="Change log"
        extra={
          <Space wrap>
            <Select
              allowClear
              placeholder="Filter by action"
              className="admin-list-page__filter"
              value={actionKey}
              onChange={setActionKey}
              options={ACTION_KEYS.map((key) => ({ value: key, label: projectAuditActionLabel(key) }))}
            />
            <Button
              size="small"
              icon={<DownloadOutlined />}
              disabled={!items.length}
              onClick={() =>
                exportRowsToCsv(
                  "project-audit-log.csv",
                  // SAA-01: exportRowsToCsv(filename, columns, rows) needs a {label,key}[] columns
                  // array as its 2nd argument — this call passed only the mapped rows, so `rows`
                  // was undefined and every export downloaded an empty file.
                  [
                    { label: "Action", key: "action" },
                    { label: "Entity type", key: "entityType" },
                    { label: "Entity ID", key: "entityId" },
                    { label: "Actor", key: "actor" },
                    { label: "When", key: "createdAt" },
                  ],
                  items.map((r) => ({
                    action: r?.actionKey ?? "",
                    entityType: r?.entityType ?? "",
                    entityId: r?.entityId ?? "",
                    actor: r?.actorName ?? (r?.actorUserId != null ? `User #${r.actorUserId}` : ""),
                    createdAt: r?.createdAt ?? "",
                  }))
                )
              }
            >
              Export CSV
            </Button>
          </Space>
        }
      >
        <Skeleton loading={loading} active paragraph={{ rows: 8 }}>
          <Table
            rowKey={(record) => record.__key ?? record?.id}
            dataSource={tableData}
            columns={columns}
            expandable={expandable}
            scroll={{ x: "max-content" }}
            rowClassName={(record) => (record.__divider ? "admin-audit-day-divider" : "")}
            // SAA-09: antd's generic "No data" read identically whether the range genuinely has
            // no activity, an entity/action filter is stale, or the page number is out of range —
            // give the three cases distinguishable copy.
            locale={{
              emptyText: entityId
                ? `No audit rows match entity "${entityId}" — the filter may be stale (e.g. left over from a different college).`
                : actionKey
                  ? `No "${actionKey}" activity in this range.`
                  : `No audit activity ${range === "all" ? "recorded" : `in the last ${range === "today" ? "day" : range}`}.`,
            }}
            pagination={
              range === "all"
                ? {
                    current: page + 1,
                    pageSize: size,
                    total,
                    onChange: (nextPage) => setPage(nextPage - 1),
                    showSizeChanger: false,
                  }
                : false
            }
          />
          {range !== "all" && total > size ? (
            <Text type="secondary" style={{ display: "block", marginTop: 12 }}>
              Showing the most recent {size} of {total} actions in this range. Switch to a narrower filter or &quot;All time&quot; (paginated) to see the rest.
            </Text>
          ) : null}
        </Skeleton>
      </Card>
      </SuperAdminGroupShell>
    </div>
  );
}

SuperAdminProjectAuditPage.superAdminLayout = SuperAdminLayout;
