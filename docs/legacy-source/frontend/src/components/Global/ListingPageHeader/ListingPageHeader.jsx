import React from "react";

/**
 * Shared listing page header — single source of truth for all listing pages.
 *
 * @param {string}    title       - Page title (e.g. "Attendance", "Courses")
 * @param {ReactNode} [metrics]   - Metric pills or filter pills rendered below title
 * @param {ReactNode} [subtitle]  - Extra content between title and metrics (e.g. program chip)
 * @param {ReactNode} [rightContent] - Search input, create button, etc.
 * @param {string}    [ariaLabel] - Accessible label for the header
 * @param {string}    [className] - Additional class for page-specific overrides
 */
export default function ListingPageHeader({
  title,
  metrics,
  subtitle,
  rightContent,
  ariaLabel,
  className = "",
}) {
  return (
    <header
      className={`listing-page-header ${className}`.trim()}
      aria-label={ariaLabel}
    >
      <div className="listing-page-header__left">
        <div className="listing-page-header__title-row">
          <h1 className="listing-page-header__title ln-lto-bold">{title}</h1>
          {subtitle && <div className="listing-page-header__subtitle">{subtitle}</div>}
        </div>
        {metrics && (
          <div className="listing-page-header__metrics">{metrics}</div>
        )}
      </div>
      {rightContent && (
        <div className="listing-page-header__right">{rightContent}</div>
      )}
    </header>
  );
}
