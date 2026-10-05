"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";

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
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const loadedOnce = useRef(false);

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

  const pinned = useMemo(
    () => messages.find((item) => item.pinned) ?? null,
    [messages],
  );

  async function submit(event: FormEvent) {
    event.preventDefault();
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
      await load(true);
      window.requestAnimationFrame(() =>
        bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
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
          <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-primary-text">
            Pinned
          </p>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {pinned.messageText}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {pinned.senderName} · {formatTime(pinned.createdAt)}
          </p>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="max-h-[34rem] min-h-80 overflow-y-auto p-4 sm:p-5">
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
            <div className="space-y-3" role="log" aria-live="polite" aria-relevant="additions">
              {messages.map((item) => (
                <article
                  key={item.id}
                  className={
                    item.isMine
                      ? "ml-auto max-w-[88%] rounded-xl border border-primary bg-primary-subtle p-4"
                      : "max-w-[88%] rounded-xl border border-border bg-surface-subtle p-4"
                  }
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-sm text-foreground">
                      {item.isMine ? "You" : item.senderName}
                    </strong>
                    {item.senderRole === "FACULTY" ? (
                      <StatusBadge tone="info">Faculty</StatusBadge>
                    ) : null}
                    <span className="text-xs text-muted-foreground">
                      {formatTime(item.createdAt)}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-body">
                    {item.messageText}
                  </p>
                  {item.isMine && canPost ? (
                    <div className="mt-2">
                      <button
                        type="button"
                        disabled={deletingId === item.id}
                        onClick={() => void remove(item.id)}
                        className="text-xs font-semibold text-error hover:underline disabled:opacity-50"
                      >
                        {deletingId === item.id ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  ) : null}
                </article>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {canPost ? (
        <form onSubmit={submit} className="border-t border-border p-4 sm:p-5">
          {loadError && messages.length > 0 ? (
            <p className="mb-3 text-xs font-semibold text-warning">
              Background refresh failed. You can keep reading the messages already loaded.
            </p>
          ) : null}
          <label className="text-xs font-semibold text-body" htmlFor="course-discussion-message">
            Write a message
          </label>
          <textarea
            id="course-discussion-message"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={3}
            maxLength={4000}
            placeholder="Write a message..."
            className="mt-1.5 w-full resize-y rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-[var(--lms-focus-ring)]"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              {draft.length}/4000
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
