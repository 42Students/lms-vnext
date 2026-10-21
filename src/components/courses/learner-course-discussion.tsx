"use client";
import { Alert } from "@/components/ui/alert";


import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { learnerDiscussionCanPost } from "@/modules/courses/learner-discussion-capability-model";
import { learnerDiscussionMayPost } from "@/modules/courses/learner-discussion-submit-guard-model";
import { createLearnerDiscussionHistoryFlight } from "@/modules/courses/learner-discussion-history-flight-model";
import { learnerDiscussionRefreshIsCurrent } from "@/modules/courses/learner-discussion-refresh-order-model";
import { learnerDiscussionDraftValid, LEARNER_DISCUSSION_MESSAGE_MAX_LENGTH } from "@/modules/courses/learner-discussion-message-limit-model";
import { learnerDiscussionTimeLabel,learnerDiscussionRelativeTimeLabel } from "@/modules/courses/learner-discussion-time-model";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import {shouldSendLearnerDiscussionOnEnter,learnerDiscussionMobileJumpVisible} from "./learner-discussion-mobile-model";
import {
  buildDiscussionFeed,
  countNewDiscussionMessages,
  mergeDiscussionHistory,
  reconcileLatestDiscussionPage,
} from "./learner-course-discussion-model";
import {Textarea} from "@/components/ui/textarea";

type DiscussionCursor = { beforeCreatedAt: string; beforeId: string };

type DiscussionMessage = {
  id: string;
  senderMembershipId: string;
  senderRole: string;
  senderName: string;
  messageText: string;
  pinned: boolean;
  createdAt: string;
  createdAtExact: string;
  updatedAt: string;
  isMine: boolean;
};

// Eight deterministic pastel tints, matching the legacy Classroom palette.
const AVATAR_TINTS=[
  {bg:"#e0f2f1",fg:"#0f766e"}, {bg:"#ede9fe",fg:"#5b21b6"},
  {bg:"#fef3c7",fg:"#92400e"}, {bg:"#e0e7ff",fg:"#3730a3"},
  {bg:"#fce7f3",fg:"#9d174d"}, {bg:"#dcfce7",fg:"#166534"},
  {bg:"#ffe4e6",fg:"#9f1239"}, {bg:"#e0f2fe",fg:"#075985"},
] as const;
function avatarTint(senderId:string,senderName:string){
  const source=senderId||senderName;
  const hash=[...source].reduce((value,char)=>((value*31+char.charCodeAt(0))>>>0),0);
  return AVATAR_TINTS[hash%AVATAR_TINTS.length]!;
}
function initials(name:string){
  return name.split(/\s+/).filter(Boolean).slice(0,2)
    .map(part=>part.charAt(0).toUpperCase()).join("")||"U";
}
function DiscussionPinIcon({filled=false}:{filled?:boolean}){
 return <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16"
  fill={filled?"currentColor":"none"} stroke="currentColor" strokeWidth="1.8"
  strokeLinecap="round" strokeLinejoin="round">
  <path d="M16 3l5 5-3 1.5v4L14 17l-4-4H6L4.5 10 8 7h4z"/>
  <path d="M10 14L3 21"/>
 </svg>;
}
function DiscussionDeleteIcon(){
 return <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16"
  fill="none" stroke="currentColor" strokeWidth="1.8"
  strokeLinecap="round" strokeLinejoin="round">
  <path d="M4 7h16M10 4h4M6 7l1 13h10l1-13M10 11v5m4-5v5"/>
 </svg>;
}
function formatTime(value: string, asOfMs: number) {
  return learnerDiscussionRelativeTimeLabel(value, asOfMs);
}


