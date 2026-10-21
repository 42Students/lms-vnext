import parse from 'html-react-parser';
import { descriptionHtml, unescapeStoredHtml } from '@/utils/driveDescription';

const ALLOWED_TAGS = new Set(['p','br','strong','em','u','s','ul','ol','li','a','h1','h2','h3','h4','blockquote','pre','code','sub','sup','span','div','table','thead','tbody','tr','th','td']);
const ALLOWED_ATTRS = new Set(['href','target','rel','class','colspan','rowspan']);

const options = {
  replace(domNode) {
    if (domNode.type === 'tag') {
      if (!ALLOWED_TAGS.has(domNode.name)) return <></>;
      // Strip dangerous attributes
      if (domNode.attribs) {
        Object.keys(domNode.attribs).forEach(attr => {
          if (!ALLOWED_ATTRS.has(attr)) delete domNode.attribs[attr];
          // Block non-http(s) URIs (javascript:, data:, vbscript:, etc.)
          if ((attr === 'href' || attr === 'src') && domNode.attribs[attr] && !/^https?:/i.test(domNode.attribs[attr])) {
            delete domNode.attribs[attr];
          }
        });
        // Enforce safe rel on anchor tags that open in a new tab
        if (domNode.name === 'a') {
          if (domNode.attribs.target === '_blank') {
            domNode.attribs.rel = 'noopener noreferrer';
          }
        }
      }
    }
    if (domNode.type === 'script' || domNode.type === 'style') return <></>;
    if (domNode.type === 'comment') return <></>;
  }
};

const RichTextDisplay = ({ content, className = "" }) => {
  if (!content) return null;

  let parsed;
  try {
    // Escaped once too often by an older page: show the HTML it was, not its tags. Plain text keeps its paragraphs and lines.
    const html = unescapeStoredHtml(String(content));
    parsed = parse(/<[a-z][\s\S]*>/i.test(html) ? html : descriptionHtml(html), options);
  } catch (e) {
    parsed = content;
  }

  return (
    <div
      className={`rich-text-display ${className}`}
      style={{
        lineHeight: "1.6",
        wordBreak: "break-word",
      }}
    >
      {parsed}
      <style jsx global>{`
        .rich-text-display ul,
        .rich-text-display ol {
          margin: 8px 0;
          padding-left: 24px;
        }
        .rich-text-display li {
          margin: 4px 0;
        }
        .rich-text-display p {
          margin: 8px 0;
        }
        .rich-text-display p:first-child {
          margin-top: 0;
        }
        .rich-text-display p:last-child {
          margin-bottom: 0;
        }
        .rich-text-display strong,
        .rich-text-display b {
          font-weight: 600;
        }
        .rich-text-display em,
        .rich-text-display i {
          font-style: italic;
        }
        .rich-text-display u {
          text-decoration: underline;
        }
        .rich-text-display a {
          color: #0a7c88;
          text-decoration: none;
        }
        .rich-text-display a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default RichTextDisplay;
