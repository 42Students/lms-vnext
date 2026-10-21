import { useState } from 'react';
import { Row, Col, Input, Button } from 'antd';

export default function CommentPost() {
  const [comment, setComment] = useState('');

  function postComment() {
    // TODO: implement comment submission
  };

  function commentChange(el) {
    setComment(el.target.value);
  }

  return (
    <Row justify={'space-between'} align={'middle'} gutter={[16, 16]} className="bg-white pe-3 rounded-3 pt-2">
      <Col span={22}>
        <Input.TextArea
          className="ln-lto-reg fnt-14"
          bordered={false}
          size='large'
          onChange={commentChange}
          style={{ height: 80, resize: 'none' }}
          placeholder="Add a comment"
        /></Col>
      <Col span={1}>
        <Button disabled={comment.length === 0} className='ant-btn-transparent border-0 clrgray2BB' icon={<i className="bi bi-send"></i>} onClick={postComment}></Button>
      </Col>
    </Row>
  )
}
