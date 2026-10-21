import { useEffect, useRef, useState } from "react";
import { Alert, Button, Card, Col, DatePicker, Input, Row, Space, Table, Tooltip } from "antd";
import dayjs from "dayjs";
import { exportRowsToCsv } from "@/utils/csvExport";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { searchAuditLogs } from "@/api/Services/SuperAdminAuditService";
import { formatTimestamp, statusLabel } from "@/components/admin/projects/adminProjectUtils";
import { RefreshStatus, TableSkeleton } from "@/components/Common/Skeletons";
import { useOptionalSuperAdminScope } from "@/contexts/SuperAdminScopeContext";

const DEFAULT_PAGE_SIZE = 50;

// A non-numeric filter value (e.g. "abc") is truthy, so a bare `Number(...)` would send NaN as
// the query param. Guard it so a bad input silently drops the filter instead.
const toIntOrNull = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

export default function AuditLogs({ fixedCollegeId = null, hideFilters = false, allowGlobal = false, fixedEntityId = null, fixedEntityType = null } = {}) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [activeScopeKey, setActiveScopeKey] = useState(null);
  const [loadedScopeKey, setLoadedScopeKey] = useState(null);
  const [errorScopeKey, setErrorScopeKey] = useState(null);
  const requestSeq = useRef(0);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ actionKey: "", actorUserId: "", organizationId: "", collegeId: "", entityId: fixedEntityId || "" });
  // Part B "Audit log: filter by date range". The backend had a `since` parameter the endpoint
  // never exposed and no upper bound at all; both now exist.
  const [dateRange, setDateRange] = useState(null);
  // Part B "human-readable actor names": the response now carries a {"FACULTY:41": "Asha Rao"}
  // lookup so rows stop rendering as bare "FACULTY:41".
  const [actorNames, setActorNames] = useState({});
  // {"user:212": "Asha Rao"}: the record each row is about, so the Entity column names it.
  const [targetNames, setTargetNames] = useState({});
  // A trail pinned to one record (the per-student/per-faculty drawer) repeats the same entity, org
  // and machine details on every row; there only the time, action and who did it say anything.
  const singleRecord = fixedEntityId != null;
  // The platform-wide log showed Org and College as bare ids ("6 6"); the console already has both lists.
  const scope = useOptionalSuperAdminScope();
  const nameById = (list, id) => {
    if (id == null || !Array.isArray(list)) return id ?? "";
    const hit = list.find((x) => String(x?.id) === String(id));
    return hit?.name ?? hit?.collegeName ?? hit?.orgName ?? id;
  };
  const orgName = (id) => nameById(scope?.organizations, id);
  const collegeName = (id) => nameById(scope?.colleges, id);
  // Renamed from the old "isCollegeScoped" — that name conflated two different things: "do we
  // know which college to search" and "should we even render the search UI at all". A genuinely
  // global/unscoped search is now a real, supported case (allowGlobal=true, passed by AuditHub
  // for a global-superadmin session) — the backend (SuperAdminAuditController.search) already
  // permits collegeId=null for a global superadmin principal; this was purely a frontend-only
  // block with no corresponding backend restriction to preserve.
  const canSearch = fixedCollegeId != null || allowGlobal;

  const refresh = async (override = null, pageOverride = null, sizeOverride = null) => {
    const requestId = ++requestSeq.current;
    const f = override || filters;
    const p = pageOverride != null ? pageOverride : page;
    const s = sizeOverride != null ? sizeOverride : size;
    const params = {
      actionKey: f.actionKey || null,
      actorUserId: toIntOrNull(f.actorUserId),
      organizationId: toIntOrNull(f.organizationId),
      collegeId: toIntOrNull(f.collegeId),
      entityId: f.entityId || null,
      entityType: fixedEntityType || null,
      since: dateRange?.[0] ? dayjs(dateRange[0]).startOf("day").format("YYYY-MM-DDTHH:mm:ss") : null,
      until: dateRange?.[1] ? dayjs(dateRange[1]).endOf("day").format("YYYY-MM-DDTHH:mm:ss") : null,
      page: p,
      size: s,
    };
    const requestScopeKey = JSON.stringify(params);
    const scopeChanged = loadedScopeKey !== requestScopeKey;
    setActiveScopeKey(requestScopeKey);
    if (scopeChanged) {
      setItems([]);
      setTotal(0);
      setActorNames({});
    }
    setLoading(true);
    setError(null);
    setErrorScopeKey(null);
    const res = await fetchWithErrorHandling(searchAuditLogs(params));
    if (requestId !== requestSeq.current) return;
    if (res?.success) {
      setItems(res?.data?.items ?? []);
      setTotal(Number(res?.data?.total) || 0);
      setActorNames(res?.data?.actorNames ?? {});
      setLoadedScopeKey(requestScopeKey);
      setTargetNames(res?.data?.targetNames ?? {});
    } else {
      setError(res?.message || "Failed to load audit logs. Please try again.");
      setErrorScopeKey(requestScopeKey);
      if (scopeChanged) {
        setItems([]);
        setTotal(0);
        setActorNames({});
      }
    }
    setLoading(false);
  };

  const runSearch = () => {
    setPage(0);
    refresh(filters, 0);
  };

  const handleTableChange = (pagination) => {
    const nextPage = (pagination.current || 1) - 1;
    const nextSize = pagination.pageSize || size;
    setPage(nextPage);
    setSize(nextSize);
    refresh(filters, nextPage, nextSize);
  };

  // `filters` is read inside the scope effect below but must not re-trigger it — typing in a
  // filter box would refetch on every keystroke. A ref gives the effect the current value
  // without making it a dependency.
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  // Re-pin whenever the resolved college changes, NOT once at mount.
  //
  // This effect used to carry `[]` deps, so it read `fixedCollegeId` exactly once — during the
  // first render. SuperAdminScopeContext resolves the saved college asynchronously (it waits on
  // /api/v1/college/fetchCollegeList), so `fixedCollegeId` is still null at that moment. The
  // component therefore ran a GLOBAL audit search and never re-pinned, leaving
  // `filters.collegeId` empty for its whole life — Refresh included.
  //
  // That was a cross-tenant leak, not just a stale filter: AuditHub tells the user "Audit search
  // is pinned to the selected college" and AuditLogs hides the College column to match, while the
  // rows on screen came from every college on the platform.
  useEffect(() => {
    if (!canSearch) return;
    const next = fixedCollegeId
      ? { ...filtersRef.current, collegeId: String(fixedCollegeId) }
      : filtersRef.current;
    setFilters(next);
    setPage(0);
    refresh(next, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fixedCollegeId, canSearch]);

  const hasCurrentAuditScope = activeScopeKey != null && loadedScopeKey === activeScopeKey;
  const currentAuditError = activeScopeKey != null && errorScopeKey === activeScopeKey ? error : null;
  const initialAuditLoading = loading && !hasCurrentAuditScope;
  const auditRefreshing = loading && hasCurrentAuditScope;

  // Part B "Audit log: export". Exports exactly the rows currently loaded (the active filters and
  // page), which is what an admin asked for by filtering — not a silent full-table dump.
  const handleExport = () => {
    exportRowsToCsv(
      `audit-log-${dayjs().format("YYYY-MM-DD")}.csv`,
      [
        { label: "Time", key: "createdAt" },
        { label: "Action", key: "actionKey" },
        { label: "Entity", key: "entity" },
        { label: "Actor", key: "actor" },
        { label: "Org", key: "organizationId" },
        { label: "College", key: "collegeId" },
        { label: "IP", key: "ipAddress" },
        { label: "User agent", key: "userAgent" },
      ],
      items.map((r) => {
        const key = `${String(r.actorUserType).toUpperCase() === "LEARNER" ? "LEARNER" : "FACULTY"}:${r.actorUserId ?? ""}`;
        return {
          createdAt: formatTimestamp(r.createdAt),
          actionKey: r.actionKey ?? "",
          entity: entityLabel(r),
          actor: actorNames[key] || `${r.actorUserType ?? ""}:${r.actorUserId ?? ""}`,
          organizationId: orgName(r.organizationId),
          collegeId: collegeName(r.collegeId),
          ipAddress: r.ipAddress ?? "",
          userAgent: r.userAgent ?? "",
        };
      }),
    );
  };

  const entityLabel = (r) => {
    const raw = `${r.entityType ?? ""}:${r.entityId ?? ""}`;
    const named = targetNames[`${String(r.entityType ?? "").trim().toLowerCase()}:${r.entityId ?? ""}`];
    if (named) return named;
    if (!r.entityType) return raw;
    // No name (deleted record, or a type without a lookup): "Student #213" / "Project task #…",
    // not "learner:213" / "PROJECT_TASK:…". The raw key stays in the tooltip.
    const kind = statusLabel(r.entityType, "").replace(/^Learner\b/, "Student").replace(/^User$/, "Account");
    return r.entityId != null && r.entityId !== "" ? `${kind} #${r.entityId}` : kind;
  };

  const columns = [
    { title: "Time", dataIndex: "createdAt", key: "createdAt", width: 180, render: (value) => formatTimestamp(value) },
    {
      title: "Action",
      dataIndex: "actionKey",
      key: "actionKey",
      render: (value) => (
        <Tooltip title={value}>
          {/* Admin screens say "student"; LEARNER_CREATE read "Learner Create". */}
          <span>{statusLabel(value, "").replace(/^Learner\b/, "Student")}</span>
        </Tooltip>
      ),
    },
    ...(singleRecord ? [] : [
      {
        title: "Entity",
        key: "entity",
        render: (_, r) => <Tooltip title={`${r.entityType ?? ""}:${r.entityId ?? ""}`}><span>{entityLabel(r)}</span></Tooltip>,
      },
      { title: "Org", dataIndex: "organizationId", key: "organizationId", render: (v) => orgName(v) },
    ]),
    // Redundant/noisy for a college-scoped caller — every row shows the same pinned value.
    ...(fixedCollegeId == null ? [{ title: "College", dataIndex: "collegeId", key: "collegeId", render: (v) => collegeName(v) }] : []),
    {
      title: "Actor",
      key: "actor",
      render: (_, r) => {
        const raw = `${r.actorUserType ?? ""}:${r.actorUserId ?? ""}`;
        const key = `${String(r.actorUserType).toUpperCase() === "LEARNER" ? "LEARNER" : "FACULTY"}:${r.actorUserId ?? ""}`;
        const name = actorNames[key];
        // Show the person, not the row's foreign key — but keep the raw id reachable, since it's
        // what you need to paste into the "Actor userId" filter.
        return name && name !== key ? <Tooltip title={raw}><span>{name}</span></Tooltip> : raw;
      },
    },
    ...(singleRecord ? [] : [
      { title: "IP", dataIndex: "ipAddress", key: "ipAddress", width: 120 },
      { title: "User Agent", dataIndex: "userAgent", key: "userAgent", ellipsis: true },
    ]),
  ];

  return (
    <div>
      {!canSearch ? (
        <Card title="Audit Logs">
          <Alert
            type="warning"
            showIcon
            message="Select a College to view audit logs"
            description="Audit logs are treated as college-scoped in Superadmin to avoid cross-tenant searches. Pick a College in the header."
          />
        </Card>
      ) : (
        <>
      <Card title="Audit Logs" style={{ marginBottom: 16 }}>
        {!hideFilters && (
          <>
            <Row gutter={12}>
              <Col xs={24} md={5}>
                <Input placeholder="Action key" value={filters.actionKey} onChange={(e) => setFilters((p) => ({ ...p, actionKey: e.target.value }))} />
              </Col>
              <Col xs={24} md={5}>
                <Input placeholder="Actor userId" value={filters.actorUserId} onChange={(e) => setFilters((p) => ({ ...p, actorUserId: e.target.value }))} />
              </Col>
              <Col xs={24} md={5}>
                <Input placeholder="OrgId" value={filters.organizationId} onChange={(e) => setFilters((p) => ({ ...p, organizationId: e.target.value }))} />
              </Col>
              <Col xs={24} md={5}>
                <Input placeholder="CollegeId" value={filters.collegeId} onChange={(e) => setFilters((p) => ({ ...p, collegeId: e.target.value }))} />
              </Col>
              <Col xs={24} md={4}>
                <Input placeholder="Entity id" value={filters.entityId} onChange={(e) => setFilters((p) => ({ ...p, entityId: e.target.value }))} />
              </Col>
            </Row>
            <div style={{ marginTop: 12 }}>
              <Space wrap>
                {/* Part B: date-range filtering. Sent as since/until; the day boundaries are
                    widened to start-of-day / end-of-day so picking one day includes all of it. */}
                <DatePicker.RangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  allowEmpty={[true, true]}
                  placeholder={["From (any)", "To (any)"]}
                />
                <Button type="primary" onClick={runSearch} loading={loading}>Search</Button>
                <Button onClick={handleExport} disabled={items.length === 0}>
                  Export CSV
                </Button>
              </Space>
            </div>
          </>
        )}
        {hideFilters && (
          <div style={{ marginTop: 4 }}>
            <Space wrap>
              <Button type="primary" onClick={runSearch} loading={loading}>Refresh</Button>
              <Button onClick={handleExport} disabled={items.length === 0}>
                Export CSV
              </Button>
            </Space>
          </div>
        )}
      </Card>
      {auditRefreshing ? <RefreshStatus label="Refreshing audit logs…" /> : null}
      {currentAuditError ? (
        <Alert
          type={hasCurrentAuditScope ? "warning" : "error"}
          showIcon
          message={hasCurrentAuditScope ? "Couldn't refresh audit logs" : "Couldn't load audit logs"}
          description={hasCurrentAuditScope ? "Showing the last audit results loaded for these filters." : currentAuditError}
          action={<Button size="small" onClick={() => refresh()}>Retry</Button>}
          style={{ marginBottom: 16 }}
        />
      ) : null}
      {initialAuditLoading ? (
        <TableSkeleton rows={10} columns={8} label="Loading audit logs" />
      ) : currentAuditError && !hasCurrentAuditScope ? null : (
      <Table
        rowKey="id"
        dataSource={items}
        columns={columns}
        scroll={{ x: "max-content" }}
        onChange={handleTableChange}
        locale={{ emptyText: error ? "Audit logs could not be loaded" : "No activity recorded yet" }}
        pagination={{
          current: page + 1,
          pageSize: size,
          total,
          showSizeChanger: true,
          pageSizeOptions: [25, 50, 100, 200],
          showTotal: (t) => `${t} ${t === 1 ? "entry" : "entries"}`,
        }}
      />
      )}
        </>
      )}
    </div>
  );
}
