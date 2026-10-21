import React, { useId, useState, useMemo } from "react";
import { Markup } from "interweave";
import {
  ReadOutlined,
  UpOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
  UserOutlined,
} from "@ant-design/icons";

// HTML sanitization for untrusted content
const MARKUP_ALLOWED_TAGS = ['p', 'div', 'span', 'strong', 'em', 'u', 's', 'ul', 'ol', 'li', 'br', 'a', 'h1', 'h2', 'h3', 'h4', 'blockquote', 'code', 'pre', 'table', 'thead', 'tbody', 'tr', 'td', 'th'];
const MARKUP_ALLOWED_ATTRS = { a: ['href', 'target', 'rel'] };

const COLLAPSE_THRESHOLD = 350;

/**
 * Course overview section — compact, scannable layout.
 * Intro as subtitle, takeaways in 2-col grid (desktop), collapsible description.
 */
export default function InThisCourseSection({
  introductionContent,
  htmlContent,
  takeaways,
  credits,
  instructor,
  loading = false,
}) {
  const intro = (introductionContent || "").trim();
  const content = (htmlContent || "").trim();
  const hasHtml = content && /<[a-z][\s\S]*>/i.test(content);
  const takeawayList = Array.isArray(takeaways) ? takeaways.filter(Boolean) : [];

  const plainText = useMemo(() => {
    if (!content) return "";
    if (!hasHtml) return content;
    return content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }, [content, hasHtml]);

  const isLong = plainText.length > COLLAPSE_THRESHOLD;
  const [expanded, setExpanded] = useState(false);
  const descriptionId = useId();

  // `credits` and `instructor` are real content. Excluding them meant a course with both but no
  // description returned null and threw them away, while the parent still rendered its bordered
  // wrapper — an empty ~50px box directly under the page title.
  const hasMeta = (credits != null && credits !== "") || instructor;
  const hasContent = intro || content || takeawayList.length > 0 || hasMeta;

  if (loading) {
    return (
      <section className="cas" aria-label="Course overview" aria-busy="true" role="status" aria-live="polite">
        <span className="sr-only">Loading course overview</span>
        <div aria-hidden="true">
          <div className="cas__head">
            <div className="cas__skel-title" />
            <div className="cas__skel-sub" />
          </div>
          <div className="cas__skel-line" style={{ width: "85%" }} />
          <div className="cas__skel-line" style={{ width: "60%" }} />
        </div>
      </section>
    );
  }

  if (!hasContent) return null;

  const truncatedText =
    !expanded && plainText.length > COLLAPSE_THRESHOLD
      ? plainText.slice(0, COLLAPSE_THRESHOLD).trim() + "\u2026"
      : null;

  return (
    <section className="cas" aria-label="Course overview">
      {/* Header row: title + meta chips */}
      <div className="cas__head">
        <h2 className="cas__title">About this course</h2>
        {hasMeta && (
          <div className="cas__meta">
            {credits != null && credits !== "" && (
              <span className="cas__chip">
                <TrophyOutlined /> {credits} Credits
              </span>
            )}
            {instructor && (
              <span className="cas__chip">
                <UserOutlined /> {instructor}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Intro as subtitle — one-liner hook */}
      {intro && <p className="cas__intro">{intro}</p>}

      {/* Takeaways — 2-col grid on desktop, single col on mobile */}
      {takeawayList.length > 0 && (
        <ul className="cas__takeaways">
          {takeawayList.map((item, i) => (
            <li key={i} className="cas__takeaway">
              <CheckCircleOutlined className="cas__takeaway-icon" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Description — collapsible */}
      {content && (
        <div className="cas__desc">
          <div id={descriptionId}>
          {!expanded && truncatedText ? (
            <p className="cas__desc-preview">{truncatedText}</p>
          ) : (
            <div className="cas__desc-full">
              {hasHtml ? (
                <div className="cas__html ln-tbl-markup">
                  <Markup content={content} allowList={MARKUP_ALLOWED_TAGS} allowAttributes={MARKUP_ALLOWED_ATTRS} />
                </div>
              ) : (
                <p>{content}</p>
              )}
            </div>
          )}
          </div>
          {isLong && (
            <button
              type="button"
              className="cas__expand"
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
              aria-controls={descriptionId}
            >
              {expanded ? (
                <><UpOutlined /> Show less</>
              ) : (
                <><ReadOutlined /> Read more</>
              )}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
