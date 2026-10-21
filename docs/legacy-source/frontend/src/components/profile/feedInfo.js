import { Space, Image, Avatar } from "antd";
import Link from "next/link";

const FeedInfo = ({ feed, timeFormat = "long" }) => (
  <>
    <Space align="start">
      <Avatar
        shape="square"
        size={45}
        icon={
          <Image
            src={feed.image}
            preview={false}
            alt={feed.postedBy}
            width={45}
            height={45}
          />
        }
      ></Avatar>
      <div className="clrgray2BB ln-lto-reg lh-base">
        <div>
          <span className="fw-bold clrB517">{feed.postedBy}</span> posted on{" "}
          <Link className="clrThird" href={""}>
            <>{feed.postedFor}’s</>
          </Link>{" "}
          timeline
        </div>
        {timeFormat === "sm" ? (
          <div className="fnt-12">{feed.postDate}</div>
        ) : (
          <div className="fnt-12">
            <i className="bi bi-clock me-1"></i> Posted on {feed.postDate}
          </div>
        )}
      </div>
    </Space>
  </>
);

export default FeedInfo;
