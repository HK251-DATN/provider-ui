# Provider UI — Implementation Plan

## Overview

Fresh food and vegetable provider portal. Providers (farmers, local suppliers) use this to view store demands, confirm supply, and track transactions.

**Stack:** React + Vite + TypeScript, Ant Design 5, Recharts, React Router v6, TanStack Query, Axios, Zustand

---

## Phase 1 — Foundation

### ✅ Task 1: Project bootstrap & architecture
- Vite + React + TypeScript scaffolded, dev server on port 5273
- Dependencies installed: `antd`, `@ant-design/icons`, `recharts`, `react-router-dom`, `@tanstack/react-query`, `axios`, `zustand`
- Folder structure: `src/pages/`, `src/components/`, `src/services/`, `src/store/`, `src/routes/`, `src/theme/`, `src/config/`, `src/layout/`
- `@/` path alias configured in `vite.config.ts` and `tsconfig.app.json`
- Two layouts built: `AuthLayout` (centered card) and `AppLayout` (dark green collapsible sidebar + sticky header)
- Route tree wired: `/login`, `/register`, `/dashboard`, `/giao-dich`, `/nhu-cau`, `/profile`
- Ant Design theme: green palette (`#4a9b6f` primary, dark `#1a3328` sidebar), 15px base font, Vietnamese locale (`vi_VN`)
- Placeholder pages with mock data for all 6 routes

---

## Phase 2 — Authentication

### ✅ Task 2: Login screen (`/login`) — partially complete
**Infrastructure added (beyond original plan):**
- `src/config/services.ts` — central port config for all 4 backend services. Change a port here → all API calls pick it up. Also supports `VITE_*` env var overrides per environment.
- `src/services/api.ts` — factory pattern: `createClient(baseURL)` creates an Axios instance with shared interceptors (auto-attach JWT, 401 → redirect to `/login`). Exports: `identityApi`, `backOfficeApi`, `productStorageApi`, `ecommerceApi`.
- `src/services/auth.service.ts` — typed `loginRequest()` against `POST /api/user/login` on identity-service
- `src/store/authStore.ts` — `AuthUser` type updated to include `roles` and `permissions[]` from login response

**Login screen (`/login`):**
- Logo + tagline in Vietnamese
- Email + password fields with validation messages in Vietnamese
- "Nhớ đăng nhập" checkbox
- "Đăng nhập" button with loading state, calls real API
- Error alert on bad credentials
- Link to `/register`
- On success: stores JWT + user in Zustand + `localStorage`, redirects to `/dashboard`

### Task 3: Register screen (`/register`) — multi-step wizard
- Step 1: Thông tin tài khoản (name, phone, email, password)
- Step 2: Thông tin kinh doanh (business name, address, product categories they supply)
- Step 3: Tài liệu chứng minh — file/image upload for freshness proofs (VietGAP certificate, food safety license, photos). Ant Design `Upload` dragger component.
- Submit → "Yêu cầu đã được gửi, chờ xét duyệt"

---

## Phase 3 — App Shell

### Task 4: Sidebar layout
> **Note:** The sidebar and app shell were already built as part of Task 1 (AppLayout). This task is effectively done. Remaining work: add auth guard (redirect unauthenticated users to `/login`).

- ✅ Collapsible left sidebar with Vietnamese nav labels
- ✅ Top header: avatar + name dropdown + logout
- ✅ Active route highlighted
- ✅ Widths/margins in `em` and `%`
- ⬜ Auth guard on protected routes

---

## Phase 4 — Dashboard

### Task 5: Dashboard screen (`/dashboard`)
- 3 summary cards: Tổng giao dịch tháng này / Đang chờ xác nhận / Doanh thu tháng này
- Line chart (Recharts): doanh thu 6 tháng gần nhất
- Bar chart: top 5 sản phẩm đã cung cấp (by quantity)
- All charts use large labels, tooltips in Vietnamese
- No jargon — numbers prominently displayed

---

## Phase 5 — Transaction History

### Task 6: Transaction history screen (`/giao-dich`)
- Ant Design `Table` with columns: Ngày, Sản phẩm, Số lượng, Đơn giá, Thành tiền, Trạng thái
- Status badge: Hoàn thành / Đang xử lý / Đã hủy (color-coded)
- Filter bar: date range picker + status dropdown + product name search
- Client-side sort on all numeric columns
- Pagination (10 rows/page default)
- Future hook: "Xuất báo cáo" button (disabled, tooltip says "Sắp có")

---

## Phase 6 — Product Demand

### Task 7: Product demand list (`/nhu-cau`)
- Card grid (or table toggle) showing open demands from the store
- Each card: tên sản phẩm, số lượng cần, hạn chót, trạng thái (Đang mở / Đã đủ)
- Filter by product category, deadline range
- Click card → demand detail drawer

### Task 8: Confirm supply flow
- Drawer/modal from demand detail
- Form: "Tôi có thể cung cấp [___] kg vào ngày [___]"
- Quantity input capped at demand quantity, shows remaining needed
- Ghi chú (optional notes)
- "Xác nhận cung cấp" submit → success notification

---

## Phase 7 — Polish

### Task 9: Empty states, loading skeletons, error handling
- Skeleton placeholders for all data-fetching screens
- Empty state illustrations + Vietnamese messages ("Chưa có giao dịch nào")
- Global error boundary
- 401 → redirect to login

---

## Milestone Summary

| #  | Task               | Status | Output                          |
|----|--------------------|---------|---------------------------------|
| 1  | Bootstrap          | ✅ Done | Runnable shell with routing     |
| 2  | Login              | ✅ Done | Auth entry point + API infra    |
| 3  | Register           | ⬜ Next | Onboarding with file upload     |
| 4  | App shell          | ✅ Done | Navigation chrome               |
| 5  | Dashboard          | ⬜      | Overview at a glance            |
| 6  | Transactions       | ⬜      | Financial history               |
| 7  | Demand list        | ⬜      | Store's needs visible           |
| 8  | Confirm supply     | ⬜      | Core business action            |
| 9  | Polish             | ⬜      | Production-grade UX             |
