"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import {shouldSendLearnerDiscussionOnEnter,learnerDiscussionMobileJumpVisible} from "./learner-discussion-mobile-model";
import {
  buildDiscussionFeed,
  countNewDiscussionMessages,
  mergeDiscussionHistory,
  reconcileLatestDiscussionPage,
} from "./learner-course-discussion-model";

type DiscussionCursor = { beforeCreatedAt: string; beforeId: string };

type DiscussionMessage = {
  id: string;
  senderMembershipId: string;
  senderRole: string;
  senderName: string;
  messageText: string;
  pinned: boolean;
  createdAt: string;
  createdAtExact: string;
  updatedAt: string;
  isMine: boolean;
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}


export function LearnerCourseDiscussion({
  deliveryId,
  moderate = false,
}: {
  deliveryId: string;
  moderate?: boolean;
}) {
  const [messages, setMessages] = useState<DiscussionMessage[]>([]);
  const [highlightedPinned, setHighlightedPinned] = useState<{
    id: string;
    messageText: string;
    senderName: string | null;
    createdAt: string;
    updatedAt: string;
  } | null>(null);
  const [canPost, setCanPost] = useState(true);
  const [loading, setLoading] = useState(true);
  const [olderCursor, setOlderCursor] = useState<DiscussionCursor | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [olderError, setOlderError] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; text: string } | null>(null);
  const [posting, setPosting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [moderationError, setModerationError] = useState<string | null>(null);
  const [pinningId, setPinningId] = useState<string | null>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [unseenCount, setUnseenCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const loadedOnce = useRef(false);
  const previousMessages = useRef<DiscussionMessage[]>([]);
  const forceBottomOnNextLoad = useRef(false);
  const historyPrepend = useRef(false);
  const locallyDeletedIds = useRef(new Set<string>());

  const load = useCallback(async (silent = false) => {
    if (!silent && !loadedOnce.current) setLoading(true);
    try {
      const response = await fetch(
        `/api/courses/deliveries/${encodeURIComponent(deliveryId)}/discussions`,
        { cache: "no-store" },
      );
      if (!response.ok) throw new Error("discussion_load_failed");
      const payload = await response.json();
      const received = Array.isArray(payload.messages) ? payload.messages as DiscussionMessage[] : [];
      const incoming = received.filter((row) => !locallyDeletedIds.current.has(row.id));
      setMessages((previous) => loadedOnce.current
        ? reconcileLatestDiscussionPage(previous, incoming, received.length)
        : incoming);
      if (!loadedOnce.current) setOlderCursor(payload.nextCursor ?? null);
      setHighlightedPinned(
        payload.highlightedPinned?.id && !locallyDeletedIds.current.has(payload.highlightedPinned.id)
          ? payload.highlightedPinned
          : null,
      );
      setCanPost(payload.canPost !== false);
      setLoadError(false);
      loadedOnce.current = true;
    } catch {
      setLoadError(true);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [deliveryId]);

  const loadOlder = useCallback(async () => {
    if (!olderCursor || loadingOlder) return;
    setLoadingOlder(true);
    setOlderError(false);
    try {
      const params = new URLSearchParams({
        beforeCreatedAt: olderCursor.beforeCreatedAt,
        beforeId: olderCursor.beforeId,
      });
      const response = await fetch(
        "/api/courses/deliveries/" + encodeURIComponent(deliveryId) + "/discussions?" + params,
        { cache: "no-store" },
      );
      if (!response.ok) throw new Error("discussion_history_failed");
      const result = await response.json();
      const previousHeight = scrollRef.current?.scrollHeight ?? 0;
      historyPrepend.current = true;
      const received = Array.isArray(result.messages) ? result.messages as DiscussionMessage[] : [];
      setMessages((previous) => mergeDiscussionHistory(
        previous,
        received.filter((row) => !locallyDeletedIds.current.has(row.id)),
      ));
      setOlderCursor(result.nextCursor ?? null);
      window.requestAnimationFrame(() => {
        const scroller = scrollRef.current;
        if (scroller) scroller.scrollTop += scroller.scrollHeight - previousHeight;
      });
    } catch {
      setOlderError(true);
    } finally {
      setLoadingOlder(false);
    }
  }, [deliveryId, loadingOlder, olderCursor]);

  useEffect(() => {
    // Defer initial fetch to avoid synchronous cascading state updates.
    const first = window.setTimeout(() => void load(), 0);
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void load(true);
      }
    }, 15000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(interval);
    };
  }, [load]);

  const pinnedMessages = useMemo(
    () => messages.filter((item) => item.pinned),
    [messages],
  );
  const pinned = highlightedPinned ?? pinnedMessages[0] ?? null;
  const feed = useMemo(
    () => buildDiscussionFeed(messages),
    [messages],
  );

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({
      block: "end",
      behavior,
    });
    setUnseenCount(0);
    setAtBottom(true);
  }, []);

  const handleScroll = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;

    const distance =
      element.scrollHeight -
      element.scrollTop -
      element.clientHeight;
    const nextAtBottom = distance < 80;
    setAtBottom(nextAtBottom);
    if (nextAtBottom) setUnseenCount(0);
  }, []);

  useEffect(() => {
    if (messages.length === 0) {
      previousMessages.current = messages;
      return;
    }

    const previous = previousMessages.current;
    const firstLoadedFeed =
      previous.length === 0 && loadedOnce.current;
    const newCount = countNewDiscussionMessages(
      previous,
      messages,
    );

    if (historyPrepend.current) {
      historyPrepend.current = false;
    } else if (firstLoadedFeed) {
      window.requestAnimationFrame(() => scrollToBottom("auto"));
    } else if (forceBottomOnNextLoad.current) {
      forceBottomOnNextLoad.current = false;
      window.requestAnimationFrame(() =>
        scrollToBottom("smooth"),
      );
    } else if (newCount > 0 && atBottom) {
      window.requestAnimationFrame(() =>
        scrollToBottom("smooth"),
      );
    } else if (newCount > 0) {
      setUnseenCount((count) => count + newCount);
    }

    previousMessages.current = messages;
  }, [messages, atBottom, scrollToBottom]);

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    const messageText = draft.trim();
    if (!messageText || posting) return;

    setPosting(true);
    try {
      const response = await fetch(
        `/api/courses/deliveries/${encodeURIComponent(deliveryId)}/discussions`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ messageText, ...(replyTo ? { replyToMessageId: replyTo.id } : {}) }),
        },
      );
      if (!response.ok) throw new Error("discussion_post_failed");
      setDraft("");
      setReplyTo(null);
      forceBottomOnNextLoad.current = true;
      await load(true);
      window.requestAnimationFrame(() =>
        composerRef.current?.focus(),
      );
    } catch {
      setLoadError(true);
    } finally {
      setPosting(false);
    }
  }

  async function remove(messageId: string) {
    const current=messages.find(row=>row.id===messageId);
    if(!current){setModerationError("Message snapshot missing. Refresh and retry.");return;}
    if (!window.confirm("Delete this message? This cannot be undone.")) return;
    setDeletingId(messageId);setModerationError(null);
    try {
      const response = await fetch(
        `/api/courses/deliveries/${encodeURIComponent(deliveryId)}/discussions/${encodeURIComponent(messageId)}`,
        { method: "DELETE",headers:{"content-type":"application/json"},
          body:JSON.stringify({expectedUpdatedAt:current.updatedAt,confirmed:true}) },
      );
      if (!response.ok) throw new Error("Message was changed or is no longer editable. Refresh and retry.");
      // Requests already in flight can return a pre-delete snapshot.
      // Tombstone this ID for this workspace to prevent resurrection.
      locallyDeletedIds.current.add(messageId);
      setMessages((current) => current.filter((item) => item.id !== messageId));
      setHighlightedPinned((current) => current?.id === messageId ? null : current);
      await load(true);
    } catch(e) {
      setModerationError(e instanceof Error?e.message:"Discussion deletion failed.");
    } finally {
      setDeletingId(null);
    }
  }

  async function togglePin(messageId: string) {
    if (!moderate || pinningId) return;
    const current=messages.find(row=>row.id===messageId) ??
      (highlightedPinned?.id===messageId
        ? {id:highlightedPinned.id,pinned:true,updatedAt:highlightedPinned.updatedAt}
        : null);
    if(!current){setModerationError("Message snapshot missing. Refresh and retry.");return;}
    if(!window.confirm((current.pinned?"Unpin":"Pin")+" this Section message?"))return;
    setPinningId(messageId);setModerationError(null);
    try {
      const response = await fetch(
        `/api/courses/deliveries/${encodeURIComponent(deliveryId)}/discussions/${encodeURIComponent(messageId)}`,
        { method: "PATCH",headers:{"content-type":"application/json"},
          body:JSON.stringify({expectedUpdatedAt:current.updatedAt,confirmed:true}) },
      );
      if (!response.ok) {
        throw new Error("Message was changed or is no longer editable. Refresh and retry.");
      }
      const payload = await response.json();
      const updated = payload?.message;
      if(updated?.id===highlightedPinned?.id && !updated.pinned)
        setHighlightedPinned(null);
      if (updated?.id) {
        setMessages((current) =>
          current.map((item) =>
            item.id === updated.id
              ? {
                  ...item,
                  pinned: Boolean(updated.pinned),
                  updatedAt:
                    typeof updated.updatedAt === "string"
                      ? updated.updatedAt
                      : item.updatedAt,
                }
              : item,
          ),
        );
      }
      await load(true);
    } catch(e) {
      setModerationError(e instanceof Error?e.message:"Discussion moderation failed.");
    } finally {
      setPinningId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="sr-only">Discussions</h2>
        <p className="m-0 text-sm text-body">
          {moderate
            ? "Guide the class conversation, answer questions, pin important context, and moderate messages."
            : "Ask questions, share context, and keep course conversations visible to your class and faculty."}
        </p>
      </div>

      {pinned ? (
        <section className="rounded-xl border border-primary bg-primary-subtle p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-primary-text">
              Pinned
            </p>
          </div>
          <p className="mt-2 break-words text-sm font-semibold text-foreground">
            {pinned.messageText}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {pinned.senderName} · {formatTime(pinned.createdAt)}
          </p>
          {moderate && canPost ? (
            <button type="button" disabled={pinningId!==null}
              onClick={()=>void togglePin(pinned.id)}
              className="mt-3 min-h-10 rounded-md border border-primary px-3 text-xs font-semibold text-primary-text disabled:opacity-50">
              {pinningId===pinned.id?"Saving…":"Unpin pinned message"}
            </button>
          ) : null}
        </section>
      ) : null}

      {moderationError?<p role="alert" className="text-sm text-error">
        {moderationError}
      </p>:null}
      <section className="relative overflow-hidden rounded-xl border border-border bg-surface">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="max-h-[52dvh] min-h-56 overflow-y-auto overscroll-contain p-3 sm:max-h-[34rem] sm:min-h-80 sm:p-5"
        >
          {loading ? (
            <div className="space-y-4" aria-busy="true">
              {[1, 2, 3].map((item) => (
                <div key={item} className="animate-pulse rounded-lg border border-border p-4">
                  <div className="h-3 w-32 rounded bg-muted" />
                  <div className="mt-3 h-4 w-4/5 rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : loadError && messages.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center text-center">
              <h3 className="m-0 text-base font-semibold text-foreground">
                We could not load this discussion.
              </h3>
              <p className="mt-2 text-sm text-body">
                This is a loading problem, not an empty discussion.
              </p>
              <Button className="mt-4" variant="secondary" onClick={() => void load()}>
                Retry
              </Button>
            </div>
          ) : messages.length === 0 ? (
            moderate && canPost ? (
              <div className="flex min-h-64 flex-col items-center justify-center gap-4 p-4 text-center">
                <h3 className="text-base font-semibold text-foreground">Start the conversation</h3>
                <p className="text-sm text-body">Welcome your class or share the week&apos;s focus.</p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Button type="button" size="sm" variant="secondary"
                    onClick={()=>{
                      setDraft("Welcome! Use this space for questions about the course.");
                      composerRef.current?.focus();
                    }}>Post a welcome message</Button>
                  <Button type="button" size="sm" variant="secondary"
                    onClick={()=>{
                      setDraft("This week we are focusing on: ");
                      composerRef.current?.focus();
                    }}>Share this week&apos;s focus</Button>
                </div>
              </div>
            ) : (
              <EmptyState
                title="No messages yet"
                description="Ask the first question — your classmates and faculty will see it here."
              />
            )
          ) : (
            <div className="space-y-2" role="log" aria-live="polite" aria-relevant="additions">
              {olderCursor ? (
                <div className="flex flex-col items-center gap-2 pb-3">
                  <Button size="sm" variant="secondary" disabled={loadingOlder}
                    onClick={() => void loadOlder()}>
                    {loadingOlder ? "Loading earlier messages…" : "Load earlier messages"}
                  </Button>
                  {olderError ? <p role="alert" className="text-xs font-semibold text-error">
                    Earlier messages could not be loaded. Retry to continue.
                  </p> : null}
                </div>
              ) : null}
              {feed.map((row) =>
                row.kind === "day" ? (
                  <div
                    key={row.key}
                    className="flex items-center gap-3 py-2"
                    aria-label={row.label}
                  >
                    <span className="h-px flex-1 bg-border" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      {row.label}
                    </span>
                    <span className="h-px flex-1 bg-border" />
                  </div>
                ) : (
                  <article
                    key={row.key}
                    className={
                      row.item.isMine
                        ? `ml-auto max-w-[96%] break-words rounded-xl border border-primary bg-primary-subtle ${row.grouped ? "px-4 py-2" : "p-4"}`
                        : `max-w-[96%] break-words rounded-xl border border-border bg-surface-subtle ${row.grouped ? "px-4 py-2" : "p-4"}`
                    }
                  >
                    {!row.grouped ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="text-sm text-foreground">
                          {row.item.isMine ? "You" : row.item.senderName}
                        </strong>
                        {row.item.senderRole === "FACULTY" ? (
                          <StatusBadge tone="info">Faculty</StatusBadge>
                        ) : null}
                        <span className="text-xs text-muted-foreground">
                          {formatTime(row.item.createdAt)}
                        </span>
                        {row.item.pinned ? (
                          <StatusBadge tone="info">Pinned</StatusBadge>
                        ) : null}
                      </div>
                    ) : null}
                    <p className={`${row.grouped ? "mt-0" : "mt-2"} whitespace-pre-wrap text-sm leading-6 text-body`}>
                      {row.item.messageText}
                    </p>
                    {canPost ? <button type="button"
                      className="mt-2 text-xs font-semibold text-primary-text underline"
                      onClick={() => {
                        setReplyTo({id:row.item.id,text:row.item.messageText.slice(0,100)});
                        composerRef.current?.focus();
                      }}>
                      Reply
                    </button> : null}
                    {canPost &&
                    (moderate || row.item.isMine) ? (
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        {moderate ? (
                          <button
                            type="button"
                            disabled={pinningId !== null}
                            onClick={() =>
                              void togglePin(row.item.id)
                            }
                            className="text-xs font-semibold text-primary-text hover:underline disabled:opacity-50"
                          >
                            {pinningId === row.item.id
                              ? "Saving…"
                              : row.item.pinned
                                ? "Unpin"
                                : "Pin"}
                          </button>
                        ) : null}
                        {(moderate || !row.item.pinned) ? <button
                          type="button"
                          disabled={deletingId === row.item.id}
                          onClick={() => void remove(row.item.id)}
                          className="text-xs font-semibold text-error hover:underline disabled:opacity-50"
                        >
                          {deletingId === row.item.id ? "Deleting…" : "Delete"}
                        </button> : null}
                      </div>
                    ) : null}
                  </article>
                ),
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {learnerDiscussionMobileJumpVisible(atBottom,unseenCount,messages.length) ? (
          <button type="button" onClick={()=>scrollToBottom()}
            className="absolute bottom-[10.5rem] left-1/2 z-10 min-h-11 -translate-x-1/2 rounded-full border border-border bg-surface px-4 text-xs font-semibold text-primary-text shadow-lg sm:hidden">
            Jump to latest
          </button>
        ) : null}
        {unseenCount > 0 ? (
          <button
            type="button"
            onClick={() => scrollToBottom()}
            className="absolute bottom-[10.5rem] left-1/2 z-10 -translate-x-1/2 rounded-full border border-primary bg-primary px-4 py-2 text-xs font-semibold text-on-primary shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"
          >
            ↓ {unseenCount} new {unseenCount === 1 ? "message" : "messages"}
          </button>
        ) : null}

        {canPost ? (
        <form onSubmit={submit} className="border-t border-border p-4 sm:p-5">
          {loadError && messages.length > 0 ? (
            <p className="mb-3 text-xs font-semibold text-warning">
              Background refresh failed. You can keep reading the messages already loaded.
            </p>
          ) : null}
          <p className="mb-3 text-xs leading-5 text-muted-foreground">
            {moderate
              ? "Post an announcement, answer a learner, or add class context."
              : "Have a doubt about anything in this course? Feel free to ask here."}
          </p>
          {replyTo ? <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface-subtle p-3">
            <p className="min-w-0 break-words text-xs text-body">Replying to: {replyTo.text}</p>
            <button type="button" className="text-xs font-semibold text-primary-text underline"
              onClick={() => setReplyTo(null)}>Cancel reply</button>
          </div> : null}
          <label className="text-xs font-semibold text-body" htmlFor="course-discussion-message">
            Write a message
          </label>
          <textarea
            ref={composerRef}
            id="course-discussion-message"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (shouldSendLearnerDiscussionOnEnter({
                key:event.key,shiftKey:event.shiftKey,
                isComposing:event.nativeEvent.isComposing,
                coarsePointer:window.matchMedia("(pointer: coarse)").matches,
              })) {
                event.preventDefault();
                void submit();
              }
            }}
            rows={3}
            maxLength={4000}
            placeholder="Write a message..."
            className="mt-1.5 w-full resize-y rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-[var(--lms-focus-ring)]"
          />
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-muted-foreground">
              <span className="sm:hidden">Tap Post to send · Enter adds a new line</span>
              <span className="hidden sm:inline">Enter to send · Shift+Enter for a new line</span>
              {" · "}{draft.length}/4000
            </span>
            <Button type="submit" className="min-h-11 w-full sm:w-auto" disabled={!draft.trim() || posting}>
              {posting ? "Posting…" : "Post"}
            </Button>
          </div>
        </form>
        ) : (
          <div className="border-t border-border bg-surface-subtle p-4 text-sm font-semibold text-muted-foreground sm:p-5">
            Past semester · this discussion is read only.
          </div>
        )}
      </section>
    </div>
  );
}
