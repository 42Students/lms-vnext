import Image from "next/image";
import CustomButton from "../Button/button";

export default function Feedback({ status, userName, onStartSurvey }) {
  const isCompleted = status === "completed";

  return (
    <div className="ln-topic-details__feedback ln-panel-syllabus">
      <div className="d-flex flex-wrap align-items-center mb-4">
        <div className="ln-card-subtitle">
          <span className="ln-card-subtitle__accent" />
          <h6 className="fw-600 mb-0 fnt-16 clrB517">
            02. &nbsp;Feedback Survey
          </h6>
        </div>
        {status && (
          <div
            className={`ln-syllabus-status ms-3 ${isCompleted ? "ln-syllabus-status--completed" : ""}`}
          >
            <span className="text-capitalize">{status}</span>
          </div>
        )}
      </div>

      <div className="ln-feedback ln-syallabus-content">
        <div className="d-flex flex-wrap">
          <div className="col-8 px-0 d-flex flex-wrap">
            <div className="feedbacker-profile">
              <Image
                src={"/assets/images/dashboard/profile.png"}
                alt=""
                aria-hidden="true"
                width={14}
                height={14}
              />
            </div>
            <div className="col-10 ms-3">
              <h6 className="mb-0 clrgray7AE fnt-14">
                {userName ? `Hello ${userName},` : "Hello,"}
              </h6>
              <p className="clrgray2BB fnt-14">
                Please share your feedback across each of the parameters that
                are mentioned.
              </p>
            </div>
          </div>

          <div className="d-flex align-items-end justify-content-end ms-auto">
            <CustomButton
              title={isCompleted ? "View Survey" : "Start Survey"}
              icon={""}
              buttonType={"regular"}
              alt={""}
              onClick={onStartSurvey ?? (() => {})}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
