import React, { useState } from "react";

function Chat({ rootClass }) {
  const [msg, setMsg] = useState("");
  // These were three hardcoded placeholder messages ("tab changed!!!!", "Don't change tab",
  // "My mouse malfunctioned") that shipped into the live exam-proctoring drawer, where they read
  // as real proctor/candidate traffic. This component has no API wiring at all, so it starts
  // empty until one exists.
  const [msgList, setMsgList] = useState([]);
  return (
    <div
      className={`ln-examinee-chat clrPrimary d-flex flex-column ${rootClass}`}
    >
      <div
        className="ln-examinee-chat__container "
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label="Chat messages"
      >
        {msgList?.map((message, index) => {
          switch (message.type) {
            case "warning":
              return (
                <div key={`warning-${index}`} className="ln-msg-text ln-warn-text clrWarn mb-1">
                  <span>{message.msg}</span>
                </div>
              );
            case "teacher":
              return (
                <div key={`teacher-${index}`} className="ln-msg-text ln-teach-text  mb-1">
                  <span>{message.msg}</span>
                </div>
              );
            case "student":
              return (
                <div key={`student-${index}`} className="ln-msg-text ln-stu-text  mb-1">
                  <span>{message.msg}</span>
                </div>
              );
            default:
              return;
          }
        })}
      </div>

      {/* <!--Chat inputs--> */}
      <div className="ln-chat-input">
        <label className="ln-chat-input-text">
          <input
            type="text"
            aria-label="Chat message"
            onChange={e => setMsg(e.target.value)}
            value={msg}
          />
        </label>

        <div className="ln-chat-input__submit">
          <button
            type="button"
            className="bt-n"
            aria-label="Send message"
            onClick={() => {
              setMsgList([...msgList, { msg: msg, type: "teacher" }]);
              setMsg("");
            }}
          >
            <img
              className="img-fluid"
              src="/assets/images/common/chat-submit.svg"
              alt=""
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Chat;
