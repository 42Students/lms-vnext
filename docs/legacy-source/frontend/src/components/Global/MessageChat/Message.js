import Image from "next/image";
import React from "react";

class chat extends React.Component {
  constructor() {
    super();

    this.state = {
      show: false,

      ChatList: [
        {
          profile: "/assets/images/chat/admin-profile.png",
          name: "Jones Ferdinand",
          seen: false,
          UnreadMes: "2",
          active: true,
        },
        {
          profile: "/assets/images/chat/admin-profile.png",
          name: "Jones Ferdinand",
          seen: false,
          UnreadMes: "8",
          active: false,
        },
        {
          profile: "/assets/images/chat/admin-profile.png",
          name: "Jones Ferdinand",
          seen: true,
          UnreadMes: "0",
          active: false,
        },
        {
          profile: "/assets/images/chat/admin-profile.png",
          name: "Jones Ferdinand",
          seen: true,
          UnreadMes: "0",
          active: true,
        },
        {
          profile: "/assets/images/chat/admin-profile.png",
          name: "Jones Ferdinand",
          seen: true,
          UnreadMes: "0",
          active: false,
        },
        {
          profile: "/assets/images/chat/admin-profile.png",
          name: "Jones Ferdinand",
          seen: true,
          UnreadMes: "0",
          active: false,
        },
        {
          profile: "/assets/images/chat/admin-profile.png",
          name: "Jones Ferdinand",
          seen: true,
          UnreadMes: "0",
          active: false,
        },
      ],
    };
    this.ChatMenuOpen = this.ChatMenuOpen.bind(this);
  }

  ChatMenuOpen() {
    this.setState({ show: !this.state.show });
  }

  render() {
    return (
      <div className={this.state.show ? "chat-box-active" : null}>
        {this.state.show == false ? (
          <div className="ln-chat-panel">
            {" "}
            <div className="ln-menu-collapse">
              <button
                type="button"
                className="ln-menu-collapse__head ln-menu-collapse__toggle"
                onClick={this.ChatMenuOpen}
                aria-label="Open instant chat"
                aria-expanded="false"
                aria-controls="instant-chat-list"
              >
                <span className="ln-menu-icon m-0">
                  <Image
                    src={"/assets/images/common/message-square.svg"}
                    alt=""
                    aria-hidden="true"
                    width={14}
                    height={14}
                  />
                </span>
              </button>

              <div className="ln-menu-collapse__body" id="instant-chat-list">
                <ul className="ln-chat-list">
                  {this.state.ChatList.map((item, i) => (
                    <li
                      className="ln-chat-list__item d-flex align-items-center justify-content-center"
                      key={i}
                    >
                      <div className="ln-chat-profile">
                        <Image
                          src={item.profile}
                          alt="chat profile"
                          className="ln-chat-profile__fig"
                          width={37}
                          height={37}
                        />

                        {/* <div className="ln-chat-dot"></div> */}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="ln-menu-collapse">
            <button
              type="button"
              className="ln-menu-collapse__head ln-menu-collapse__toggle"
              onClick={this.ChatMenuOpen}
              aria-label="Close instant chat"
              aria-expanded="true"
              aria-controls="instant-chat-list"
            >
              <span className="ln-menu-icon">
                <Image
                  src={"/assets/images/common/message-square.svg"}
                  alt=""
                  aria-hidden="true"
                  width={14}
                  height={14}
                />
              </span>
              <span className="fnt-16 f-6 clrb517 ln-collapse">
                Instant Chat
              </span>
            </button>

            <div className="ln-menu-collapse__body" id="instant-chat-list">
              <ul className="ln-chat-list">
                {this.state.ChatList.map((item, i) => (
                  <li className="ln-chat-list__item ln-media" key={i}>
                    <div className="ln-chat-profile">
                      <Image
                        src={item.profile}
                        alt="chat profile"
                        className="ln-chat-profile__fig"
                        width={37}
                        height={37}
                      />

                      <div className="ln-chat-dot"></div>
                    </div>
                    <div className="col-8 ln-collapse">
                      <h4 className="fnt-14 ln-chat-name mb-0">{item.name}</h4>
                    </div>
                    {/* <div className="col-2 d-flex align-items-center justify-content-end ln-collapse">
                            <div className="ln-chat-unread">
                                <span></span>
                            </div>
                        </div> */}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default chat;
