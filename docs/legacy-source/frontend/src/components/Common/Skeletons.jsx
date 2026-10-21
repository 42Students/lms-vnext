import React from "react";

const clampCount = (value, fallback, max = 12) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(Math.max(Math.floor(number), 1), max);
};

const normalizeSize = (value) =>
  typeof value === "number" ? String(value) + "px" : value;

const classes = (base, extra) => (extra ? base + " " + extra : base);

export function SkeletonRegion({
  label = "Loading content",
  className = "",
  children,
}) {
  return (
    <div
      className={classes("lms-skeleton-region", className)}
      role="status"
      aria-label={label}
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

export function RefreshStatus({
  label = "Refreshing…",
  className = "",
}) {
  return (
    <div
      className={classes("lms-refresh-status", className)}
      role="status"
      aria-live="polite"
    >
      <span className="lms-refresh-status__dot" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function SkeletonBlock({
  width = "100%",
  height = 12,
  radius = 6,
  className = "",
}) {
  return (
    <span
      className={classes("lms-skeleton-block", className)}
      style={{
        width: normalizeSize(width),
        height: normalizeSize(height),
        borderRadius: normalizeSize(radius),
      }}
      aria-hidden="true"
    />
  );
}

export function SkeletonAvatar({ size = 40, square = false, className = "" }) {
  return (
    <SkeletonBlock
      width={size}
      height={size}
      radius={square ? 10 : "50%"}
      className={classes("lms-skeleton-avatar", className)}
    />
  );
}

export function SkeletonText({
  lines = 3,
  widths = ["100%", "92%", "68%"],
  className = "",
}) {
  const lineCount = clampCount(lines, 3, 8);
  const safeWidths =
    Array.isArray(widths) && widths.length ? widths : ["100%"];

  return (
    <div className={classes("lms-skeleton-text", className)} aria-hidden="true">
      {Array.from({ length: lineCount }).map((_, index) => (
        <SkeletonBlock
          key={index}
          width={safeWidths[index % safeWidths.length]}
          height={index === 0 ? 13 : 11}
        />
      ))}
    </div>
  );
}

function SkeletonCard({ compact = false }) {
  return (
    <div className="lms-skeleton-card" aria-hidden="true">
      <SkeletonBlock
        width="100%"
        height={compact ? 84 : 120}
        radius={10}
        className="lms-skeleton-card__media"
      />
      <SkeletonText
        lines={compact ? 2 : 3}
        widths={
          compact ? ["70%", "45%"] : ["72%", "94%", "58%"]
        }
      />
      <SkeletonBlock
        width={compact ? 72 : 96}
        height={30}
        radius={999}
      />
    </div>
  );
}

export function CardGridSkeleton({
  cards = 6,
  columns = 3,
  compact = false,
  label = "Loading cards",
  className = "",
}) {
  const cardCount = clampCount(cards, 6);
  const columnCount = clampCount(columns, 3, 4);

  return (
    <SkeletonRegion label={label} className={className}>
      <div
        className="lms-skeleton-card-grid"
        style={{ "--lms-skeleton-columns": columnCount }}
      >
        {Array.from({ length: cardCount }).map((_, index) => (
          <SkeletonCard key={index} compact={compact} />
        ))}
      </div>
    </SkeletonRegion>
  );
}

export function ListSkeleton({
  rows = 6,
  avatar = true,
  label = "Loading list",
  className = "",
}) {
  const rowCount = clampCount(rows, 6);

  return (
    <SkeletonRegion label={label} className={className}>
      <div className="lms-skeleton-list">
        {Array.from({ length: rowCount }).map((_, index) => (
          <div
            className="lms-skeleton-list__row"
            key={index}
            aria-hidden="true"
          >
            {avatar && <SkeletonAvatar size={40} />}
            <div className="lms-skeleton-list__content">
              <SkeletonBlock
                width={index % 2 ? "42%" : "56%"}
                height={13}
              />
              <SkeletonBlock
                width={index % 3 ? "68%" : "78%"}
                height={10}
              />
            </div>
            <SkeletonBlock
              width={72}
              height={28}
              radius={999}
              className="lms-skeleton-list__action"
            />
          </div>
        ))}
      </div>
    </SkeletonRegion>
  );
}

export function TableSkeleton({
  rows = 6,
  columns = 4,
  columnWidths,
  label = "Loading table",
  className = "",
}) {
  const rowCount = clampCount(rows, 6);
  const columnCount = clampCount(columns, 4, 8);
  const gridTemplateColumns = Array.isArray(columnWidths) && columnWidths.length
    ? Array.from({ length: columnCount }, (_, index) => {
        const width = columnWidths[index];
        if (typeof width === "number" && Number.isFinite(width)) return `${Math.max(width, 72)}px`;
        return typeof width === "string" && width.trim() ? width.trim() : "minmax(92px, 1fr)";
      }).join(" ")
    : undefined;
  // Each row is its own grid (see _skeletons.scss), so explicit widths must be set on the rows, not the table.
  const rowStyle = gridTemplateColumns ? { gridTemplateColumns } : undefined;

  return (
    <SkeletonRegion label={label} className={className}>
      <div className="lms-skeleton-table-wrap">
        <div
          className="lms-skeleton-table"
          style={{ "--lms-skeleton-columns": columnCount }}
          aria-hidden="true"
        >
          <div className="lms-skeleton-table__row lms-skeleton-table__row--head" style={rowStyle}>
            {Array.from({ length: columnCount }).map((_, index) => (
              <SkeletonBlock
                key={index}
                width={index === 0 ? "72%" : "56%"}
                height={10}
              />
            ))}
          </div>
          {Array.from({ length: rowCount }).map((_, rowIndex) => (
            <div className="lms-skeleton-table__row" key={rowIndex} style={rowStyle}>
              {Array.from({ length: columnCount }).map(
                (__, columnIndex) => (
                  <SkeletonBlock
                    key={columnIndex}
                    width={
                      columnIndex === 0
                        ? "82%"
                        : rowIndex % 2
                        ? "62%"
                        : "72%"
                    }
                    height={12}
                  />
                )
              )}
            </div>
          ))}
        </div>
      </div>
    </SkeletonRegion>
  );
}

export function DetailSkeleton({
  label = "Loading details",
  className = "",
  withMedia = true,
}) {
  return (
    <SkeletonRegion label={label} className={className}>
      <div className="lms-skeleton-detail">
        {withMedia && (
          <SkeletonBlock
            width="100%"
            height={220}
            radius={12}
            className="lms-skeleton-detail__media"
          />
        )}
        <div className="lms-skeleton-detail__content" aria-hidden="true">
          <SkeletonBlock width="42%" height={24} radius={7} />
          <SkeletonText
            lines={4}
            widths={["96%", "90%", "84%", "62%"]}
          />
          <div className="lms-skeleton-detail__meta">
            <SkeletonBlock width={92} height={28} radius={999} />
            <SkeletonBlock width={116} height={28} radius={999} />
          </div>
          <SkeletonBlock width={132} height={38} radius={8} />
        </div>
      </div>
    </SkeletonRegion>
  );
}

export function DashboardSkeleton({
  metrics = 4,
  label = "Loading dashboard",
  className = "",
}) {
  const metricCount = clampCount(metrics, 4, 6);

  return (
    <SkeletonRegion label={label} className={className}>
      <div className="lms-skeleton-dashboard">
        <div
          className="lms-skeleton-dashboard__heading"
          aria-hidden="true"
        >
          <SkeletonText lines={2} widths={["34%", "52%"]} />
        </div>
        <div className="lms-skeleton-dashboard__metrics">
          {Array.from({ length: metricCount }).map((_, index) => (
            <div
              className="lms-skeleton-metric"
              key={index}
              aria-hidden="true"
            >
              <SkeletonBlock width={86} height={10} />
              <SkeletonBlock
                width={index % 2 ? 64 : 84}
                height={28}
                radius={7}
              />
              <SkeletonBlock width="58%" height={9} />
            </div>
          ))}
        </div>
        <div className="lms-skeleton-dashboard__panels">
          <div
            className="lms-skeleton-dashboard__panel"
            aria-hidden="true"
          >
            <SkeletonBlock width="32%" height={16} />
            <SkeletonBlock width="100%" height={210} radius={10} />
          </div>
          <div
            className="lms-skeleton-dashboard__panel"
            aria-hidden="true"
          >
            <SkeletonBlock width="46%" height={16} />
            <SkeletonText
              lines={6}
              widths={["92%", "76%", "88%", "66%"]}
            />
          </div>
        </div>
      </div>
    </SkeletonRegion>
  );
}

export function PageSkeleton({
  label = "Loading page",
  className = "",
  children,
}) {
  return (
    <SkeletonRegion label={label} className={className}>
      <div className="lms-skeleton-page">
        <div
          className="lms-skeleton-page__header"
          aria-hidden="true"
        >
          <div className="lms-skeleton-page__title">
            <SkeletonBlock width={220} height={24} radius={7} />
            <SkeletonBlock width={320} height={11} />
          </div>
          <SkeletonBlock width={108} height={38} radius={8} />
        </div>
        {children || (
          <div
            className="lms-skeleton-page__default"
            aria-hidden="true"
          >
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}
      </div>
    </SkeletonRegion>
  );
}
