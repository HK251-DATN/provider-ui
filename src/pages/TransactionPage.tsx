import { useState } from 'react'
import {
  Card, Table, Tag, Typography, Select, DatePicker, Row, Col, Space, Button,
} from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import type { TableProps } from 'antd'
import {
  getTransactionHistory,
  type TransactionItem,
  type TransactionStatus,
  type TransactionSortBy,
  type SortDir,
  type TransactionHistoryParams,
} from '@/services/demand.service'

const { Title } = Typography
const { RangePicker } = DatePicker

const UNIT_LABEL: Record<string, string> = {
  KILOGRAM: 'kg',
  GRAM: 'g',
  LITER: 'L',
  MILLILITER: 'mL',
}

const STATUS_CFG: Record<TransactionStatus, { label: string; color: string }> = {
  WAIT_FOR_DELIVERY: { label: 'Chờ giao hàng', color: 'orange' },
  FINISHED:          { label: 'Hoàn thành',    color: 'green'  },
  REJECTED:          { label: 'Bị từ chối',    color: 'red'    },
  EXPIRED:           { label: 'Hết hạn',       color: 'default'},
}

const SORT_BY_OPTIONS: { label: string; value: TransactionSortBy }[] = [
  { label: 'Ngày tạo',     value: 'createdAt'  },
  { label: 'Ngày cần',     value: 'dateNeed'   },
  { label: 'Số lượng',     value: 'quantity'   },
  { label: 'Đơn giá',      value: 'unitPrice'  },
  { label: 'Ngày nhận',    value: 'receivedAt' },
]

const VND = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

export default function TransactionPage() {
  const [filters, setFilters] = useState<TransactionHistoryParams>({
    pageNum: 1,
    pageSize: 20,
    sortBy: 'createdAt',
    sortDir: 'DESC',
  })

  const { data, isFetching, refetch } = useQuery({
    queryKey: ['transaction-history', filters],
    queryFn: () => getTransactionHistory(filters),
  })

  const paged = data?.detail
  const rows = paged?.data ?? []

  const columns: TableProps<TransactionItem>['columns'] = [
    {
      title: 'Sản phẩm',
      dataIndex: 'subSubcategoryName',
      ellipsis: true,
    },
    {
      title: 'Số lượng',
      key: 'quantity',
      render: (_, r) => `${r.quantity} ${UNIT_LABEL[r.unit] ?? r.unit}`,
      sorter: true,
      sortDirections: ['descend', 'ascend'],
    },
    {
      title: 'Đơn giá',
      dataIndex: 'unitPrice',
      sorter: true,
      sortDirections: ['descend', 'ascend'],
      render: (v: number) => VND.format(v),
    },
    {
      title: 'Thành tiền',
      key: 'total',
      render: (_, r) => VND.format(r.quantity * r.unitPrice),
    },
    {
      title: 'Ngày cần',
      dataIndex: 'dateNeed',
      sorter: true,
      sortDirections: ['descend', 'ascend'],
    },
    {
      title: 'Ngày nhận',
      dataIndex: 'receivedAt',
      sorter: true,
      sortDirections: ['descend', 'ascend'],
      render: (v: string, r: TransactionItem) =>
        r.status === 'WAIT_FOR_DELIVERY' || r.status === 'REJECTED'
          ? '—'
          : v ? new Date(v).toLocaleString('vi-VN') : '—',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (s: TransactionStatus) => (
        <Tag color={STATUS_CFG[s]?.color ?? 'default'}>
          {STATUS_CFG[s]?.label ?? s}
        </Tag>
      ),
    },
  ]

  function handleTableChange(
    pagination: { current?: number; pageSize?: number },
    _: unknown,
    sorter: { field?: string; order?: 'ascend' | 'descend' } | { field?: string; order?: 'ascend' | 'descend' }[],
  ) {
    const s = Array.isArray(sorter) ? sorter[0] : sorter
    setFilters((prev) => ({
      ...prev,
      pageNum: pagination.current ?? 1,
      pageSize: pagination.pageSize ?? prev.pageSize,
      ...(s?.field ? { sortBy: s.field as TransactionSortBy } : {}),
      ...(s?.order ? { sortDir: s.order === 'ascend' ? 'ASC' : 'DESC' } : {}),
    }))
  }

  return (
    <div>
      <Title level={4} style={{ marginBottom: '1em' }}>Lịch sử giao dịch</Title>

      <Card variant="borderless" style={{ borderRadius: '0.75em', marginBottom: '1em' }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Select
              allowClear
              placeholder="Trạng thái"
              style={{ width: '100%' }}
              options={Object.entries(STATUS_CFG).map(([value, { label }]) => ({ label, value }))}
              onChange={(v) => setFilters((p) => ({ ...p, status: v, pageNum: 1 }))}
            />
          </Col>

          <Col xs={24} sm={12} md={8}>
            <RangePicker
              style={{ width: '100%' }}
              placeholder={['Ngày cần từ', 'Ngày cần đến']}
              onChange={(dates) =>
                setFilters((p) => ({
                  ...p,
                  dateNeedFrom: dates?.[0]?.format('YYYY-MM-DD'),
                  dateNeedTo:   dates?.[1]?.format('YYYY-MM-DD'),
                  pageNum: 1,
                }))
              }
            />
          </Col>

          <Col xs={24} sm={12} md={5}>
            <Select
              style={{ width: '100%' }}
              value={filters.sortBy}
              options={SORT_BY_OPTIONS}
              onChange={(v) => setFilters((p) => ({ ...p, sortBy: v, pageNum: 1 }))}
            />
          </Col>

          <Col xs={24} sm={12} md={3}>
            <Select
              style={{ width: '100%' }}
              value={filters.sortDir}
              options={[
                { label: 'Mới nhất', value: 'DESC' },
                { label: 'Cũ nhất',  value: 'ASC'  },
              ]}
              onChange={(v: SortDir) => setFilters((p) => ({ ...p, sortDir: v, pageNum: 1 }))}
            />
          </Col>

          <Col xs={24} sm={12} md={2}>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isFetching} />
            </Space>
          </Col>
        </Row>
      </Card>

      <Card variant="borderless" style={{ borderRadius: '0.75em' }}>
        <Table<TransactionItem>
          rowKey="id"
          columns={columns}
          dataSource={rows}
          loading={isFetching}
          onChange={handleTableChange as TableProps<TransactionItem>['onChange']}
          pagination={{
            current: paged?.page ?? 1,
            pageSize: paged?.size ?? filters.pageSize,
            total: paged?.totalElements ?? 0,
            showTotal: (total) => `Tổng ${total} giao dịch`,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
          }}
          size="middle"
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </div>
  )
}
