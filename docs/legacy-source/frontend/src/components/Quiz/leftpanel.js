import Image from "next/image";
import Link from "next/link";
import { CheckOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";

// Question Status panel
function Status(props) {
  const loginUser = useSelector(state => state.loginUser);
  const isTeacherRole = loginUser?.userType == "FACULTY" ? true : false;

  const showLogo = props.showLogo !== false;

  return (
    <div className="panel-pd ln-QZstatus-panel panel-w ln-quiz-status-panel">
      {showLogo && (
        <div className="ln-QZstatus-panel__logo">
          {!isTeacherRole ? (
            <button
              type="button"
              onClick={props.CancelQuiz}
              aria-label="Cancel quiz"
              style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer" }}
            >
              <Image
                src="/assets/images/logo.svg"
                alt="Logo"
                width={130}
                height={40}
              />
            </button>
          ) : (
            <Link
              href={{
                pathname: "/learn/courses",
              }}
              aria-label="Back to courses"
            >
              <Image
                src="/assets/images/logo.svg"
                alt="Logo"
                width={130}
                height={40}
              />
            </Link>
          )}
        </div>
      )}

      <div className="ln-QZstatus-panel__body">
        <div className="mb-4 mb-md-4 pb-md-3">
          <h6 className="fnt-13 fw-700 clr-505D05 mb-2">Quiz</h6>
          <p className="fw-600">{props.contentTitle || "Quiz"}</p>
        </div>
        <div className="Question-status">
          <span className="fnt-13 fw-700 clr-505D05 mb-3 d-block">
            Progress
          </span>

          {typeof props.Checkboxvalid !== "undefined" &&
          props.Checkboxvalid != null &&
          props.questionlist != null &&
          typeof props.questionlist === "object" ? (
            <ul className="Question-status-list">
              {Object.entries(props.questionlist).map(
                ([key, questionlist], i) => (
                  <li className="Question-status-list__item" key={i}>
                    <button
                      type="button"
                      className="ln-quiz-status-jump"
                      onClick={() => props?.onJump?.(i)}
                      aria-label={`Go to question ${i + 1}, ${props.Checkboxvalid[i] ? "answered" : "not answered"}, ${questionlist?.answer_data?.points ?? "unknown"} points`}
                    >
                      <span
                        className={`ln-quiz-status-indicator${props.Checkboxvalid[i] ? " is-complete" : ""}`}
                        aria-hidden="true"
                      >
                        {props.Checkboxvalid[i] ? <CheckOutlined /> : null}
                      </span>
                      <div className="col-12 px-0 d-flex align-items-center justify-content-between ln-quiz-status-meta">
                        <span className="fnt-16 q-item ln-quiz-status-number">Question {i + 1}</span>
                        <span className="fnt-16 q-item ln-quiz-status-points">{questionlist?.answer_data?.points ?? "—"} pts</span>
                      </div>
                    </button>
                  </li>
                )
              )}
            </ul>
          ) : (
            ""
          )}
        </div>
      </div>
    </div>
  );
}

export default Status;


