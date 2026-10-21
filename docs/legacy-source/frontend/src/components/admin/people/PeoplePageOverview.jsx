import { Card, Typography } from "antd";

const { Text, Paragraph } = Typography;

export default function PeoplePageOverview({
  eyebrow = "People",
  title,
  description,
  metrics = [],
  actions = null,
  note = null,
}) {
  return (
    <Card className="people-page-overview" size="small">
      <div className="people-page-overview__topline">
        <div className="people-page-overview__copy">
          <Text className="people-page-overview__eyebrow">{eyebrow}</Text>
          <h1 className="admin-list-page__title people-page-overview__title">{title}</h1>
          {description ? (
            <Paragraph type="secondary" className="people-page-overview__description">
              {description}
            </Paragraph>
          ) : null}
        </div>
        {actions ? <div className="people-page-overview__actions">{actions}</div> : null}
      </div>

      {metrics.length > 0 ? (
        <div className="people-page-overview__metrics" aria-label={`${title} summary`}>
          {metrics.map((metric) => (
            <div className="people-page-overview__metric" key={metric.label}>
              <Text type="secondary">{metric.label}</Text>
              <div>{metric.value ?? "—"}</div>
              {metric.hint ? <span>{metric.hint}</span> : null}
            </div>
          ))}
        </div>
      ) : null}

      {note ? <div className="people-page-overview__note">{note}</div> : null}
    </Card>
  );
}
