import { Button, Tag } from "antd";
import {
  CheckCircleOutlined,
  DisconnectOutlined,
  ExclamationCircleOutlined,
  FileUnknownOutlined,
  LockOutlined,
  ReloadOutlined,
  WarningOutlined,
} from "@ant-design/icons";

/**
 * Product-wide section states.
 *
 * Empty, failed, permission, removed, connectivity, partial and completion states
 * intentionally share one calm visual/interaction contract. A failed request must
 * never silently degrade into an empty state.
 */

const joinClasses = (...values) => values.filter(Boolean).join(" ");

export function PanelState({
  kind = "empty",
  icon: Icon,
  title,
  description,
  children,
  actionLabel,
  onAction,
  actionIcon,
  actionAriaLabel,
  compact = false,
  className = "",
  role = "status",
  live = "polite",
}) {
  const effectiveLive = role === "alert" ? "assertive" : live;

  return (
    <div
      className={joinClasses(
        "panel-state",
        `panel-state--${kind}`,
        compact && "panel-state--compact",
        className
      )}
      role={role}
      aria-live={effectiveLive}
      aria-atomic="true"
    >
      {Icon ? (
        <Icon
          className={joinClasses(
            "panel-state__icon",
            `panel-state__icon--${kind}`
          )}
          aria-hidden
        />
      ) : null}
      {title ? <p className="panel-state__title">{title}</p> : null}
      {description ? (
        <p className="panel-state__subtitle">{description}</p>
      ) : null}
      {children}
      {actionLabel && typeof onAction === "function" ? (
        <Button
          size="middle"
          icon={actionIcon}
          onClick={onAction}
          aria-label={actionAriaLabel}
          className="panel-state__action"
        >
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

/** A panel/section that failed to load. */
export function PanelError({
  title = "Couldn't load this",
  description,
  subtitle,
  onRetry,
  retryLabel = "Retry",
  retryAriaLabel,
  compact = false,
}) {
  return (
    <PanelState
      kind="error"
      icon={ExclamationCircleOutlined}
      title={title}
      description={
        description ||
        subtitle ||
        "Something went wrong while loading this content. Your current context has been kept."
      }
      actionLabel={onRetry ? retryLabel : undefined}
      onAction={onRetry}
      actionIcon={onRetry ? <ReloadOutlined aria-hidden="true" /> : undefined}
      actionAriaLabel={retryAriaLabel}
      compact={compact}
      role="alert"
    />
  );
}

/** A genuinely empty list/section, with an optional useful next step. */
export function PanelEmpty({
  icon,
  title = "Nothing here yet",
  subtitle,
  description,
  ctaLabel,
  onCta,
  compact = false,
}) {
  return (
    <PanelState
      kind="empty"
      icon={icon}
      title={title}
      description={description || subtitle}
      actionLabel={ctaLabel}
      onAction={onCta}
      compact={compact}
    />
  );
}

export function PanelPermissionDenied({
  title = "You don't have access",
  description = "Your account does not have permission to view or change this content.",
}) {
  return (
    <PanelState
      kind="permission"
      icon={LockOutlined}
      title={title}
      description={description}
    />
  );
}

export function PanelNotFound({
  title = "This is no longer available",
  description = "The item may have been removed, moved, or is no longer available to this workspace.",
  actionLabel,
  onAction,
}) {
  return (
    <PanelState
      kind="not-found"
      icon={FileUnknownOutlined}
      title={title}
      description={description}
      actionLabel={actionLabel}
      onAction={onAction}
    />
  );
}

export function PanelOffline({
  title = "You're offline",
  description = "Reconnect to continue. Any content already on this screen has been kept where possible.",
  onRetry,
}) {
  return (
    <PanelState
      kind="offline"
      icon={DisconnectOutlined}
      title={title}
      description={description}
      actionLabel={onRetry ? "Try again" : undefined}
      onAction={onRetry}
      actionIcon={onRetry ? <ReloadOutlined aria-hidden="true" /> : undefined}
      role="alert"
    />
  );
}

export function PanelPartial({
  title = "Some information couldn't be loaded",
  description = "The available information is still shown. Retry to load the missing parts.",
  onRetry,
  retryLabel = "Retry missing data",
  children,
  compact = false,
}) {
  return (
    <PanelState
      kind="partial"
      icon={WarningOutlined}
      title={title}
      description={description}
      actionLabel={onRetry ? retryLabel : undefined}
      onAction={onRetry}
      actionIcon={onRetry ? <ReloadOutlined aria-hidden="true" /> : undefined}
      compact={compact}
    >
      {children}
    </PanelState>
  );
}

export function PanelSuccess({
  title = "Completed",
  description,
  actionLabel,
  onAction,
  children,
}) {
  return (
    <PanelState
      kind="success"
      icon={CheckCircleOutlined}
      title={title}
      description={description}
      actionLabel={actionLabel}
      onAction={onAction}
    >
      {children}
    </PanelState>
  );
}

export const STATUS_TONE = Object.freeze({
  neutral: "neutral",
  info: "info",
  success: "success",
  warning: "warning",
  error: "error",
});

export const STATUS_PRESENTATION = Object.freeze({
  draft: { label: "Draft", tone: STATUS_TONE.neutral },
  active: { label: "Active", tone: STATUS_TONE.success },
  scheduled: { label: "Scheduled", tone: STATUS_TONE.info },
  open: { label: "Open", tone: STATUS_TONE.success },
  closing: { label: "Closing", tone: STATUS_TONE.warning },
  closed: { label: "Closed", tone: STATUS_TONE.neutral },
  expired: { label: "Expired", tone: STATUS_TONE.error },
  submitted: { label: "Submitted", tone: STATUS_TONE.info },
  completed: { label: "Completed", tone: STATUS_TONE.success },
  evaluated: { label: "Evaluated", tone: STATUS_TONE.success },
  failed: { label: "Failed", tone: STATUS_TONE.error },
  pending: { label: "Pending", tone: STATUS_TONE.warning },
  archived: { label: "Archived", tone: STATUS_TONE.neutral },
});

const statusKey = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "-");

const STATUS_ALIASES = Object.freeze({
  "in-progress": "active",
  live: "active",
  enabled: "active",
  upcoming: "scheduled",
  complete: "completed",
  completed: "completed",
  done: "completed",
  error: "failed",
  failure: "failed",
  inactive: "closed",
  disabled: "closed",
});

export function getStatusPresentation(status, fallbackLabel) {
  const rawKey = statusKey(status);
  const canonicalKey = STATUS_ALIASES[rawKey] || rawKey;
  const known = STATUS_PRESENTATION[canonicalKey];

  if (known) {
    return {
      ...known,
      key: canonicalKey,
      label: fallbackLabel || known.label,
    };
  }

  const readable =
    fallbackLabel ||
    (rawKey
      ? rawKey
          .split("-")
          .filter(Boolean)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" ")
      : "Unknown");

  return { key: rawKey || "unknown", label: readable, tone: STATUS_TONE.neutral };
}

/**
 * Status text is always rendered, so color is supplementary rather than the only
 * carrier of meaning. Prefer this over ad-hoc colored Tags for lifecycle states.
 */
export function StatusBadge({
  status,
  label,
  tone,
  icon,
  className = "",
}) {
  const presentation = getStatusPresentation(status, label);
  const resolvedTone = Object.values(STATUS_TONE).includes(tone)
    ? tone
    : presentation.tone;

  return (
    <Tag
      icon={icon}
      className={joinClasses(
        "lms-status-badge",
        `lms-status-badge--${resolvedTone}`,
        className
      )}
      data-status={presentation.key}
    >
      {!icon ? <span className="lms-status-badge__dot" aria-hidden="true" /> : null}
      <span>{presentation.label}</span>
    </Tag>
  );
}
