import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { Alert, Button, Empty, Segmented, Space, Spin, Tag, Typography } from "antd";
import { DownloadOutlined, ReloadOutlined } from "@ant-design/icons";
import { searchAuditLogs } from "@/api/Services/SuperAdminAuditService";
import { exportRowsToCsv } from "@/utils/csvExport";
import { describeActivity, activityName, activityTone, payloadDetails } from "./activityText";
import { ListSkeleton, RefreshStatus } from "@/components/Common/Skeletons";
import { parseServerTimestamp } from "@/components/admin/projects/adminProjectUtils";

// since.utc() below needs this plugin. It only worked when another page had already loaded it;
// opened directly, the call threw and the log showed "Couldn't load activity" without a request.
dayjs.extend(utc);

// createdAt is server UTC, sent as a Jackson array ([2026, 10, 5, 9, 30]); dayjs(array) is
// "Invalid Date", which is what every row and day heading showed.
const whenOf = (r) => dayjs(parseServerTimestamp(r?.createdAt)?.date);

const { Text } = Typography;
const PAGE_SIZE = 50;

export const CATEGORIES = [
  { value: "important", label: "Important" },
  { value: "setup", label: "Academic setup" },
  { value: "people", label: "People & access" },
  { value: "teaching", label: "Teaching" },
  { value: "projects", label: "Projects" },
  { value: "all", label: "Everything" },
];

const RANGES = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "all", label: "All time" },
];

const sinceFor = (range) => {
  if (range === "today") return dayjs().startOf("day");
  if (range === "7d") return dayjs().subtract(7, "day").startOf("day");
  if (range === "30d") return dayjs().subtract(30, "day").startOf("day");
  return null;
};

const dayHeading = (d) => {
  if (d.isSame(dayjs(), "day")) return "Today";
  if (d.isSame(dayjs().subtract(1, "day"), "day")) return "Yesterday";
  return d.format("dddd, D MMM YYYY");
};

/**
 * College activity log as a readable feed. The old page was a developer table (raw action keys,
 * "COURSE:12", IP and user-agent columns) where a day of project-task chatter buried the one
 * deletion an admin needed to find. Now: "Important" by default (deletions, promotions,
 * suspensions, access and feature changes), other categories one click away, each entry a
 * sentence with the technical detail folded underneath.
 */
