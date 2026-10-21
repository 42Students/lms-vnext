import { Space, Image, Avatar } from "antd"

export default function CommentList({ comments = [] }) {
  return (
    <>
      {comments.map(comment => (
        <div key={comment?.id ?? `${comment?.name ?? "user"}-${comment?.postDate ?? ""}`} className="my-3">
          <Space size={16} align='start'>
            <Avatar shape="square" size={45} icon={<Image
              src={comment.image}
              preview={false}
              alt={comment.name}
              width={45}
              height={45}
            />}></Avatar>
            <div className="clrgray2BB ln-lto-reg lh-base">
              <div className="clrFour mb-2"><span className="fw-bold clrB517 pe-3">{comment.name}</span>{comment.comment}</div>
              <div className="fnt-12">{comment.postDate}</div>
            </div>
          </Space>
        </div>
      ))}
    </>
  )
}
