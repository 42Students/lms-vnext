import React from "react";
import { RightOutlined, RiseOutlined } from "@ant-design/icons";
import ScoreDistributionBars from "@/components/Report/ScoreDistributionBars";

/**
 * Faculty course-home card: not just the class average, but its shape -- how many students are
 * excelling vs. struggling, and which graded item is dragging the average down. Data comes
 * straight out of useFacultyCourseStats().performanceStats; no new fetching.
 */
const PerformanceCard = ({ stats, loading = false, onViewAll }) => {
  const distribution = stats?.distribution ?? [];
  const avgPercent = stats?.avgPercent;

  // The item most worth a faculty member's attention isn't the lowest SINGLE score (one outlier
  // tells you little) -- it's the graded item with the lowest AVERAGE across everyone who took
  // it, and only once enough people have actually been graded on it for that average to mean
  // anything.
  const qualifyingContent = (stats?.contentAverages ?? [])
    .filter((c) => c.avgPercent != null && c.gradedCount >= 3)
    .sort((a, b) => a.avgPercent - b.avgPercent);
  const weakestContent = qualifyingContent[0];
  // Only worth naming a "strongest" when it's a genuinely different item -- with one qualifying
  // item, "weakest" and "strongest" would be the same line said twice.
  const strongestContent = qualifyingContent.length > 1 ? qualifyingContent[qualifyingContent.length - 1] : null;

  // #6/#7: a bar's count alone still doesn't say WHO -- group the same studentAverages the
  // at-risk card's snapshot uses into these same 5 buckets, so clicking a bar shows exactly
  // which students landed there.
  const studentsByLabel = React.useMemo(() => {
    const map = {};
    for (const bucket of distribution) map[bucket.label] = [];
    for (const s of stats?.studentAverages ?? []) {
      const bucket = distribution.find((b) => {
        if (b.label === "Below 60%") return s.avgPercent < 60;
        const [min, max] = b.label.replace("%", "").split("-").map(Number);
        return s.avgPercent >= min && s.avgPercent <= max;
      });
      if (bucket) map[bucket.label].push(s);
    }
    for (const label of Object.keys(map)) map[label].sort((a, b) => b.avgPercent - a.avgPercent);
    return map;
  }, [distribution, stats?.studentAverages]);

  return (
    <section className="ln-module-card learn-placements-section-card learn-performance-card" aria-label="Performance">
      <div className="learn-performance-card__head">
        <div className="learn-performance-card__heading">
          <span className="learn-performance-card__icon"><RiseOutlined /></span>
          <div>
            <h3 className="learn-performance-card__title">Performance</h3>
            <p className="learn-performance-card__subtitle">
              {loading
                ? "Averaging graded work…"
                : avgPercent == null
                  ? "No graded submissions yet"
                  : "Average across graded work"}
            </p>
          </div>
        </div>
        {!loading && avgPercent != null && (
          <span className={`learn-performance-card__avg${avgPercent < 60 ? " learn-performance-card__avg--low" : ""}`}>
            {avgPercent}%
          </span>
        )}
      </div>

      {loading ? (
        <div className="learn-performance-card__skeleton" aria-hidden="true" />
      ) : avgPercent == null ? (
        <p className="learn-performance-card__empty">Grade a few submissions to see the class&apos;s score spread here.</p>
      ) : (
        <>
          <ScoreDistributionBars distribution={distribution} studentsByLabel={studentsByLabel} />

          {weakestContent && (
            <p className="learn-performance-card__insight learn-performance-card__insight--weak">
              <strong>{weakestContent.title}</strong> is the weakest spot right now, averaging {weakestContent.avgPercent}%
              across {weakestContent.gradedCount} graded {weakestContent.gradedCount === 1 ? "submission" : "submissions"}.
            </p>
          )}
          {strongestContent && (
            <p className="learn-performance-card__insight learn-performance-card__insight--strong">
              <strong>{strongestContent.title}</strong> is the strongest spot, averaging {strongestContent.avgPercent}%
              across {strongestContent.gradedCount} graded {strongestContent.gradedCount === 1 ? "submission" : "submissions"}.
            </p>
          )}

          <button type="button" className="learn-performance-card__cta" onClick={onViewAll}>
            View all assessments
            <RightOutlined />
          </button>
        </>
      )}
    </section>
  );
};

export default React.memo(PerformanceCard);
