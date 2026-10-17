"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { facultyRosterCsv, facultyRosterFileName } from "@/modules/courses/faculty-roster-export";

export type FacultyCourseRosterLearner = {
  membershipId: string;
  displayName: string | null;
  email: string | null;
  phoneE164: string | null;
  rollNumber: string | null;
};

const PAGE_SIZE = 25;

function nameOf(learner: FacultyCourseRosterLearner) {
  return (
    learner.displayName?.trim() ||
    learner.email?.trim() ||
    `Learner ${learner.membershipId.slice(0, 8)}`
  );
}

function initials(value: string) {
  const parts = value
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return (
    (parts.length > 1
      ? `${parts[0]![0]}${parts.at(-1)![0]}`
      : parts[0]?.slice(0, 2)) || "L"
  ).toUpperCase();
}

export function FacultyCourseRoster({
  learners,
  sectionName,
  deliveryId,
}: {
  learners: readonly FacultyCourseRosterLearner[];
  sectionName: string;
  deliveryId?: string;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const sorted = useMemo(
    () =>
      [...learners].sort(
        (a, b) =>
          String(a.rollNumber ?? "").localeCompare(
            String(b.rollNumber ?? ""),
            undefined,
            { numeric: true },
          ) ||
          nameOf(a).localeCompare(nameOf(b)),
      ),
    [learners],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return sorted;
    return sorted.filter((learner) =>
      [
        nameOf(learner),
        learner.rollNumber,
        learner.email,
        learner.phoneE164,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [search, sorted]);

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / PAGE_SIZE),
  );
  const currentPage = Math.min(page, totalPages);
  const rows = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const missingRoll = learners.filter(
    (learner) => !learner.rollNumber,
  ).length;
  const contacts = learners.filter(
    (learner) =>
      Boolean(learner.email || learner.phoneE164),
  ).length;

  // Faculty exports exclude phone/email and cap the already authorized roster.
  function exportFiltered() {
    // CSV contains exactly the active Section roster already authorized for
    // this Faculty view; filtering does not widen the permission boundary.
    const csv = facultyRosterCsv(filtered);
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8",
    }));
    const link = document.createElement("a");
    link.href = url;
    link.download = facultyRosterFileName(sectionName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }

  if (learners.length === 0) {
    return (
      <EmptyState
        title="No students yet"
        description="Students will appear here once they are enrolled in this class."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Students", learners.length],
          ["Roll missing", missingRoll],
          ["Contact available", contacts],
        ].map(([label, value]) => (
          <section
            key={label}
            className="rounded-xl border border-border bg-surface p-4"
          >
            <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {value}
            </p>
          </section>
        ))}
      </div>

      <section className="rounded-xl border border-border bg-surface p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-primary-text">
              Class list
            </p>
            <h2 className="mt-1 text-lg font-semibold text-foreground">
              {sectionName}
            </h2>
          </div>
          <div className="flex w-full flex-wrap items-end gap-3 lg:w-auto">
          <Button
            type="button"
            variant="secondary"
            disabled={filtered.length === 0}
            onClick={exportFiltered}
            aria-label="Download roster CSV"
          >
            Download roster CSV (names and roll numbers)
          </Button>
          <label className="w-full max-w-md text-xs font-semibold text-body">
            Search students
            <Input
              className="mt-1.5"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Name, roll number, phone or email"
              aria-label="Search students"
            />
          </label>
          </div>
        </div>
        {search.trim() ? (
          <p
            className="mt-3 text-xs text-muted-foreground"
            aria-live="polite"
          >
            Showing {filtered.length} of {learners.length}
          </p>
        ) : null}
      </section>

      {filtered.length === 0 ? (
        <EmptyState
          title="No students match this search"
          description="Try another name, roll number, phone number or email."
        />
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-xl border border-border bg-surface md:block">
            <table className="w-full min-w-[48rem] border-collapse text-left text-sm">
              <thead className="bg-surface-subtle text-xs uppercase tracking-[0.06em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">
                    Student
                  </th>
                  <th className="px-4 py-3">
                    Phone
                  </th>
                  <th className="px-4 py-3">
                    Email
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((learner) => {
                  const name = nameOf(learner);
                  return (
                    <tr key={learner.membershipId}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span
                            aria-hidden="true"
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-xs font-bold text-primary-text"
                          >
                            {initials(name)}
                          </span>
                          <div>
                            <p className="m-0 font-semibold text-foreground">
                              {name}
                            </p>
                            {deliveryId ? (
                              <Link
                                href={"/teacher/courses/" + encodeURIComponent(deliveryId) +
                                  "/students/" + encodeURIComponent(learner.membershipId)}
                                className="mt-1 inline-flex text-xs font-semibold text-primary-text hover:underline"
                              >
                                View student details →
                              </Link>
                            ) : null}
                            <p className="mt-1 text-xs text-muted-foreground">
                              {learner.rollNumber
                                ? `Roll ${learner.rollNumber}`
                                : "Roll not assigned"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {learner.phoneE164 ? (
                          <a
                            href={`tel:${learner.phoneE164}`}
                            className="font-semibold text-primary-text hover:underline"
                            aria-label={`Call ${name}`}
                          >
                            {learner.phoneE164}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">
                            No number
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {learner.email ? (
                          <a
                            href={`mailto:${learner.email}`}
                            className="font-semibold text-primary-text hover:underline"
                            aria-label={`Email ${name}`}
                          >
                            {learner.email}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">
                            No email
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {rows.map((learner) => {
              const name = nameOf(learner);
              return (
                <article
                  key={learner.membershipId}
                  className="rounded-xl border border-border bg-surface p-4"
                >
                  <div className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-xs font-bold text-primary-text"
                    >
                      {initials(name)}
                    </span>
                    <div className="min-w-0">
                      <p className="m-0 font-semibold text-foreground">
                        {name}
                      </p>
                      <StatusBadge
                        className="mt-2"
                        tone={
                          learner.rollNumber
                            ? "info"
                            : "warning"
                        }
                      >
                        {learner.rollNumber
                          ? `Roll ${learner.rollNumber}`
                          : "Roll not assigned"}
                      </StatusBadge>
                    </div>
                  </div>
                  {deliveryId ? (
                    <Link
                      href={"/teacher/courses/" + encodeURIComponent(deliveryId) +
                        "/students/" + encodeURIComponent(learner.membershipId)}
                      className="mt-3 inline-flex min-h-9 items-center text-sm font-semibold text-primary-text hover:underline"
                    >
                      View student details →
                    </Link>
                  ) : null}
                  <div className="mt-4 grid gap-2 text-sm">
                    {learner.phoneE164 ? (
                      <a
                        href={`tel:${learner.phoneE164}`}
                        className="font-semibold text-primary-text"
                      >
                        {learner.phoneE164}
                      </a>
                    ) : null}
                    {learner.email ? (
                      <a
                        href={`mailto:${learner.email}`}
                        className="break-all font-semibold text-primary-text"
                      >
                        {learner.email}
                      </a>
                    ) : null}
                    {!learner.phoneE164 &&
                    !learner.email ? (
                      <span className="text-muted-foreground">
                        Contact details unavailable
                      </span>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>

          {totalPages > 1 ? (
            <nav
              aria-label="Student roster pages"
              className="flex items-center justify-between gap-3"
            >
              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage === 1}
                onClick={() =>
                  setPage((value) =>
                    Math.max(1, value - 1),
                  )
                }
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={
                  currentPage === totalPages
                }
                onClick={() =>
                  setPage((value) =>
                    Math.min(
                      totalPages,
                      value + 1,
                    ),
                  )
                }
              >
                Next
              </Button>
            </nav>
          ) : null}
        </>
      )}
    </div>
  );
}
