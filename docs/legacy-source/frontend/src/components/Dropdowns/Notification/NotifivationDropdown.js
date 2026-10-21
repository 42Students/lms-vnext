import Image from "next/image";
import { createPortal } from "react-dom";
import { Tag, Drawer, Badge } from "antd";
import Link from "next/link";
import { useSelector } from "react-redux";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Markup } from "interweave";
import ModalContainer from "@/components/Global/ModalContainer/ModalContainer";
import { getCourseName, getCourseNameBySlug } from "@/api/Services/courseServices";
import { useRouter } from "next/router";
import { getNotificationsPath } from "@/utils/roleUtils";
import { formatNotificationDate } from "@/utils/notificationDateUtils";
import { BellOutlined } from "@ant-design/icons";
import { useNotificationFeed } from "@/hooks/useNotificationFeed";
import { getNotificationTypeConfig } from "@/utils/notificationTypeUtils";
import { ListSkeleton, RefreshStatus } from "@/components/Common/Skeletons";
import {
  PanelEmpty,
  PanelError,
  PanelPartial,
} from "@/components/Common/PanelStates";

const MOBILE_BP = 767;
const DIALOG_FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const NOTIFICATION_ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'a', 'h1', 'h2', 'h3', 'h4', 'span'];
const NOTIFICATION_ALLOWED_ATTRS = { a: ['href', 'target', 'rel'] };

function getTypeTag(record) {
  const config = getNotificationTypeConfig(record);
  return <Tag color={config.color}>{config.label}</Tag>;
}

