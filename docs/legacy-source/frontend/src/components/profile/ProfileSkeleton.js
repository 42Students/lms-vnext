import { Row, Col, Card, Skeleton } from "antd";

// Mirrors the actual shape of the loaded profile page (see about.js): a user-info card with an
// avatar/name block plus a video-intro block, a slim profile-completeness bar, and a responsive
// grid of section cards (xs=24 xl=12), each with its own header + body — not a single flat box
// with a couple of generic skeleton lines. Rendering the real Card/Row/Col grid here (using
// antd's Card `loading` state) means the loading and loaded states share the same layout, so
// there's no visible "two different screens" swap once data arrives.
const SECTION_CARD_COUNT = 10;

export default function ProfileSkeleton() {
  return (
    <div className="learn-profile-page__skeleton-grid">
      <Row gutter={[20, 20]} className="profile-sections">
        <Col span={24}>
          <Card className="profile-userinfo-card profile-userinfo">
            <div className="profile-userinfo__main">
              <Skeleton.Avatar active size={120} shape="square" className="profile-userinfo__avatar ln-prof-img" />
              <div className="profile-userinfo__content" style={{ flex: 1 }}>
                <Skeleton active title={{ width: "35%" }} paragraph={{ rows: 2, width: ["45%", "30%"] }} />
              </div>
            </div>
            <div className="profile-userinfo__video-section">
              <Skeleton.Node active className="profile-userinfo__video-skeleton" style={{ width: "100%", height: 180 }} />
            </div>
          </Card>
        </Col>

        <Col span={24}>
          <Card>
            <Skeleton active title={false} paragraph={{ rows: 1, width: "100%" }} />
          </Card>
        </Col>

        <Col span={24}>
          <Row gutter={[20, 20]} className="profile-sections-row" align="top">
            {Array.from({ length: SECTION_CARD_COUNT }).map((_, i) => (
              <Col xs={24} xl={12} key={i}>
                <Card loading />
              </Col>
            ))}
          </Row>
        </Col>
      </Row>
    </div>
  );
}
