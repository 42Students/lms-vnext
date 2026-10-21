import React from "react";

function CourseSectionHeader({ title, subtitle, ariaLabel, actions, headingLevel = 2 }) {
  const Heading = headingLevel === 1 ? "h1" : headingLevel === 3 ? "h3" : "h2";

  return (
    <header className="learn-course-home-header" aria-label={ariaLabel || title}>
      <div className="learn-course-home-header__left">
        <Heading className="learn-course-home-header__title">{title}</Heading>
        {subtitle ? <p className="learn-course-home-header__subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="learn-course-home-header__actions">{actions}</div> : null}
    </header>
  );
}

export default CourseSectionHeader;
