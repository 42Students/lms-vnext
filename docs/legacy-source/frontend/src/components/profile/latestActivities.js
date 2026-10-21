import { Card, Space } from 'antd';
import FeedInfo from './feedInfo';
import CardHeader from '@/components/Global/CardHeader/cardHeader';

const LatestActivities = () => {
  const activityList = [
    {
      postedBy: 'Jones Ferdinand',
      postDate: '44m ago',
      postedFor: 'Rajdeep',
      image: '/assets/images/avatar/profile_big.png',
      type: 'post'
    },
    {
      postedBy: 'Jones Ferdinand',
      postDate: '44m ago',
      postedFor: 'Rajdeep',
      image: '/assets/images/avatar/chat-profile.png',
      type: 'comment'
    },
    {
      postedBy: 'Jones Ferdinand',
      postDate: '44m ago',
      postedFor: 'Rajdeep',
      image: '/assets/images/avatar/notification-avatar1.png',
      type: 'post'
    }
  ]

  return (<Card title={<CardHeader title="Latest Activities" headerColor="#BDE9FA"/>}>
    <Space size={24} direction="vertical" style={{maxHeight: 'calc(80px * 5)', overflow: 'auto'}}>
      {activityList.map((activity, i) => (
        <FeedInfo feed={activity} timeFormat="sm" key={i} />
      ))}
    </Space>
  </Card>
  )
};

export default LatestActivities;