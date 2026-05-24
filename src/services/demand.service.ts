import { productStorageApi, backOfficeApi } from './api'

export type DemandUnit = 'KILOGRAM' | 'GRAM' | 'LITER' | 'MILLILITER'
export type DemandStatus = 'PENDING' | 'PARTIALLY_FULFILLED' | 'FULFILLED' | 'CANCELLED'

export interface RawProductDemand {
  demandId: number
  subSubcategoryId: number
  unit: DemandUnit
  unitQuantity: number
  unitPrice: number
  currentProgress: number
  dateNeed: string
  status: DemandStatus
  note: string | null
  createdAt: string
  updatedAt: string
}

export interface SubSubCategory {
  subSubcategoryId: number
  name: string
  description: string
  subcategoryId: number
  avgShelfDays: number
}

export interface ConfirmDemandPayload {
  quantity: number
  note?: string
}

export interface ApiResponse<T> {
  type: 'GOOD' | 'ERROR' | 'WARN' | 'SKIP_AS_GOOD'
  code: string
  message: string
  detail: T | null
  timestamp: string
}

export async function getAllDemands(pageNum: number = 1, pageSize: number = 20): Promise<ApiResponse<RawProductDemand[]>> {
  const res = await productStorageApi.get<ApiResponse<RawProductDemand[]>>(
    `/api/raw-product-demand?pageNum=${pageNum}&pageSize=${pageSize}`
  )
  return res.data
}

export async function getDemandsByCategory(subSubcategoryId: number): Promise<ApiResponse<RawProductDemand[]>> {
  const res = await productStorageApi.get<ApiResponse<RawProductDemand[]>>(
    `/api/raw-product-demand/by-category/${subSubcategoryId}`
  )
  return res.data
}

export async function getDemandDetails(demandId: number): Promise<ApiResponse<RawProductDemand>> {
  const res = await productStorageApi.get<ApiResponse<RawProductDemand>>(
    `/api/raw-product-demand/${demandId}`
  )
  return res.data
}

export async function confirmDemand(demandId: number, payload: ConfirmDemandPayload): Promise<ApiResponse<RawProductDemand>> {
  const res = await productStorageApi.post<ApiResponse<RawProductDemand>>(
    `/api/raw-product-demand/${demandId}/confirm`,
    payload
  )
  return res.data
}

export async function getAllSubSubCategories(): Promise<ApiResponse<SubSubCategory[]>> {
  const res = await backOfficeApi.get<ApiResponse<SubSubCategory[]>>(
    '/api/categories/sub-subcategories'
  )
  return res.data
}

export type TransactionStatus = 'WAIT_FOR_DELIVERY' | 'FINISHED' | 'REJECTED' | 'EXPIRED'
export type TransactionSortBy = 'createdAt' | 'dateNeed' | 'quantity' | 'unitPrice' | 'receivedAt'
export type SortDir = 'DESC' | 'ASC'

export interface TransactionItem {
  id: number
  batchType: string
  demandId: number
  subSubcategoryId: number
  subSubcategoryName: string
  quantity: number
  unit: DemandUnit
  dateNeed: string
  unitPrice: number
  status: TransactionStatus
  providerId: number
  receivedAt: string
  createdAt: string
}

export interface PagedDetail<T> {
  data: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface TransactionHistoryParams {
  status?: TransactionStatus
  subSubcategoryId?: number
  demandId?: number
  dateNeedFrom?: string
  dateNeedTo?: string
  sortBy?: TransactionSortBy
  sortDir?: SortDir
  pageNum?: number
  pageSize?: number
}

export async function getTransactionHistory(
  params: TransactionHistoryParams = {},
): Promise<ApiResponse<PagedDetail<TransactionItem>>> {
  const res = await productStorageApi.get<ApiResponse<PagedDetail<TransactionItem>>>(
    '/api/raw-product-demand/transaction-history/me',
    { params: { pageNum: 1, pageSize: 20, sortBy: 'createdAt', sortDir: 'DESC', ...params } },
  )
  return res.data
}
