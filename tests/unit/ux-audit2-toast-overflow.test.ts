import { describe, expect, it } from "vitest";
import { enqueueToast, clearEvictedToastTimers, type ToastItem } from "@/components/ui/toast";

const entry = (index: number, tone: "error" | "info" | "success"): ToastItem => ({
  id: "notice-"+index, tone, title: "Notice "+index,
});
describe("RV-02 A2-14 persistent toast retention", () => {
  it("retains all five undismissed errors even with a timed informational overflow", () => {
    let queue: ToastItem[] = [];
    for(let i=1;i<=5;i++) queue=enqueueToast(queue,entry(i,"error")).items;
    for(let i=6;i<=11;i++) queue=enqueueToast(queue,entry(i,"info")).items;
    expect(queue.filter(item=>item.tone==="error").map(item=>item.id)).toEqual([
      "notice-1","notice-2","notice-3","notice-4","notice-5",
    ]);
    expect(queue.filter(item=>item.tone!=="error").map(item=>item.id)).toEqual([
      "notice-9","notice-10","notice-11",
    ]);
  });
  it("returns every evicted informational timer ID, never an error timer", () => {
    const before=[entry(1,"error"),entry(2,"info"),entry(3,"success"),entry(4,"info")];
    const next=enqueueToast(before,entry(5,"info"));
    expect(next.evictedIds).toEqual(["notice-2"]);
    expect(next.items.map(item=>item.id)).toEqual(["notice-1","notice-3","notice-4","notice-5"]);
  });
  it("cancels and removes timers of evicted timed notices while preserving errors", () => {
    const timers = new Map<string, ReturnType<typeof setTimeout>>();
    timers.set("notice-2", 21 as unknown as ReturnType<typeof setTimeout>);
    timers.set("notice-3", 22 as unknown as ReturnType<typeof setTimeout>);
    const cancelled: number[] = [];
    clearEvictedToastTimers(["notice-2"], timers, timer => cancelled.push(timer as unknown as number));
    expect(cancelled).toEqual([21]);
    expect(timers.has("notice-2")).toBe(false);
    expect(timers.has("notice-3")).toBe(true);
  });
});