export default function ActivityCenter({ collegeId = null, organizationId = null }) {
  const [category, setCategory] = useState("important");
  const [range, setRange] = useState("30d");
  const [rows, setRows] = useState([]);
  const [actorNames, setActorNames] = useState({});
  const [targetNames, setTargetNames] = useState({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMode, setLoadingMode] = useState(null);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState({});
  const seq = useRef(0);
  const loadedQueryRef = useRef(null);

  const load = useCallback(async (nextPage = 0, { preserveExisting = false } = {}) => {
    const request = ++seq.current;
    const mode = nextPage > 0 ? "append" : preserveExisting ? "refresh" : "scope";
    const queryKey = `${organizationId ?? "all-orgs"}:${collegeId ?? "all-colleges"}:${category}:${range}`;
    // A changed filter/range is a different dataset: never show the previous query's activity
    // beneath the newly selected controls while this request is pending or if it fails.
    if (nextPage === 0 && loadedQueryRef.current !== queryKey) {
      setRows([]);
      setActorNames({});
      setTotal(0);
      setPage(0);
    }
    setLoading(true);
    setLoadingMode(mode);
    setError(null);
    if (mode === "scope") {
      // Category/range changes alter what the rows mean. Never leave the previous scope visible
      // under newly selected controls; reserve the feed geometry with a skeleton instead.
      setRows([]);
      setActorNames({});
      setTotal(0);
      setPage(0);
    }
    const since = sinceFor(range);
    try {
      // Times are sent in UTC: audit rows are stored as UTC wall clock by the server.
      const res = await searchAuditLogs({
        organizationId: organizationId ?? undefined,
        collegeId: collegeId ?? undefined,
        category: category === "all" ? undefined : category,
        since: since ? since.utc().format("YYYY-MM-DDTHH:mm:ss") : undefined,
        page: nextPage,
        size: PAGE_SIZE,
      });
      if (request !== seq.current) return;
      const data = res?.data ?? {};
      const items = Array.isArray(data.items) ? data.items : [];
      setRows((prev) => (nextPage === 0 ? items : [...prev, ...items]));
      setActorNames((prev) => ({ ...(nextPage === 0 ? {} : prev), ...(data.actorNames || {}) }));
      setTargetNames((prev) => ({ ...(nextPage === 0 ? {} : prev), ...(data.targetNames || {}) }));
      setTotal(Number(data.total) || 0);
      setPage(nextPage);
      loadedQueryRef.current = queryKey;
    } catch (e) {
      if (request !== seq.current) return;
      // For a same-query refresh, keep the last successful rows visible with the error banner.
      // A changed query was already cleared above, so unrelated activity can never masquerade
      // as results for the newly selected filters.
      setError(e?.response?.data?.message || "Couldn't load activity.");
    } finally {
      if (request === seq.current) {
        setLoading(false);
        setLoadingMode(null);
      }
    }
  }, [organizationId, collegeId, category, range]);

  useEffect(() => {
    setOpen({});
    load(0);
  }, [load]);

  const actorOf = (r) => {
    const key = `${String(r.actorUserType).toUpperCase() === "LEARNER" ? "LEARNER" : "FACULTY"}:${r.actorUserId ?? ""}`;
    const name = actorNames[key];
    if (name && name !== key) return name;
    if (r.actorUserId == null) return "System";
    return String(r.actorUserType).toUpperCase() === "LEARNER" ? `Student #${r.actorUserId}` : `Staff #${r.actorUserId}`;
  };

  const groups = useMemo(() => {
    const out = [];
    rows.forEach((r) => {
      const d = whenOf(r);
      const heading = d.isValid() ? dayHeading(d) : "Unknown date";
      const last = out[out.length - 1];
      if (last && last.heading === heading) last.items.push(r);
      else out.push({ heading, items: [r] });
    });
    return out;
  }, [rows]);

  const handleExport = () => {
    exportRowsToCsv(
      `activity-${category}-${dayjs().format("YYYY-MM-DD")}.csv`,
      [
        { label: "Time", key: "time" },
        { label: "Who", key: "who" },
        { label: "What", key: "what" },
        { label: "Item", key: "item" },
        { label: "Action key", key: "actionKey" },
        { label: "IP", key: "ip" },
      ],
      rows.map((r) => ({
        time: whenOf(r).format("YYYY-MM-DD HH:mm"),
        who: actorOf(r),
        what: describeActivity(r).sentence,
        item: activityName(r, targetNames) || "",
        actionKey: r.actionKey || "",
        ip: r.ipAddress || "",
      })),
    );
  };

  return (
    <div className="admin-activity">
      <div className="admin-activity__bar">
        <Segmented options={CATEGORIES} value={category} onChange={setCategory} />
        <Space wrap>
          <Segmented size="small" options={RANGES} value={range} onChange={setRange} />
          <Button size="small" icon={<ReloadOutlined />} onClick={() => load(0, { preserveExisting: true })}
            loading={loadingMode === "refresh"}>Refresh</Button>
          <Button size="small" icon={<DownloadOutlined />} onClick={handleExport} disabled={!rows.length}>Export</Button>
        </Space>
      </div>
      {category === "important" && (
        <Text type="secondary" className="admin-activity__hint">
          Deletions and restores, promotions, suspensions, impersonation, module access and feature changes, and identity views.
        </Text>
      )}

      {loadingMode === "refresh" && rows.length > 0 && (
        <RefreshStatus label="Refreshing activity…" />
      )}

      {error && <Alert type="error" showIcon message="Couldn't load activity" description={error}
        action={<Button size="small" onClick={() => load(0, { preserveExisting: rows.length > 0 })}>Retry</Button>}
        style={{ margin: "12px 0" }} />}

      {loadingMode === "scope" && rows.length === 0 ? (
        <div className="admin-activity__loading">
          <ListSkeleton rows={6} avatar={false} label="Loading activity" />
        </div>
      ) : !error && rows.length === 0 ? (
        <Empty className="admin-activity__empty"
          description={category === "important" ? "Nothing important happened in this period." : "No activity in this period."} />
      ) : (
        groups.map((group) => (
          <section key={group.heading} className="admin-activity__day">
            <h3 className="admin-activity__day-title">{group.heading}</h3>
            <ul className="admin-activity__list">
              {group.items.map((r) => {
                const { verb, thing, bulk } = describeActivity(r);
                const name = activityName(r, targetNames);
                const details = payloadDetails(r);
                const isOpen = Boolean(open[r.id]);
                return (
                  <li key={r.id} className={`admin-activity__item admin-activity__item--${activityTone(r)}`}>
                    <span className="admin-activity__time">{whenOf(r).format("h:mm A")}</span>
                    <div className="admin-activity__body">
                      <div className="admin-activity__sentence">
                        <strong>{actorOf(r)}</strong> {verb} {thing}{name ? <> <strong>{name}</strong></> : null}
                        {bulk ? <Tag className="admin-activity__tag">several at once</Tag> : null}
                      </div>
                      <button type="button" className="admin-activity__more" onClick={() => setOpen((o) => ({ ...o, [r.id]: !isOpen }))}>
                        {isOpen ? "Hide details" : "Details"}
                      </button>
                      {isOpen && (
                        <dl className="admin-activity__details">
                          {details.map(([k, v]) => (
                            <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
                          ))}
                          {/* The raw action key and item id stay in the CSV export, not on screen. */}
                          {r.ipAddress ? <div><dt>IP</dt><dd>{r.ipAddress}</dd></div> : null}
                          <div><dt>When</dt><dd>{whenOf(r).format("D MMM YYYY, h:mm:ss A")}</dd></div>
                        </dl>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}

      {rows.length > 0 && rows.length < total && (
        <div className="admin-activity__more-wrap">
          <Button onClick={() => load(page + 1)} loading={loadingMode === "append"}>
            Load more ({total - rows.length} older)
          </Button>
        </div>
      )}
    </div>
  );
}
