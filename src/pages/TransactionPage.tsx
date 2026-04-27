import { Card, Table, Tag, Typography } from 'antd'

const { Title, Text } = Typography

const MOCK_DATA = [
  { key: '1', date: '25/04/2026', product: 'Thịt bò',   qty: '50 kg',  price: '250.000 ₫', total: '12.500.000 ₫', status: 'done' },
  { key: '2', date: '22/04/2026', product: 'Rau muống', qty: '30 kg',  price: '15.000 ₫',  total: '450.000 ₫',    status: 'processing' },
  { key: '3', date: '18/04/2026', product: 'Cá basa',   qty: '20 kg',  price: '80.000 ₫',  total: '1.600.000 ₫',  status: 'done' },
  { key: '4', date: '10/04/2026', product: 'Thịt heo',  qty: '40 kg',  price: '150.000 ₫', total: '6.000.000 ₫',  status: 'cancelled' },
]

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  done:        { label: 'Hoàn thành',   color: 'green'  },
  processing:  { label: 'Đang xử lý',   color: 'orange' },
  cancelled:   { label: 'Đã hủy',       color: 'red'    },
}

const COLUMNS = [
  { title: 'Ngày',       dataIndex: 'date',    sorter: true },
  { title: 'Sản phẩm',  dataIndex: 'product'  },
  { title: 'Số lượng',  dataIndex: 'qty',      sorter: true },
  { title: 'Đơn giá',   dataIndex: 'price'    },
  { title: 'Thành tiền', dataIndex: 'total',   sorter: true },
  {
    title: 'Trạng thái',
    dataIndex: 'status',
    render: (s: string) => (
      <Tag color={STATUS_MAP[s].color}>{STATUS_MAP[s].label}</Tag>
    ),
  },
]

export default function TransactionPage() {
  return (
    <div>
      <Title level={4} style={{ marginBottom: '1em' }}>Lịch sử giao dịch</Title>
      <Card variant="borderless" style={{ borderRadius: '0.75em' }}>
        <div style={{ marginBottom: '1em' }}>
          <Text type="secondary" style={{ fontSize: '0.9em' }}>
            — Bộ lọc (ngày, trạng thái, tên sản phẩm) sẽ có ở Task 6 —
          </Text>
        </div>
        <Table
          columns={COLUMNS}
          dataSource={MOCK_DATA}
          pagination={{ pageSize: 10, showTotal: (total) => `Tổng ${total} giao dịch` }}
          size="middle"
        />
      </Card>
    </div>
  )
}
