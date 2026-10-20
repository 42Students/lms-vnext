import { StatusBadge } from "@/components/ui/status-badge";
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
  createdAt: Date;
};

export function AnnouncementFeed({
  items,
  enabled,
}: {
  items: readonly AnnouncementFeedItem[];
  enabled: boolean;
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
            className="text-lg font-semibold text-foreground"
          >
            College announcements
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
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
            className="text-lg font-semibold text-foreground"
          >
            College announcements
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Current announcements visible to your persisted college, role and
            class/program/department audience.
          </p>
        </div>
        <StatusBadge tone={items.length ? "info" : "neutral"}>
          {items.length} visible
        </StatusBadge>
      </div>

      {items.length === 0 ? (
        <div className="border-y border-border bg-surface px-3 py-4 text-sm text-body">
          No active announcements for you right now.
        </div>
      ) : (
        <div className="divide-y divide-border border-y border-border">
          {items.map((item) => (
            <article
              key={item.id}
              className="min-w-0 py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {item.isPinned ? (
                      <StatusBadge tone="warning">Pinned</StatusBadge>
                    ) : null}
                    <StatusBadge>
                      {item.senderType.replaceAll("_", " ")}
                    </StatusBadge>
                  </div>
                  <h3 className="mt-2 text-base font-semibold text-foreground">
                    {item.title}
                  </h3>
                </div>
                <time
                  dateTime={item.createdAt.toISOString()}
                  className="text-xs text-muted-foreground"
                >
                  {new Intl.DateTimeFormat("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: "Asia/Kolkata",
                  }).format(item.createdAt)}
                </time>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-body">
                {item.message}
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
