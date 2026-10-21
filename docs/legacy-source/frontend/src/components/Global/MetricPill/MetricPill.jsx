import React, { useEffect, useId, useRef, useState } from "react";
import { Popover } from "antd";

/**
 * MetricPill — clickable metric pill with optional popover detail.
 *
 * @param {ReactNode}  icon       - Ant Design icon (e.g. <BookOutlined />)
 * @param {string}     label      - Display text (e.g. "6 Courses")
 * @param {string}     [variant]  - Color variant (teal, green, amber, indigo, emerald, violet, default)
 * @param {ReactNode}  [popover]  - Content to show inside the popover. If falsy, pill is non-interactive.
 * @param {string}     [popoverTitle] - Popover header title
 * @param {string}     [className] - Extra class names
 * @param {string}     [metricClass] - Override for the base class (default: "listing-page-metric")
 */
export default function MetricPill({
  icon,
  label,
  variant = "default",
  popover,
  popoverTitle,
  className = "",
  metricClass = "listing-page-metric",
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const popoverId = useId();
  const pillClass = `${metricClass} ${metricClass}--${variant} ln-lto-reg ${popover ? "metric-pill--clickable" : ""} ${className}`.trim();

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      if (typeof window !== "undefined") {
        window.requestAnimationFrame(() => triggerRef.current?.focus());
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  if (!popover) {
    return (
      <span className={pillClass}>
        {icon} {label}
      </span>
    );
  }

  const pill = (
    <button
      ref={triggerRef}
      type="button"
      className={pillClass}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-controls={popoverId}
    >
      {icon} {label}
    </button>
  );

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      content={
        <div
          id={popoverId}
          className="metric-pill-popover__body"
          role="dialog"
          aria-modal="false"
          aria-label={popoverTitle || label}
        >
          {popover}
        </div>
      }
      title={popoverTitle || null}
      trigger="click"
      overlayClassName="metric-pill-popover"
      placement="bottomLeft"
      autoAdjustOverflow
      arrow={{ pointAtCenter: true }}
      overlayStyle={{ maxWidth: "calc(100vw - 32px)" }}
    >
      {pill}
    </Popover>
  );
}
