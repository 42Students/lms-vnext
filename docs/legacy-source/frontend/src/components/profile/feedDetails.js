import { Divider, Row, Col, Button } from 'antd';
import FeedInfo from './feedInfo';
import CommentWrapper from './timeline/CommentWrapper';

const FeedDetails = ({ feed }) => (
  <>
    <FeedInfo feed={feed} />
    <div className="mt-3 ln-lto-reg clrB517">{feed.message}</div>
    <Divider className="mb-2 mt-3" />
    <Row justify={'space-between'}>
      <Col className="fnt-13 ln-lto-reg" span={8}><Button type="link" className="clrRed576 fnt-13 p-0" icon={<i className={`bi me-1 bi-heart${feed.liked ? '-fill': ''}`}></i>}>Liked</Button> by {feed.likes}</Col>
      <Col className="fnt-13 ln-lto-reg text-end clrgray7AE" span={16}>View all {feed.comments.length} comments</Col>
    </Row>
    <CommentWrapper comments={feed.comments} />
  </>
);

export default FeedDetails;
