import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Avatar, Button, Input, Modal, Spin, Tag, Tooltip, message } from "antd";
import {
  ArrowDownOutlined,
  DeleteOutlined,
  PushpinFilled,
  PushpinOutlined,
  ReloadOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import {
  createClassroomMessage,
  deleteClassroomMessage,
  getClassroomMessages,
  toggleClassroomPin,
} from "@/api/Services/courseServices";
import { getCourseClassAssignments, resolveCourseClassAssignment } from "@/utils/courseClassAssignment";
import { loadClientSettings } from "@/utils/clientSettings";
import Router from "next/router";
import { parsePlacementUtcDateTime } from "@/utils/placementDateTime";

/** Fallback poll interval while the tab is visible. There is no websocket, so without this a
 *  participant only ever sees new messages after their own next action. The live value comes from
 *  ui.chatPollIntervalMs; this is what's used if that fetch fails. */
const POLL_MS = 15000;
/** Consecutive messages from one sender within this window collapse into a single group. */
const GROUP_WINDOW_MS = 5 * 60 * 1000;

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join("") || "U";
}

/** Deterministic per-sender avatar tint. Every avatar used to be the same teal, so in a class of
 *  60 with colliding initials there was no identity signal at all. */
const AVATAR_TINTS = [
  { bg: "#e0f2f1", fg: "#0f766e" },
  { bg: "#ede9fe", fg: "#5b21b6" },
  { bg: "#fef3c7", fg: "#92400e" },
  { bg: "#e0e7ff", fg: "#3730a3" },
  { bg: "#fce7f3", fg: "#9d174d" },
  { bg: "#dcfce7", fg: "#166534" },
  { bg: "#ffe4e6", fg: "#9f1239" },
  { bg: "#e0f2fe", fg: "#075985" },
];

function getAvatarTint(senderId, senderName) {
  const seed = senderId != null
    ? Number(senderId)
    : String(senderName || "").split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const index = Math.abs(Number.isFinite(seed) ? seed : 0) % AVATAR_TINTS.length;
  return AVATAR_TINTS[index];
}

// Server times come as UTC, often as an array ([2026, 10, 15, 8, 30, 0]); new Date(array) and Date.parse(array) gave NaN, so
// every message sat under "Earlier" with no time, and polling never had a cursor (test run, 15 Oct 2026).
const msOf = (value) => {
  const m = parsePlacementUtcDateTime(value);
  return m ? m.valueOf() : NaN;
};

function toDate(value) {
  const t = msOf(value);
  return Number.isFinite(t) ? new Date(t) : null;
}

