import CommentList from "./CommentList";
import CommentPost from "./CommentPost";

export default function CommentWrapper({ comments = [] }) {
  return (
    <div className="bg-grayCFD rounded-3 p-4">
      <CommentList comments={comments} />
      <CommentPost />
    </div>)
}
