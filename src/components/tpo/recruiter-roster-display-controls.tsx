"use client";

import { Dropdown } from "@/components/ui/dropdown";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { ENGAGE_COLUMNS, type EngageColumn, type EngageSort } from "@/modules/placements/tpo-recruiter-table-view-model";

export function RecruiterRosterDisplayControls({
  columns, onColumns, sort, onSort, ascending, onAscending, showColumns = true,
}: {
  columns: readonly EngageColumn[];
  onColumns: (value: EngageColumn[]) => void;
  sort: EngageSort;
  onSort: (value: EngageSort) => void;
  ascending: boolean;
  onAscending: (value: boolean) => void;
  showColumns?: boolean;
}) {
  return (
    <section
      aria-label="Recruiter table display"
      className="grid min-w-0 grid-cols-1 items-end gap-3 border-b border-border py-3 sm:grid-cols-[minmax(0,15rem)_auto_auto] sm:justify-start"
    >
      <label className="block min-w-0 text-sm font-semibold text-body">
        Sort by
        <Select
          className="mt-1 block min-h-11 w-full min-w-0 md:min-h-9"
          value={sort}
          onChange={event => onSort(event.target.value as EngageSort)}
        >
          <option value="LAST_ACTIVITY">Last activity</option>
          <option value="NEXT_FOLLOWUP">Next follow-up</option>
          <option value="ADDED">Added</option>
          <option value="NAME">Name</option>
          <option value="DRIVES">Company drives</option>
        </Select>
      </label>

      <label className="flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-[var(--lms-control-radius)] px-2 text-sm font-medium text-body hover:bg-primary-subtle sm:w-auto md:min-h-9">
        <Checkbox checked={ascending} onChange={event => onAscending(event.target.checked)} />
        Ascending
      </label>

      {showColumns ? (
        <Dropdown
          align="end"
          mobileSheet
          label="Roster columns"
          trigger="Columns"
          className="w-full sm:w-auto"
          triggerClassName="w-full justify-center sm:w-auto"
        >
          <div className="min-w-0 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-foreground">Columns</p>
              <Button
                variant="secondary"
                type="button"
                size="sm"
                className="min-h-11 md:min-h-9"
                onClick={event => {
                  const details = event.currentTarget.closest("details");
                  details?.removeAttribute("open");
                  details?.querySelector("summary")?.focus();
                }}
              >
                Done
              </Button>
            </div>
            <div
              role="group"
              aria-label="Visible recruiter roster columns"
              className="max-h-[min(50dvh,24rem)] min-w-0 space-y-1 overflow-y-auto overscroll-contain"
            >
              {ENGAGE_COLUMNS.map(column => (
                <label
                  key={column}
                  className={"flex min-h-11 min-w-0 items-center gap-3 rounded-[var(--lms-control-radius)] px-2 py-2 text-sm transition-colors motion-reduce:transition-none " +
                    (column === "Contact" ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-primary-subtle")}
                >
                  <Checkbox
                    checked={columns.includes(column)}
                    disabled={column === "Contact"}
                    onChange={event => onColumns(event.target.checked
                      ? ENGAGE_COLUMNS.filter(value => value === column || columns.includes(value))
                      : columns.filter(value => value !== column))}
                  />
                  <span className="min-w-0 break-words">{column}</span>
                </label>
              ))}
            </div>
          </div>
        </Dropdown>
      ) : null}
    </section>
  );
}
