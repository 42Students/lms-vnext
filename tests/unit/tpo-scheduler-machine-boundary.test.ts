import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const jobs = vi.hoisted(() => ({ execute: vi.fn(), deliver: vi.fn(), escalate: vi.fn() }));
vi.mock("@/modules/operations/scheduled-job-runner", () => ({
  executeScheduledJobWithLease: jobs.execute,
}));
vi.mock("@/modules/operations/postgres-scheduled-job-lease-store", () => ({
  postgresScheduledJobLeaseStore: {},
}));
vi.mock("@/modules/operations/tpo-scheduled-job-registry", () => ({
  TPO_SCHEDULED_JOBS: { "tpo.escalateWithdrawals": { leaseMs: 60000 } },
}));
vi.mock("@/modules/announcements/tpo-notice-delivery-service", () => ({
  deliverDueTpoNotices: jobs.deliver,
}));
vi.mock("@/modules/placements/tpo-withdrawal-escalation-service", () => ({
  escalatePendingWithdrawalRequests: jobs.escalate,
}));

import { POST as deliverNotices } from "@/app/api/internal/placements/tpo/notices/deliver/route";
import { POST as escalateWithdrawals } from "@/app/api/internal/placements/tpo/withdrawal-escalations/run/route";

const previous = process.env["TPO_NOTICE_SCHEDULER_SECRET"];
const secret = "separate-tpo-scheduler-machine-secret-32bytes";
const endpoints = [
  { name: "due notices", post: deliverNotices, jobName: "tpo.deliverDueNotices" },
  { name: "withdrawal escalations", post: escalateWithdrawals, jobName: "tpo.escalateWithdrawals" },
] as const;

function request(path: string, options: {
  key?: string;
  origin?: string;
  body?: string;
  contentLength?: string;
} = {}) {
  const headers = new Headers();
  if (options.key !== undefined) headers.set("x-tpo-scheduler-key", options.key);
  if (options.origin !== undefined) headers.set("origin", options.origin);
  if (options.contentLength !== undefined) headers.set("content-length", options.contentLength);
  return new Request("https://lms.example" + path, {
    method: "POST",
    headers,
    ...(options.body === undefined ? {} : { body: options.body }),
  });
}
const base = "/api/internal/placements/tpo/notices/deliver";

describe.each(endpoints)("$name worker boundary", ({ post, jobName }) => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env["TPO_NOTICE_SCHEDULER_SECRET"] = secret;
    jobs.execute.mockResolvedValue({ ran: false, reason: "ALREADY_RUNNING" });
  });
  afterEach(() => {
    if (previous === undefined) delete process.env["TPO_NOTICE_SCHEDULER_SECRET"];
    else process.env["TPO_NOTICE_SCHEDULER_SECRET"] = previous;
  });

  it("denies absent and mismatched keys without dispatching work", async () => {
    for (const key of [undefined, "", "wrong", secret + "extra"]) {
      const response = await post(request(base, { key }));
      expect(response.status).toBe(403);
      expect(response.headers.get("cache-control")).toBe("no-store");
    }
    expect(jobs.execute).not.toHaveBeenCalled();
  });

  it("denies even a matching short deployment credential", async () => {
    process.env["TPO_NOTICE_SCHEDULER_SECRET"] = "short";
    const response = await post(request(base, { key: "short" }));
    expect(response.status).toBe(403);
    expect(jobs.execute).not.toHaveBeenCalled();
  });

  it("denies a browser Origin with a correctly signed internal call", async () => {
    const response = await post(request(base, { key: secret, origin: "https://lms.example" }));
    expect(response.status).toBe(403);
    expect(jobs.execute).not.toHaveBeenCalled();
  });

  it("does not accept user-selected job parameters", async () => {
    const response = await post(request(base + "?targetTenant=foreign", { key: secret }));
    expect(response.status).toBe(400);
    expect(jobs.execute).not.toHaveBeenCalled();
  });

  it("rejects any body, even if the declared length is zero", async () => {
    const response = await post(request(base, {
      key: secret, body: '{"forced":true}', contentLength: "0",
    }));
    expect(response.status).toBe(400);
    expect(jobs.execute).not.toHaveBeenCalled();
  });

  it("permits only the predetermined fenced job for a valid empty machine POST", async () => {
    const response = await post(request(base, { key: secret }));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(jobs.execute).toHaveBeenCalledTimes(1);
    expect(jobs.execute.mock.calls[0]?.[1]).toMatchObject({ jobName });
    expect(jobs.deliver).not.toHaveBeenCalled();
    expect(jobs.escalate).not.toHaveBeenCalled();
  });
});
