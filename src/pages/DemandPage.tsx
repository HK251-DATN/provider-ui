import { Badge, Button, Card, Col, Row, Tag, Typography } from 'antd'
import { CheckCircleOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

const MOCK_DEMANDS = [
  { id: '1', product: 'Thịt bò',    qty: '100 kg', deadline: '30/04/2026', category: 'Thịt',      open: true  },
  { id: '2', product: 'Cải xanh',   qty: '50 kg',  deadline: '28/04/2026', category: 'Rau củ',    open: true  },
  { id: '3', product: 'Cá hồi',     qty: '30 kg',  deadline: '02/05/2026', category: 'Hải sản',   open: true  },
  { id: '4', product: 'Thịt heo',   qty: '80 kg',  deadline: '25/04/2026', category: 'Thịt',      open: false },
  { id: '5', product: 'Cà rốt',     qty: '40 kg',  deadline: '05/05/2026', category: 'Rau củ',    open: true  },
  { id: '6', product: 'Tôm sú',     qty: '20 kg',  deadline: '01/05/2026', category: 'Hải sản',   open: true  },
]

export default function DemandPage() {
  return (
    <div>
      <Title level={4} style={{ marginBottom: '0.3em' }}>Nhu cầu sản phẩm</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: '1.2em' }}>
        Các sản phẩm cửa hàng cần trong thời gian tới
      </Text>

      <Row gutter={[16, 16]}>
        {MOCK_DEMANDS.map((d) => (
          <Col key={d.id} xs={24} sm={12} lg={8}>
            <Badge.Ribbon
              text={d.open ? 'Đang mở' : 'Đã đủ'}
              color={d.open ? '#4a9b6f' : '#aaa'}
            >
              <Card
                variant="borderless"
                style={{ borderRadius: '0.75em', opacity: d.open ? 1 : 0.65 }}
                actions={
                  d.open
                    ? [
                        <Button
                          type="primary"
                          icon={<CheckCircleOutlined />}
                          size="small"
                          disabled
                        >
                          Xác nhận cung cấp
                        </Button>,
                      ]
                    : undefined
                }
              >
                <Title level={5} style={{ marginBottom: '0.3em' }}>{d.product}</Title>
                <Tag color="blue" style={{ marginBottom: '0.8em' }}>{d.category}</Tag>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3em' }}>
                  <Text><Text strong>Số lượng cần: </Text>{d.qty}</Text>
                  <Text><Text strong>Hạn chót: </Text>{d.deadline}</Text>
                </div>
              </Card>
            </Badge.Ribbon>
          </Col>
        ))}
      </Row>

      <div style={{ marginTop: '1.5em' }}>
        <Text type="secondary" style={{ fontSize: '0.9em' }}>
          — Xác nhận cung cấp (modal + form) sẽ có ở Task 8 —
        </Text>
      </div>
    </div>
  )
}