function NotificationPanelContent({
  loading,
  error,
  hasLoaded,
  displayList,
  onItemClick,
  onViewAllClick,
  onRetry,
  viewAllHref = "/learn/notifications",
  emptyDescription = "Notifications will appear here when available.",
  showHeader = true,
}) {
  return (
    <div className="ln-notification-drawer-panel">
      {showHeader && (
        <div className="ln-notification-drawer__header">
          <h3 className="ln-notification-drawer__title" id="notification-panel-title">Notifications</h3>
        </div>
      )}

      <div className="ln-notification-drawer__body">
        {loading && !hasLoaded ? (
          <ListSkeleton rows={4} avatar={false} label="Loading notifications" />
        ) : error && !hasLoaded ? (
          <PanelError
            title="Couldn't load notifications"
            description="Your notification feed could not be loaded."
            onRetry={onRetry}
            retryAriaLabel="Retry loading notifications"
          />
        ) : (
          <>
            {loading && displayList != null ? (
              <RefreshStatus label="Refreshing notifications…" />
            ) : null}
            {error && displayList != null ? (
              <PanelPartial
                title="Notifications may be out of date"
                description="The last loaded notifications are still shown. Retry to get the latest updates."
                onRetry={onRetry}
              />
            ) : null}
            {displayList?.length > 0 ? (
              <ul className="ln-notification-drawer__list">
                {displayList.map((notification, index) => (
                  <li
                    className="ln-notification-drawer__item"
                    key={notification?.id ?? `notif-${notification?.classId ?? ''}-${notification?.title ?? ''}-${index}`}
                  >
                    <button
                      type="button"
                      className="ln-notification-drawer__item-inner"
                      onClick={() => onItemClick?.(notification)}
                    >
                      <div className="ln-notification-drawer__item-content">
                        <div className="ln-notification-drawer__item-title">
                          {notification?.title ?? "—"}
                        </div>
                        <div className="ln-notification-drawer__item-snippet">
                          <Markup
                            content={
                              (notification?.message?.length > 80
                                ? notification.message.slice(0, 80) + "…"
                                : notification?.message) ?? ""
                            }
                            allowList={NOTIFICATION_ALLOWED_TAGS}
                            allowAttributes={NOTIFICATION_ALLOWED_ATTRS}
                          />
                        </div>
                        <div className="ln-notification-drawer__item-meta">
                          {getTypeTag(notification)}
                          <span className="ln-notification-drawer__item-date">
                            {formatNotificationDate(notification?.created_at)}
                          </span>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <PanelEmpty
                icon={BellOutlined}
                title="No notifications yet"
                description={emptyDescription}
              />
            )}
          </>
        )}
      </div>

      {viewAllHref ? (
        <div className="ln-notification-drawer__footer">
          <Link href={viewAllHref} passHref legacyBehavior>
            <a className="ln-notification-drawer__view-all" onClick={onViewAllClick}>
              View all notifications
            </a>
          </Link>
        </div>
      ) : null}
    </div>
  );
}

const NotificationDropdown = () => {
  const router = useRouter();
  const loginUser = useSelector((state) => state.loginUser);
  const {
    data,
    loading,
    error,
    hasLoaded = !error && data != null,
    refetch: fetchNotifications,
  } = useNotificationFeed();
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [courseNameForSelected, setCourseNameForSelected] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ top: 0, right: 0 });
  const [panelSnapshot, setPanelSnapshot] = useState(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const previousPanelLoadingRef = useRef(false);

  const checkMobile = useCallback(() => {
    setIsMobile(typeof window !== "undefined" && window.innerWidth <= MOBILE_BP);
  }, []);

  const restoreTriggerFocus = useCallback(() => {
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    }
  }, []);

  const closeDesktopPanel = useCallback(() => {
    setOpenDropdown(false);
    restoreTriggerFocus();
  }, [restoreTriggerFocus]);

  const closeMobileDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  const handleMobileAfterOpenChange = useCallback((isOpen) => {
    if (!isOpen) restoreTriggerFocus();
  }, [restoreTriggerFocus]);

  useEffect(() => {
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [checkMobile]);

  // Position panel relative to trigger (desktop only)
  const updatePanelPosition = useCallback(() => {
    if (!triggerRef.current || typeof document === "undefined") return;
    const rect = triggerRef.current.getBoundingClientRect();
    const gap = 8;
    setPanelPosition({
      top: rect.bottom + gap,
      right: Math.max(12, document.documentElement.clientWidth - rect.right),
    });
  }, []);

  useEffect(() => {
    if (openDropdown && !isMobile) {
      updatePanelPosition();
      window.addEventListener("scroll", updatePanelPosition, true);
      window.addEventListener("resize", updatePanelPosition);
      return () => {
        window.removeEventListener("scroll", updatePanelPosition, true);
        window.removeEventListener("resize", updatePanelPosition);
      };
    }
  }, [openDropdown, isMobile, updatePanelPosition]);

  // Click outside to close desktop panel
  useEffect(() => {
    if (!openDropdown || isMobile) return;
    const handleClickOutside = (e) => {
      const trigger = triggerRef.current;
      const panel = panelRef.current;
      if (!trigger || !panel) return;
      if (
        !trigger.contains(e.target) &&
        !panel.contains(e.target)
      ) {
        closeDesktopPanel();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown, isMobile, closeDesktopPanel]);

  // Keep keyboard focus inside the custom desktop dialog and return it to the bell on dismiss.
  // Ant Drawer handles this on mobile; the desktop panel is a custom portal and needs the same
  // lifecycle explicitly.
  useEffect(() => {
    if (!openDropdown || isMobile) return undefined;
    const panel = panelRef.current;
    if (!panel) return undefined;

    const focusFirst = () => {
      const first = panel.querySelector(DIALOG_FOCUSABLE);
      (first || panel).focus();
    };
    const frame = window.requestAnimationFrame(focusFirst);

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDesktopPanel();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = Array.from(panel.querySelectorAll(DIALOG_FOCUSABLE))
        .filter((element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true");
      if (!focusable.length) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openDropdown, isMobile, closeDesktopPanel]);

  useEffect(() => {
    if (!selectedNotification) {
      setCourseNameForSelected(null);
      return;
    }
    let cancelled = false;
    setCourseNameForSelected(null);

    const ctx =
      selectedNotification?.context_label || selectedNotification?.contextLabel;
    if (ctx) {
      setCourseNameForSelected(ctx);
      return () => {};
    }
    const slug =
      selectedNotification?.course_slug ?? selectedNotification?.courseSlug;
    const id =
      selectedNotification?.course_id ?? selectedNotification?.courseId;
    if (slug) {
      getCourseNameBySlug(slug)
        .then((res) => {
          if (cancelled) return;
          const data = res?.data;
          const name = typeof data === "string" ? data : (data?.courseName ?? data?.course_name ?? data?.shortTitle ?? null);
          setCourseNameForSelected(name);
        })
        .catch(() => {
          if (!cancelled) setCourseNameForSelected(null);
        });
    } else if (id != null && id !== 0) {
      getCourseName({ courseId: id })
        .then((res) => {
          if (cancelled) return;
          const data = res?.data ?? res;
          const name = typeof data === "string" ? data : (data?.courseName ?? data?.course_name ?? data?.shortTitle ?? null);
          setCourseNameForSelected(name);
        })
        .catch(() => {
          if (!cancelled) setCourseNameForSelected(null);
        });
    }
    return () => {
      cancelled = true;
    };
  }, [selectedNotification]);

  const displayList = useMemo(
    () =>
      data == null
        ? null
        : Array.isArray(data)
          ? [...data].sort((a, b) => (b?.id ?? 0) - (a?.id ?? 0)).slice(0, 8)
          : [],
    [data]
  );
  const badgeCount = Array.isArray(data) ? Math.min(data.length, 99) : 0;
  const panelOpen = openDropdown || drawerOpen;

  // Keep the visible order stable while someone is reading the drawer. Live/SSE arrivals
  // still update the badge immediately, but are folded into the list on the next open.
  // An explicit fetch is different: when a loading cycle finishes, replace the snapshot
  // with that fresh server result so Retry/refresh never leaves visibly stale content behind.
  useEffect(() => {
    const refreshJustFinished = previousPanelLoadingRef.current && !loading;
    previousPanelLoadingRef.current = loading;

    if (!panelOpen) {
      setPanelSnapshot(null);
      return;
    }

    if (Array.isArray(displayList) && (panelSnapshot == null || refreshJustFinished)) {
      setPanelSnapshot(displayList);
    }
  }, [displayList, loading, panelOpen, panelSnapshot]);

  const visibleDisplayList =
    panelOpen && panelSnapshot != null ? panelSnapshot : displayList;

  // null for admins: they have no notifications page, so the panel shows no "view all" link.
  const notificationsPath = getNotificationsPath(loginUser);

  const handleItemClick = (notification) => {
    setSelectedNotification(notification);
    setOpenDropdown(false);
    setDrawerOpen(false);
  };

  const handleTriggerClick = () => {
    if (isMobile) {
      setDrawerOpen((v) => !v);
    } else {
      setOpenDropdown((v) => !v);
    }
  };

  const closePanel = () => {
    setOpenDropdown(false);
    setDrawerOpen(false);
  };

  const panelContent = (
    <NotificationPanelContent
      loading={loading}
      error={error}
      hasLoaded={hasLoaded}
      displayList={visibleDisplayList}
      onItemClick={handleItemClick}
      onViewAllClick={closePanel}
      onRetry={fetchNotifications}
      viewAllHref={notificationsPath}
      showHeader={!isMobile}
    />
  );

  return (
    <div className="ln-notification-dropdown-root">
      {selectedNotification && (
        <ModalContainer
          customClass="ln-notification-detail-modal"
          onClose={() => setSelectedNotification(null)}
          showFooter={
            (selectedNotification?.interview_id ?? selectedNotification?.interviewId) != null ||
            (selectedNotification?.application_id ?? selectedNotification?.applicationId) != null ||
            (selectedNotification?.assessment_url ?? selectedNotification?.assessmentUrl)
          }
          open={!!selectedNotification}
          title={
            <div className="ln-notification-detail__title">
              {selectedNotification?.title || "NA"}
            </div>
          }
          primaryButtonTitle={
            (selectedNotification?.assessment_url ?? selectedNotification?.assessmentUrl)
              ? "Take Assessment"
              : (selectedNotification?.interview_id ?? selectedNotification?.interviewId) != null
                ? "View Interview"
                : (selectedNotification?.application_id ?? selectedNotification?.applicationId) != null
                  ? "View in My Applications"
                  : undefined
          }
          onClickPrimary={
            (selectedNotification?.assessment_url ?? selectedNotification?.assessmentUrl)
              ? () => {
                  const url = ((selectedNotification?.assessment_url ?? selectedNotification?.assessmentUrl) || "").trim();
                  setSelectedNotification(null);
                  setOpenDropdown(false);
                  setDrawerOpen(false);
                  if (url && /^https?:\/\//i.test(url)) {
                    window.open(url, "_blank", "noopener,noreferrer");
                  } else {
                    const appId = selectedNotification?.application_id ?? selectedNotification?.applicationId;
                    if (appId) router.push(`/learn/my-placements/applications?applicationId=${appId}`);
                  }
                }
              : (selectedNotification?.interview_id ?? selectedNotification?.interviewId) != null
                ? () => {
                    const interviewId = selectedNotification?.interview_id ?? selectedNotification?.interviewId;
                    setSelectedNotification(null);
                    setOpenDropdown(false);
                    setDrawerOpen(false);
                    router.push("/learn/my-placements/schedule");
                  }
                : (selectedNotification?.application_id ?? selectedNotification?.applicationId) != null
                  ? () => {
                      const appId = selectedNotification?.application_id ?? selectedNotification?.applicationId;
                      setSelectedNotification(null);
                      setOpenDropdown(false);
                      setDrawerOpen(false);
                      router.push(`/learn/my-placements/applications?applicationId=${appId}`);
                    }
                  : undefined
          }
          secondaryButtonTitle={
            (selectedNotification?.assessment_url ?? selectedNotification?.assessmentUrl)
              ? (selectedNotification?.application_id ?? selectedNotification?.applicationId) != null
                ? "View in My Applications"
                : undefined
              : (selectedNotification?.interview_id ?? selectedNotification?.interviewId) != null &&
                (selectedNotification?.application_id ?? selectedNotification?.applicationId) != null
                ? "View in My Applications"
                : undefined
          }
          onClickSecondary={
            (selectedNotification?.assessment_url ?? selectedNotification?.assessmentUrl)
              ? (selectedNotification?.application_id ?? selectedNotification?.applicationId) != null
                ? () => {
                    const appId = selectedNotification?.application_id ?? selectedNotification?.applicationId;
                    setSelectedNotification(null);
                    setOpenDropdown(false);
                    setDrawerOpen(false);
                    router.push(`/learn/my-placements/applications?applicationId=${appId}`);
                  }
                : undefined
              : (selectedNotification?.interview_id ?? selectedNotification?.interviewId) != null &&
                (selectedNotification?.application_id ?? selectedNotification?.applicationId) != null
                ? () => {
                    const appId = selectedNotification?.application_id ?? selectedNotification?.applicationId;
                    setSelectedNotification(null);
                    setOpenDropdown(false);
                    setDrawerOpen(false);
                    router.push(`/learn/my-placements/applications?applicationId=${appId}`);
                  }
                : undefined
          }
        >
          <div className="ln-notification-detail__body">
            <div className="ln-notification-detail__message">
              <Markup content={selectedNotification?.message ?? ""} allowList={NOTIFICATION_ALLOWED_TAGS} allowAttributes={NOTIFICATION_ALLOWED_ATTRS} />
            </div>
            <div className="ln-notification-detail__meta">
              {getTypeTag(selectedNotification)}
              {courseNameForSelected && (
                <span className="ln-notification-detail__context">
                  {courseNameForSelected}
                </span>
              )}
            </div>
            <div className="ln-notification-detail__date">
              {formatNotificationDate(selectedNotification?.created_at)}
            </div>
          </div>
        </ModalContainer>
      )}

      {/* badgeCount is the total fetched notification count, not filtered by read state —
          nothing in this app currently marks a notification read, so calling it "unread" here
          claimed a real-time-changing count that never actually changes as you read things. */}
      <button
        ref={triggerRef}
        type="button"
        className="ln-notification-trigger"
        aria-label={badgeCount > 0 ? `Open notifications, ${badgeCount} total` : "Open notifications"}
        aria-expanded={openDropdown || drawerOpen}
        aria-haspopup="dialog"
        onClick={handleTriggerClick}
      >
        <Badge count={badgeCount} size="small" offset={[-2, 2]}>
          <Image
            src="/assets/images/common/bell.svg"
            alt=""
            width={24}
            height={24}
            aria-hidden
          />
        </Badge>
      </button>

      {isMobile ? (
        <Drawer
          rootClassName="ln-notification-drawer-root"
          open={drawerOpen}
          onClose={closeMobileDrawer}
          afterOpenChange={handleMobileAfterOpenChange}
          placement="right"
          width="100%"
          className="ln-notification-drawer ln-notification-drawer--mobile"
          title="Notifications"
          closable={true}
          styles={{
            body: { padding: 0 },
          }}
        >
          {panelContent}
        </Drawer>
      ) : (
        openDropdown &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="ln-notification-dropdown-portal">
            <div
              className="ln-notification-dropdown-backdrop"
              aria-hidden
              onClick={closeDesktopPanel}
            />
            <div
              ref={panelRef}
              className="ln-notification-dropdown-panel ln-notification-dropdown-panel--visible"
              role="dialog"
              aria-modal="true"
              aria-labelledby="notification-panel-title"
              tabIndex={-1}
              style={{
                position: "fixed",
                top: panelPosition.top,
                right: panelPosition.right,
                zIndex: 1051,
              }}
            >
              {panelContent}
            </div>
          </div>,
          document.body
        )
      )}
    </div>
  );
};

export default NotificationDropdown;
