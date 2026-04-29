import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Table,
  Button,
  Select,
  Space,
  Typography,
  Tag,
  Modal,
  Form,
  InputNumber,
  Input,
  message,
  Alert,
} from 'antd'
import { CheckCircleOutlined, ShopOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import {
  getAllDemands,
  getDemandsByCategory,
  confirmDemand,
  getAllSubSubCategories,
  type RawProductDemand,
  type ConfirmDemandPayload,
} from '@/services/demand.service'

const { Title, Text } = Typography
const { TextArea } = Input

const UNIT_LABELS: Record<string, string> = {
  KILOGRAM: 'kg',
  GRAM: 'g',
  LITER: 'L',
  MILLILITER: 'mL',
}

const STATUS_CONFIG = {
  PENDING: { label: 'Chưa có', color: 'orange' },
  PARTIALLY_FULFILLED: { label: 'Đang mở', color: 'blue' },
  FULFILLED: { label: 'Đã đủ', color: 'green' },
  CANCELLED: { label: 'Đã hủy', color: 'red' },
}

export default function DemandPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>()
  const [confirmModal, setConfirmModal] = useState<{ visible: boolean; demand: RawProductDemand | null }>({
    visible: false,
    demand: null,
  })
  const [form] = Form.useForm()
  const queryClient = useQueryClient()

  const { data: categoriesRes } = useQuery({
    queryKey: ['subSubCategories'],
    queryFn: getAllSubSubCategories,
  })

  const { data: demandsRes, isLoading } = useQuery({
    queryKey: ['demands', currentPage, pageSize, selectedCategory],
    queryFn: () =>
      selectedCategory
        ? getDemandsByCategory(selectedCategory)
        : getAllDemands(currentPage, pageSize),
  })

  const confirmMutation = useMutation({
    mutationFn: ({ demandId, payload }: { demandId: number; payload: ConfirmDemandPayload }) =>
      confirmDemand(demandId, payload),
    onSuccess: (res) => {
      if (res.type === 'GOOD') {
        message.success('Xác nhận cung cấp thành công!')
        setConfirmModal({ visible: false, demand: null })
        form.resetFields()
        queryClient.invalidateQueries({ queryKey: ['demands'] })
      } else {
        message.error(res.message || 'Có lỗi xảy ra')
      }
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Không thể xác nhận cung cấp')
    },
  })

  const categories = categoriesRes?.type === 'GOOD' ? categoriesRes.detail || [] : []
  const demands = demandsRes?.type === 'GOOD' ? demandsRes.detail || [] : []

  const categoryMap = new Map(categories.map((c) => [c.subSubcategoryId, c.name]))

  const handleConfirmClick = (demand: RawProductDemand) => {
    setConfirmModal({ visible: true, demand })
    form.setFieldsValue({
      quantity: undefined,
      note: '',
    })
  }

  const handleConfirmSubmit = async () => {
    if (!confirmModal.demand) return
    try {
      const values = await form.validateFields()
      await confirmMutation.mutateAsync({
        demandId: confirmModal.demand.demandId,
        payload: values,
      })
    } catch (err) {
      // Form validation error
    }
  }

  const columns: ColumnsType<RawProductDemand> = [
    {
      title: '#',
      dataIndex: 'demandId',
      key: 'demandId',
      width: 60,
    },
    {
      title: 'Sản phẩm',
      key: 'product',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{categoryMap.get(record.subSubcategoryId) || `ID ${record.subSubcategoryId}`}</Text>
          <Text type="secondary" style={{ fontSize: '0.85em' }}>
            {record.unitPrice.toLocaleString('vi-VN')} VND/{UNIT_LABELS[record.unit]}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Tổng cần',
      key: 'total',
      render: (_, record) => (
        <Text>
          {record.unitQuantity} {UNIT_LABELS[record.unit]}
        </Text>
      ),
    },
    {
      title: 'Còn lại',
      key: 'remaining',
      render: (_, record) => {
        const remaining = record.unitQuantity - record.currentProgress
        return (
          <Text strong style={{ color: remaining > 0 ? '#4a9b6f' : '#999' }}>
            {remaining} {UNIT_LABELS[record.unit]}
          </Text>
        )
      },
    },
    {
      title: 'Hạn cần',
      key: 'dateNeed',
      render: (_, record) => new Date(record.dateNeed).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_, record) => {
        const config = STATUS_CONFIG[record.status]
        return <Tag color={config.color}>{config.label}</Tag>
      },
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      key: 'note',
      render: (note) => (note ? <Text type="secondary">{note}</Text> : <Text type="secondary">—</Text>),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => {
        const remaining = record.unitQuantity - record.currentProgress
        const canConfirm = remaining > 0 && record.status !== 'FULFILLED' && record.status !== 'CANCELLED'
        return (
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            size="small"
            disabled={!canConfirm}
            onClick={() => handleConfirmClick(record)}
          >
            Xác nhận
          </Button>
        )
      },
    },
  ]

  const remaining = confirmModal.demand ? confirmModal.demand.unitQuantity - confirmModal.demand.currentProgress : 0

  return (
    <div>
      <Title level={4} style={{ marginBottom: '0.3em' }}>
        Nhu cầu sản phẩm
      </Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: '1.2em' }}>
        Các sản phẩm cửa hàng cần trong thời gian tới
      </Text>

      <Space style={{ marginBottom: '1em' }}>
        <Select
          placeholder="Lọc theo danh mục"
          style={{ width: '15em' }}
          allowClear
          value={selectedCategory}
          onChange={(val) => {
            setSelectedCategory(val)
            setCurrentPage(1)
          }}
          options={[
            { label: 'Tất cả danh mục', value: undefined },
            ...categories.map((c) => ({ label: c.name, value: c.subSubcategoryId })),
          ]}
        />
      </Space>

      <Table
        columns={columns}
        dataSource={demands}
        rowKey="demandId"
        loading={isLoading}
        pagination={{
          current: currentPage,
          pageSize,
          onChange: setCurrentPage,
          showSizeChanger: false,
          showTotal: (total) => `Tổng ${total} nhu cầu`,
        }}
      />

      <Modal
        title={
          <Space>
            <ShopOutlined style={{ color: '#4a9b6f' }} />
            <span>Xác nhận cung cấp</span>
          </Space>
        }
        open={confirmModal.visible}
        onCancel={() => {
          setConfirmModal({ visible: false, demand: null })
          form.resetFields()
        }}
        onOk={handleConfirmSubmit}
        confirmLoading={confirmMutation.isPending}
        okText="Xác nhận cung cấp"
        cancelText="Hủy"
        width={600}
      >
        {confirmModal.demand && (
          <div style={{ marginTop: '1em' }}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text>
                <Text strong>Sản phẩm: </Text>
                {categoryMap.get(confirmModal.demand.subSubcategoryId) || `ID ${confirmModal.demand.subSubcategoryId}`}
              </Text>
              <Text>
                <Text strong>Tổng cần: </Text>
                {confirmModal.demand.unitQuantity} {UNIT_LABELS[confirmModal.demand.unit]}
              </Text>
              <Text>
                <Text strong>Đã có: </Text>
                {confirmModal.demand.currentProgress} {UNIT_LABELS[confirmModal.demand.unit]}
              </Text>
              <Text>
                <Text strong>Còn lại: </Text>
                <Text style={{ color: '#4a9b6f', fontWeight: 600 }}>
                  {remaining} {UNIT_LABELS[confirmModal.demand.unit]}
                </Text>
              </Text>
              <Text>
                <Text strong>Đơn giá: </Text>
                {confirmModal.demand.unitPrice.toLocaleString('vi-VN')} VND/{UNIT_LABELS[confirmModal.demand.unit]}
              </Text>
              <Text>
                <Text strong>Hạn cần: </Text>
                {new Date(confirmModal.demand.dateNeed).toLocaleDateString('vi-VN')}
              </Text>
              {confirmModal.demand.note && (
                <Alert
                  message="Ghi chú từ cửa hàng"
                  description={confirmModal.demand.note}
                  type="info"
                  showIcon
                  style={{ marginTop: '0.5em' }}
                />
              )}
            </Space>

            <Form form={form} layout="vertical" style={{ marginTop: '1.5em' }}>
              <Form.Item
                name="quantity"
                label="Số lượng bạn có thể cung cấp"
                rules={[
                  { required: true, message: 'Vui lòng nhập số lượng' },
                  { type: 'number', min: 1, message: 'Số lượng phải lớn hơn 0' },
                  {
                    type: 'number',
                    max: remaining,
                    message: `Số lượng không được vượt quá ${remaining} ${UNIT_LABELS[confirmModal.demand.unit]}`,
                  },
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder={`Tối đa ${remaining}`}
                  addonAfter={UNIT_LABELS[confirmModal.demand.unit]}
                  min={1}
                  max={remaining}
                />
              </Form.Item>

              <Form.Item name="note" label="Ghi chú giao hàng (không bắt buộc)">
                <TextArea
                  rows={3}
                  placeholder="Ví dụ: Giao hàng sáng ngày 1/5"
                  maxLength={500}
                  showCount
                />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  )
}
