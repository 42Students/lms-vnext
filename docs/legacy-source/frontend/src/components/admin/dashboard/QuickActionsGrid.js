import { Card, Row, Col } from "antd";

export default function QuickActionsGrid({ actions, onNavigate }) {
  return (
    <section className="admin-dashboard-section admin-dashboard-quick-actions" aria-label="Quick Actions">
      <h2 className="admin-dashboard-section__title">Quick Actions</h2>
      <Row gutter={[16, 16]} className="admin-dashboard-quick-actions__grid">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Col xs={24} sm={12} md={8} lg={6} xl={6} key={action.key}>
              <Card
                hoverable
                onClick={() => onNavigate(action.key)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onNavigate(action.key); } }}
                tabIndex={0}
                role="button"
                aria-label={action.label}
                className="admin-dashboard-quick-action-card"
                style={{ ["--action-color"]: action.color }}
              >
                <div className="admin-dashboard-quick-action-card__icon">
                  <Icon />
                </div>
                <div className="admin-dashboard-quick-action-card__label">{action.label}</div>
              </Card>
            </Col>
          );
        })}
      </Row>
    </section>
  );
}
