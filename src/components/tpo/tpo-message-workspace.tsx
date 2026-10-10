"use client";

import { useCallback, useEffect, useState } from "react";

type ThreadRow = {
  thread: {
    id: string;
    collegeId: string;
    recruiterUserId: string;
    jobId: string | null;
    lastMessageAt: string | null;
    createdAt: string;
  };
  recruiterName: string | null;
  recruiterEmail: string | null;
  jobTitle: string | null;
};

type Message = {
  id: string;
  threadId: string;
  senderType: "TPO" | "HR";
  senderUserId: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

type Phase = "loading" | "ready" | "error" | "migration-pending";

const button =
  "inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-50";
const primary =
  "inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50";

function when(value: string | null) {
  if (!value) return "No messages yet";
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Kolkata",
      }).format(date)
    : "Unknown time";
}

export function TpoMessageWorkspace({
  mode,
  collegeId,
  collegeName,
  initialThreadId = "",
}: {
  mode: "tpo" | "recruiter";
  collegeId: string;
  collegeName: string;
  initialThreadId?: string;
}) {
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [selectedId, setSelectedId] = useState(initialThreadId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [phase, setPhase] = useState<Phase>("loading");
  const [messagePhase, setMessagePhase] = useState<Phase>("ready");
  const [error, setError] = useState("");
  const [messageError, setMessageError] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const base =
    mode === "tpo"
      ? "/api/placements/tpo/messages"
      : "/api/placements/recruiter/messages";

  const loadThreads = useCallback(async (signal?: AbortSignal) => {
    setPhase("loading");
    setError("");
    try {
      const response = await fetch(
        base + "?collegeId=" + encodeURIComponent(collegeId),
        { credentials: "same-origin", cache: "no-store", signal },
      );
      const data = await response.json() as {
        threads?: ThreadRow[];
        error?: string;
      };
      if (!response.ok) {
        if (signal?.aborted) return;
        setPhase(
          response.status === 503 && data.error === "DB09_MIGRATIONS_PENDING"
            ? "migration-pending"
            : "error",
        );
        setError(
          response.status === 503
            ? "Messages are awaiting DB09 database verification."
            : "Messages could not be loaded.",
        );
        return;
      }
      if (signal?.aborted) return;
      const rows = Array.isArray(data.threads) ? data.threads : [];
      setThreads(rows);
      setSelectedId(current =>
        current && rows.some(row => row.thread.id === current)
          ? current
          : initialThreadId &&
              rows.some(row => row.thread.id === initialThreadId)
            ? initialThreadId
            : rows[0]?.thread.id ?? "",
      );
      setPhase("ready");
    } catch {
      if (signal?.aborted) return;
      setPhase("error");
      setError("Messages could not be loaded. Try again.");
    }
  }, [base, collegeId, initialThreadId]);

  const loadMessages = useCallback(async (
    threadId: string,
    signal?: AbortSignal,
  ) => {
    if (!threadId) {
      setMessages([]);
      return;
    }
    setMessagePhase("loading");
    setMessageError("");
    try {
      const response = await fetch(
        "/api/placements/messages/" + encodeURIComponent(threadId),
        { credentials: "same-origin", cache: "no-store", signal },
      );
      const data = await response.json() as {
        messages?: Message[];
        error?: string;
      };
      if (!response.ok) {
        if (signal?.aborted) return;
        setMessagePhase(
          response.status === 503 && data.error === "DB09_MIGRATIONS_PENDING"
            ? "migration-pending"
            : "error",
        );
        setMessageError("Conversation could not be loaded.");
        return;
      }
      if (signal?.aborted) return;
      setMessages(Array.isArray(data.messages) ? data.messages : []);
      setMessagePhase("ready");
    } catch {
      if (signal?.aborted) return;
      setMessagePhase("error");
      setMessageError("Conversation could not be loaded.");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadThreads(controller.signal);
    return () => controller.abort();
  }, [loadThreads]);

  useEffect(() => {
    const controller = new AbortController();
    void loadMessages(selectedId, controller.signal);
    return () => controller.abort();
  }, [selectedId, loadMessages]);

  async function startGeneralThread() {
    setSending(true);
    setMessageError("");
    try {
      const response = await fetch(base, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collegeId }),
      });
      const data = await response.json() as {
        thread?: ThreadRow["thread"];
        error?: string;
      };
      if (!response.ok || !data.thread) {
        throw new Error("Could not start conversation.");
      }
      await loadThreads();
      setSelectedId(data.thread.id);
    } catch (cause) {
      setMessageError(
        cause instanceof Error ? cause.message : "Could not start conversation.",
      );
    } finally {
      setSending(false);
    }
  }

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!selectedId || !body) return;
    setSending(true);
    setMessageError("");
    try {
      const response = await fetch(
        "/api/placements/messages/" + encodeURIComponent(selectedId),
        {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body }),
        },
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({})) as {
          error?: string;
        };
        throw new Error(
          data.error === "DB09_MIGRATIONS_PENDING"
            ? "Messages are awaiting DB09 database verification."
            : "Message could not be sent.",
        );
      }
      setDraft("");
      await Promise.all([
        loadMessages(selectedId),
        loadThreads(),
      ]);
    } catch (cause) {
      setMessageError(
        cause instanceof Error ? cause.message : "Message could not be sent.",
      );
    } finally {
      setSending(false);
    }
  }

  const selected =
    threads.find(row => row.thread.id === selectedId) ?? null;

  return (
    <section className="space-y-4" aria-label="Placement messages">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Messages</h1>
        <p className="text-sm text-muted-foreground">
          {mode === "tpo"
            ? "Private conversations with recruiters for " + collegeName + "."
            : "Private conversations with " + collegeName + "'s placement cell."}
        </p>
      </header>

      {phase !== "ready" ? (
        <div
          role={phase === "loading" ? "status" : "alert"}
          className="rounded-lg border border-border bg-surface p-5"
        >
          {phase === "loading" ? "Loading conversations…" : error}
          {phase === "error" ? (
            <button className={button + " ml-3"} onClick={() => void loadThreads()}>
              Retry
            </button>
          ) : null}
        </div>
      ) : (
        <div className="grid min-h-[520px] overflow-hidden rounded-xl border border-border bg-surface lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="border-b border-border lg:border-b-0 lg:border-r">
            <div className="border-b border-border p-3">
              <p className="text-sm font-semibold">Conversations</p>
              {mode === "recruiter" ? (
                <button
                  className={button + " mt-2 w-full"}
                  disabled={sending}
                  onClick={() => void startGeneralThread()}
                >
                  Start general conversation
                </button>
              ) : null}
            </div>
            {threads.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                {mode === "tpo"
                  ? "No recruiter conversations yet. Start one from a joined recruiter record."
                  : "No conversations yet."}
              </p>
            ) : (
              <div className="max-h-[500px] overflow-y-auto">
                {threads.map(row => (
                  <button
                    type="button"
                    key={row.thread.id}
                    onClick={() => setSelectedId(row.thread.id)}
                    className={
                      "block w-full border-b border-border p-3 text-left hover:bg-surface-secondary " +
                      (selectedId === row.thread.id ? "bg-primary-subtle" : "")
                    }
                  >
                    <span className="block font-medium">
                      {mode === "tpo"
                        ? row.recruiterName || row.recruiterEmail || "Recruiter"
                        : row.jobTitle || "Placement cell"}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {row.jobTitle || "General"} · {when(row.thread.lastMessageAt)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </aside>

          <div className="flex min-h-[420px] flex-col">
            {!selected ? (
              <div className="m-auto p-6 text-center text-sm text-muted-foreground">
                Select a conversation to view messages.
              </div>
            ) : (
              <>
                <div className="border-b border-border p-4">
                  <h2 className="font-semibold">
                    {mode === "tpo"
                      ? selected.recruiterName || selected.recruiterEmail || "Recruiter"
                      : selected.jobTitle || collegeName + " placement cell"}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {selected.jobTitle || "General conversation"}
                  </p>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto p-4">
                  {messagePhase === "loading" ? (
                    <p role="status" className="text-sm text-muted-foreground">
                      Loading messages…
                    </p>
                  ) : messagePhase !== "ready" ? (
                    <p role="alert" className="text-sm text-destructive">
                      {messageError}
                    </p>
                  ) : messages.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No messages yet. Start the conversation below.
                    </p>
                  ) : (
                    messages.map(message => {
                      const mine =
                        (mode === "tpo" && message.senderType === "TPO") ||
                        (mode === "recruiter" && message.senderType === "HR");
                      return (
                        <div
                          key={message.id}
                          className={
                            "max-w-[85%] rounded-lg border border-border p-3 " +
                            (mine ? "ml-auto bg-primary-subtle" : "bg-surface-secondary")
                          }
                        >
                          <p className="whitespace-pre-wrap text-sm">{message.body}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {when(message.createdAt)}
                            {mine && message.readAt ? " · Read" : ""}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>

                <form className="border-t border-border p-4" onSubmit={event => void send(event)}>
                  <label className="block text-sm font-medium">
                    Message
                    <textarea
                      className="mt-1 min-h-24 w-full rounded-md border border-border bg-surface p-3 text-sm"
                      maxLength={4000}
                      value={draft}
                      onChange={event => setDraft(event.target.value)}
                      placeholder="Write a message"
                    />
                  </label>
                  {messageError ? (
                    <p role="alert" className="mt-2 text-sm text-destructive">{messageError}</p>
                  ) : null}
                  <div className="mt-2 flex justify-end">
                    <button className={primary} disabled={sending || !draft.trim()}>
                      {sending ? "Sending…" : "Send"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
