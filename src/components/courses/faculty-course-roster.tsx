"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";

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
}: {
  learners: readonly FacultyCourseRosterLearner[];
  sectionName: string;
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

  if (learners.length === 0) {
    return (
      <EmptyState
        title="No learners in this Section"
        description="Learners appear here after an active Section enrollment or active elective-group membership grants this exact Course delivery."
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
          title="No matching students"
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
