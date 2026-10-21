import { useMemo, useState } from "react";
import { Alert, Button, DatePicker, Popover, Tag, message } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { exportLogs } from "@/api/Services/SuperAdminLogsService";
import { exportRangeChunked } from "@/utils/trackerLogsExport";

const { RangePicker } = DatePicker;

const MAX_RANGE_DAYS = 31;
const DATE_FORMAT = "MMM D, YYYY h:mm A";

const QUICK_RANGES = [
  { label: "Last 1 hour", amount: 1, unit: "hour" },
  { label: "Last 24 hours", amount: 24, unit: "hour" },
  { label: "Last 7 days", amount: 7, unit: "day" },
];

const LEVEL_LABELS = {
  ERROR: "Errors only",
  WARNING: "Warnings + Errors",
  INFO: "Info and above",
  ALL: "Everything",
};

/**
 * Downloads every log entry in an explicit date/time range as an NDJSON file -- separate from the
 * live view's own preset time windows (15m/1h/6h/24h/7d looking back from "now"), which can't
 * express "give me last Tuesday afternoon". Reuses the live view's current environment/level/search
 * filters (shown read-only here) rather than duplicating that whole filter bar a second time --
 * the one new decision this control asks for is the time range.
 */
export default function LogsDownloadControl({ environment, level, search, defaultSince, defaultUntil }) {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState(() => [dayjs(defaultSince), dayjs(defaultUntil)]);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");

  const rangeError = useMemo(() => {
    if (!range || !range[0] || !range[1]) return "Pick a start and end.";
    if (!range[1].isAfter(range[0])) return "End must be after start.";
    if (range[1].diff(range[0], "day", true) > MAX_RANGE_DAYS) {
      return `Range is too wide -- pick at most ${MAX_RANGE_DAYS} days at a time.`;
    }
    if (range[0].isAfter(dayjs())) return "Start can't be in the future.";
    return "";
  }, [range]);

  function applyQuickRange(amount, unit) {
    const until = dayjs();
    setRange([until.subtract(amount, unit), until]);
    setError("");
  }

  async function handleDownload() {
    if (rangeError) return;
    setExporting(true);
    setError("");
    try {
      // Wide ranges outlive the load balancer's timeout as one request, so they're fetched in
      // day-sized pieces (halved further if a piece still times out) and stitched back together.
      const since = range[0].toISOString();
      const until = range[1].toISOString();
      const { text, meta } = await exportRangeChunked({
        since,
        until,
        onProgress: setProgress,
        fetchChunk: (chunkSince, chunkUntil) =>
          exportLogs({ environment, level, search, since: chunkSince, until: chunkUntil }),
      });
      const blob = new Blob([text], { type: "application/x-ndjson" });
      const stamp = (iso) => iso.replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
      const filename = `lms-logs_${meta.environment || environment}_${stamp(since)}_to_${stamp(until)}.ndjson`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      const entryCount = meta.count;
      if (meta?.truncated) {
        message.warning(
          `Downloaded the most recent ${entryCount.toLocaleString()} entries -- this range had more. Narrow the range or level to get the rest.`,
          6
        );
      } else {
        message.success(`Downloaded ${entryCount.toLocaleString()} log ${entryCount === 1 ? "entry" : "entries"}.`);
      }
      setOpen(false);
    } catch (err) {
      setError(err?.message || "Logs could not be exported. Try a smaller range.");
    } finally {
      setExporting(false);
      setProgress(null);
    }
  }

  const content = (
    <div style={{ width: 360 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
        <Tag>{environment}</Tag>
        <Tag>{LEVEL_LABELS[level] || level}</Tag>
        {search ? <Tag>matches &quot;{search}&quot;</Tag> : <Tag>no search filter</Tag>}
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        {QUICK_RANGES.map((quick) => (
          <Button key={quick.label} size="small" onClick={() => applyQuickRange(quick.amount, quick.unit)}>
            {quick.label}
          </Button>
        ))}
      </div>

      <RangePicker
        value={range}
        onChange={(next) => {
          setRange(next);
          setError("");
        }}
        showTime={{ format: "h:mm A" }}
        format={DATE_FORMAT}
        disabledDate={(current) => current && current.isAfter(dayjs(), "minute")}
        style={{ width: "100%", marginBottom: 10 }}
        allowClear={false}
      />

      {rangeError && <div style={{ color: "#cf1322", fontSize: 12, marginBottom: 10 }}>{rangeError}</div>}
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 10 }} />}

      <Button
        type="primary"
        block
        icon={<DownloadOutlined />}
        loading={exporting}
        disabled={Boolean(rangeError)}
        onClick={handleDownload}
      >
        {exporting
          ? progress && progress.total > 1
            ? `Preparing your file… ${progress.done}/${progress.total}`
            : "Preparing your file…"
          : "Download"}
      </Button>
    </div>
  );

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setRange([dayjs(defaultSince), dayjs(defaultUntil)]);
          setError("");
        }
      }}
      trigger="click"
      placement="bottomRight"
      content={content}
      title="Download logs"
      overlayClassName="tracker-popover-scope"
    >
      <Button size="small" icon={<DownloadOutlined />}>
        Download logs
      </Button>
    </Popover>
  );
}
