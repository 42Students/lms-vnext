import { Row, Col, Card } from 'antd';
import UserInfo from "./userInfo";
import MessagePost from "./messagePost";
import LatestActivities from "./latestActivities";
import FeedDetails from './feedDetails';
import CardHeader from '@/components/Global/CardHeader/cardHeader';

const Timeline = ({ userDetails }) => {
  const feedList = [
    {
      postId: 1,
      postedBy: 'Jones Ferdinand',
      postDate: '20 Jan, 2023',
      postedFor: 'Rajdeep',
      image: '/assets/images/avatar/profile_big.png',
      message: 'In publishing and graphic design, Lorem ipsum is a placeholder text commonly used to demonstrate the visual form of a document or a typeface history and more.',
      likes: 44,
      liked: true,
      comments: [
        {
          name: "Roger Dias",
          comment: "Commonly used to demonstrate the visual form of a docs lorem ipsum is a placeholder or a typeface.",
          image: '/assets/images/avatar/profile_big3.png',
          postDate: '44m ago'
        },
        {
          name: "Omar Culhane",
          comment: "Commonly used to demonstrate the visual form of a docs lorem ipsum is a placeholder or a typeface. \
          Commonly used to demonstrate the visual form of a docs lorem ipsum is a placeholder or a typeface. \
          Commonly used to demonstrate the visual form of a docs lorem ipsum is a placeholder or a typeface. ",
          image: '/assets/images/avatar/profile_big4.png',
          postDate: '44m ago'
        }
      ]
    },
    {
      postId: 2,
      postedBy: 'Jones Ferdinand',
      postDate: '25 Jan, 2023',
      postedFor: 'Rajdeep',
      image: '/assets/images/avatar/chat-profile.png',
      message: 'In publishing and graphic design, Lorem ipsum is a placeholder text commonly used to demonstrate the visual form of a document or a typeface history and more.',
      likes: 0,
      comments: []
    },
  ];

  return (
    <div className="scroll-container scroll-container--courselanding pt-0">
      <Row gutter={[16, 16]} className="mb-4">
        <Col span={24}>
          <UserInfo userDetails={userDetails} />
        </Col>

        <Col span={24}>
          <Row gutter={[16, 24]}>
            <Col xs={{order: 1, span: 24}} sm={{order: 1, span: 24}} md={{order: 0, span: 16}}>
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <MessagePost userDetails={userDetails} />
                </Col>
                <Col span={24}>
                  <Row gutter={[16, 16]}>
                    {feedList.map((feed, i) => (
                      <Col span={24} key={feed.postId}>
                        <Card title={i === 0 ? <CardHeader title="Your Feed" headerColor="#D1C6FF"/>  : null}>
                          <FeedDetails feed={feed} key={i}/>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Col>
              </Row>
            </Col>
            <Col xs={{order: 0, span: 24}} sm={{order: 0, span: 24}} md={{order: 1, span: 8}}>
              <LatestActivities />
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  )
};

export default Timeline;