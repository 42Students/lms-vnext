"use client";

import { useEffect, useRef, useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

/** Promise-backed shared confirmation. Caller awaits safely in async event handlers. */
export function useConfirmFlow() {
  const [message, setMessage] = useState<string | null>(null);
  const resolver = useRef<((answer: boolean) => void) | null>(null);
  useEffect(() => () => { resolver.current?.(false); resolver.current = null; }, []);
  function askConfirm(prompt: string): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      resolver.current?.(false);
      resolver.current = resolve;
      setMessage(prompt);
    });
  }
  function finish(approved: boolean) {
    const resolve = resolver.current;
    resolver.current = null;
    setMessage(null);
    resolve?.(approved);
  }
  const dialog = <ConfirmDialog open={message !== null} title={message ?? ""}
    onOpenChange={open => { if (!open) finish(false); }}
    confirmLabel="Confirm" onConfirm={() => finish(true)} />;
  return { askConfirm, dialog };
}
