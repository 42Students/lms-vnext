import { Card, Space, Image, Divider, Row, Col, Avatar, Input, Button, Switch } from 'antd';
import { useState } from 'react';

const MessagePost = ({ userDetails }) => {
  const [postForm, setPostForm] = useState({ message: '', restricted: false });

  function postMessage() {
    // TODO: implement message submission
  };

  function messageChange(el) {
    setPostForm({ ...postForm, message: el.target.value })
  }

  function restrictionChange(value) {
    setPostForm({ ...postForm, restricted: value });
  }

  return (<Card>
    <Row>
      <Col span={24}>
        <Row gutter={[16, 16]}>
          <Col span={2}>
            <Avatar shape="square" size={45} icon={<Image
              src={userDetails.image}
              preview={false}
              alt={userDetails.name}
              width={45}
              height={45}
            />}></Avatar>
          </Col>
          <Col span={19}>
            <Input.TextArea
              bordered={false}
              size='large'
              onChange={messageChange}
              style={{ height: 80, resize: 'none' }}
              placeholder="Write something here.."
            /></Col>
          <Col span={2}>
            <Button disabled={postForm.message.length === 0} className='bg-gray text-secondary border-0' onClick={postMessage}>Post</Button>
          </Col>
        </Row>
      </Col>
      <Divider className='mb-2 mt-4' />
      <Col span={24}>
        <Row justify="space-between">
          <Col span={10}>
            <Space>
              <Switch checked={postForm.restricted} onChange={restrictionChange} />
              <span className="ln-lto-reg">Restricted</span>
            </Space>
          </Col>
          <Col span={14} className='text-muted text-end fnt-13 ln-lto-reg'>(Post will be shared only with current organization)</Col>
        </Row>
      </Col>
    </Row>
  </Card>
  )
};

export default MessagePost;