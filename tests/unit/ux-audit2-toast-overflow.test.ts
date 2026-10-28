import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ToastStack, enqueueToast, clearEvictedToastTimers, type ToastItem } from "@/components/ui/toast";

const entry = (index: number, tone: "error" | "info" | "success"): ToastItem => ({
  id: "notice-"+index, tone, title: "Notice "+index,
});
describe("RV-02 A2-14 persistent toast retention", () => {
  it("keeps dismissible notifications inside the native modal top layer", () => {
    const source=readFileSync(join(process.cwd(),"src/components/ui/toast.tsx"),"utf8");
    expect(source).toContain('querySelectorAll<HTMLDialogElement>("dialog:modal")');
    expect(source).toContain("createPortal(toastStack, toastModal)");
    expect(source).toContain('toastModal.addEventListener("close", restore)');
    expect(source).toContain('toastModal.removeEventListener("close", restore)');
  });
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
  it("R2-02 keeps eight persistent errors individually dismissible inside a 320×568 visual viewport", () => {
    let items: ToastItem[]=[];
    for(let i=1;i<=8;i++)items=enqueueToast(items,entry(i,"error")).items;
    expect(items).toHaveLength(8);
    const markup=renderToStaticMarkup(createElement(ToastStack,{
      toasts:items,
      onDismiss:()=>{},
      viewport:{height:568,bottom:0},
    }));
    expect(markup).toContain('data-slot="toast-stack"');
    expect(markup).toContain('role="region"');
    expect(markup).toContain('tabindex="0"');
    expect(markup).toContain('overflow-y-auto');
    expect(markup).toContain('overscroll-contain');
    expect(markup).toContain('--lms-toast-visual-height:568px');
    expect(markup).toContain('safe-area-inset-top');
    expect(markup).toContain('safe-area-inset-bottom');
    expect((markup.match(/role="alert"/g)??[])).toHaveLength(8);
    expect((markup.match(/aria-label="Dismiss error: Notice [0-9]+"/g)??[])).toHaveLength(8);
    for(let i=1;i<=8;i++)expect(markup).toContain(`Dismiss error: Notice ${i}`);
  });
  it("R2-02 adjusts the bounded stack above the on-screen keyboard without evicting errors", () => {
    const items=Array.from({length:10},(_,i)=>entry(i+1,"error"));
    const markup=renderToStaticMarkup(createElement(ToastStack,{
      toasts:items,onDismiss:()=>{},viewport:{height:320,bottom:248},
    }));
    expect(markup).toContain('--lms-toast-visual-height:320px');
    expect(markup).toContain('--lms-toast-visual-bottom:248px');
    expect((markup.match(/role="alert"/g)??[])).toHaveLength(10);
    expect((markup.match(/aria-label="Dismiss error: Notice [0-9]+"/g)??[])).toHaveLength(10);
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
