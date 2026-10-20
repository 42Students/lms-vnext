"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";

type AttendanceStatus =
  | "WAITING"
  | "PRESENT"
  | "IN_INTERVIEW"
  | "DONE"
  | "ABSENT";

type Student = {
  applicationId: string;
  displayName: string;
  rollNumber: string | null;
  roleTitle: string;
  attendance: AttendanceStatus;
  room: string | null;
};

const inputClass = "min-h-11 md:min-h-9";

export function DriveDayRoster({
  round,
  students,
}: {
  round: {
    id: string;
    name: string;
    status: string;
    scheduledAt: string | null;
    timezone: string | null;
    venue: string | null;
    company: string;
    jobTitle: string;
  };
  students: Student[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [query, setQuery] = useState("");
  const [pendingId, setPendingId] =
    useState<string | null>(null);

  useEffect(() => {
    const timer = window.setInterval(
      () => router.refresh(),
      20_000,
    );
    return () =>
      window.clearInterval(timer);
  }, [router]);

  const rows = useMemo(() => {
    const needle = query
      .trim()
      .toLowerCase();
    if (!needle) return students;
    return students.filter((student) =>
      [
        student.displayName,
        student.rollNumber ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [query, students]);

  const counts = useMemo(
    () => ({
      total: students.length,
      present: students.filter((student) =>
        [
          "PRESENT",
          "IN_INTERVIEW",
          "DONE",
        ].includes(student.attendance),
      ).length,
      absent: students.filter(
        (student) =>
          student.attendance === "ABSENT",
      ).length,
      waiting: students.filter(
        (student) =>
          student.attendance === "WAITING",
      ).length,
    }),
    [students],
  );

  async function mark(
    student: Student,
    status: "PRESENT" | "ABSENT",
  ) {
    setPendingId(student.applicationId);
    try {
      const response = await fetch(
        `/api/placements/drive-day/${round.id}/attendance`,
        {
          method: "POST",
          headers: {
            "content-type":
              "application/json",
          },
          body: JSON.stringify({
            applicationId:
              student.applicationId,
            status,
            room: student.room,
          }),
        },
      );
      const payload = (await response
        .json()
        .catch(() => null)) as
        | { error?: string }
        | null;
      if (!response.ok) {
        throw new Error(
          payload?.error ??
            "Attendance could not be saved",
        );
      }
      showToast({
        tone: "success",
        title:
          status === "PRESENT"
            ? "Marked present"
            : "Marked absent",
        description:
          student.displayName +
          " was updated for this round.",
      });
      router.refresh();
    } catch (error) {
      showToast({
        tone: "error",
        title:
          "Attendance could not be saved",
        description:
          error instanceof Error
            ? error.message
            : "Please try again.",
      });
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="min-w-0 space-y-4 md:space-y-6">
      <PageHeader
        eyebrow="Drive day"
        title={
          round.company +
          " · " +
          round.name
        }
        description={
          round.jobTitle +
          (round.venue
            ? " · " + round.venue
            : "")
        }
        actions={
          <Link
            href="/tpo/drive-day"
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-foreground transition hover:bg-muted md:min-h-9"
          >
            Back
          </Link>
        }
      />

      <section className="grid overflow-hidden rounded-[var(--lms-canvas-radius)] border border-border md:grid-cols-2 xl:grid-cols-4">
        {[
          ["On roster", counts.total],
          ["Checked in", counts.present],
          ["Not here yet", counts.waiting],
          ["Absent", counts.absent],
        ].map(([label, value], index) => (
          <div
            key={String(label)}
            className={"min-w-0 p-3 sm:p-4 " +
              (index < 3 ? "border-b border-border " : "") +
              (index === 2 ? "md:border-b-0 " : "") +
              (index % 2 === 0 ? "md:border-r md:border-border " : "") +
              (index < 2 ? "xl:border-b-0 " : "") +
              (index < 3 ? "xl:border-r xl:border-border " : "xl:border-r-0 ")}
          >
            <p className="m-0 text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              {label}
            </p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {value}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface">
        <div className="border-b border-border p-4">
          <Input
            className={inputClass}
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            placeholder="Search by roll number or name"
            aria-label="Search drive-day roster"
          />
        </div>

        {rows.length === 0 ? (
          <div className="flex min-w-0 flex-col items-start gap-3 p-4 sm:p-6">
            <p className="m-0 text-sm text-muted-foreground">{students.length === 0 ? "No students are assigned to this round yet." : "No student matches your search."}</p>
            {query.trim() ? <Button type="button" variant="secondary" className="min-h-11 md:min-h-9" onClick={() => setQuery("")}>Clear search</Button> : null}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {rows.map((student) => (
              <article
                key={student.applicationId}
                className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="m-0 font-semibold text-foreground">
                      {student.displayName}
                    </p>
                    <StatusBadge
                      tone={
                        student.attendance ===
                        "PRESENT"
                          ? "success"
                          : student.attendance ===
                              "ABSENT"
                            ? "error"
                            : "neutral"
                      }
                    >
                      {student.attendance}
                    </StatusBadge>
                  </div>
                  <p className="mt-1 text-sm text-body">
                    {student.rollNumber ??
                      "No roll number"}{" "}
                    · {student.roleTitle}
                  </p>
                </div>

                <div className="grid min-w-0 grid-cols-2 gap-2 md:flex md:flex-wrap">
                  <Button
                    size="sm"
                    className="w-full min-w-0 md:w-auto"
                    disabled={
                      pendingId !== null ||
                      student.attendance ===
                        "PRESENT"
                    }
                    onClick={() =>
                      mark(
                        student,
                        "PRESENT",
                      )
                    }
                  >
                    Present
                  </Button>
                  <Button
                    size="sm"
                    className="w-full min-w-0 md:w-auto"
                    variant="danger"
                    disabled={
                      pendingId !== null ||
                      student.attendance ===
                        "ABSENT"
                    }
                    onClick={() =>
                      mark(student, "ABSENT")
                    }
                  >
                    Absent
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <p className="text-xs leading-5 text-muted-foreground">
        Student coordinators can only mark
        Present or Absent. Candidate phone
        numbers and result controls are not
        exposed in this workspace.
      </p>
    </div>
  );
}
