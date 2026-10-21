import { LeftOutlined } from "@ant-design/icons";
import { Button } from "antd";

/**
 * Unified learn page header: sky blue accent, title, subtitle.
 * Optional back button (left) and action (right). Matches All Assignments style.
 */
export default function LearnPageHeader({ title, subtitle, action, onBack, backLabel = "Back to Jobs" }) {
  return (
    <header className="ln-module__head learn-page-header">
      <div className="learn-page-header__content">
        <div className="learn-page-header__left">
          {onBack && (
            <Button
              type="text"
              className="learn-page-header__back"
              icon={<LeftOutlined aria-hidden="true" />}
              onClick={onBack}
              aria-label={backLabel}
            >
              {/* aria-hidden prevents double-announcement — aria-label on button covers it */}
              <span className="learn-page-header__back-label" aria-hidden="true">{backLabel}</span>
            </Button>
          )}
          <div className="learn-page-header__accent" aria-hidden />
          <div className="learn-page-header__text">
            <h1 className="learn-page-header__title">{title}</h1>
            {subtitle && <p className="learn-page-header__subtitle">{subtitle}</p>}
          </div>
        </div>
        {action && <div className="learn-page-header__action">{action}</div>}
      </div>
    </header>
  );
}
