import { Card, Row, Col } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";

export default function SetupGuide({ phases, onNavigate }) {
  return (
    <section className="admin-dashboard-section admin-dashboard-setup" aria-label="Setup Guide">
      <h2 className="admin-dashboard-section__title">Setup Guide (Follow in Order)</h2>
      <p className="admin-dashboard-setup__intro">
        If you&apos;re setting up the LMS for the first time, follow these phases in order. Each phase depends on the previous one being completed.
      </p>
      {phases.map((phase) => (
        <div
          key={phase.phase}
          className="admin-dashboard-setup-phase"
          style={{ "--phase-color": phase.phaseColor }}
        >
          <div className="admin-dashboard-setup-phase__header">
            <span className="admin-dashboard-setup-phase__badge">
              {phase.phase}
            </span>
            <h3 className="admin-dashboard-setup-phase__title">
              {phase.phaseTitle}
            </h3>
          </div>
          <Row gutter={[16, 16]} className="admin-dashboard-setup-phase__steps">
            {phase.steps.map((step) => {
              const Icon = step.icon;
              return (
                <Col xs={24} sm={12} md={8} key={step.step}>
                  <Card
                    size="small"
                    hoverable
                    onClick={() => onNavigate(step.key)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onNavigate(step.key); } }}
                    tabIndex={0}
                    role="button"
                    aria-label={`${step.title} — ${step.desc}`}
                    className="admin-dashboard-setup-step"
                  >
                    <div className="admin-dashboard-setup-step__inner">
                      <span className="admin-dashboard-setup-step__num">
                        {step.step}
                      </span>
                      <div className="admin-dashboard-setup-step__content">
                        <div className="admin-dashboard-setup-step__title">
                          <span className="admin-dashboard-setup-step__title-icon" aria-hidden="true">
                            <Icon />
                          </span>
                          {step.title}
                        </div>
                        <div className="admin-dashboard-setup-step__desc">{step.desc}</div>
                      </div>
                      <ArrowRightOutlined aria-hidden="true" className="admin-dashboard-setup-step__arrow" />
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </div>
      ))}
    </section>
  );
}
