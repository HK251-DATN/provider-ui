import { Card, Col, Row, Statistic, Typography } from 'antd'
import {
  RiseOutlined,
  ClockCircleOutlined,
  DollarOutlined,
} from '@ant-design/icons'

const { Title, Text } = Typography

const SUMMARY_CARDS = [
  { title: 'Tổng giao dịch tháng này', value: 24,    suffix: 'đơn',  icon: <RiseOutlined />,         color: '#4a9b6f' },
  { title: 'Đang chờ xác nhận',        value: 3,     suffix: 'đơn',  icon: <ClockCircleOutlined />,  color: '#fa8c16' },
  { title: 'Doanh thu tháng này',       value: '12.4', suffix: 'tr ₫', icon: <DollarOutlined />,       color: '#1677ff' },
]

export default function DashboardPage() {
  return (
    <div>
      <Title level={4} style={{ marginBottom: '1em' }}>Tổng quan</Title>

      <Row gutter={[16, 16]}>
        {SUMMARY_CARDS.map((card) => (
          <Col key={card.title} xs={24} sm={8}>
            <Card variant="borderless" style={{ borderRadius: '0.75em' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8em', marginBottom: '0.6em' }}>
                <div
                  style={{
                    width: '2.4em', height: '2.4em',
                    borderRadius: '50%',
                    background: `${card.color}1a`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: card.color, fontSize: '1.1em',
                  }}
                >
                  {card.icon}
                </div>
                <Text type="secondary" style={{ fontSize: '0.9em' }}>{card.title}</Text>
              </div>
              <Statistic
                value={card.value}
                suffix={card.suffix}
                valueStyle={{ color: card.color, fontSize: '1.8em', fontWeight: 700 }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '1em' }}>
        <Col xs={24} sm={14}>
          <Card
            title="Doanh thu 6 tháng gần nhất"
            variant="borderless"
            style={{ borderRadius: '0.75em', minHeight: '16em' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '12em' }}>
              <Text type="secondary">— Biểu đồ (Task 5) —</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={10}>
          <Card
            title="Top sản phẩm đã cung cấp"
            variant="borderless"
            style={{ borderRadius: '0.75em', minHeight: '16em' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '12em' }}>
              <Text type="secondary">— Biểu đồ (Task 5) —</Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
