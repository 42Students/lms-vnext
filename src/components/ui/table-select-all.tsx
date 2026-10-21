"use client";

import { useEffect, useRef } from "react";

/** Header control for the one rendered, current-page selection column.
 * Only enabled checkboxes inside this table are changed, never across pages. */
export function TableSelectAll({ fieldName }: { fieldName: string }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const root = ref.current?.closest('[data-slot="data-table"]');
    if (!root) return;
    const rows = () => Array.from(root.querySelectorAll<HTMLInputElement>(
      'input[data-table-selection="row"]',
    )).filter(input => input.name === fieldName && !input.disabled);
    const refresh = () => {
      if (!ref.current) return;
      const eligible = rows();
      const selected = eligible.filter(input => input.checked).length;
      ref.current.checked = eligible.length > 0 && selected === eligible.length;
      ref.current.indeterminate = selected > 0 && selected < eligible.length;
      ref.current.disabled = eligible.length === 0;
    };
    const onChange = () => refresh();
    root.addEventListener("change", onChange);
    refresh();
    return () => root.removeEventListener("change", onChange);
  }, [fieldName]);

  return <input ref={ref} type="checkbox" aria-label="Select all records on this page"
    className="size-4 accent-[var(--lms-primary)] disabled:opacity-50"
    onChange={() => {
      const root = ref.current?.closest('[data-slot="data-table"]');
      if (!root) return;
      const checked = ref.current?.checked === true;
      root.querySelectorAll<HTMLInputElement>('input[data-table-selection="row"]').forEach(input => {
        if (input.name === fieldName && !input.disabled) input.checked = checked;
      });
      if (ref.current) ref.current.indeterminate = false;
    }} />;
}
