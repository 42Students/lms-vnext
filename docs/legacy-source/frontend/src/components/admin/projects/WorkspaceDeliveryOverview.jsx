import { Button, Card, Empty, Tag, Typography } from "antd";
import { DownloadOutlined, LinkOutlined } from "@ant-design/icons";
import {
  formatTimestamp,
  reviewStatusColor,
  submissionTypeLabel,
  textOrDash,
} from "@/components/admin/projects/adminProjectUtils";

const { Paragraph, Text } = Typography;

const safeHttpUrl = (value) => {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : null;
};

export default function WorkspaceDeliveryOverview({ workspace }) {
  const delivery = workspace?.resolvedDelivery || workspace?.delivery || null;

  if (!delivery || !Object.keys(delivery).length) {
    return (
      <Card title="Delivery" className="project-workspace-delivery__empty">
        <Empty
          description={
            <span>
              No final delivery has been submitted yet.
              <br />
              <Text type="secondary">Task-level submissions can still be reviewed from the Tasks tab.</Text>
            </span>
          }
        />
      </Card>
    );
  }

  const fileUrl = safeHttpUrl(delivery?.attachmentUrl || delivery?.submissionFileUrl);
  const sourceUrl = safeHttpUrl(delivery?.sourceUrl);
  const attachments = Array.isArray(delivery?.attachments) ? delivery.attachments : [];
  const safeAttachments = attachments.map((item) => ({ ...item, safeUrl: safeHttpUrl(item?.url) }));

  const facts = [
    { label: "Submission type", value: submissionTypeLabel(delivery?.submissionType) },
    { label: "Submitted by", value: textOrDash(delivery?.submittedByName) },
    { label: "Submitted at", value: formatTimestamp(delivery?.submittedAt) },
    { label: "Revisions", value: delivery?.revisionCount ?? "—" },
  ];

  return (
    <div className="project-workspace-delivery">
      <Card className="project-workspace-delivery__hero">
        <div className="project-workspace-delivery__topline">
          <div>
            <div className="project-workspace-delivery__eyebrow">Final delivery</div>
            <div className="project-workspace-delivery__headline">Submission package and review state</div>
          </div>
          <Tag color={reviewStatusColor(delivery?.reviewStatus)}>
            {textOrDash(delivery?.reviewStatus)}
          </Tag>
        </div>

        <div className="project-workspace-delivery__facts">
          {facts.map((fact) => (
            <div className="project-workspace-delivery__fact" key={fact.label}>
              <Text type="secondary">{fact.label}</Text>
              <div>{fact.value}</div>
            </div>
          ))}
        </div>

        <div className="project-workspace-delivery__actions">
          <Text strong>Primary submission</Text>
          <div>
            {fileUrl ? (
              <Button type="link" href={fileUrl} target="_blank" rel="noreferrer noopener" icon={<DownloadOutlined />}>
                {delivery?.fileName || "Open submitted file"}
              </Button>
            ) : null}
            {sourceUrl ? (
              <Button type="link" href={sourceUrl} target="_blank" rel="noreferrer noopener" icon={<LinkOutlined />}>
                Open source link
              </Button>
            ) : null}
            {!fileUrl && !sourceUrl ? <Text type="secondary">No valid file or source link is attached.</Text> : null}
          </div>
        </div>
      </Card>

      <Card
        title="Additional evidence"
        className="project-workspace-delivery__attachments"
        extra={<Text type="secondary">{attachments.length} additional item{attachments.length === 1 ? "" : "s"}</Text>}
      >
        {attachments.length ? (
          <div className="project-workspace-delivery__attachment-list">
            {safeAttachments.map((item, index) => (
              <div className="project-workspace-delivery__attachment" key={`${item?.url || "attachment"}-${index}`}>
                <div>
                  <div className="project-workspace-delivery__attachment-title">
                    {item?.label || item?.fileName || `Attachment ${index + 1}`}
                  </div>
                  {item?.addedByName ? <Text type="secondary">Added by {item.addedByName}</Text> : null}
                </div>
                {item.safeUrl ? (
                  <Button type="link" href={item.safeUrl} target="_blank" rel="noreferrer noopener" icon={<LinkOutlined />}>
                    Open
                  </Button>
                ) : (
                  <Text type="secondary">Unavailable link</Text>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Empty description="No additional files or links." image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      <Card title="Review" className="project-workspace-delivery__review">
        <div className="project-workspace-delivery__review-meta">
          <div>
            <Text type="secondary">Reviewed by</Text>
            <div>{textOrDash(delivery?.reviewedByName)}</div>
          </div>
          <div>
            <Text type="secondary">Reviewed at</Text>
            <div>{formatTimestamp(delivery?.reviewedAt)}</div>
          </div>
        </div>
        {delivery?.feedback ? (
          <div className="project-workspace-delivery__feedback">
            <Text type="secondary">Mentor feedback</Text>
            <Paragraph>{delivery.feedback}</Paragraph>
          </div>
        ) : (
          <Text type="secondary">No mentor feedback has been recorded yet.</Text>
        )}
      </Card>
    </div>
  );
}
