import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import { Badge, Card, Typography } from "antd";
import {
  RightOutlined, ApartmentOutlined, CheckCircleOutlined, CalendarOutlined, MessageOutlined,
  FileTextOutlined, BellOutlined, BuildOutlined, HistoryOutlined, IdcardOutlined, NotificationOutlined,
} from "@ant-design/icons";
import PageShell from "@/components/Common/PageShell";
import ListingPageHeader from "@/components/Global/ListingPageHeader/ListingPageHeader";
import { appAction } from "@/redux/store";
import { fetchWithErrorHandling } from "@/api/Services/AdminService";
import { getCounts } from "@/api/Services/TpoHubService";

// MORE-01: this used to be a bare Card+List of eight plain text rows with no structure or
// context. Grouped into the same sections the sidebar now uses (Operate/Coordinate live in the
// footer's own four tabs; this is what's left - Insights/Administration), each row with an icon,
// a one-line description and a badge where a count is meaningful.
const GROUPS = [
  {
    label: "Work",
    items: [
      { key: "batches", label: "Placement eligibility", href: "/tpo/batches", icon: ApartmentOutlined, desc: "Who is in placements, batch by batch" },
      { key: "requests", label: "Requests", href: "/tpo/requests", icon: CheckCircleOutlined, desc: "What students asked you to decide: withdrawals, off-campus offers, registration changes" },
      { key: "calendar", label: "Calendar", href: "/tpo/calendar", icon: CalendarOutlined, desc: "Talks, deadlines and rounds" },
      { key: "announcements", label: "Announcements", href: "/tpo/announcements", icon: NotificationOutlined, desc: "Tell your students; read what 42 tells you" },
      { key: "messages", label: "Messages", href: "/tpo/messages", icon: MessageOutlined, desc: "Conversations with recruiters" },
      { key: "team", label: "Placement team", href: "/tpo/settings?tab=team", icon: IdcardOutlined, desc: "Who is on the team and who owns what" },
    ],
  },
  {
    label: "Insights",
    items: [
      { key: "reports", label: "Reports", href: "/tpo/reports", icon: FileTextOutlined, desc: "Placement summary, by branch, by company and more" },
    ],
  },
  {
    label: "Account",
    items: [
      { key: "notifications", label: "Notifications", href: "/tpo/notifications", icon: BellOutlined, desc: "Everything that has notified you" },
      { key: "settings", label: "Settings", href: "/tpo/settings", icon: BuildOutlined, desc: "Rules, team, templates and branding" },
      { key: "audit", label: "Audit log", href: "/tpo/audit", icon: HistoryOutlined, desc: "Who did what, and when" },
      { key: "profile", label: "Profile", href: "/tpo/profile", icon: IdcardOutlined, desc: "Your own account details" },
    ],
  },
];

/** The phone footer's "More" (TPO V1 - Locked.docx §1): everything that is not in the footer's four main places. */
export default function TpoMore() {
  const dispatch = useDispatch();
  const router = useRouter();
  const [counts, setCounts] = useState({ requests: 0, messages: 0 });
  const [countsFailed, setCountsFailed] = useState(false);

  useEffect(() => { dispatch(appAction.setActiveMenuItem("more")); }, [dispatch]);

  // BE-0046: the two badges come from the light counts call the top bar uses (not the whole request queue and every
  // message thread). A failure is said as such, never shown as "nothing waiting".
  const loadCounts = useCallback(async () => {
    const c = await fetchWithErrorHandling(getCounts());
    if (!c.success || !c.data) { setCountsFailed(true); return; }
    setCountsFailed(false);
    setCounts({ requests: Number(c.data.requests) || 0, messages: Number(c.data.messages) || 0 });
  }, []);
  useEffect(() => { loadCounts(); }, [loadCounts]);

  return (
    <div className="scroll-container tpo-more" data-testid="tpo.more">
      <PageShell>
        <ListingPageHeader
          className="tpo-more__header"
          title="More"
          subtitle={<Typography.Text type="secondary">Secondary placement tools, insights and account controls that stay out of your main day-to-day navigation.</Typography.Text>}
        />

        {countsFailed && (
          <Typography.Text type="secondary" className="tpo-more__counts-failed" data-testid="tpo.more.counts-failed">
            Waiting requests and unread messages could not be counted. <Typography.Link onClick={loadCounts}>Retry</Typography.Link>
          </Typography.Text>
        )}
        <div className="tpo-more__groups">
          {GROUPS.map((group) => (
            <section className="tpo-more__group" key={group.label} aria-labelledby={`more-group-${group.label.toLowerCase()}`}>
              <Typography.Text className="tpo-more__group-label" id={`more-group-${group.label.toLowerCase()}`}>{group.label}</Typography.Text>
              <Card className="tpo-more__card" size="small">
                {group.items.map((item) => {
                  const IconComponent = item.icon;
                  return (
                  <div
                    className="tpo-more__item"
                    key={item.key}
                    role="link"
                    tabIndex={0}
                    onClick={() => router.push(item.href)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); router.push(item.href); } }}
                  >
                    <span className="tpo-more__icon"><IconComponent aria-hidden="true" /></span>
                    <div className="tpo-more__copy">
                      <div className="tpo-more__item-title">{item.label}</div>
                      <Typography.Text type="secondary">{item.desc}</Typography.Text>
                    </div>
                    {Boolean(counts[item.key]) && <Badge className="tpo-more__badge" count={counts[item.key]} size="small" overflowCount={99} />}
                    <RightOutlined className="tpo-more__arrow" aria-hidden="true" />
                  </div>
                  );
                })}
              </Card>
            </section>
          ))}
        </div>
      </PageShell>
    </div>
  );
}
