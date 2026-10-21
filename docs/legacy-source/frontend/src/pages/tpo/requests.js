import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Card, Typography } from "antd";
import PageShell from "@/components/Common/PageShell";
import ListingPageHeader from "@/components/Global/ListingPageHeader/ListingPageHeader";
import RequestsPanel from "@/components/tpo/RequestsPanel";
import { appAction } from "@/redux/store";

export default function TpoRequests() {
  const dispatch = useDispatch();
  useEffect(() => { dispatch(appAction.setActiveMenuItem("requests")); }, [dispatch]);
  return (
    <div className="scroll-container tpo-requests" data-testid="tpo.requests">
      <PageShell>
        <ListingPageHeader
          className="tpo-requests__header"
          title="Requests"
          subtitle={<Typography.Text type="secondary">What students have asked you to decide: withdrawals, off-campus offers, registration changes and disputes. Urgent ones come first.</Typography.Text>}
        />
        <Card className="tpo-requests__workspace">
          <div className="tpo-requests__panel">
            <RequestsPanel />
          </div>
        </Card>
      </PageShell>
    </div>
  );
}