function formatTimeAgo(isoValue, nowMs) {
  const date = toDate(isoValue);
  if (!date) return "";
  const diffMins = Math.floor((nowMs - date.getTime()) / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor((nowMs - date.getTime()) / 3600000);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor((nowMs - date.getTime()) / 86400000);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function formatDaySeparator(date) {
  const today = new Date();
  const startOf = d => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOf(today) - startOf(date)) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
}

/** Flat list to day separators + sender groups. Without this the feed is an undifferentiated
 *  chronological dump: four consecutive messages from one person rendered four avatars, four
 *  meta rows and four action rows for ~20px of actual content each. */
// Learner and faculty ids are separate number ranges: learner 21 and faculty 21 are two people, so a
// sender is identified by role + id (LRN-DISC-02), never the id alone.
const senderKeyOf = (item) => (item?.senderId != null
  ? `${String(item?.senderRole || "").toLowerCase() === "faculty" ? "faculty" : "learner"}:${item.senderId}`
  : null);

// Polling asks only for what changed since the newest updatedAt already held (LRN-DISC-03): new,
// pinned/unpinned and deleted messages, merged into the list by id. A full reload still happens on
// the first load, a manual Refresh and after your own post/pin/delete.
// Sent back as "since": an ISO instant, which is what the server parses (OffsetDateTime).
const newestUpdatedAt = (list) => {
  const newest = list.reduce((max, m) => {
    const t = msOf(m?.updatedAt);
    return Number.isFinite(t) && t > max ? t : max;
  }, -Infinity);
  return Number.isFinite(newest) ? new Date(newest).toISOString() : null;
};

const mergeChanges = (current, changes) => {
  const byId = new Map(current.map((m) => [m?.id, m]));
  changes.forEach((m) => {
    if (m?.isDeleted || m?.deleted) byId.delete(m?.id);
    else byId.set(m?.id, m);
  });
  return [...byId.values()].sort((a, b) =>
    (msOf(a?.createdAt) || 0) - (msOf(b?.createdAt) || 0) || (a?.id ?? 0) - (b?.id ?? 0));
};

function buildFeed(messages) {
  const rows = [];
  let lastDayKey = null;
  let lastSenderId = null;
  let lastTime = 0;

  messages.forEach(item => {
    const date = toDate(item?.createdAt);
    const dayKey = date ? `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}` : "unknown";
    if (dayKey !== lastDayKey) {
      rows.push({ kind: "day", key: `day-${dayKey}`, label: date ? formatDaySeparator(date) : "Earlier" });
      lastDayKey = dayKey;
      lastSenderId = null;
      lastTime = 0;
    }
    const time = date ? date.getTime() : 0;
    const sameSender = senderKeyOf(item) != null && senderKeyOf(item) === lastSenderId;
    const withinWindow = time && lastTime && time - lastTime <= GROUP_WINDOW_MS;
    rows.push({
      kind: "message",
      key: item?.id ?? `msg-${rows.length}`,
      item,
      grouped: Boolean(sameSender && withinWindow),
    });
    lastSenderId = senderKeyOf(item);
    lastTime = time;
  });

  return rows;
}

function Classroom() {
  const loginUser = useSelector(state => state.loginUser);
  const course = useSelector(state => state.course);
  const courseClassAssignments = getCourseClassAssignments(course);
  const courseScope = useMemo(
    () =>
      resolveCourseClassAssignment({
        loginClassId: loginUser?.classId,
        assignments: courseClassAssignments,
        preferFirstAssignment: true,
      }),
    [courseClassAssignments, loginUser?.classId],
  );
  const courseId = course?.selectedCourseId ?? loginUser?.selectedCourse?.id ?? null;
  const classId = courseScope?.classId ?? loginUser?.classId ?? null;
  const isFacultyRole = loginUser?.userType === "FACULTY" || loginUser?.userType === "ADMIN";
  const currentUserId = loginUser?.id != null ? Number(loginUser.id) : null;

  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  // initialLoading drives the spinner; a background refresh must never blank the feed.
  const [initialLoading, setInitialLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [refreshError, setRefreshError] = useState(null);
  const [posting, setPosting] = useState(false);
  const [mutationBusyId, setMutationBusyId] = useState(null);
  const [atBottom, setAtBottom] = useState(true);
  const [unseenCount, setUnseenCount] = useState(0);
  // Ticks so relative timestamps age while the user reads instead of freezing at "Just now".
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [messageApi, contextHolder] = message.useMessage();

  const scrollRef = useRef(null);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const hasLoadedOnce = useRef(false);
  const postingRef = useRef(false);
  const messageMutationRef = useRef(null);
  const prevCount = useRef(0);
  const cursorRef = useRef(null);

  const pinnedMessages = useMemo(() => messages.filter(item => item?.pinned), [messages]);
  const pinnedMessage = pinnedMessages[0] ?? null;
  const feedRows = useMemo(() => buildFeed(messages), [messages]);

  const scopeReady = Boolean(courseId && classId);

  const loadMessages = useCallback(({ silent, changesOnly } = {}) => {
    if (!scopeReady) {
      setMessages([]);
      setLoadError(null);
      setRefreshError(null);
      cursorRef.current = null;
      return Promise.resolve();
    }
    if (!silent && !hasLoadedOnce.current) setInitialLoading(true);
    const since = changesOnly && hasLoadedOnce.current ? cursorRef.current : null;
    return getClassroomMessages(since ? { courseId, classId, since } : { courseId, classId })
      .then(res => {
        const raw = res?.data;
        const got = Array.isArray(raw) ? raw : (raw?.data ?? []);
        const list = Array.isArray(got) ? got : [];
        if (since) {
          if (list.length) {
            setMessages((current) => mergeChanges(current, list));
            cursorRef.current = newestUpdatedAt([...list, { updatedAt: cursorRef.current }]);
          }
        } else {
          setMessages(list);
          cursorRef.current = newestUpdatedAt(list);
        }
        setLoadError(null);
        setRefreshError(null);
        hasLoadedOnce.current = true;
      })
      .catch(() => {
        // Once a real snapshot exists, a poll/refresh failure is stale state, not a reason to
        // replace the whole discussion with an error panel. Initial failure remains blocking.
        if (hasLoadedOnce.current) {
          setRefreshError("Could not refresh the discussion. Showing the last messages we loaded.");
        } else {
          setLoadError("We could not load this discussion.");
        }
      })
      .finally(() => {
        setInitialLoading(false);
      });
  }, [classId, courseId, scopeReady]);

  useEffect(() => {
    // Never carry the previous course/class conversation into a newly selected scope while its
    // first request is still pending.
    hasLoadedOnce.current = false;
    prevCount.current = 0;
    setMessages([]);
    setLoadError(null);
    setRefreshError(null);
    loadMessages();
  }, [loadMessages]);

  // Poll only while the tab is visible, so a backgrounded tab does not hammer the API.
  // Interval is a platform tunable (ui.chatPollIntervalMs) rather than a hardcoded constant —
  // falls back to POLL_MS if the settings fetch hasn't landed or failed.
  useEffect(() => {
    if (!scopeReady) return undefined;
    let id = null;
    let cancelled = false;
    const tick = () => {
      if (document.visibilityState === "visible") loadMessages({ silent: true, changesOnly: true });
    };
    loadClientSettings().then((settings) => {
      if (cancelled) return;
      id = setInterval(tick, settings?.chatPollIntervalMs || POLL_MS);
    });
    return () => {
      cancelled = true;
      if (id) clearInterval(id);
    };
  }, [loadMessages, scopeReady]);

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!draft.trim() || postingRef.current || typeof window === "undefined") return undefined;

    const beforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const beforeRouteChange = () => {
      if (window.confirm("Discard your unsent discussion message?")) return;
      const addressBar = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (addressBar !== Router.asPath) window.history.pushState(null, "", Router.asPath);
      // eslint-disable-next-line no-throw-literal
      throw "Route change aborted to preserve an unsent discussion message.";
    };

    window.addEventListener("beforeunload", beforeUnload);
    Router.events.on("routeChangeStart", beforeRouteChange);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      Router.events.off("routeChangeStart", beforeRouteChange);
    };
  }, [draft]);


  // Track whether the reader is pinned to the bottom, so we never yank them away from history.
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    const bottom = distance < 80;
    setAtBottom(bottom);
    if (bottom) setUnseenCount(0);
  }, []);

  const scrollToBottom = useCallback((behavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ block: "end", behavior });
    setUnseenCount(0);
    setAtBottom(true);
  }, []);

  // Newest message lives at the bottom (backend orders ascending). Landing at scroll-top meant
  // opening the course's oldest message and never seeing your own sent message.
  useEffect(() => {
    if (messages.length === 0) return;
    const grew = messages.length > prevCount.current;
    if (prevCount.current === 0) {
      scrollToBottom("auto");
    } else if (grew && atBottom) {
      scrollToBottom("smooth");
    } else if (grew) {
      setUnseenCount(count => count + (messages.length - prevCount.current));
    }
    prevCount.current = messages.length;
  }, [messages, atBottom, scrollToBottom]);

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text || !scopeReady || postingRef.current) return;
    postingRef.current = true;
    setPosting(true);
    try {
      await createClassroomMessage({ courseId, classId, messageText: text });
      setDraft("");
      setAtBottom(true);
      // A refresh failure after a successful post is labelled stale; it must not turn the
      // successful write into a misleading "post failed" error.
      await loadMessages({ silent: true });
      textareaRef.current?.focus();
    } catch (error) {
      messageApi.error(error?.response?.data?.message || "Failed to post message.");
    } finally {
      postingRef.current = false;
      setPosting(false);
    }
  };

  const togglePin = async (messageId) => {
    if (!messageId || messageMutationRef.current) return;
    const busyKey = `pin-${messageId}`;
    messageMutationRef.current = busyKey;
    setMutationBusyId(busyKey);
    try {
      await toggleClassroomPin({ messageId });
      await loadMessages({ silent: true });
    } catch (error) {
      messageApi.error(error?.response?.data?.message || "Failed to update pin state.");
    } finally {
      messageMutationRef.current = null;
      setMutationBusyId(null);
    }
  };

  const deleteMessage = (messageId) => {
    if (!messageId || messageMutationRef.current) return;
    Modal.confirm({
      rootClassName: "ln-confirm-modal-root",
      title: "Delete this message?",
      content: "This cannot be undone.",
      okText: "Delete",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      onOk: async () => {
        if (messageMutationRef.current) return;
        const busyKey = `delete-${messageId}`;
        messageMutationRef.current = busyKey;
        setMutationBusyId(busyKey);
        try {
          await deleteClassroomMessage(messageId);
          await loadMessages({ silent: true });
        } catch (error) {
          messageApi.error(error?.response?.data?.message || "Failed to delete message.");
          throw error;
        } finally {
          messageMutationRef.current = null;
          setMutationBusyId(null);
        }
      },
    });
  };

  const renderMessage = (item, grouped) => {
    const isMine = currentUserId != null && senderKeyOf(item) === `${isFacultyRole ? "faculty" : "learner"}:${currentUserId}`;
    const isFacultyMessage = String(item?.senderRole || "").toLowerCase() === "faculty";
    const tint = getAvatarTint(item?.senderId, item?.senderName);
    const timestampTitle = toDate(item?.createdAt)?.toLocaleString() ?? "";
    return (
      <article
        className={[
          "ln-classroom-message",
          grouped ? "ln-classroom-message--grouped" : "",
          isMine ? "ln-classroom-message--mine" : "",
          isFacultyMessage ? "ln-classroom-message--faculty" : "",
        ].filter(Boolean).join(" ")}
      >
        {grouped ? (
          <span className="ln-classroom-message__avatar-spacer" aria-hidden="true" />
        ) : (
          <Avatar
            className="ln-classroom-message__avatar"
            style={{ background: tint.bg, color: tint.fg }}
          >
            {getInitials(item?.senderName)}
          </Avatar>
        )}
        <div className="ln-classroom-message__body">
          {!grouped && (
            <div className="ln-classroom-message__meta">
              <strong>{isMine ? "You" : (item?.senderName || "User")}</strong>
              {isFacultyMessage && <Tag className="ln-classroom-message__role">Faculty</Tag>}
              <Tooltip title={timestampTitle}>
                <time dateTime={toDate(item?.createdAt)?.toISOString()}>{formatTimeAgo(item?.createdAt, nowMs)}</time>
              </Tooltip>
              {item?.pinned && <Tag icon={<PushpinFilled />}>Pinned</Tag>}
            </div>
          )}
          <p>{item?.messageText}</p>
        </div>
        {(isFacultyRole || isMine) && (
          <div className="ln-classroom-message__actions">
            {isFacultyRole && (
              <Tooltip title={item?.pinned ? "Unpin" : "Pin"}>
                <Button
                  size="small"
                  type="text"
                  aria-label={item?.pinned ? "Unpin this message" : "Pin this message"}
                  icon={item?.pinned ? <PushpinFilled /> : <PushpinOutlined />}
                  loading={mutationBusyId === `pin-${item.id}`}
                  disabled={mutationBusyId != null}
                  onClick={() => togglePin(item.id)}
                />
              </Tooltip>
            )}
            <Tooltip title="Delete">
              <Button
                size="small"
                type="text"
                danger
                aria-label="Delete this message"
                icon={<DeleteOutlined />}
                loading={mutationBusyId === `delete-${item.id}`}
                disabled={mutationBusyId != null}
                onClick={() => deleteMessage(item.id)}
              />
            </Tooltip>
          </div>
        )}
      </article>
    );
  };

  const renderBody = () => {
    if (initialLoading) {
      return (
        <div className="ln-classroom-loading" aria-live="polite">
          <Spin />
        </div>
      );
    }
    if (loadError) {
      return (
        <Alert
          type="error"
          showIcon
          className="ln-classroom-error"
          message="We could not load this discussion."
          description="Check your connection and try again."
          action={
            <Button size="small" icon={<ReloadOutlined />} onClick={() => loadMessages()}>
              Retry
            </Button>
          }
        />
      );
    }
    if (!scopeReady) {
      return (
        <div className="ln-classroom-empty">
          <h3>Discussion unavailable</h3>
          <p>This course is not linked to one of your classes yet, so there is no discussion to show.</p>
        </div>
      );
    }
    if (messages.length === 0) {
      // Day one IS the empty state for a course discussion, and it decides whether the channel is
      // ever used. A grey AntD shrug was the worst possible answer here.
      return (
        <div className="ln-classroom-empty">
          <h3>{isFacultyRole ? "Start the conversation" : "No messages yet"}</h3>
          <p>
            {isFacultyRole
              ? "Learners are far more likely to post once someone else has. Try a welcome note or this week's focus."
              : "Ask the first question — your classmates and faculty will see it here."}
          </p>
          {isFacultyRole && (
            <div className="ln-classroom-empty__actions">
              <Button
                onClick={() => {
                  setDraft("Welcome! Use this space for questions about the course.");
                  textareaRef.current?.focus();
                }}
              >
                Post a welcome message
              </Button>
              <Button
                onClick={() => {
                  setDraft("This week we are focusing on: ");
                  textareaRef.current?.focus();
                }}
              >
                Share this week&apos;s focus
              </Button>
            </div>
          )}
        </div>
      );
    }
    return (
      <div className="ln-classroom-messages" role="log" aria-live="polite" aria-relevant="additions">
        {feedRows.map(row =>
          row.kind === "day" ? (
            <div key={row.key} className="ln-classroom-day">
              <span>{row.label}</span>
            </div>
          ) : (
            <React.Fragment key={row.key}>{renderMessage(row.item, row.grouped)}</React.Fragment>
          )
        )}
        <div ref={bottomRef} />
      </div>
    );
  };

  // Same page-head + single content-card structure as ProjectDetailContent's tabs (see
  // CourseTabsLayout) — the pill above already says "Chat", so the visible-title
  // CourseSectionHeader repeated it; sr-only heading + visible subtitle matches every other tab.
  return (
    <div className="learn-projects-detail ln-classroom">
      {contextHolder}
      <div className="learn-projects-detail__page-head">
        <div>
          <h3 className="learn-projects-detail__page-head-title--sr-only">Discussions</h3>
          <p className="learn-projects-detail__page-head-subtitle">
            Keep course conversations in one place and follow along easily.
          </p>
        </div>
      </div>
      <div className="learn-projects-detail__body">
      <section className="learn-projects-detail__content ln-classroom__shell">

        {pinnedMessage && (
          // A banner, not a control. This used to be a full-width button whose only action was
          // unpin, ungated by role, with the whole message body as its accessible name.
          <div className="ln-classroom-pin-strip">
            <PushpinFilled aria-hidden="true" />
            <span>
              <strong>{pinnedMessage.messageText}</strong>
              <small>
                Pinned by {pinnedMessage.senderName || "User"}
                {pinnedMessages.length > 1 ? ` · 1 of ${pinnedMessages.length}` : ""}
              </small>
            </span>
            {isFacultyRole && (
              <Tooltip title="Unpin this message">
                <Button
                  type="text"
                  size="small"
                  className="ln-classroom-pin-strip__unpin"
                  aria-label="Unpin this message"
                  icon={<PushpinOutlined />}
                  loading={mutationBusyId === `pin-${pinnedMessage.id}`}
                  disabled={mutationBusyId != null}
                  onClick={() => togglePin(pinnedMessage.id)}
                />
              </Tooltip>
            )}
          </div>
        )}

        <section className="ln-classroom-feed ln-classroom-feed--plain" aria-label="Course discussions">
          {refreshError && (
            <Alert
              type="warning"
              showIcon
              closable
              onClose={() => setRefreshError(null)}
              message="Discussion refresh failed"
              description={refreshError}
              action={<Button size="small" icon={<ReloadOutlined />} onClick={() => loadMessages({ silent: true })}>Retry</Button>}
              style={{ marginBottom: 12 }}
            />
          )}
          <div className="ln-classroom-scroll" ref={scrollRef} onScroll={handleScroll}>
            {renderBody()}
          </div>

          {unseenCount > 0 && (
            <button type="button" className="ln-classroom-jump" onClick={() => scrollToBottom()}>
              <ArrowDownOutlined aria-hidden="true" />
              {unseenCount} new {unseenCount === 1 ? "message" : "messages"}
            </button>
          )}

          {/* A persistent invitation, not just an empty-state one-off — "Start the conversation"
              above only ever shows once and never again after the first message lands, so a
              learner opening this weeks later saw no cue at all that this space is for questions,
              not just announcements. */}
          <p className="ln-classroom-composer-hint">
            {isFacultyRole
              ? "Students can post questions here anytime — you'll see them appear in real time."
              : "Have a doubt about anything in this course? Feel free to ask here."}
          </p>
          <div className="ln-classroom-composer ln-classroom-composer--plain">
            <Input.TextArea
              ref={textareaRef}
              autoSize={{ minRows: 2, maxRows: 4 }}
              value={draft}
              onChange={event => setDraft(event.target.value)}
              onPressEnter={event => {
                if (!event.shiftKey) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Write a message..."
              maxLength={4000}
              showCount={draft.length > 3400}
              disabled={!scopeReady || Boolean(loadError)}
              aria-label="Write a message"
            />
            <div className="ln-classroom-composer__side">
              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={posting}
                disabled={!draft.trim() || posting || !scopeReady}
                onClick={sendMessage}
              >
                Send
              </Button>
              <span className="ln-classroom-composer__hint">
                Enter to send · Shift+Enter for a new line
              </span>
            </div>
          </div>
        </section>
      </section>
      </div>
    </div>
  );
}

export default Classroom;
