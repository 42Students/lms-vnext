"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-fetch";
import { SearchIcon } from "./icons";
import { Button } from "@/components/ui/button";
import style from "./topbar.module.css";
import { safeTpoFindResult, type TpoFindResult } from "./tpo-find-model";

export function TpoFindSuggestions({
  query, onOpen,
}: {
  query: string;
  onOpen: (href: string) => void;
}) {
  const [retryToken, setRetryToken] = useState(0);
  const [state, setState] = useState<{
    forQuery: string; results: TpoFindResult[]; loading: boolean; error: string | null;
  }>({ forQuery: "", results: [], loading: false, error: null });
  const needle = query.trim().slice(0, 100);

  useEffect(() => {
    if (needle.length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void apiFetch<unknown>(
        "/api/tpo/find-suggestions?q=" + encodeURIComponent(needle),
        { signal: controller.signal, cache: "no-store", timeoutMs: 12000 },
      ).then(payload => {
        if (controller.signal.aborted) return;
        if (!payload || typeof payload !== "object" ||
          !("results" in payload) || !Array.isArray(payload.results))
          throw new Error("Invalid find suggestions");
        setState({ forQuery: needle,
          results: payload.results.filter(safeTpoFindResult).slice(0, 12),
          loading: false, error: null });
      }).catch(() => {
        if (!controller.signal.aborted)
          setState({ forQuery: needle, results: [], loading: false,
            error: "Search could not be loaded. Try again." });
      });
    }, 200);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [needle, retryToken]);

  if (needle.length < 2) return null;
  const ready = state.forQuery === needle && !state.loading;
  return <section aria-label="Matching TPO records" className="min-w-0 max-w-full border-t border-[var(--lms-canvas-border)]">
    <p className="px-2 pt-2 text-[length:var(--lms-topbar-caption-size,11px)] font-semibold uppercase tracking-wide text-muted-foreground">Matching records</p>
    {!ready ? <p role="status" className="min-w-0 break-words p-2 text-xs text-muted-foreground">Searching…</p> : null}
    {ready && state.error ? <div className="flex min-w-0 flex-wrap items-center gap-[var(--lms-space-2)] p-2">
      <p role="alert" className="min-w-0 flex-1 break-words text-xs text-error">{state.error}</p>
      <Button type="button" variant="ghost" size="sm" className="shrink-0 text-primary-text underline"
        onClick={() => setRetryToken(value => value + 1)}>Retry</Button>
    </div> : null}
    {ready && !state.error && state.results.map(result =>
      <Button type="button" variant="ghost" role="option" aria-selected={false} aria-label={result.label+" — "+result.group}
        data-tpo-result="" key={result.href} className={style["suggestion"]+" min-w-0 max-w-full"}
        onClick={() => onOpen(result.href)}>
        <SearchIcon/>
        <span className="min-w-0 flex-1 truncate">{result.label}</span>
        <span className="max-w-[36%] shrink-0 truncate text-[length:var(--lms-topbar-caption-size,11px)] text-muted-foreground">{result.group}</span>
      </Button>
    )}
    {ready && !state.error && state.results.length === 0
      ? <p role="status" className="min-w-0 break-words p-2 text-xs text-muted-foreground">No matching records.</p> : null}
  </section>;
}
