import React from "react";
import { Button } from "antd";
import { ArrowLeftOutlined, DownloadOutlined } from "@ant-design/icons";

/**
 * Shared header for the quiz and assignment report pages: back nav, title/subtitle, a stat strip,
 * and the PDF download action. `stats` is [{ label, value, tone? }] -- tone "warning" renders the
 * value in the app's warning color for a figure worth a second look (e.g. a low average).
 */
const ReportSummaryHeader = ({ title, subtitle, stats = [], onBack, onDownloadPdf, downloading = false }) => (
  <div className="ln-report-header">
    <div className="ln-report-header__nav">
      <Button icon={<ArrowLeftOutlined />} onClick={onBack}>Back</Button>
      <Button
        type="primary"
        icon={<DownloadOutlined />}
        onClick={onDownloadPdf}
        loading={downloading}
      >
        Download PDF
      </Button>
    </div>
    <h1 className="ln-report-header__title">{title}</h1>
    {subtitle && <p className="ln-report-header__subtitle">{subtitle}</p>}
    {stats.length > 0 && (
      <div className="ln-report-header__stats">
        {stats.map((stat) => (
          <div key={stat.label} className="ln-report-header__stat">
            <span className={`ln-report-header__stat-value${stat.tone === "warning" ? " ln-report-header__stat-value--warning" : ""}`}>
              {stat.value}
            </span>
            <span className="ln-report-header__stat-label">{stat.label}</span>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default React.memo(ReportSummaryHeader);
