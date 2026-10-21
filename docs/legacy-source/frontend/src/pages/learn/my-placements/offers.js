import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { Alert, Button, Skeleton } from "antd";
import PlacementsTabsLayout from "@/layouts/PlacementsTabsLayout";
import useJourney from "@/components/Placements/student/useJourney";
import OfferCard from "@/components/Placements/student/OfferCard";
import PlacementRules from "@/components/Placements/student/PlacementRules";

/**
 * The student's offers (redesign, 14 Oct 2026): offers waiting for a reply first, with the time left and Accept / Decline; then the
 * ones answered. They were the second of five sections on Placement cell, easy to miss with a reply deadline running.
 */
export default function OffersPage() {
  const router = useRouter();
  const learnerId = useSelector((s) => s.loginUser?.id);
  const { journey, failed, loading, reload } = useJourney({ withOverview: false });
  useEffect(() => { if (router.isReady && !learnerId) router.replace("/"); }, [router, router.isReady, learnerId]);

  if (!learnerId) return null;
  if (failed) return <Alert type="warning" showIcon message="We could not load your offers" action={<Button size="small" onClick={reload}>Retry</Button>} />;
  if (loading && !journey) return <Skeleton active paragraph={{ rows: 6 }} />;

  const waiting = journey.offers.filter((o) => o.status === "RELEASED");
  const answered = journey.offers.filter((o) => o.status !== "RELEASED");

  return (
    <div data-testid="sp.offers">
      {journey.offers.length === 0 ? (
        <section className="sp-panel">
          <header className="sp-panel__head"><h2>No offers yet</h2></header>
          <p className="sp-empty">When a company selects you and the placement cell releases the offer, it shows here and you get a notice. You&apos;ll have time to read it and decide. <Link href="/learn/my-placements/applications">See where your applications stand</Link></p>
        </section>
      ) : (
        <>
          {waiting.length > 0 && (
            <section aria-labelledby="sp-off-wait">
              <h2 id="sp-off-wait" className="sp-day-head">Needs your reply</h2>
              {waiting.map((o) => <OfferCard key={o.offerId} offer={o} onChanged={reload} />)}
            </section>
          )}
          {answered.length > 0 && (
            <section aria-labelledby="sp-off-done">
              <h2 id="sp-off-done" className="sp-day-head">{waiting.length ? "Earlier offers" : "Your offers"}</h2>
              {answered.map((o) => <OfferCard key={o.offerId} offer={o} onChanged={reload} />)}
            </section>
          )}
          <p className="sp-small sp-muted">Need more time on an offer, or got an offer outside campus? <Link href="/learn/my-placements/placement#requests">Send a request to the placement cell</Link>.</p>
        </>
      )}

      <section className="sp-panel" aria-labelledby="sp-off-rules" style={{ marginTop: 16 }}>
        <header className="sp-panel__head"><h2 id="sp-off-rules">How offers work at your college</h2></header>
        <PlacementRules collapsible />
      </section>
    </div>
  );
}

OffersPage.getLayout = (page) => PlacementsTabsLayout(page);
