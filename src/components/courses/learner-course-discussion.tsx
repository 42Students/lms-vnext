"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  buildDiscussionFeed,
  countNewDiscussionMessages,
} from "./learner-course-discussion-model";

type DiscussionMessage = {
  id: string;
  senderMembershipId: string;
  senderRole: string;
  senderName: string;
  messageText: string;
  pinned: boolean;
  createdAt: string;
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
}: {
  deliveryId: string;
}) {
  const [messages, setMessages] = useState<DiscussionMessage[]>([]);
  const [canPost, setCanPost] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [unseenCount, setUnseenCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const loadedOnce = useRef(false);
  const previousMessages = useRef<DiscussionMessage[]>([]);
  const forceBottomOnNextLoad = useRef(false);

  const load = useCallback(async (silent = false) => {
    if (!silent && !loadedOnce.current) setLoading(true);
    try {
      const response = await fetch(
        `/api/courses/deliveries/${encodeURIComponent(deliveryId)}/discussions`,
        { cache: "no-store" },
      );
      if (!response.ok) throw new Error("discussion_load_failed");
      const payload = await response.json();
      setMessages(Array.isArray(payload.messages) ? payload.messages : []);
      setCanPost(payload.canPost !== false);
      setLoadError(false);
      loadedOnce.current = true;
    } catch {
      setLoadError(true);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [deliveryId]);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void load(true);
      }
    }, 15000);
    return () => window.clearInterval(interval);
  }, [load]);

  const pinnedMessages = useMemo(
    () => messages.filter((item) => item.pinned),
    [messages],
  );
  const pinned = pinnedMessages[0] ?? null;
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

    if (firstLoadedFeed) {
      window.requestAnimationFrame(() =>
        scrollToBottom("auto"),
      );
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
          body: JSON.stringify({ messageText }),
        },
      );
      if (!response.ok) throw new Error("discussion_post_failed");
      setDraft("");
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
    if (!window.confirm("Delete this message? This cannot be undone.")) return;
    setDeletingId(messageId);
    try {
      const response = await fetch(
        `/api/courses/deliveries/${encodeURIComponent(deliveryId)}/discussions/${encodeURIComponent(messageId)}`,
        { method: "DELETE" },
      );
      if (!response.ok) throw new Error("discussion_delete_failed");
      setMessages((current) => current.filter((item) => item.id !== messageId));
    } catch {
      setLoadError(true);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="sr-only">Discussions</h2>
        <p className="m-0 text-sm text-body">
          Ask questions, share context, and keep course conversations visible to your class and faculty.
        </p>
      </div>

      {pinned ? (
        <section className="rounded-xl border border-primary bg-primary-subtle p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-primary-text">
              Pinned
            </p>
            {pinnedMessages.length > 1 ? (
              <span className="text-xs font-semibold text-muted-foreground">
                1 of {pinnedMessages.length} pinned messages
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {pinned.messageText}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {pinned.senderName} · {formatTime(pinned.createdAt)}
          </p>
        </section>
      ) : null}

      <section className="relative overflow-hidden rounded-xl border border-border bg-surface">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="max-h-[34rem] min-h-80 overflow-y-auto p-4 sm:p-5"
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
            <EmptyState
              title="No messages yet"
              description="Ask the first question — your classmates and faculty will see it here."
            />
          ) : (
            <div className="space-y-2" role="log" aria-live="polite" aria-relevant="additions">
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
                        ? `ml-auto max-w-[88%] rounded-xl border border-primary bg-primary-subtle ${row.grouped ? "px-4 py-2" : "p-4"}`
                        : `max-w-[88%] rounded-xl border border-border bg-surface-subtle ${row.grouped ? "px-4 py-2" : "p-4"}`
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
                    {row.item.isMine && canPost ? (
                      <div className="mt-2">
                        <button
                          type="button"
                          disabled={deletingId === row.item.id}
                          onClick={() => void remove(row.item.id)}
                          className="text-xs font-semibold text-error hover:underline disabled:opacity-50"
                        >
                          {deletingId === row.item.id ? "Deleting…" : "Delete"}
                        </button>
                      </div>
                    ) : null}
                  </article>
                ),
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

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
            Have a doubt about anything in this course? Feel free to ask here.
          </p>
          <label className="text-xs font-semibold text-body" htmlFor="course-discussion-message">
            Write a message
          </label>
          <textarea
            ref={composerRef}
            id="course-discussion-message"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                void submit();
              }
            }}
            rows={3}
            maxLength={4000}
            placeholder="Write a message..."
            className="mt-1.5 w-full resize-y rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-[var(--lms-focus-ring)]"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              Enter to send · Shift+Enter for a new line · {draft.length}/4000
            </span>
            <Button type="submit" disabled={!draft.trim() || posting}>
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