export function LearnerCourseDiscussion({
  deliveryId,
  moderate = false,
  pollIntervalMs = 15000,
}: {
  deliveryId: string;
  moderate?: boolean;
  pollIntervalMs?: number;
}) {
  const [messages, setMessages] = useState<DiscussionMessage[]>([]);
  const [timeReference, setTimeReference] = useState(() => Date.now());
  const [highlightedPinned, setHighlightedPinned] = useState<{
    id: string;
    messageText: string;
    senderName: string | null;
    createdAt: string;
    updatedAt: string;
  } | null>(null);
  const [canPost, setCanPost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [olderCursor, setOlderCursor] = useState<DiscussionCursor | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [olderError, setOlderError] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [scopeUnavailable,setScopeUnavailable] = useState(false);
  const [refreshDismissed,setRefreshDismissed] = useState(false);
  const [draft, setDraft] = useState("");
  const router = useRouter();
  const [leaveHref,setLeaveHref]=useState<string|null>(null);
  const [posting, setPosting] = useState(false);
  useEffect(()=>{
    if(!draft.trim()&&!posting)return;
    const guard=(event:BeforeUnloadEvent)=>{
      event.preventDefault();
      event.returnValue="";
    };
    window.addEventListener("beforeunload",guard);
    return ()=>window.removeEventListener("beforeunload",guard);
  },[draft,posting]);
  useEffect(()=>{
    if(!draft.trim()&&!posting)return;
    function guard(event:MouseEvent){
      const target=event.target;
      const link=target instanceof Element?target.closest("a[href]"):null;
      if(!link||event.defaultPrevented||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
      const href=link.getAttribute("href");
      if(!href||href.startsWith("#"))return;
      try{
        const destination=new URL(href,window.location.href);
        if(destination.origin!==window.location.origin)return;
        if(destination.pathname===window.location.pathname&&destination.search===window.location.search)return;
        event.preventDefault();
        setLeaveHref(destination.pathname+destination.search+destination.hash);
      }catch{return;}
    }
    document.addEventListener("click",guard,true);
    return ()=>document.removeEventListener("click",guard,true);
  },[draft,posting]);
  const [replyTo, setReplyTo] = useState<{id:string;text:string;updatedAt:string}|null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget,setDeleteTarget]=useState<string|null>(null);
  const [moderationError, setModerationError] = useState<string | null>(null);
  const [operationToast,setOperationToast]=useState<string|null>(null);
  const toastTimeout=useRef<ReturnType<typeof setTimeout>|null>(null);
  useEffect(()=>()=>{if(toastTimeout.current!==null)window.clearTimeout(toastTimeout.current);},[]);
  function showOperationError(message:string){
    setModerationError(message);
    setOperationToast(message);
    if(toastTimeout.current!==null)window.clearTimeout(toastTimeout.current);
    toastTimeout.current=window.setTimeout(()=>setOperationToast(null),2000);
  }
  const [pinningId, setPinningId] = useState<string | null>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [scrollEdges,setScrollEdges] = useState({top:false,bottom:false});
  const [unseenCount, setUnseenCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  // The shared Textarea does not forward a ref; retain reply/compose focus by id.
  const focusComposer = () => document.getElementById("course-discussion-message")?.focus();
  const postLocked = useRef(false);
  const historyFlight = useRef(createLearnerDiscussionHistoryFlight());
  const latestRefreshId = useRef(0);
  const loadedOnce = useRef(false);
  const previousMessages = useRef<DiscussionMessage[]>([]);
  const forceBottomOnNextLoad = useRef(false);
  const historyPrepend = useRef(false);
  const locallyDeletedIds = useRef(new Set<string>());
  const changeCursor=useRef<{since:string;afterId?:string}|null>(null);
  const refreshPollCount=useRef(0);

  const load = useCallback(async (silent = false) => {
    const refreshId = ++latestRefreshId.current;
    if (!silent && !loadedOnce.current) setLoading(true);
    try {
      const response = await fetch(
        `/api/courses/deliveries/${encodeURIComponent(deliveryId)}/discussions`,
        { cache: "no-store" },
      );
      if(!response.ok){
        if(response.status===403||response.status===404){
          setScopeUnavailable(true);
          setCanPost(false);
          setLoading(false);
          return;
        }
        throw new Error("discussion_load_failed");
      }
      const payload = await response.json();
      if (!learnerDiscussionRefreshIsCurrent(refreshId,latestRefreshId.current)) return;
      const received = Array.isArray(payload.messages) ? payload.messages as DiscussionMessage[] : [];
      const incoming = received.filter((row) => !locallyDeletedIds.current.has(row.id));
      setMessages((previous) => loadedOnce.current
        ? reconcileLatestDiscussionPage(previous, incoming, received.length)
        : incoming);
      if (!loadedOnce.current) {
        setOlderCursor(payload.nextCursor ?? null);
        const newest=[...incoming,...(payload.highlightedPinned?[payload.highlightedPinned]:[])]
          .map(message=>Date.parse(message.updatedAt))
          .filter((time):time is number=>Number.isFinite(time))
          .reduce((max,time)=>Math.max(max,time),Date.now()-30000);
        changeCursor.current={since:new Date(newest).toISOString()};
      }
      setHighlightedPinned(
        payload.highlightedPinned?.id && !locallyDeletedIds.current.has(payload.highlightedPinned.id)
          ? payload.highlightedPinned
          : null,
      );
      setCanPost(learnerDiscussionCanPost(payload.canPost));
      // Refresh relative timestamps only when a feed response arrives, not during render.
      setTimeReference(Date.now());
      setLoadError(false);
      setScopeUnavailable(false);
      setRefreshDismissed(false);
      loadedOnce.current = true;
    } catch {
      if (learnerDiscussionRefreshIsCurrent(refreshId,latestRefreshId.current)) {
        setCanPost(false);
        setLoadError(true);
        setRefreshDismissed(false);
      }
    } finally {
      if (learnerDiscussionRefreshIsCurrent(refreshId,latestRefreshId.current)) setLoading(false);
    }
  }, [deliveryId]);

  const loadOlder = useCallback(async () => {
    if (!olderCursor || !historyFlight.current.begin()) return;
    setLoadingOlder(true);
    setOlderError(false);
    try {
      const params = new URLSearchParams({
        beforeCreatedAt: olderCursor.beforeCreatedAt,
        beforeId: olderCursor.beforeId,
      });
      const response = await fetch(
        "/api/courses/deliveries/" + encodeURIComponent(deliveryId) + "/discussions?" + params,
        { cache: "no-store" },
      );
      if (!response.ok) throw new Error("discussion_history_failed");
      const result = await response.json();
      const previousHeight = scrollRef.current?.scrollHeight ?? 0;
      historyPrepend.current = true;
      const received = Array.isArray(result.messages) ? result.messages as DiscussionMessage[] : [];
      setMessages((previous) => mergeDiscussionHistory(
        previous,
        received.filter((row) => !locallyDeletedIds.current.has(row.id)),
      ));
      setOlderCursor(result.nextCursor ?? null);
      window.requestAnimationFrame(() => {
        const scroller = scrollRef.current;
        if (scroller) scroller.scrollTop += scroller.scrollHeight - previousHeight;
      });
    } catch {
      setOlderError(true);
    } finally {
      historyFlight.current.end();
      setLoadingOlder(false);
    }
  }, [deliveryId, olderCursor]);

  // Compare the legacy 15-second conditional update cursor rather than
  // retransferring the whole 60-message page for every idle tick.
  const pollChanges=useCallback(async()=>{
    if(!loadedOnce.current||!changeCursor.current)return;
    if(++refreshPollCount.current%4===0){await load(true);return;}
    try{
      const params=new URLSearchParams({since:changeCursor.current.since});
      if(changeCursor.current.afterId)params.set("afterId",changeCursor.current.afterId);
      const response=await fetch(
        "/api/courses/deliveries/"+encodeURIComponent(deliveryId)+
          "/discussions/changes?"+params,{cache:"no-store"});
      if(!response.ok)throw new Error("discussion_changes_failed");
      const result=await response.json() as {
        changes?:Array<{id:string;deleted:boolean;updatedAtExact:string}>;
        nextCursor?:{since:string;afterId:string}|null;
      };
      const changes=result.changes??[];
      const newest=changes.at(-1);
      if(newest)changeCursor.current={
        since:newest.updatedAtExact,afterId:newest.id,
      };
      if(changes.some(change=>change.deleted)){
        const deleted=new Set(changes.filter(change=>change.deleted).map(change=>change.id));
        deleted.forEach(id=>locallyDeletedIds.current.add(id));
        setMessages(previous=>previous.filter(message=>!deleted.has(message.id)));
        setHighlightedPinned(previous=>previous&&deleted.has(previous.id)?null:previous);
      }
      if(changes.length||result.nextCursor)await load(true);
    }catch{
      await load(true);
    }
  },[deliveryId,load]);

  useEffect(()=>{
    const interval=window.setInterval(()=>setTimeReference(Date.now()),60000);
    return ()=>window.clearInterval(interval);
  },[]);

  useEffect(() => {
    // Defer initial fetch to avoid synchronous cascading state updates.
    const first = window.setTimeout(() => void load(), 0);
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void pollChanges();
      }
    }, Math.max(5000,Math.min(120000,pollIntervalMs)));
    return () => {
      window.clearTimeout(first);
      window.clearInterval(interval);
    };
  }, [load,pollChanges,pollIntervalMs]);

  const pinnedMessages = useMemo(
    () => messages.filter((item) => item.pinned),
    [messages],
  );
  const pinned = highlightedPinned ?? pinnedMessages[0] ?? null;
  const feed = useMemo(
    () => buildDiscussionFeed(messages),
    [messages],
  );

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if(typeof window!=="undefined"&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)behavior="auto";
    bottomRef.current?.scrollIntoView({
      block: "end",
      behavior,
    });
    setUnseenCount(0);
    setAtBottom(true);
  }, []);

  const handleScroll = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;

    const distance =
      element.scrollHeight -
      element.scrollTop -
      element.clientHeight;
    const nextAtBottom = distance < 80;
    setScrollEdges({top:element.scrollTop>1,bottom:distance>1});
    setAtBottom(nextAtBottom);
    if (nextAtBottom) setUnseenCount(0);
  }, []);

  useEffect(()=>{
    const node=scrollRef.current;
    if(!node)return;
    const update=()=>setScrollEdges({
      top:node.scrollTop>1,
      bottom:node.scrollHeight-node.scrollTop-node.clientHeight>1,
    });
    update();
    const observer=typeof ResizeObserver==="undefined"?null:new ResizeObserver(update);
    observer?.observe(node);
    return()=>observer?.disconnect();
  },[messages,loading,olderCursor]);

  useEffect(() => {
    if (messages.length === 0) {
      previousMessages.current = messages;
      return;
    }

    const previous = previousMessages.current;
    const firstLoadedFeed =
      previous.length === 0 && loadedOnce.current;
    const newCount = countNewDiscussionMessages(
      previous,
      messages,
    );

    if (historyPrepend.current) {
      historyPrepend.current = false;
    } else if (firstLoadedFeed) {
      window.requestAnimationFrame(() => scrollToBottom("auto"));
    } else if (forceBottomOnNextLoad.current) {
      forceBottomOnNextLoad.current = false;
      window.requestAnimationFrame(() =>
        scrollToBottom("smooth"),
      );
    } else if (newCount > 0 && atBottom) {
      window.requestAnimationFrame(() =>
        scrollToBottom("smooth"),
      );
    } else if (newCount > 0) {
      setUnseenCount((count) => count + newCount);
    }

    previousMessages.current = messages;
  }, [messages, atBottom, scrollToBottom]);

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    const messageText = draft.trim();
    if (!learnerDiscussionMayPost(messageText,canPost,postLocked.current) || !learnerDiscussionDraftValid(messageText)) return;

    postLocked.current = true;
    setPosting(true);
    try {
      const sent=await apiFetch<{message?:{id:string}}>(
        `/api/courses/deliveries/${encodeURIComponent(deliveryId)}/discussions`+
          (moderate&&replyTo?"/faculty-reply":""),
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({messageText,...(replyTo?{
            replyToMessageId:replyTo.id,
            ...(moderate?{expectedParentUpdatedAt:replyTo.updatedAt,confirmed:true}:{}),
          }:{})}),
        },
      );
      if(!sent?.message?.id)throw new Error("UNCONFIRMED_POST");
      setDraft("");
      setReplyTo(null);
      setModerationError(null);
      forceBottomOnNextLoad.current = true;
      await load(true);
      window.requestAnimationFrame(() =>
        focusComposer(),
      );
    } catch(e) {
      showOperationError(e instanceof FriendlyFetchError&&e.status===409?
        "The discussion changed while you were writing. Your message is still here. Refresh and retry.":
        "Failed to post message.");
    } finally {
      postLocked.current = false;
      setPosting(false);
    }
  }

  async function remove(messageId: string) {
    const current=messages.find(row=>row.id===messageId);
    if(!current){setModerationError("Message snapshot missing. Refresh and retry.");return;}
    setDeletingId(messageId);setModerationError(null);
    try {
      await apiFetch(
        `/api/courses/deliveries/${encodeURIComponent(deliveryId)}/discussions/${encodeURIComponent(messageId)}`,
        { method: "DELETE",headers:{"content-type":"application/json"},
          body:JSON.stringify({expectedUpdatedAt:current.updatedAt,confirmed:true}) },
      );
      // Requests already in flight can return a pre-delete snapshot.
      // Tombstone this ID for this workspace to prevent resurrection.
      locallyDeletedIds.current.add(messageId);
      setMessages((current) => current.filter((item) => item.id !== messageId));
      setHighlightedPinned((current) => current?.id === messageId ? null : current);
      setDeleteTarget(null);
      await load(true);
    } catch(e) {
      showOperationError("Failed to delete message.");
    } finally {
      setDeletingId(null);
    }
  }

  async function togglePin(messageId: string) {
    if (!moderate || pinningId) return;
    const current=messages.find(row=>row.id===messageId) ??
      (highlightedPinned?.id===messageId
        ? {id:highlightedPinned.id,pinned:true,updatedAt:highlightedPinned.updatedAt}
        : null);
    if(!current){setModerationError("Message snapshot missing. Refresh and retry.");return;}
    setPinningId(messageId);setModerationError(null);
    try {
      const payload = await apiFetch<{message?:{id:string;pinned:boolean;updatedAt:string}}>(
        `/api/courses/deliveries/${encodeURIComponent(deliveryId)}/discussions/${encodeURIComponent(messageId)}`,
        { method: "PATCH",headers:{"content-type":"application/json"},
          body:JSON.stringify({expectedUpdatedAt:current.updatedAt,confirmed:true}) },
      );
      const updated = payload?.message;
      if(updated && updated.id===highlightedPinned?.id && !updated.pinned)
        setHighlightedPinned(null);
      if (updated?.id) {
        setMessages((current) =>
          current.map((item) =>
            item.id === updated.id
              ? {
                  ...item,
                  pinned: Boolean(updated.pinned),
                  updatedAt:
                    typeof updated.updatedAt === "string"
                      ? updated.updatedAt
                      : item.updatedAt,
                }
              : item,
          ),
        );
      }
      await load(true);
    } catch(e) {
      showOperationError("Failed to update pin state.");
    } finally {
      setPinningId(null);
    }
  }

  return (
    <div className="min-w-0 space-y-4">
      {operationToast?<div role="alert" className="fixed bottom-5 left-1/2 z-50 w-[min(92vw,28rem)] -translate-x-1/2 rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 py-3 text-sm text-error shadow-lg">
        {operationToast}
      </div>:null}
      <h2 className="sr-only">Discussions</h2>
      <p className="m-0 text-sm text-body">
        Keep course conversations in one place and follow along easily.
      </p>



      {pinned ? (
        <section className="flex min-w-0 items-start gap-2.5 rounded-[14px] border border-[#d8e7ea] bg-[#f6fbfb] px-[14px] py-3">
          <span className="mt-0.5 shrink-0 text-[#1a95a1]"><DiscussionPinIcon filled /></span>
          <div className="min-w-0 flex-1">
          <p className="break-words text-sm font-semibold text-foreground">{pinned.messageText}</p>
          <small title={learnerDiscussionTimeLabel(pinned.createdAt)}
            className="mt-1 block text-xs text-muted-foreground">
            Pinned by {pinned.senderName??"User"}{pinnedMessages.length>1
              ?" · 1 of "+pinnedMessages.length:""}
          </small>
          </div>
          {moderate ? (
            <Button type="button" size="sm" variant="ghost"
              title="Unpin this message" aria-label="Unpin this message"
              disabled={pinningId!==null}
              onClick={()=>void togglePin(pinned.id)}
              className="min-h-9 min-w-9 p-2 text-[#1a95a1]">
              <DiscussionPinIcon />
            </Button>
          ) : null}
        </section>
      ) : null}

      <ConfirmDialog open={deleteTarget!==null}
        onOpenChange={open=>{if(!open&&deletingId===null)setDeleteTarget(null);}}
        title="Delete this message?"
        description="This cannot be undone."
        confirmLabel="Delete" confirmVariant="danger"
        pending={deletingId!==null}
        onConfirm={()=>{if(deleteTarget)void remove(deleteTarget);}}>
        {moderationError?<Alert tone="error">{moderationError}</Alert>:null}
      </ConfirmDialog>
      <ConfirmDialog open={leaveHref!==null}
        onOpenChange={open=>{if(!open)setLeaveHref(null);}}
        title="Discard your unsent discussion message?"
        description="Your unsent message will not be saved."
        confirmLabel="Discard"
        onConfirm={()=>{
          const destination=leaveHref;
          setLeaveHref(null);
          setDraft("");
          if(destination)router.push(destination);
        }}/>
      {moderationError?<Alert tone="error">{moderationError}</Alert>:null}
      <section className="relative min-w-0 overflow-hidden border border-[#e5e9f0] bg-white">
        {loadError && messages.length > 0 && loadedOnce.current && !refreshDismissed ? (
          <div role="alert" className="flex flex-wrap items-center gap-3 border-b border-[#f2e3b9] bg-[#fffbea] px-3 py-2 text-sm">
            <div className="min-w-0 flex-1">
              <strong>Discussion refresh failed</strong>
              <p>Showing the last messages we loaded.</p>
            </div>
            <Button type="button" size="sm" variant="secondary" onClick={()=>void load(true)}>Retry</Button>
            <Button type="button" size="sm" variant="ghost" title="Dismiss refresh warning"
              aria-label="Dismiss refresh warning" onClick={()=>setRefreshDismissed(true)}>×</Button>
          </div>
        ) : null}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          role="region" aria-label="Course discussion messages" tabIndex={0}
          className="max-h-[min(62vh,640px)] min-h-[320px] overflow-y-auto overscroll-contain px-2 py-3 sm:px-3 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"
        >
          {scopeUnavailable ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-2 p-4 text-center">
              <h3 className="text-base font-semibold text-foreground">Discussion unavailable</h3>
              <p className="max-w-md text-sm text-body">
                This course is not linked to one of your classes yet, so there is no discussion to show.
              </p>
            </div>
          ) : loading ? (
            <div className="flex min-h-64 items-center justify-center" aria-busy="true"
              aria-label="Loading discussion messages" role="status">
              <span aria-hidden="true" className="size-7 motion-safe:animate-spin rounded-full border-2 border-[#e5e9f0] border-t-[#0a7c88]"/>
            </div>
          ) : loadError && messages.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center text-center">
              <h3 className="m-0 text-base font-semibold text-foreground">
                We could not load this discussion.
              </h3>
              <p className="mt-2 text-sm text-body">
                Check your connection and try again.
              </p>
              <Button className="mt-4 min-h-11 w-full sm:w-auto md:min-h-9" variant="secondary" onClick={() => void load()}>
                Retry
              </Button>
            </div>
          ) : messages.length === 0 ? (
            moderate && canPost ? (
              <div className="flex min-h-64 flex-col items-center justify-center gap-4 p-4 text-center">
                <h3 className="text-base font-semibold text-foreground">Start the conversation</h3>
                <p className="text-sm text-body">Learners are far more likely to post once someone else has. Try a welcome note or this week's focus.</p>
                <div className="grid w-full min-w-0 gap-2 sm:flex sm:flex-wrap sm:justify-center">
                  <Button type="button" size="sm" variant="secondary" className="min-h-11 md:min-h-9"
                    onClick={()=>{
                      setDraft("Welcome! Use this space for questions about the course.");
                      focusComposer();
                    }}>Post a welcome message</Button>
                  <Button type="button" size="sm" variant="secondary" className="min-h-11 md:min-h-9"
                    onClick={()=>{
                      setDraft("This week we are focusing on: ");
                      focusComposer();
                    }}>Share this week&apos;s focus</Button>
                </div>
              </div>
            ) : (
              <EmptyState
                title="No messages yet"
                description="Ask the first question — your classmates and faculty will see it here."
              />
            )
          ) : (
            <div className="min-w-0 space-y-2" role="log" aria-live="polite" aria-relevant="additions">
              {olderCursor ? (
                <div className="flex flex-col items-center gap-2 pb-3">
                  <Button size="sm" variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" disabled={loadingOlder}
                    onClick={() => void loadOlder()}>
                    {loadingOlder ? "Loading earlier messages…" : "Load earlier messages"}
                  </Button>
                  {olderError ? <Alert tone="error" className="w-full">
                    Earlier messages could not be loaded. Retry to continue.
                  </Alert> : null}
                </div>
              ) : null}
              {feed.map((row) =>
                row.kind === "day" ? (
                  <div
                    key={row.key}
                    className="sticky top-0 z-[2] flex items-center gap-3 py-2"
                    aria-label={row.label}
                  >
                    <span className="h-px flex-1 bg-border" />
                    <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      {row.label}
                    </span>
                    <span className="h-px flex-1 bg-border" />
                  </div>
                ) : (
                  <article
                    key={row.key}
                    className={`group grid max-w-full min-w-0 grid-cols-[36px_minmax(0,1fr)_auto] items-start gap-3 break-words rounded-[12px] px-3 py-2
                      ${row.grouped ? "mt-0" : "mt-4"}
                      ${row.item.isMine ? "bg-[#f0fafa] hover:bg-[#e7f7f7]" : "bg-white hover:bg-[#f9fafb]"}`}
                  >
                    {row.grouped?<span aria-hidden="true" className="w-8 shrink-0"/>:
                      <span aria-hidden="true" title={row.item.senderRole}
                        className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold"
                        style={{backgroundColor:avatarTint(row.item.senderMembershipId,row.item.senderName).bg,
                          color:avatarTint(row.item.senderMembershipId,row.item.senderName).fg}}>
                        {initials(row.item.senderName)}
                      </span>}
                    <div className="min-w-0 flex-1">
                      {!row.grouped?<div className="flex flex-wrap items-center gap-2">
                        <strong className="text-sm text-foreground">
                          {row.item.isMine ? "You" : row.item.senderName}
                        </strong>
                        {row.item.senderRole==="FACULTY"?<StatusBadge tone="info">Faculty</StatusBadge>:null}
                        <time dateTime={row.item.createdAt}
                          title={learnerDiscussionTimeLabel(row.item.createdAt)}
                          className="text-xs text-muted-foreground">
                          {formatTime(row.item.createdAt,timeReference)}
                        </time>
                        {row.item.pinned?<StatusBadge tone="info">Pinned</StatusBadge>:null}
                      </div>:null}
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-body">
                        {row.item.messageText}
                      </p>
                    </div>
                    {(canPost || moderate) ? (
                      <div className="flex shrink-0 items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                        {canPost ? <Button type="button" variant="ghost"
                          className="min-h-11 !text-[var(--lms-primary-text)] underline md:min-h-9"
                          onClick={() => {
                            setReplyTo({id:row.item.id,text:row.item.messageText.slice(0,100),updatedAt:row.item.updatedAt});
                            focusComposer();
                          }}>Reply</Button> : null}
                        {moderate ? <Button type="button" variant="ghost" size="sm"
                          aria-label={row.item.pinned?"Unpin this message":"Pin this message"}
                          title={row.item.pinned?"Unpin this message":"Pin this message"}
                          disabled={pinningId!==null}
                          onClick={()=>void togglePin(row.item.id)}
                          className="min-h-9 min-w-9 p-2 !text-[#1a95a1]">
                          <DiscussionPinIcon filled={row.item.pinned}/>
                        </Button> : null}
                        {(moderate || row.item.isMine) ? <Button
                          type="button" variant="ghost" size="sm"
                          aria-label="Delete this message" title="Delete this message"
                          disabled={deletingId===row.item.id}
                          onClick={()=>{setModerationError(null);setDeleteTarget(row.item.id);}}
                          className="min-h-9 min-w-9 p-2 !text-[var(--lms-error)]">
                          <DiscussionDeleteIcon/>
                        </Button> : null}
                      </div>
                    ) : null}
                  </article>
                ),
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {scrollEdges.top?<span aria-hidden="true" data-scroll-fade="top"
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-5 bg-gradient-to-b from-surface to-transparent"/>:null}
        {scrollEdges.bottom?<span aria-hidden="true" data-scroll-fade="bottom"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-5 bg-gradient-to-t from-surface to-transparent"/>:null}
        {unseenCount===0 && learnerDiscussionMobileJumpVisible(atBottom,unseenCount,messages.length) ? (
          <Button type="button" onClick={()=>scrollToBottom()}
            variant="secondary" className="absolute bottom-[10.5rem] left-1/2 z-10 min-h-11 -translate-x-1/2 shadow-md md:hidden">
            Jump to latest
          </Button>
        ) : null}
        {unseenCount > 0 ? (
          <Button
            type="button"
            onClick={() => scrollToBottom()}
            className="absolute bottom-[10.5rem] left-1/2 z-10 min-h-11 -translate-x-1/2 shadow-md md:min-h-9"
          >
            ↓ {unseenCount} new {unseenCount === 1 ? "message" : "messages"}
          </Button>
        ) : null}

        {canPost && !scopeUnavailable ? (
        <form onSubmit={submit} className="min-w-0 border-t border-border px-1 py-3 sm:px-3 md:py-4">
          <p className="mb-2 text-xs leading-5 text-muted-foreground">
            {moderate
              ? "Students can post questions here anytime — you'll see them appear in real time."
              : "Have a doubt about anything in this course? Feel free to ask here."}
          </p>
          {replyTo ? <div className="mb-3 flex min-w-0 flex-col gap-2 border-l-2 border-border bg-surface-subtle p-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="min-w-0 break-words text-xs text-body">Replying to: {replyTo.text}</p>
            <Button type="button" variant="ghost" className="min-h-11 !text-[var(--lms-primary-text)] underline md:min-h-9"
              onClick={() => setReplyTo(null)}>Cancel reply</Button>
          </div> : null}
          <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]" htmlFor="course-discussion-message">
            Write a message
          </label>
          <Textarea
            id="course-discussion-message"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (shouldSendLearnerDiscussionOnEnter({
                key:event.key,shiftKey:event.shiftKey,
                isComposing:event.nativeEvent.isComposing,
                coarsePointer:false,
              })) {
                event.preventDefault();
                void submit();
              }
            }}
            rows={2}
            maxLength={LEARNER_DISCUSSION_MESSAGE_MAX_LENGTH}
            placeholder="Write a message..."
            className="mt-1.5 w-full"
          />
          <div className="mt-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-muted-foreground">
              Enter to send · Shift+Enter for a new line
              {draft.length>3400? " · "+draft.length+"/"+LEARNER_DISCUSSION_MESSAGE_MAX_LENGTH:""}
            </span>
            <Button type="submit" className="min-h-9 w-auto" disabled={!learnerDiscussionDraftValid(draft) || posting}>
              {posting ? "Sending…" : "Send"}
            </Button>
          </div>
        </form>
        ) : (
          <div className="border-t border-border bg-surface-subtle p-3 text-sm font-semibold text-muted-foreground">
            Past semester · this discussion is read only.
          </div>
        )}
      </section>
    </div>
  );
}
