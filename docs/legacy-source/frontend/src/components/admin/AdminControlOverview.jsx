import { Card, Tag, Typography } from "antd";

const { Paragraph, Text } = Typography;

export default function AdminControlOverview({
  eyebrow = "Admin control",
  title,
  description,
  scopeLabel = null,
  scopeColor = "blue",
  metrics = [],
  actions = null,
}) {
  return (
    <Card size="small" className="admin-control-overview">
      <div className="admin-control-overview__top">
        <div className="admin-control-overview__copy">
          <div className="admin-control-overview__eyebrow-row">
            <Text className="admin-control-overview__eyebrow">{eyebrow}</Text>
            {scopeLabel ? <Tag color={scopeColor}>{scopeLabel}</Tag> : null}
          </div>
          <h2 className="admin-control-overview__title">{title}</h2>
          {description ? (
            <Paragraph type="secondary" className="admin-control-overview__description">
              {description}
            </Paragraph>
          ) : null}
        </div>
        {actions ? <div className="admin-control-overview__actions">{actions}</div> : null}
      </div>
      {metrics.length > 0 ? (
        <div className="admin-control-overview__metrics">
          {metrics.map((metric) => (
            <div className="admin-control-overview__metric" key={metric.label}>
              <Text type="secondary">{metric.label}</Text>
              <strong>{metric.value ?? "—"}</strong>
              {metric.hint ? <span>{metric.hint}</span> : null}
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
