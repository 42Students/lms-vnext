import { StatusBadge } from "@/components/ui/status-badge";
import {MentorSourceNotificationRead} from "@/components/projects/mentor-source-notification-read";
function trustedAnnouncementAction(url:string|undefined|null,label:string|undefined|null){
 if(!url||!label)return null;
 try{
  const parsed=new URL(url);
  return parsed.protocol==="https:"&&parsed.hostname&&!parsed.username&&!parsed.password?
   {href:parsed.href,label}:null;
 }catch{return null;}
}


export type AnnouncementFeedItem = {
  id: string;
  title: string;
  message: string;
  senderType: string;
  receiverType: string;
  isPinned: boolean;
  buttonLabel?:string|null;
  buttonUrl?:string|null;
  createdAt: Date | string | readonly [number, number, number];
};

/** Spring legacy [year, month, day] dates are IST calendar days, not JS
 * zero-based month numbers. vNext timestamps are ISO instants. */
function announcementTimestamp(raw: AnnouncementFeedItem["createdAt"]): Date | null {
  let value: Date;
  if (Array.isArray(raw)) {
    const [year, month, day] = raw;
    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day) ||
        month < 1 || month > 12 || day < 1 || day > 31) return null;
    value = new Date(Date.UTC(year, month - 1, day) - 330 * 60_000);
    const local = new Date(value.getTime() + 330 * 60_000);
    if (local.getUTCFullYear() !== year || local.getUTCMonth() + 1 !== month ||
        local.getUTCDate() !== day) return null;
  } else value = raw instanceof Date ? new Date(raw.getTime()) : new Date(raw as string);
  return Number.isFinite(value.getTime()) ? value : null;
}

function announcementDateLabel(raw: AnnouncementFeedItem["createdAt"]): string {
  const date = announcementTimestamp(raw);
  return date ? new Intl.DateTimeFormat("en-IN", {
    dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
  }).format(date) : "Date unavailable";
}

export function AnnouncementFeed({
  items,
  enabled,
  mentorReadStates,
}: {
  items: readonly AnnouncementFeedItem[];
  enabled: boolean;
  mentorReadStates?:Readonly<Record<string,{key:string;read:boolean}>>;
}) {
  if (!enabled) {
    return (
      <section
        aria-labelledby="college-announcements"
        className="space-y-3"
      >
        <div>
          <h2
            id="college-announcements"
            className="text-lg font-semibold text-[var(--lms-heading)]"
          >
            College announcements
          </h2>
          <p className="mt-1 text-sm text-muted-foreground leading-[22px]">
            Announcements are temporarily unavailable while the verified
            database rollout is pending.
          </p>
        </div>
        <div className="border-y border-border bg-surface px-3 py-4 text-sm text-body">
          Personal workflow notifications below remain available.
        </div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="college-announcements"
      className="space-y-3"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id="college-announcements"
            className="text-lg font-semibold text-[var(--lms-heading)]"
          >
            College announcements
          </h2>
          <p className="mt-1 text-sm text-muted-foreground leading-[22px]">
            Current announcements visible to your persisted college, role and
            class/program/department audience.
          </p>
        </div>
        <StatusBadge tone={items.length ? "info" : "neutral"}>
          {items.length} visible
        </StatusBadge>
      </div>

      {items.length === 0 ? (
        <div className="flex items-start gap-3 border-y border-border bg-surface px-4 py-5 text-sm text-body">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mt-0.5 h-6 w-6 shrink-0 text-muted-foreground"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg>
          <div><p className="font-semibold text-foreground">No notifications yet</p>
          <p className="mt-1 text-muted-foreground">Announcements across college, department, and faculty will appear here.</p></div>
        </div>
      ) : (
        <div className="space-y-3" role="list" aria-label="College announcements">
          {items.map((item) => (
            <article
              key={item.id}
              role="listitem"
              data-notification-type="lms_announcement"
              className="min-w-0 rounded-lg border border-border bg-surface p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {item.isPinned ? (
                      <StatusBadge tone="warning">Pinned</StatusBadge>
                    ) : null}
                    <StatusBadge>
                      {item.senderType?.trim().replaceAll("_", " ") || "Announcement"}
                    </StatusBadge>
                    {item.receiverType?.trim() ? <span className="text-xs text-muted-foreground">
                      {item.receiverType.replaceAll("_", " ")}
                    </span> : null}
                  </div>
                  <h3 className="mt-2 text-base font-semibold text-[var(--lms-heading)]">
                    {item.title?.trim() || "Announcement"}
                  </h3>
                </div>
                <time
                  dateTime={announcementTimestamp(item.createdAt)?.toISOString()}
                  className="text-xs text-muted-foreground"
                >
                  {announcementDateLabel(item.createdAt)}
                </time>
              </div>
              {mentorReadStates?.[item.id] ? <div className="mt-2">
                <MentorSourceNotificationRead
                  receiptKey={mentorReadStates[item.id].key}
                  read={mentorReadStates[item.id].read}/>
              </div>:null}
              <p className="mt-3 whitespace-pre-wrap text-sm leading-[22px] text-body">
                {item.message?.trim() || "An announcement was shared with you."}
              </p>
              {trustedAnnouncementAction(item.buttonUrl,item.buttonLabel) ?
                <a href={trustedAnnouncementAction(item.buttonUrl,item.buttonLabel)!.href}
                  target="_blank" rel="noopener noreferrer"
                  className="mt-3 inline-flex min-h-10 items-center rounded-md border border-border px-3 text-sm font-semibold text-primary-text">
                  {trustedAnnouncementAction(item.buttonUrl,item.buttonLabel)!.label} ↗
                </a>:null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
