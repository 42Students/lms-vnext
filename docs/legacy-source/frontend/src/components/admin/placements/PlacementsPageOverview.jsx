import { Card, Typography } from "antd";

const { Paragraph, Text } = Typography;

export default function PlacementsPageOverview({
  title,
  description,
  metrics = [],
  actions = null,
  eyebrow = "Placements",
}) {
  return (
    <Card size="small" className="placements-page-overview">
      <div className="placements-page-overview__topline">
        <div className="placements-page-overview__copy">
          <Text className="placements-page-overview__eyebrow">{eyebrow}</Text>
          <h1 className="admin-list-page__title placements-page-overview__title">{title}</h1>
          {description ? (
            <Paragraph type="secondary" className="placements-page-overview__description">
              {description}
            </Paragraph>
          ) : null}
        </div>
        {actions ? <div className="placements-page-overview__actions">{actions}</div> : null}
      </div>
      {metrics.length > 0 ? (
        <div className="placements-page-overview__metrics">
          {metrics.map((metric) => (
            <div className="placements-page-overview__metric" key={metric.label}>
              <Text type="secondary">{metric.label}</Text>
              <div>{metric.value ?? "—"}</div>
              {metric.hint ? <span>{metric.hint}</span> : null}
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
